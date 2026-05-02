import { prisma } from "@/lib/db";

const KEY_TERMS_TITLE_AR = "shipment_terms_title_ar";
const KEY_TERMS_TITLE_EN = "shipment_terms_title_en";
const KEY_TERMS_CONTENT_AR = "shipment_terms_content_ar";
const KEY_TERMS_CONTENT_EN = "shipment_terms_content_en";

const DEFAULT_TERMS_TITLE_AR = "الشروط والأحكام";
const DEFAULT_TERMS_TITLE_EN = "Terms and Conditions";

const DEFAULT_TERMS_CONTENT_AR = `باستخدامك خدمة إرسال طلب الشحن، فإنك توافق على الشروط التالية:
1) جميع بيانات الطلب (المواقع، نوع الشحنة، نوع الشاحنة، التاريخ، ورقم التواصل) يجب أن تكون صحيحة.
2) السعر الظاهر تقديري وقد يخضع للمراجعة والاعتماد النهائي من الإدارة.
3) يحق للإدارة طلب مستندات إضافية قبل اعتماد الطلب أو الدفع.
4) أي معلومات مضللة قد تؤدي إلى رفض الطلب أو إيقاف الحساب.
5) استخدام المنصة يعني التزامك بسياسة التشغيل المعتمدة لدى Hawai Logisti.`;

const DEFAULT_TERMS_CONTENT_EN = `By submitting a shipment request, you agree to the following:
1) All request data (locations, shipment type, truck type, date, and phone) must be accurate.
2) Displayed pricing is an estimate and may be reviewed by admin before final approval.
3) Admin may request additional documents before approving the request or payment.
4) Misleading information may result in request rejection or account restrictions.
5) Using the platform means you accept Hawai Logisti operational policies.`;

export type ShipmentTerms = {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
};

export async function getShipmentTerms(): Promise<ShipmentTerms> {
  try {
    const [titleAr, titleEn, contentAr, contentEn] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: KEY_TERMS_TITLE_AR } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_TERMS_TITLE_EN } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_TERMS_CONTENT_AR } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_TERMS_CONTENT_EN } }),
    ]);
    return {
      titleAr: titleAr?.value?.trim() || DEFAULT_TERMS_TITLE_AR,
      titleEn: titleEn?.value?.trim() || DEFAULT_TERMS_TITLE_EN,
      contentAr: contentAr?.value?.trim() || DEFAULT_TERMS_CONTENT_AR,
      contentEn: contentEn?.value?.trim() || DEFAULT_TERMS_CONTENT_EN,
    };
  } catch {
    return {
      titleAr: DEFAULT_TERMS_TITLE_AR,
      titleEn: DEFAULT_TERMS_TITLE_EN,
      contentAr: DEFAULT_TERMS_CONTENT_AR,
      contentEn: DEFAULT_TERMS_CONTENT_EN,
    };
  }
}

export async function setShipmentTerms(data: Partial<ShipmentTerms>) {
  if (data.titleAr !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: KEY_TERMS_TITLE_AR },
      create: { key: KEY_TERMS_TITLE_AR, value: data.titleAr.trim() },
      update: { value: data.titleAr.trim() },
    });
  }
  if (data.titleEn !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: KEY_TERMS_TITLE_EN },
      create: { key: KEY_TERMS_TITLE_EN, value: data.titleEn.trim() },
      update: { value: data.titleEn.trim() },
    });
  }
  if (data.contentAr !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: KEY_TERMS_CONTENT_AR },
      create: { key: KEY_TERMS_CONTENT_AR, value: data.contentAr.trim() },
      update: { value: data.contentAr.trim() },
    });
  }
  if (data.contentEn !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: KEY_TERMS_CONTENT_EN },
      create: { key: KEY_TERMS_CONTENT_EN, value: data.contentEn.trim() },
      update: { value: data.contentEn.trim() },
    });
  }
}

