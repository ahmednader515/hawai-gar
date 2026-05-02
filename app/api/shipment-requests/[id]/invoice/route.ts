import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getShipmentInvoiceData } from "@/lib/shipment-invoice";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const invoice = await getShipmentInvoiceData(id, {
    userId: session.user.id,
    role: session.user.role,
  });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  return NextResponse.json(invoice);
}

