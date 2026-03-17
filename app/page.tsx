import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

export default async function Home() {
  const { userId } = await getAuth();
  if (userId) redirect("/dashboard");
  redirect("/sign-in");
}
