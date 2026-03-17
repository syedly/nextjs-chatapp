import { NextRequest, NextResponse } from "next/server"; // ← NextResponse added
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";
import {
  verifyPassword,
  createToken,
  getCookieOptions,
  getAuthTokenCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email?.trim() || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await createToken(user._id.toString(), user.email);
    const res = NextResponse.json({ success: true, user: { id: user._id, email: user.email, name: user.name } }); // ← NextResponse
    res.cookies.set(getAuthTokenCookie(), token, getCookieOptions());
    return res;
  } catch (e) {
    console.error("Signin error:", e);
    return Response.json({ error: "Sign in failed" }, { status: 500 });
  }
}