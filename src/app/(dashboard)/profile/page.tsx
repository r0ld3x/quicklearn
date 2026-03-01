import { getServerUser, getServerContent } from "@/lib/server-data";
import { ProfileClient } from "./_components/profile-client";

export default async function ProfilePage() {
  const user = await getServerUser();
  const contentRes = user ? await getServerContent(user.id, 1) : null;

  return (
    <ProfileClient
      initialUser={user}
      initialTotalDocs={contentRes?.pagination?.total ?? 0}
    />
  );
}
