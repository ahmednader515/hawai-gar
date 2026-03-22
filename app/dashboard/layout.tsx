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
      {/* overflow-y only inside role layouts so desktop sidebars stay visible */}
      <main className="flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col overflow-hidden py-4 max-md:px-[5vw] md:px-4">
        {children}
      </main>
    </div>
  );
}
