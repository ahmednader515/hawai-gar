import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role === "ADMIN") redirect("/dashboard/admin");
  if (role === "SUPERVISOR") redirect("/dashboard/supervisor");
  if (role === "COMPANY") redirect("/");
  if (role === "DRIVER") redirect("/dashboard/client");

  redirect("/login");
}
