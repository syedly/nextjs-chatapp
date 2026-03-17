/**
 * app/api/seed/route.ts
 * Seeds the database with sample customer data for demo purposes.
 * Only runs in development.
 */

import { getAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/lib/models";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Seed disabled in production" }, { status: 403 });
  }

  const { userId } = await getAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await connectToDatabase();

  const existing = await Customer.countDocuments();
  if (existing > 0) {
    return Response.json({ message: "Database already seeded", count: existing });
  }

  const customers = [
    { name: "Alice Johnson", email: "alice@acmecorp.com", company: "Acme Corp", status: "active", phone: "+1-555-0101" },
    { name: "Bob Smith", email: "bob@techstart.io", company: "TechStart", status: "lead", phone: "+1-555-0102" },
    { name: "Carol White", email: "carol@innovate.co", company: "Innovate Co", status: "active", phone: "+1-555-0103" },
    { name: "David Lee", email: "david@globalinc.com", company: "Global Inc", status: "inactive", phone: "+1-555-0104" },
    { name: "Emma Davis", email: "emma@futuretech.ai", company: "FutureTech AI", status: "active", phone: "+1-555-0105" },
    { name: "Frank Miller", email: "frank@buildfast.dev", company: "BuildFast", status: "lead", phone: "+1-555-0106" },
    { name: "Grace Wilson", email: "grace@cloudops.net", company: "CloudOps", status: "active", phone: "+1-555-0107" },
    { name: "Henry Brown", email: "henry@dataflow.io", company: "DataFlow", status: "lead", phone: "+1-555-0108" },
  ];

  await Customer.insertMany(customers);

  return Response.json({ message: "Seeded successfully", count: customers.length });
}
