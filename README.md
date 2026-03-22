# شركة خليج الحاويات للنقل — Gulf Container Shipping

منصة Next.js (App Router) لربط الشركات الراغبة بنقل بضائعها بسائقي الحاويات في المملكة العربية السعودية. تديرها شركة خليج الحاويات للنقل.

## المميزات

- **صفحة هبوط** عربية RTL مع أقسام: Hero، الخدمات، كيف يعمل، التغطية، CTA، Footer
- **حسابات:** شركات (طلبات نقل)، سائقون (قبول/رفض الطلبات)، إدارة ومشرفون (عرض الطلبات وبيانات التواصل وإغلاق الطلبات)
- **الطلبات:** الشركة تختار من → إلى ثم السائق؛ السائق يقبل أو يرفض؛ الإدارة فقط ترى بيانات التواصل وتحدّث الحالة وتحذف الطلبات المنتهية

## التقنيات

- Next.js 14+ (App Router), TypeScript, Tailwind CSS
- Prisma (PostgreSQL) مع إمكانية استخدام Prisma Postgres (Accelerate)
- NextAuth.js v5 (Credentials + JWT)
- shadcn/ui، واجهة عربية RTL

## الإعداد

### 1. تثبيت الحزم

```bash
npm install
```

### 2. قاعدة البيانات

- ضع `DATABASE_URL` في ملف `.env` (انظر `.env.example`).
- **Neon:** أنشئ مشروعاً في [Neon](https://neon.tech)، ثم:
  - **للتطبيق (Next.js):** انسخ **Pooled connection** إلى `DATABASE_URL` (مناسب للـ serverless وعدد اتصالات أعلى).
  - **لأوامر Prisma:** انسخ **Direct connection** إلى `DATABASE_DIRECT_URL` حتى يعمل `migrate` / `db push` بشكل موثوق (الـ pooler قد يعطل بعض أوامر الـ migration).
  - أضف `?sslmode=require` إن لم يكن في الرابط.
  - التطبيق يستخدم **`DATABASE_URL` فقط** في وقت التشغيل عندما يكون `postgresql://`؛ لا يُوجَّه تلقائياً إلى `DATABASE_DIRECT_URL` (عكس سيناريو Accelerate).
- لاستخدام **Prisma Postgres** محلياً: شغّل `npx prisma dev` ثم استخدم الـ URL الناتج في `.env`.
- لاستخدام **PostgreSQL عادي**: ضع في `.env` رابطاً مثل `postgresql://user:pass@localhost:5432/dbname`. التطبيق يستخدم محول `@prisma/adapter-pg` تلقائياً عندما لا يبدأ الرابط بـ `prisma+postgres://` أو `prisma://`.

#### خطأ: «Unable to connect to the Accelerate API»

يظهر عندما يكون `DATABASE_URL` رابط **Prisma Accelerate** (`prisma+postgres://` أو `prisma://`) والشبكة لا تصل إلى خدمة Accelerate.

**الحلول:**

1. **تطوير محلي:** استخدم اتصالاً مباشراً بـ PostgreSQL في `.env`:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
   ```
2. **الإبقاء على رابط Accelerate في `DATABASE_URL`** (مثلاً من نسخة الإنتاج) مع تشغيل قاعدة محلية: أضف اتصالاً مباشراً يستخدمه التطبيق فقط:
   ```env
   DATABASE_URL="prisma+postgres://..."
   DATABASE_DIRECT_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
   ```
   أوامر Prisma (`db push`, `migrate`) تقرأ `DATABASE_DIRECT_URL` ثم `DATABASE_URL` من `prisma.config.ts`. مع Neon ضع `DATABASE_DIRECT_URL` للرابط **المباشر**.

3. **الإنتاج:** تحقق من صحة رابط Accelerate، الشبكة، و DNS، ومن لوحة Prisma Data Platform.

### 3. تطبيق المخطط وبذر البيانات

**قاعدة جديدة (مثل Neon) فارغة؟** نفّذ أحد الخيارين:

```powershell
cd "d:\web dev\gulf-container"
npm run db:setup
```

أو السكربت:

```powershell
.\scripts\setup-database.ps1
```

أو يدوياً:

```bash
npx prisma db push
npx prisma db seed
```

`db push` ينشئ كل الجداول من `prisma/schema.prisma` (User، Order، ShipmentRequest، …).

الـ seed يضيف مواقع النقل البري في المملكة وحساب مدير افتراضي:

- البريد: `admin@gulfcontainer.com`
- كلمة المرور: `Admin123!`

### 4. NextAuth

أضف في `.env`:

```
AUTH_SECRET=your-secret
```

ولتوليد سر آمن:

```bash
npx auth secret
```

### 5. تشغيل التطبيق

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000).

## هيكل الحسابات والصلاحيات

| النوع      | التسجيل | الوظيفة |
|-----------|---------|---------|
| شركة      | نعم     | إنشاء طلبات نقل، اختيار سائق، عرض طلباتها (بدون بيانات تواصل السائق) |
| سائق      | نعم     | استلام الطلبات، قبول/رفض، عرض طلباته (بدون بيانات تواصل الشركة) |
| إدارة / مشرف | لا (عبر الـ seed أو سكربت) | عرض كل الطلبات وبيانات التواصل، تحديث الحالة، حذف الطلبات المنتهية |

## أوامر مفيدة

- `npm run dev` — تشغيل وضع التطوير
- `npm run build` — بناء المشروع
- `npm run db:generate` — توليد Prisma Client
- `npm run db:push` — دفع المخطط إلى قاعدة البيانات
- `npm run db:seed` — بذر المواقع والمدير الافتراضي
