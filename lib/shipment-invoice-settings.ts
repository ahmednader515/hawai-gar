import { prisma } from "@/lib/db";

const KEY_COMPANY_NAME = "shipment_invoice_company_name";
const KEY_LOGO_URL = "shipment_invoice_logo_url";
const KEY_TITLE_AR = "shipment_invoice_title_ar";
const KEY_TITLE_EN = "shipment_invoice_title_en";
const KEY_NOTES_AR = "shipment_invoice_notes_ar";
const KEY_NOTES_EN = "shipment_invoice_notes_en";
const KEY_BANK_ACCOUNTS = "shipment_invoice_bank_accounts_json_v1";

export type InvoiceBankAccount = {
  id: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  accountNumber: string;
  swiftCode: string;
};

export type ShipmentInvoiceSettings = {
  companyName: string;
  logoUrl: string;
  titleAr: string;
  titleEn: string;
  notesAr: string;
  notesEn: string;
  bankAccounts: InvoiceBankAccount[];
};

const DEFAULT_SETTINGS: ShipmentInvoiceSettings = {
  companyName: "Hawai Logisti",
  logoUrl: "/logo.png",
  titleAr: "ايصال الدفع",
  titleEn: "Payment receipt",
  notesAr:
    "يرجى تحويل المبلغ إلى أحد الحسابات البنكية التالية، ثم تأكيد الدفع عبر زر «لقد دفعت» مع رفع إثبات السداد.",
  notesEn:
    "Please transfer the amount to one of the bank accounts below, then confirm payment using the \"I have paid\" action and upload proof.",
  bankAccounts: [
    {
      id: "default-1",
      bankName: "Saudi National Bank",
      accountHolder: "Hawai Logisti",
      iban: "SA0000000000000000000000",
      accountNumber: "0000000000",
      swiftCode: "NCBKSAJE",
    },
  ],
};

function parseBankAccounts(raw: string | null | undefined): InvoiceBankAccount[] {
  const s = raw?.trim() ?? "";
  if (!s) return DEFAULT_SETTINGS.bankAccounts;
  try {
    const parsed = JSON.parse(s) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_SETTINGS.bankAccounts;
    const out: InvoiceBankAccount[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const bankName = String(row.bankName ?? "").trim();
      const accountHolder = String(row.accountHolder ?? "").trim();
      const iban = String(row.iban ?? "").trim();
      if (!bankName || !accountHolder || !iban) continue;
      out.push({
        id: String(row.id ?? crypto.randomUUID()),
        bankName,
        accountHolder,
        iban,
        accountNumber: String(row.accountNumber ?? "").trim(),
        swiftCode: String(row.swiftCode ?? "").trim(),
      });
    }
    return out.length > 0 ? out : DEFAULT_SETTINGS.bankAccounts;
  } catch {
    return DEFAULT_SETTINGS.bankAccounts;
  }
}

export async function getShipmentInvoiceSettings(): Promise<ShipmentInvoiceSettings> {
  try {
    const [companyNameRow, logoUrlRow, titleArRow, titleEnRow, notesArRow, notesEnRow, accountsRow] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: KEY_COMPANY_NAME } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_LOGO_URL } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_TITLE_AR } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_TITLE_EN } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_NOTES_AR } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_NOTES_EN } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_BANK_ACCOUNTS } }),
    ]);
    return {
      companyName: companyNameRow?.value?.trim() || DEFAULT_SETTINGS.companyName,
      logoUrl: logoUrlRow?.value?.trim() || DEFAULT_SETTINGS.logoUrl,
      titleAr: titleArRow?.value?.trim() || DEFAULT_SETTINGS.titleAr,
      titleEn: titleEnRow?.value?.trim() || DEFAULT_SETTINGS.titleEn,
      notesAr: notesArRow?.value?.trim() || DEFAULT_SETTINGS.notesAr,
      notesEn: notesEnRow?.value?.trim() || DEFAULT_SETTINGS.notesEn,
      bankAccounts: parseBankAccounts(accountsRow?.value),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setShipmentInvoiceSettings(data: Partial<ShipmentInvoiceSettings>) {
  if (data.companyName !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: KEY_COMPANY_NAME },
      create: { key: KEY_COMPANY_NAME, value: data.companyName.trim() },
      update: { value: data.companyName.trim() },
    });
  }
  if (data.logoUrl !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: KEY_LOGO_URL },
      create: { key: KEY_LOGO_URL, value: data.logoUrl.trim() },
      update: { value: data.logoUrl.trim() },
    });
  }
  if (data.titleAr !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: KEY_TITLE_AR },
      create: { key: KEY_TITLE_AR, value: data.titleAr.trim() },
      update: { value: data.titleAr.trim() },
    });
  }
  if (data.titleEn !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: KEY_TITLE_EN },
      create: { key: KEY_TITLE_EN, value: data.titleEn.trim() },
      update: { value: data.titleEn.trim() },
    });
  }
  if (data.notesAr !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: KEY_NOTES_AR },
      create: { key: KEY_NOTES_AR, value: data.notesAr.trim() },
      update: { value: data.notesAr.trim() },
    });
  }
  if (data.notesEn !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: KEY_NOTES_EN },
      create: { key: KEY_NOTES_EN, value: data.notesEn.trim() },
      update: { value: data.notesEn.trim() },
    });
  }
  if (data.bankAccounts !== undefined) {
    const safeAccounts = (data.bankAccounts ?? [])
      .map((row) => ({
        id: String(row.id ?? "").trim() || crypto.randomUUID(),
        bankName: String(row.bankName ?? "").trim(),
        accountHolder: String(row.accountHolder ?? "").trim(),
        iban: String(row.iban ?? "").trim(),
        accountNumber: String(row.accountNumber ?? "").trim(),
        swiftCode: String(row.swiftCode ?? "").trim(),
      }))
      .filter((row) => row.bankName && row.accountHolder && row.iban);
    await prisma.siteSetting.upsert({
      where: { key: KEY_BANK_ACCOUNTS },
      create: {
        key: KEY_BANK_ACCOUNTS,
        value: JSON.stringify(safeAccounts.length ? safeAccounts : DEFAULT_SETTINGS.bankAccounts),
      },
      update: {
        value: JSON.stringify(safeAccounts.length ? safeAccounts : DEFAULT_SETTINGS.bankAccounts),
      },
    });
  }
}

