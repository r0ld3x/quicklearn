import { getServerUser, getServerContent } from "@/lib/server-data";
import { LibraryClient } from "./_components/library-client";

export default async function LibraryPage() {
  const user = await getServerUser();
  const contentRes = user ? await getServerContent(user.id) : null;

  return <LibraryClient initialContent={contentRes} />;
}
