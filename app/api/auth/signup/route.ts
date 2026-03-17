import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";
import {
  hashPassword,
  createToken,
  getCookieOptions,
  getAuthTokenCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email?.trim() || !password?.trim()) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(password);
    const user = await User.create({
      email: email.trim().toLowerCase(),
      password: hashed,
      name: name?.trim() || undefined,
    });

    const token = await createToken(user._id.toString(), user.email);
    const res = NextResponse.json({ success: true, user: { id: user._id, email: user.email, name: user.name } });
    res.cookies.set(getAuthTokenCookie(), token, getCookieOptions());
    return res;

  } catch (e) {
    console.error("Signup error:", e);
    return Response.json({ error: "Sign up failed" }, { status: 500 });
  }
}
