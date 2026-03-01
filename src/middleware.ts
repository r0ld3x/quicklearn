import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/pricing",
  "/terms",
  "/privacy",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/verify-otp",
  "/api/payments/webhook",
  "/api/uploadthing",
];

const adminPathPrefixes = ["/admin", "/api/admin"];

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function verifyTokenInMiddleware(
  token: string
): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      userId: payload.userId as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".");

  if (isPublic || isStaticAsset) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("quicklearn-session")?.value;

  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminPath = adminPathPrefixes.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // For admin paths, only verify the session token is valid (logged in).
  // Role is checked server-side in admin layout and API (getSession/requireAdmin use DB),
  // so upgraded users (e.g. first user or admin-granted) get current role from DB.
  if (isAdminPath) {
    const tokenValid = await verifyTokenInMiddleware(sessionToken);
    if (!tokenValid) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Invalid session" },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
