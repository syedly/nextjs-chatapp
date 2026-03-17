import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getAuthTokenFromRequest,
  verifyTokenInMiddleware,
} from "@/lib/auth-middleware";

const PROTECTED_PATHS = ["/dashboard", "/settings", "/api/chat", "/api/chats", "/api/seed"];
const AUTH_PATHS = ["/sign-in", "/sign-up"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAuthApi(pathname: string): boolean {
  return pathname.startsWith("/api/auth/");
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  console.log("=== MIDDLEWARE DEBUG ===");
  console.log("PATH:", pathname);
  console.log("COOKIE HEADER:", req.headers.get("cookie"));

  if (isAuthApi(pathname)) {
    return NextResponse.next();
  }

  const token = getAuthTokenFromRequest(req);
  console.log("TOKEN FOUND:", token ? "YES — " + token.slice(0, 20) + "..." : "NO");

  const session = token ? await verifyTokenInMiddleware(token) : null;
  console.log("SESSION:", session);

  if (isProtected(pathname)) {
    if (!session) {
      console.log("REDIRECTING TO SIGN-IN — no session");
      const signIn = new URL("/sign-in", req.url);
      signIn.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signIn);
    }
    console.log("ALLOWING ACCESS TO PROTECTED PATH");
    return NextResponse.next();
  }

  if (isAuthPath(pathname) && session) {
    console.log("REDIRECTING TO DASHBOARD — already logged in");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};