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

type ExtractedRow = ParsedRow & {
  sourcePdf: string;
  sourcePage: number;
  sourceIndex: number;
};

type ExtractReport = {
  generatedAt: string;
  sourcePdf: string;
  outputDir: string;
  totalPages: number;
  textPages: number;
  ocrPages: number;
  noDataPages: number;
  rows: ExtractedRow[];
  summary: {
    totalRows: number;
    rowsWithoutCompanyName: number;
    rowsWithoutEmail: number;
    rowsWithoutPhone: number;
    duplicateEmails: Array<{ value: string; count: number }>;
    duplicatePhones: Array<{ value: string; count: number }>;
  };
};

type ImportMode = "extract-only" | "load-approved";

const OUTPUT_DIR = path.join(process.cwd(), "tmp", "extracted-companies");
const EXTRACT_JSON_FILE = path.join(OUTPUT_DIR, "shipment-companies.extracted.json");
const EXTRACT_CSV_FILE = path.join(OUTPUT_DIR, "shipment-companies.extracted.csv");
const EXTRACT_SUMMARY_FILE = path.join(OUTPUT_DIR, "shipment-companies.summary.txt");
const DEFAULT_INPUT_PDF = path.join(process.cwd(), "public", "الشركات.pdf");
const INSERT_BATCH_SIZE = 500;

function normalizeWhitespace(input: string): string {
  return input
    .replace(/\u0000/g, "")
    .replace(/[\u200e\u200f\u061c]/g, "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function sanitizeNullable(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\u0000/g, "").trim();
  return cleaned.length > 0 ? cleaned : null;
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

function parseArgs() {
  const args = process.argv.slice(2);
  let mode: ImportMode = "extract-only";
  let inputPdf = DEFAULT_INPUT_PDF;
  let approvedJson = EXTRACT_JSON_FILE;
  let outputDir = OUTPUT_DIR;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--mode") {
      const maybeMode = args[i + 1] as ImportMode | undefined;
      if (maybeMode === "extract-only" || maybeMode === "load-approved") {
        mode = maybeMode;
        i += 1;
      }
      continue;
    }
    if (arg === "--input") {
      const maybePath = args[i + 1];
      if (maybePath) {
        inputPdf = path.isAbsolute(maybePath) ? maybePath : path.join(process.cwd(), maybePath);
        i += 1;
      }
      continue;
    }
    if (arg === "--approved-json") {
      const maybePath = args[i + 1];
      if (maybePath) {
        approvedJson = path.isAbsolute(maybePath) ? maybePath : path.join(process.cwd(), maybePath);
        i += 1;
      }
      continue;
    }
    if (arg === "--output-dir") {
      const maybePath = args[i + 1];
      if (maybePath) {
        outputDir = path.isAbsolute(maybePath) ? maybePath : path.join(process.cwd(), maybePath);
        i += 1;
      }
    }
  }

  return { mode, inputPdf, approvedJson, outputDir };
}

function toCsvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  const escaped = raw.replace(/"/g, "\"\"");
  return `"${escaped}"`;
}

function getDuplicates(values: Array<string | null>): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    const normalized = value.trim().toLowerCase();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));
}

async function extractRowsFromPdf(inputPdf: string, outputDir: string): Promise<ExtractReport> {
  const pdfBytes = await fs.readFile(inputPdf);
  const parser = new PDFParse({ data: pdfBytes });
  const info = await parser.getInfo();
  const totalPages = info.total ?? 0;
  const sourcePdf = path.relative(path.join(process.cwd(), "public"), inputPdf).replaceAll("\\", "/");

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  let textPages = 0;
  let ocrPages = 0;
  let noDataPages = 0;
  let sourceIndex = 1;
  const rows: ExtractedRow[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      let pageText = "";
      let sourceKind: "text" | "ocr" | "none" = "none";

      try {
        const textResult = await parser.getText({ partial: [pageNumber] });
        pageText = normalizeWhitespace(textResult.text ?? "");
      } catch (error) {
        console.warn(`Page ${pageNumber}: text extraction failed, fallback to OCR.`, error);
      }

      let rowChunks = splitRows(pageText);
      if (rowChunks.length > 0) {
        sourceKind = "text";
        textPages += 1;
      } else {
        if (!worker) {
          worker = await createWorker("ara+eng");
        }
        const screenshot = await parser.getScreenshot({
          partial: [pageNumber],
          imageDataUrl: false,
          imageBuffer: true,
          desiredWidth: 1600,
        });
        const image = screenshot.pages?.[0]?.data;
        if (image) {
          const ocr = await worker.recognize(Buffer.from(image));
          pageText = normalizeWhitespace(ocr.data.text ?? "");
          rowChunks = splitRows(pageText);
        }
        if (rowChunks.length > 0) {
          sourceKind = "ocr";
          ocrPages += 1;
        } else {
          noDataPages += 1;
          console.log(`[${pageNumber}/${totalPages}] no rows detected`);
          continue;
        }
      }

      for (const chunk of rowChunks) {
        rows.push({
          sourcePdf,
          sourcePage: pageNumber,
          sourceIndex,
          ...parseChunk(chunk),
        });
        sourceIndex += 1;
      }

      console.log(`[${pageNumber}/${totalPages}] ${sourceKind} -> ${rowChunks.length} rows`);
    }
  } finally {
    await parser.destroy();
    if (worker) {
      await worker.terminate();
    }
  }

  const summary = {
    totalRows: rows.length,
    rowsWithoutCompanyName: rows.filter((row) => !row.companyName).length,
    rowsWithoutEmail: rows.filter((row) => !row.email).length,
    rowsWithoutPhone: rows.filter((row) => !row.phone).length,
    duplicateEmails: getDuplicates(rows.map((row) => row.email)),
    duplicatePhones: getDuplicates(rows.map((row) => row.phone)),
  };

  const report: ExtractReport = {
    generatedAt: new Date().toISOString(),
    sourcePdf,
    outputDir,
    totalPages,
    textPages,
    ocrPages,
    noDataPages,
    rows,
    summary,
  };

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, path.basename(EXTRACT_JSON_FILE)), JSON.stringify(report, null, 2), "utf8");

  const csvHeader = [
    "sourcePdf",
    "sourcePage",
    "sourceIndex",
    "sourceRowNumber",
    "companyName",
    "representativeName",
    "email",
    "phone",
    "truckTypes",
    "destinations",
    "rawText",
  ];
  const csvLines = [csvHeader.join(",")];
  for (const row of rows) {
    const line = [
      row.sourcePdf,
      row.sourcePage,
      row.sourceIndex,
      row.sourceRowNumber ?? "",
      row.companyName ?? "",
      row.representativeName ?? "",
      row.email ?? "",
      row.phone ?? "",
      row.truckTypes ?? "",
      row.destinations ?? "",
      row.rawText,
    ]
      .map(toCsvCell)
      .join(",");
    csvLines.push(line);
  }
  await fs.writeFile(path.join(outputDir, path.basename(EXTRACT_CSV_FILE)), csvLines.join("\n"), "utf8");

  const summaryText = [
    `generatedAt: ${report.generatedAt}`,
    `sourcePdf: ${report.sourcePdf}`,
    `totalPages: ${report.totalPages}`,
    `textPages: ${report.textPages}`,
    `ocrPages: ${report.ocrPages}`,
    `noDataPages: ${report.noDataPages}`,
    `totalRows: ${report.summary.totalRows}`,
    `rowsWithoutCompanyName: ${report.summary.rowsWithoutCompanyName}`,
    `rowsWithoutEmail: ${report.summary.rowsWithoutEmail}`,
    `rowsWithoutPhone: ${report.summary.rowsWithoutPhone}`,
    `duplicateEmails: ${report.summary.duplicateEmails.length}`,
    `duplicatePhones: ${report.summary.duplicatePhones.length}`,
    "",
    "Top duplicate emails:",
    ...report.summary.duplicateEmails.slice(0, 20).map((d) => `- ${d.value} (${d.count})`),
    "",
    "Top duplicate phones:",
    ...report.summary.duplicatePhones.slice(0, 20).map((d) => `- ${d.value} (${d.count})`),
  ].join("\n");
  await fs.writeFile(path.join(outputDir, path.basename(EXTRACT_SUMMARY_FILE)), summaryText, "utf8");

  return report;
}

async function loadApprovedRows(approvedJsonPath: string) {
  const content = await fs.readFile(approvedJsonPath, "utf8");
  const parsed = JSON.parse(content) as ExtractReport;
  const rows = parsed.rows ?? [];
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`No rows found in approved JSON file: ${approvedJsonPath}`);
  }

  await prisma.shipmentCompany.deleteMany({});
  let inserted = 0;

  for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + INSERT_BATCH_SIZE);
    if (batch.length === 0) continue;
    await prisma.shipmentCompany.createMany({
      data: batch.map((row) => ({
        sourcePdf: row.sourcePdf.replace(/\u0000/g, ""),
        sourceIndex: row.sourceIndex,
        sourceRowNumber: row.sourceRowNumber,
        companyName: sanitizeNullable(row.companyName),
        representativeName: sanitizeNullable(row.representativeName),
        email: sanitizeNullable(row.email),
        phone: sanitizeNullable(row.phone),
        truckTypes: sanitizeNullable(row.truckTypes),
        destinations: sanitizeNullable(row.destinations),
        rawText: row.rawText.replace(/\u0000/g, ""),
      })),
    });
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${rows.length} rows`);
  }

  const finalCount = await prisma.shipmentCompany.count();
  console.log(`Load complete. Inserted ${inserted} rows. Table count is now ${finalCount}.`);
}

async function run() {
  const { mode, inputPdf, approvedJson, outputDir } = parseArgs();

  if (mode === "extract-only") {
    await fs.access(inputPdf);
    const report = await extractRowsFromPdf(inputPdf, outputDir);
    console.log("");
    console.log("Extraction complete. Review these files before loading:");
    console.log(`- ${path.join(outputDir, path.basename(EXTRACT_JSON_FILE))}`);
    console.log(`- ${path.join(outputDir, path.basename(EXTRACT_CSV_FILE))}`);
    console.log(`- ${path.join(outputDir, path.basename(EXTRACT_SUMMARY_FILE))}`);
    console.log(`Rows extracted: ${report.summary.totalRows}`);
    console.log("When approved, run with: --mode load-approved");
    return;
  }

  if (mode === "load-approved") {
    await fs.access(approvedJson);
    await loadApprovedRows(approvedJson);
    return;
  }

  throw new Error(`Unsupported mode: ${mode}`);
}

run()
  .catch((error) => {
    console.error("Shipment companies import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
