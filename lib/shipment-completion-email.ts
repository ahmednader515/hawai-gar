import { Resend } from "resend";
import { prisma } from "@/lib/db";

function getResendFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Notifies the shipper company and the assigned carrier when a shipment request is marked COMPLETE
 * (payment approved — execution in progress on the ground).
 */
export async function sendShipmentCompletedEmails(shipmentRequestId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[shipment-completion-email] RESEND_API_KEY missing; skipping emails");
    return;
  }

  const r = await prisma.shipmentRequest.findUnique({
    where: { id: shipmentRequestId },
    select: {
      id: true,
      fromText: true,
      toText: true,
      companyId: true,
      carrierId: true,
      shipmentCompanyId: true,
    },
  });
  if (!r) return;

  const [companyUser, carrierUser, directoryCompany] = await Promise.all([
    r.companyId
      ? prisma.user.findUnique({
          where: { id: r.companyId },
          select: { email: true, name: true },
        })
      : null,
    r.carrierId
      ? prisma.user.findUnique({
          where: { id: r.carrierId },
          select: { email: true, name: true },
        })
      : null,
    r.shipmentCompanyId
      ? prisma.shipmentCompany.findUnique({
          where: { id: r.shipmentCompanyId },
          select: { company_name: true, email: true },
        })
      : null,
  ]);

  type Recipient = { email: string; audience: "company" | "carrier" };
  const raw: Recipient[] = [];

  if (companyUser?.email?.trim()) {
    raw.push({ email: companyUser.email.trim(), audience: "company" });
  }

  if (carrierUser?.email?.trim()) {
    raw.push({ email: carrierUser.email.trim(), audience: "carrier" });
  } else if (directoryCompany?.email?.trim()) {
    raw.push({ email: directoryCompany.email.trim(), audience: "carrier" });
  }

  const seen = new Set<string>();
  const recipients = raw.filter((x) => {
    const k = x.email.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (recipients.length === 0) {
    console.warn(
      `[shipment-completion-email] No recipient emails for request ${shipmentRequestId}`,
    );
    return;
  }

  const resend = new Resend(apiKey);
  const from = getResendFromAddress();
  const idSafe = escapeHtml(r.id);
  const fromSafe = escapeHtml(r.fromText);
  const toSafe = escapeHtml(r.toText);

  const subject =
    `Shipment ${r.id} — approved & in progress | تم اعتماد الطلب قيد التنفيذ فعلياً`;

  for (const { email, audience } of recipients) {
    const isCompany = audience === "company";
    const arLead = isCompany
      ? "تم اعتماد طلب الشحن الخاص بكم، وهو الآن قيد التنفيذ على أرض الواقع."
      : "تم اعتماد طلب الشحن المسند إليكم، وهو الآن قيد التنفيذ على أرض الواقع.";
    const enLead = isCompany
      ? "Your shipment request has been fully approved and is now in progress in real life."
      : "The shipment you are assigned to has been fully approved and is now in progress in real life.";

    const html = `
      <div dir="rtl" style="font-family: Arial, 'Segoe UI', sans-serif; line-height:1.7; color:#111827; max-width: 560px;">
        <h2 style="margin:0 0 12px 0; color:#0f766e;">Hawai Logisti</h2>
        <p style="margin:0 0 12px 0; font-size: 15px;">${arLead}</p>
        <p style="margin:0 0 8px 0;"><strong>رقم الطلب:</strong> ${idSafe}</p>
        <p style="margin:0 0 16px 0;"><strong>المسار:</strong> من ${fromSafe} → إلى ${toSafe}</p>
        <p style="margin:0 0 16px 0; font-size: 14px; color:#374151;">يُنصح بمتابعة حالة الطلب عبر المنصة عند الحاجة.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0;" />
        <div dir="ltr">
          <p style="margin:0 0 12px 0; font-size: 15px;">${enLead}</p>
          <p style="margin:0 0 8px 0;"><strong>Request ID:</strong> ${idSafe}</p>
          <p style="margin:0 0 16px 0;"><strong>Route:</strong> ${fromSafe} → ${toSafe}</p>
          <p style="margin:0; font-size: 14px; color:#374151;">You can track the request on the platform as needed.</p>
        </div>
      </div>
    `;

    const text = [
      arLead,
      "",
      `رقم الطلب: ${r.id}`,
      `المسار: من ${r.fromText} إلى ${r.toText}`,
      "",
      enLead,
      "",
      `Request ID: ${r.id}`,
      `Route: ${r.fromText} → ${r.toText}`,
    ].join("\n");

    try {
      await resend.emails.send({
        from,
        to: email,
        subject,
        html,
        text,
      });
    } catch (e) {
      console.error(`[shipment-completion-email] Failed to send to ${email}:`, e);
    }
  }
}
