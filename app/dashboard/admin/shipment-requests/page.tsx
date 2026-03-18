import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminShipmentRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  redirect("/dashboard/admin");
}

