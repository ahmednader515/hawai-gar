import { NewOrderForm } from "./new-order-form";

export default function NewOrderPage() {
  return (
    <div className="w-full min-w-0 max-w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">إنشاء طلب نقل جديد</h1>
        <p className="text-muted-foreground max-w-xl">
          اختر نقطة الانطلاق والوصول، ثم اختر شركة النقل المناسبة من القائمة.
        </p>
      </div>
      <NewOrderForm />
    </div>
  );
}
