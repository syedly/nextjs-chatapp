/**
 * lib/tools/search-tool.ts
 * Google Search tool using Serper API.
 * The agent calls this when the user asks something requiring web search.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const searchTool = new DynamicStructuredTool({
  name: "google_search",
  description:
    "Search the internet for current information. Use this tool when the user asks about recent events, news, people, companies, or anything that requires up-to-date information from the web.",
  schema: z.object({
    query: z.string().describe("The search query to look up on Google"),
  }),
  func: async ({ query }) => {
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      return "Search tool not configured. Please add SERPER_API_KEY to your environment.";
    }

    try {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, num: 5 }),
      });

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`);
      }

      const data = await response.json();

      // Format results into a clean string for the agent
      const results: string[] = [];

      // Answer box (quick answer)
      if (data.answerBox) {
        const box = data.answerBox;
        results.push(
          `**Quick Answer:** ${box.answer || box.snippet || box.title}`
        );
      }

      // Knowledge graph
      if (data.knowledgeGraph) {
        const kg = data.knowledgeGraph;
        results.push(`**${kg.title}** (${kg.type || ""}): ${kg.description || ""}`);
      }

      // Organic results
      if (data.organic && data.organic.length > 0) {
        results.push("\n**Search Results:**");
        data.organic.slice(0, 4).forEach((r: any, i: number) => {
          results.push(`${i + 1}. **${r.title}**\n   ${r.snippet}\n   Source: ${r.link}`);
        });
      }

      return results.join("\n\n") || "No results found for this query.";
    } catch (error) {
      console.error("Search tool error:", error);
      return `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});
