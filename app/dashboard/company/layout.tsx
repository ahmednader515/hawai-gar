import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CompanySidebar } from "./company-sidebar";

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Companies should not have a dashboard anymore; track everything from homepage.
  if (session.user.role === "COMPANY") redirect("/");
  redirect("/dashboard");

  return (
    <div className="flex flex-col md:flex-row min-h-0 min-w-0 w-full max-w-full max-md:mx-0 -mx-4 -my-4 gap-0 md:min-h-0 md:h-[calc(100vh-3.5rem-1px)] overflow-hidden">
      <CompanySidebar />
      <div className="flex-1 min-w-0 min-h-0 w-full max-w-full p-6 bg-background overflow-auto overflow-x-hidden scrollbar-hide max-md:p-4 max-md:overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
