import { redirect } from "next/navigation";

export default function ClientDashboardPage() {
  redirect("/dashboard/client/requests");
}
