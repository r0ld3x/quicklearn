import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const SESSION_COOKIE = "quicklearn-session";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  await checkAndDowngradeExpiredSubscription(session.user.id, session.user.plan);

  return session.user;
}

async function checkAndDowngradeExpiredSubscription(
  userId: string,
  currentPlan: string
): Promise<void> {
  if (currentPlan === "FREE") return;

  // Only downgrade when there is an ACTIVE subscription that has expired (endDate in the past).
  // Do not downgrade just because there's no subscription (e.g. admin-granted PRO).
  const expiredSubscriptions = await db.subscription.findMany({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { lt: new Date() },
    },
  });

  if (expiredSubscriptions.length > 0) {
    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { plan: "FREE", credits: 5 },
      }),
      db.subscription.updateMany({
        where: { userId, status: "ACTIVE", endDate: { lt: new Date() } },
        data: { status: "EXPIRED" },
      }),
    ]);
  }
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
  return user;
}

export async function requireContentOwner(contentId: string) {
  const user = await requireAuth();

  const content = await db.content.findUnique({
    where: { id: contentId },
  });

  if (!content) {
    throw new Error("Content not found");
  }

  if (content.userId !== user.id) {
    throw new Error("Access denied");
  }

  return { user, content };
}
