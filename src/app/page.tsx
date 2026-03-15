import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default function Home() {
  // In the MVP, the root landing page redirects to the dashboard.
  // The middleware will automatically catch unauthenticated users
  // navigating to the dashboard and redirect them to /login.
  redirect(ROUTES.DASHBOARD);
}
