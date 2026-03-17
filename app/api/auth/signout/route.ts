export const dynamic = "force-dynamic"; // ← add this line at the top

// ... rest of your existing signout code stays unchanged
import { NextResponse } from "next/server";
import { getAuthTokenCookie, getCookieOptions } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(getAuthTokenCookie(), "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
  return res;
}
