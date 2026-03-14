import { redirect } from "next/navigation";

export default function CompanyDashboardPage() {
  redirect("/dashboard/company/orders");
}
