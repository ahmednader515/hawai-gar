import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SupervisorSidebar } from "./supervisor-sidebar";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPERVISOR") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col gap-0 overflow-hidden max-md:m-0 md:-mx-4 md:-my-4 md:h-[min(100dvh-3.5rem-1px,100%)] md:flex-row md:min-h-0">
      <SupervisorSidebar />
      <div className="flex-1 min-w-0 min-h-0 w-full max-w-full bg-background overflow-auto overflow-x-hidden scrollbar-hide max-md:overflow-x-hidden px-6 pt-6 max-md:px-0 max-md:pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-6">
        {children}
      </div>
    </div>
  );
}
