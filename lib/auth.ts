/**
 * Custom auth: JWT in httpOnly cookie, password hashing with bcrypt.
 */

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_NAME = "auth-token";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production"
);
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export type Session = { userId: string; email: string } | null;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d") // ← fixed: was MAX_AGE (number), jose needs "7d" string
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<Session> {
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

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Server-side auth: returns { userId, email } or null. Use in API routes and server components. */
export async function getAuth(): Promise<{ userId: string | null; email?: string | null }> {
  const session = await getSession();
  if (!session) return { userId: null, email: null };
  return { userId: session.userId, email: session.email };
}

export function getAuthTokenCookie() {
  return COOKIE_NAME;
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE,
    path: "/",
  };
}