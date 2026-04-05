import "dotenv/config";
import path from "node:path";
import { promises as fs } from "node:fs";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import { prisma } from "../lib/db";

type ParsedRow = {
  sourceRowNumber: number | null;
  companyName: string | null;
  representativeName: string | null;
  email: string | null;
  phone: string | null;
  truckTypes: string | null;
  destinations: string | null;
  rawText: string;
};

function normalizeWhitespace(input: string): string {
  return input
    .replace(/[\u200e\u200f\u061c]/g, "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function normalizePhone(raw: string): string {
  const compact = raw.replace(/[^\d+]/g, "");
  if (compact.endsWith("+") && !compact.startsWith("+")) {
    return `+${compact.slice(0, -1)}`;
  }
  return compact;
}

function extractRepresentativeName(beforeEmail: string): string | null {
  const tokens = beforeEmail.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  const take = tokens.slice(Math.max(0, tokens.length - 4)).join(" ").trim();
  return take || null;
}

function parseChunk(chunkRaw: string): ParsedRow {
  const chunk = normalizeWhitespace(chunkRaw);
  const rowMatch = chunk.match(/^(\d{1,4})\s*\|?\s*/);
  const sourceRowNumber = rowMatch ? Number(rowMatch[1]) : null;
  const body = chunk.replace(/^(\d{1,4})\s*\|?\s*/, "").trim();

  const emailMatch = body.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = body.match(/\+?\d[\d\s\-]{7,}\d\+?/);

  const email = emailMatch ? emailMatch[0].trim() : null;
  const phone = phoneMatch ? normalizePhone(phoneMatch[0]) : null;

  const beforeEmail = emailMatch ? body.slice(0, emailMatch.index).trim() : body;
  const representativeName = emailMatch ? extractRepresentativeName(beforeEmail) : null;

  const companyDelimiterCandidates: number[] = [];
  const numericDivider = beforeEmail.search(/\s7\s/);
  if (numericDivider >= 0) companyDelimiterCandidates.push(numericDivider);
  const destinationDivider = beforeEmail.search(/\sمحلي\b|\sدولي\b/);
  if (destinationDivider >= 0) companyDelimiterCandidates.push(destinationDivider);
  const companyEnd =
    companyDelimiterCandidates.length > 0
      ? Math.min(...companyDelimiterCandidates)
      : Math.min(beforeEmail.length, 90);
  const companyName = beforeEmail.slice(0, Math.max(companyEnd, 0)).trim() || null;

  let truckTypes: string | null = null;
  const truckMatch = beforeEmail.match(/\s7\s+(.+?)(?=\s(?:محلي|دولي)\b|$)/);
  if (truckMatch?.[1]) {
    truckTypes = truckMatch[1].trim() || null;
  }

  let destinations: string | null = null;
  const destinationsMatch = beforeEmail.match(/((?:محلي|دولي).*)$/);
  if (destinationsMatch?.[1]) {
    destinations = destinationsMatch[1].trim() || null;
  }

  return {
    sourceRowNumber,
    companyName,
    representativeName,
    email,
    phone,
    truckTypes,
    destinations,
    rawText: chunk,
  };
}

function splitRows(ocrText: string): string[] {
  const lines = normalizeWhitespace(ocrText)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const startsRow = /^\d{1,4}\s*\|?/.test(line);
    const isHeaderLike = /اسم المنشأة|أنواع الشاحنات|البريد الإلكتروني|الهاتف/.test(line);

    if (startsRow && !isHeaderLike) {
      if (current.length > 0) rows.push(current.join(" "));
      current = [line];
    } else if (current.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) rows.push(current.join(" "));
  return rows;
}

async function listPdfFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && full.toLowerCase().endsWith(".pdf")) {
        out.push(full);
      }
    }
  }
  await walk(root);
  out.sort((a, b) => a.localeCompare(b, "ar"));
  return out;
}

async function run() {
  const publicDir = path.join(process.cwd(), "public");
  const pdfFiles = await listPdfFiles(publicDir);
  if (pdfFiles.length === 0) {
    console.log("No PDF files found under public/. Nothing to import.");
    return;
  }

  const worker = await createWorker("ara+eng");
  const allRows: Array<ParsedRow & { sourcePdf: string; sourceIndex: number }> = [];

  try {
    for (let i = 0; i < pdfFiles.length; i += 1) {
      const pdfPath = pdfFiles[i];
      const relativePdf = path.relative(publicDir, pdfPath).replaceAll("\\", "/");

      const parser = new PDFParse({ data: await fs.readFile(pdfPath) });
      const screenshot = await parser.getScreenshot({
        first: 1,
        imageDataUrl: false,
        imageBuffer: true,
        desiredWidth: 1400,
      });
      await parser.destroy();

      const image = screenshot.pages?.[0]?.data;
      if (!image) {
        console.log(`[${i + 1}/${pdfFiles.length}] skipped (no image): ${relativePdf}`);
        continue;
      }

      const ocr = await worker.recognize(Buffer.from(image));
      const text = ocr.data.text ?? "";
      const rowChunks = splitRows(text);

      if (rowChunks.length === 0) {
        const fallback = normalizeWhitespace(text);
        if (fallback) {
          allRows.push({
            sourcePdf: relativePdf,
            sourceIndex: 1,
            ...parseChunk(`0 ${fallback}`),
            sourceRowNumber: null,
          });
        }
      } else {
        rowChunks.forEach((chunk, idx) => {
          allRows.push({
            sourcePdf: relativePdf,
            sourceIndex: idx + 1,
            ...parseChunk(chunk),
          });
        });
      }

      console.log(`[${i + 1}/${pdfFiles.length}] parsed: ${relativePdf} -> ${rowChunks.length} rows`);
    }
  } finally {
    await worker.terminate();
  }

  await prisma.shipmentCompany.deleteMany({});
  if (allRows.length > 0) {
    await prisma.shipmentCompany.createMany({
      data: allRows.map((row) => ({
        sourcePdf: row.sourcePdf,
        sourceIndex: row.sourceIndex,
        sourceRowNumber: row.sourceRowNumber,
        companyName: row.companyName,
        representativeName: row.representativeName,
        email: row.email,
        phone: row.phone,
        truckTypes: row.truckTypes,
        destinations: row.destinations,
        rawText: row.rawText,
      })),
    });
  }

  console.log(`Import complete. Inserted ${allRows.length} shipment_companies rows from ${pdfFiles.length} PDFs.`);
}

run()
  .catch((error) => {
    console.error("Shipment companies import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
