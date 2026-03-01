import { Suspense } from "react";
import { getServerUser, getServerContent } from "@/lib/server-data";
import { LibraryClient } from "./_components/library-client";
import { Loader2 } from "lucide-react";

export default async function LibraryPage() {
  const user = await getServerUser();
  const contentRes = user ? await getServerContent(user.id) : null;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LibraryClient initialContent={contentRes} />
    </Suspense>
  );
}
