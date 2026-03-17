/**
 * lib/tools/database-tool.ts
 * Database Query tool — lets the agent query the MongoDB Customer collection.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/lib/models";

export const databaseTool = new DynamicStructuredTool({
  name: "query_database",
  description:
    "Query the customer database. Use this when the user asks about customers, such as 'show my customers', 'find customer by email', 'list active customers', or any customer data query.",
  schema: z.object({
    action: z
      .enum(["list_all", "find_by_email", "find_by_name", "count", "list_by_status"])
      .describe("The database action to perform"),
    email: z
      .string()
      .optional()
      .describe("Customer email to search for (used with find_by_email)"),
    name: z
      .string()
      .optional()
      .describe("Customer name (partial match) to search for (used with find_by_name)"),
    status: z
      .enum(["active", "inactive", "lead"])
      .optional()
      .describe("Filter customers by status (used with list_by_status)"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of results to return (default: 10)"),
  }),
  func: async ({ action, email, name, status, limit = 10 }) => {
    try {
      await connectToDatabase();

      let result;

      switch (action) {
        case "list_all": {
          const customers = await Customer.find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
          result = formatCustomers(customers);
          break;
        }

        case "find_by_email": {
          if (!email) return "Please provide an email address to search for.";
          const customer = await Customer.findOne({
            email: { $regex: email, $options: "i" },
          }).lean();
          result = customer
            ? `Found customer:\n${formatCustomer(customer)}`
            : `No customer found with email: ${email}`;
          break;
        }

        case "find_by_name": {
          if (!name) return "Please provide a name to search for.";
          const customers = await Customer.find({
            name: { $regex: name, $options: "i" },
          })
            .limit(limit)
            .lean();
          result = customers.length
            ? formatCustomers(customers)
            : `No customers found matching name: ${name}`;
          break;
        }

        case "count": {
          const total = await Customer.countDocuments();
          const active = await Customer.countDocuments({ status: "active" });
          const leads = await Customer.countDocuments({ status: "lead" });
          result = `**Customer Statistics:**\n- Total: ${total}\n- Active: ${active}\n- Leads: ${leads}`;
          break;
        }

        case "list_by_status": {
          if (!status)
            return "Please provide a status: active, inactive, or lead.";
          const customers = await Customer.find({ status })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
          result = customers.length
            ? `**${status.toUpperCase()} Customers:**\n${formatCustomers(customers)}`
            : `No ${status} customers found.`;
          break;
        }

        default:
          return "Unknown action. Use: list_all, find_by_email, find_by_name, count, or list_by_status";
      }

      return result;
    } catch (error) {
      console.error("Database tool error:", error);
      return `Database query failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});

// ─── Formatting helpers ───────────────────────────────────────

function formatCustomer(c: any): string {
  return (
    `- **Name:** ${c.name}\n` +
    `  **Email:** ${c.email}\n` +
    `  **Status:** ${c.status}\n` +
    `  **Company:** ${c.company || "N/A"}\n` +
    `  **Phone:** ${c.phone || "N/A"}\n` +
    `  **Created:** ${new Date(c.createdAt).toLocaleDateString()}`
  );
}

function formatCustomers(customers: any[]): string {
  if (!customers.length) return "No customers found.";
  return customers.map((c, i) => `**${i + 1}.** ${formatCustomer(c)}`).join("\n\n");
}
