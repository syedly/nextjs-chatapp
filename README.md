# 🤖 AI Agent — Full-Stack Next.js Application

A production-ready AI agent web app with tool calling, streaming responses, Clerk auth, and MongoDB.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Authentication | Clerk (sign-up, sign-in, user profile) |
| 🤖 AI Agent | LangChain + GPT-4o with tool calling |
| 🔍 Web Search | Google Search via Serper API |
| 📺 YouTube Tool | Transcript extraction from any YouTube URL |
| 🗄️ Database Tool | Query MongoDB customers via natural language |
| 💬 Chat UI | Streaming responses, Markdown, code blocks |
| 📝 Chat History | Persisted in MongoDB, grouped by date |
| 🎨 Design | Tailwind CSS + shadcn/ui, dark sidebar |

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd ai-agent-app
npm install
```

### 2. Configure Environment

```bash
cp .env .env.local
```

Edit `.env.local` with your actual keys:

```env
# Clerk — https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# MongoDB Atlas — https://cloud.mongodb.com
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ai_agent_db

# OpenAI — https://platform.openai.com
OPENAI_API_KEY=sk-...

# Serper (Google Search) — https://serper.dev
SERPER_API_KEY=...
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌱 Seed Demo Data

After signing in, seed the database with sample customers:

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "Cookie: $(your session cookie)"
```

Or from the browser console while logged in:
```javascript
fetch('/api/seed', { method: 'POST' }).then(r => r.json()).then(console.log)
```

---

## 🛠️ Agent Tools

### 🔍 Google Search
Triggers when: user asks about current events, news, people, companies.
```
"Who won the World Cup?"
"What is the latest iPhone?"
"OpenAI news today"
```

### 📺 YouTube Transcript
Triggers when: user provides a YouTube URL.
```
"Summarize https://youtube.com/watch?v=VIDEO_ID"
"What does this video say? https://youtu.be/VIDEO_ID"
```

### 🗄️ Database Query
Triggers when: user asks about customers.
```
"Show all customers"
"Find customer with email alice@example.com"
"How many active customers do I have?"
"List all leads"
```

---

## 📁 Project Structure

```
ai-agent-app/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Main streaming chat endpoint
│   │   ├── chats/route.ts         # List/delete chats
│   │   ├── chats/[chatId]/
│   │   │   └── messages/route.ts  # Get messages for a chat
│   │   └── seed/route.ts          # Seed demo customer data
│   ├── dashboard/
│   │   ├── layout.tsx             # Dashboard layout with sidebar
│   │   ├── page.tsx               # Landing/starter prompts
│   │   └── chat/
│   │       ├── new/page.tsx       # New chat
│   │       └── [chatId]/page.tsx  # Existing chat
│   ├── settings/page.tsx          # User profile/settings
│   ├── sign-in/[[...sign-in]]/    # Clerk sign-in
│   ├── sign-up/[[...sign-up]]/    # Clerk sign-up
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   └── chat/
│       ├── Sidebar.tsx            # Left sidebar with chat history
│       ├── ChatWindow.tsx         # Main chat interface
│       ├── MessageBubble.tsx      # Individual message rendering
│       ├── ChatInput.tsx          # Textarea input bar
│       ├── TypingIndicator.tsx    # Animated dots while loading
│       └── ToolCallBadge.tsx      # Shows active tool (search/youtube/db)
│
├── lib/
│   ├── agent/index.ts             # LangChain agent setup
│   ├── tools/
│   │   ├── search-tool.ts         # Serper Google Search tool
│   │   ├── youtube-tool.ts        # YouTube transcript tool
│   │   └── database-tool.ts       # MongoDB customer query tool
│   ├── models/index.ts            # Mongoose schemas
│   ├── mongodb.ts                 # DB connection singleton
│   └── utils.ts                   # cn() helper
│
├── middleware.ts                  # Clerk auth protection
├── .env                           # Environment template
├── .env.local.example             # Local secrets example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🔑 API Keys Needed

| Service | Free Tier | Link |
|---|---|---|
| Clerk | ✅ Free | https://clerk.com |
| MongoDB Atlas | ✅ 512MB free | https://cloud.mongodb.com |
| OpenAI | Pay per use | https://platform.openai.com |
| Serper | ✅ 2,500 searches/month | https://serper.dev |

---

## 🚢 Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add all env vars in the Vercel dashboard under **Settings → Environment Variables**.

Make sure MongoDB Atlas allows connections from `0.0.0.0/0` (all IPs) for Vercel's serverless functions.

---

## 🤝 Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **LangChain** + **GPT-4o**
- **Clerk** authentication
- **MongoDB** + **Mongoose**
- **Serper API** (Google Search)
- **youtube-transcript** package
