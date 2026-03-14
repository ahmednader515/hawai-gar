import "dotenv/config";
import { prisma } from "../lib/db";
import { UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const PLACEHOLDER_NEWS = [
  {
    titleAr: "تعزيز الربط بين آسيا وأوروبا عبر النقل البري",
    titleEn: "Enhancing Asia-Europe connectivity via land transport",
    category: "النقل البري والخدمات اللوجستية",
    imageUrl: "/land-shipping-1.png",
    excerpt: "خدمات نقل حاويات موثوقة بين المدن والمحطات الجافة",
    link: "#",
    publishedAt: new Date("2026-03-09"),
  },
  {
    titleAr: "إرشادات للعملاء - تحديث أسعار النقل",
    titleEn: "Customer advisory - transport rates update",
    category: "إرشادات العملاء",
    imageUrl: "/land-shipping-2.png",
    excerpt: "تحديثات على تعريفة النقل البري للحاويات",
    link: "#",
    publishedAt: new Date("2026-03-10"),
  },
  {
    titleAr: "توسيع شبكة التغطية إلى مدن جديدة",
    titleEn: "Expanding coverage to new cities",
    category: "شبكة النقل",
    imageUrl: "/land-shipping-3.png",
    excerpt: "إضافة مسارات ومحطات جديدة في المملكة",
    link: "#",
    publishedAt: new Date("2026-03-11"),
  },
  {
    titleAr: "عودة الخدمات الموسمية للنقل المكثف",
    titleEn: "Seasonal high-volume transport services",
    category: "خدمات النقل",
    imageUrl: "/land-shipping-4.png",
    excerpt: "استعدادنا لفترة الذروة مع سائقين إضافيين",
    link: "#",
    publishedAt: new Date("2026-03-12"),
  },
];

const PLACEHOLDER_ADVISORIES = [
  {
    titleAr: "إرشاد وقود طارئ - خطوط من وإلى شمال أوروبا",
    titleEn: "Emergency Fuel Surcharge - Trades from/to Northern Europe",
    excerpt: "تحديث تعريفة الوقود الطارئ للمسارات المذكورة",
    publishedAt: new Date("2026-03-11"),
    link: "#",
  },
  {
    titleAr: "إعلان أسعار - خط من الشرق الأقصى إلى أفريقيا",
    titleEn: "Price Announcement - Trade from Far East to Sub-Saharan Africa",
    excerpt: "أسعار FAK جديدة، الشرق الأقصى",
    publishedAt: new Date("2026-03-10"),
    link: "#",
  },
  {
    titleAr: "تحديث أوقات العبور - آسيا إلى البحر الأحمر",
    titleEn: "Transit Times Update - Asia to Red Sea",
    excerpt: "أوقات عبور تنافسية عبر ميناء الملك عبدالله وجدة",
    publishedAt: new Date("2026-03-09"),
    link: "#",
  },
  {
    titleAr: "توسيع التغطية - الربط بين المدن والمحطات الجافة",
    titleEn: "Expanded coverage - City and dry port connectivity",
    excerpt: "إضافة مسارات جديدة للنقل البري",
    publishedAt: new Date("2026-03-08"),
    link: "#",
  },
  {
    titleAr: "إرشادات الشحن للموسم القادم",
    titleEn: "Shipping guidelines for next season",
    excerpt: "مواعيد وضوابط النقل البري للحاويات",
    publishedAt: new Date("2026-03-07"),
    link: "#",
  },
];

const LOCATIONS = [
  { nameAr: "الرياض", nameEn: "Riyadh", slug: "riyadh" },
  { nameAr: "جدة", nameEn: "Jeddah", slug: "jeddah" },
  { nameAr: "الدمام", nameEn: "Dammam", slug: "dammam" },
  { nameAr: "الخبر", nameEn: "Khobar", slug: "khobar" },
  { nameAr: "الجبيل", nameEn: "Jubail", slug: "jubail" },
  { nameAr: "ينبع", nameEn: "Yanbu", slug: "yanbu" },
  { nameAr: "ميناء الملك عبدالله", nameEn: "King Abdullah Port", slug: "king-abdullah-port" },
  { nameAr: "ميناء جدة الإسلامي", nameEn: "Jeddah Islamic Port", slug: "jeddah-islamic-port" },
  { nameAr: "ميناء الملك عبدالعزيز", nameEn: "King Abdulaziz Port", slug: "king-abdulaziz-port" },
  { nameAr: "المحطة الجافة بالرياض", nameEn: "Riyadh Dry Port", slug: "riyadh-dry-port" },
  { nameAr: "ميناء الجبيل التجاري", nameEn: "Jubail Commercial Port", slug: "jubail-commercial-port" },
  { nameAr: "الطائف", nameEn: "Taif", slug: "taif" },
  { nameAr: "مكة المكرمة", nameEn: "Makkah", slug: "makkah" },
  { nameAr: "المدينة المنورة", nameEn: "Madinah", slug: "madinah" },
  { nameAr: "جازان", nameEn: "Jazan", slug: "jazan" },
  { nameAr: "أبها", nameEn: "Abha", slug: "abha" },
  { nameAr: "تبوك", nameEn: "Tabuk", slug: "tabuk" },
  { nameAr: "حائل", nameEn: "Hail", slug: "hail" },
];

async function main() {
  for (const loc of LOCATIONS) {
    await prisma.location.upsert({
      where: { slug: loc.slug },
      update: {},
      create: loc,
    });
  }
  console.log("Seeded locations.");

  const adminEmail = "admin@gulfcontainer.com";
  const adminPassword = "Admin123!";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "مدير النظام",
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
    console.log("Created admin:", adminEmail, "password:", adminPassword);
  } else {
    console.log("Admin already exists:", adminEmail);
  }

  const newsCount = await prisma.newsItem.count();
  if (newsCount === 0) {
    await prisma.newsItem.createMany({ data: PLACEHOLDER_NEWS });
    console.log("Seeded placeholder news items.");
  } else {
    console.log("News items already exist, skipping.", newsCount);
  }

  const advisoriesCount = await prisma.customerAdvisory.count();
  if (advisoriesCount === 0) {
    await prisma.customerAdvisory.createMany({ data: PLACEHOLDER_ADVISORIES });
    console.log("Seeded placeholder advisories.");
  } else {
    console.log("Advisories already exist, skipping.", advisoriesCount);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
