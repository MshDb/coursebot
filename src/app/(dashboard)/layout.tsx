import { auth } from "@/auth";
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Safety net: redirect to login if no session is present.
  // The middleware already does this, but keeping it ensures stability.
  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr]">
      <Sidebar className="hidden md:flex" />
      <div className="flex flex-col">
        <Header user={session.user} />
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
