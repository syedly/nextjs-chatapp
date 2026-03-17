/**
 * Auth helpers for Edge middleware (no DB, no bcrypt).
 */

import { jwtVerify, SignJWT } from "jose";

const COOKIE_NAME = "auth-token";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production"
);

export function getAuthTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`(?:^| )${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export async function verifyTokenInMiddleware(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.userId as string;
    const email = payload.email as string;
    if (!userId || !email) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

// Re-export for SignJWT if ever needed in middleware
export { SignJWT };
