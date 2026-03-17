import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { Types } from "mongoose";

export const dynamic = "force-dynamic"; // ← added this line

type LeanUser = {
  _id: Types.ObjectId;
  email: string;
  name?: string;
  createdAt?: Date;
};

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return Response.json({ user: null }, { status: 200 });
    }

    await connectToDatabase();

    const user = (await User.findById(session.userId)
      .select("email name createdAt")
      .lean()) as LeanUser | null;

    if (!user) {
      return Response.json({ user: null }, { status: 200 });
    }

    return Response.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name ?? "",
        createdAt: user.createdAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("GET /api/user error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}