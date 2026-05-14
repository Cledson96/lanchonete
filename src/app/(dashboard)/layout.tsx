import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/dashboard/login");
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex w-full flex-col gap-4 px-3 py-4 sm:px-4 lg:min-h-screen lg:flex-row lg:gap-5 lg:px-5 lg:py-5 xl:px-6">
        <DashboardSidebar email={session.email} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
