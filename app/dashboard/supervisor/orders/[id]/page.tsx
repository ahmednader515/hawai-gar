import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderAdminActions } from "@/app/dashboard/admin/orders/[id]/order-admin-actions";

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: "في انتظار موافقة الإدارة",
  PENDING_DRIVER: "في انتظار رد شركة النقل",
  ACCEPTED: "مقبول",
  IN_PROGRESS: "قيد التنفيذ",
  DONE: "منتهي",
  REFUSED: "مرفوض",
  CANCELLED: "ملغى",
};

export default async function SupervisorOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERVISOR") return null;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      fromLocation: true,
      toLocation: true,
      company: {
        select: {
          id: true,
          email: true,
          companyProfile: true,
        },
      },
      driver: {
        select: {
          id: true,
          email: true,
          name: true,
          driverProfile: true,
        },
      },
    },
  });

  if (!order) notFound();

  const company = order.company;
  const driver = order.driver;
  const companyProfile = company?.companyProfile;
  const driverProfile = driver?.driverProfile;

  return (
    <div className="w-full min-w-0 max-w-full">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Link href="/dashboard/supervisor">
          <Button variant="ghost" size="sm">← رجوع</Button>
        </Link>
        <h1 className="text-2xl font-bold">تفاصيل الطلب</h1>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <span className="font-medium">
              من {order.fromLocation.nameAr} → إلى {order.toLocation.nameAr}
            </span>
            <p className="text-sm text-muted-foreground">
              الحالة: {statusLabels[order.status] ?? order.status}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("ar-SA")}
            </p>
          </CardHeader>
          <CardContent>
            <OrderAdminActions
              orderId={order.id}
              status={order.status}
              redirectAfterDelete="/dashboard/supervisor"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">بيانات الشركة (للاتصال)</h2>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {companyProfile ? (
              <>
                <p><strong>اسم الشركة:</strong> {companyProfile.companyName}</p>
                <p><strong>المسؤول:</strong> {companyProfile.contactPerson}</p>
                <p><strong>الهاتف:</strong> {companyProfile.phone}</p>
                <p><strong>البريد:</strong> {company?.email}</p>
                {companyProfile.address && (
                  <p><strong>العنوان:</strong> {companyProfile.address}</p>
                )}
                {companyProfile.city && (
                  <p><strong>المدينة:</strong> {companyProfile.city}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">بيانات شركة النقل (للاتصال)</h2>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {driverProfile ? (
              <>
                <p><strong>الاسم:</strong> {driverProfile.fullName}</p>
                <p><strong>الهاتف:</strong> {driverProfile.phone}</p>
                <p><strong>البريد:</strong> {driver?.email}</p>
                <p><strong>لوحة المركبة:</strong> {driverProfile.carPlate}</p>
                {driverProfile.carType && (
                  <p><strong>نوع المركبة:</strong> {driverProfile.carType}</p>
                )}
                {driverProfile.licenseNumber && (
                  <p><strong>رخصة القيادة:</strong> {driverProfile.licenseNumber}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
