/**
 * lib/agent/index.ts
 * The core LangChain tool-calling agent.
 * Wires together the LLM, tools, and streaming support.
 */

import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

import { searchTool } from "@/lib/tools/search-tool";
import { youtubeTool } from "@/lib/tools/youtube-tool";
import { databaseTool } from "@/lib/tools/database-tool";

// ─── Types ───────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Agent System Prompt ──────────────────────────────────────

const SYSTEM_PROMPT = `You are an intelligent AI assistant with access to powerful tools.

You can:
- Answer general questions from your knowledge
- Search the internet for current information (use google_search tool)
- Fetch and summarize YouTube video transcripts (use youtube_transcript tool)
- Query the customer database (use query_database tool)

Guidelines:
- Be concise and helpful
- Use tools when the question requires real-time data, web search, or database info
- Format responses with Markdown when it improves readability
- If a YouTube URL is detected in the user's message, proactively use the youtube_transcript tool
- For database queries about customers, always use the query_database tool
- Always cite your sources when using search results

Today's date: ${new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
})}`;

// ─── Build Agent ──────────────────────────────────────────────

export async function createAgent() {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.3,
    streaming: true,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const tools = [searchTool, youtubeTool, databaseTool];

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createOpenAIToolsAgent({ llm, tools, prompt });

  const executor = new AgentExecutor({
    agent,
    tools,
    verbose: false,
    maxIterations: 5, // Prevent infinite tool loops
    returnIntermediateSteps: true,
  });

  return executor;
}

// ─── Convert stored messages to LangChain format ─────────────

export function formatChatHistory(messages: ChatMessage[]) {
  return messages.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );
}

// ─── Streaming agent runner ────────────────────────────────────

export async function runAgentStream(
  input: string,
  chatHistory: ChatMessage[],
  onToken: (token: string) => void,
  onToolUse?: (tool: string, input: string) => void
): Promise<string> {
  const executor = await createAgent();
  const history = formatChatHistory(chatHistory);

  let fullResponse = "";

  const result = await executor.invoke(
    {
      input,
      chat_history: history,
    },
    {
      callbacks: [
        {
          handleLLMNewToken(token: string) {
            onToken(token);
            fullResponse += token;
          },
          handleToolStart(tool: any, input: string) {
            if (onToolUse) {
              onToolUse(tool.name || "tool", input);
            }
          },
        },
      ],
    }
  );

  // If streaming didn't capture it (e.g. tool calls), use the final output
  if (!fullResponse && result.output) {
    fullResponse = result.output;
    onToken(fullResponse);
  }

  return fullResponse || result.output;
}
