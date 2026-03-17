import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ user: null }, { status: 200 });
  }

  await connectToDatabase();
  const user = await User.findById(session.userId)
    .select("email name createdAt")
    .lean();
  if (!user) {
    return Response.json({ user: null }, { status: 200 });
  }

  return Response.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
  });
}
