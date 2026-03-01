import { NextResponse } from "next/server";

export function apiError(
  tag: string,
  error: unknown,
  fallbackMessage = "An unexpected error occurred"
) {
  console.error(tag, error);

  const message =
    error instanceof Error ? error.message : fallbackMessage;

  let status = 500;
  if (message === "Authentication required") status = 401;
  else if (message === "Admin access required") status = 403;
  else if (message === "Access denied") status = 403;
  else if (message === "Content not found" || message === "User not found")
    status = 404;

  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody(req: Request): Promise<{
  data: unknown;
  error: NextResponse | null;
}> {
  try {
    const data = await req.json();
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      ),
    };
  }
}
