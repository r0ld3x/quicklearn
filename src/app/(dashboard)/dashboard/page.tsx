import { getServerUser, getServerContent } from "@/lib/server-data";
import { DashboardClient } from "./_components/dashboard-client";

export default async function DashboardPage() {
  const user = await getServerUser();
  const contentRes = user ? await getServerContent(user.id, 5) : null;

  return (
    <DashboardClient
      initialUser={user}
      initialContent={contentRes}
    />
  );
}
