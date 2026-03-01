import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "./_components/admin-layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
