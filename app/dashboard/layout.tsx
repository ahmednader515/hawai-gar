import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const role = session.user.role;

  return (
    <div className="min-h-screen bg-muted/20 w-full max-w-[100vw] overflow-hidden flex flex-col">
      <DashboardNav
        role={role as "ADMIN" | "SUPERVISOR" | "COMPANY" | "DRIVER"}
        email={session.user.email ?? null}
      />
      <main className="container mx-auto w-full max-w-full min-w-0 flex-1 min-h-0 px-4 py-4 overflow-x-hidden overflow-y-auto">{children}</main>
    </div>
  );
}
