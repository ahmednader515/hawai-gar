import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getShipmentInvoiceSettings,
  setShipmentInvoiceSettings,
  type InvoiceBankAccount,
} from "@/lib/shipment-invoice-settings";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const settings = await getShipmentInvoiceSettings();
    return NextResponse.json(settings);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load invoice settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const bankAccountsRaw = body?.bankAccounts;
    const bankAccounts: InvoiceBankAccount[] | undefined = Array.isArray(bankAccountsRaw)
      ? bankAccountsRaw.map((row: unknown) => {
          const item = (row ?? {}) as Record<string, unknown>;
          return {
            id: String(item.id ?? ""),
            bankName: String(item.bankName ?? ""),
            accountHolder: String(item.accountHolder ?? ""),
            iban: String(item.iban ?? ""),
            accountNumber: String(item.accountNumber ?? ""),
            swiftCode: String(item.swiftCode ?? ""),
          };
        })
      : undefined;

    await setShipmentInvoiceSettings({
      companyName: typeof body?.companyName === "string" ? body.companyName : undefined,
      logoUrl: typeof body?.logoUrl === "string" ? body.logoUrl : undefined,
      notesAr: typeof body?.notesAr === "string" ? body.notesAr : undefined,
      notesEn: typeof body?.notesEn === "string" ? body.notesEn : undefined,
      bankAccounts,
    });
    const settings = await getShipmentInvoiceSettings();
    return NextResponse.json(settings);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save invoice settings" }, { status: 500 });
  }
}

