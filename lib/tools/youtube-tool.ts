/**
 * lib/tools/youtube-tool.ts
 * YouTube Transcript tool.
 * Extracts and returns transcripts from YouTube videos.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { YoutubeTranscript } from "youtube-transcript";
import { z } from "zod";

/**
 * Extracts a YouTube video ID from various URL formats.
 * Supports: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID
 */
function extractVideoId(input: string): string | null {
  // If it's already just an ID (11 chars, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
    return input.trim();
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export const youtubeTool = new DynamicStructuredTool({
  name: "youtube_transcript",
  description:
    "Fetch the transcript/subtitles of a YouTube video. Use this when the user provides a YouTube URL or video ID and wants to know the content, get a summary, or ask questions about the video.",
  schema: z.object({
    url: z
      .string()
      .describe(
        "The full YouTube URL (e.g. https://youtube.com/watch?v=XXXX) or just the video ID"
      ),
    summarize: z
      .boolean()
      .optional()
      .describe(
        "Whether to return a summary hint — the transcript is always returned but you can note if the user wants a summary"
      ),
  }),
  func: async ({ url }) => {
    const videoId = extractVideoId(url);

    if (!videoId) {
      return `Could not extract a valid YouTube video ID from: "${url}". Please provide a valid YouTube URL like https://youtube.com/watch?v=VIDEO_ID`;
    }

    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

      if (!transcriptItems || transcriptItems.length === 0) {
        return `No transcript available for video ID: ${videoId}. The video may have transcripts disabled or be in an unsupported language.`;
      }

      // Combine transcript text
      const fullText = transcriptItems
        .map((item) => item.text)
        .join(" ")
        .replace(/\[.*?\]/g, "") // Remove [Music], [Applause] etc.
        .replace(/\s+/g, " ")
        .trim();

      // Cap at ~8000 chars to stay within context limits
      const MAX_LENGTH = 8000;
      const truncated = fullText.length > MAX_LENGTH;
      const transcript = truncated
        ? fullText.slice(0, MAX_LENGTH) + "... [transcript truncated]"
        : fullText;

      return (
        `**YouTube Video Transcript** (ID: ${videoId})\n` +
        `Duration: ~${Math.round(transcriptItems.length / 5)} minutes\n` +
        `---\n${transcript}`
      );
    } catch (error: any) {
      // Handle common errors gracefully
      if (error?.message?.includes("disabled")) {
        return `Transcripts are disabled for this video (ID: ${videoId}).`;
      }
      if (error?.message?.includes("private")) {
        return `This video is private and transcripts cannot be accessed (ID: ${videoId}).`;
      }

      console.error("YouTube tool error:", error);
      return `Failed to fetch transcript for video ${videoId}: ${error?.message || "Unknown error"}`;
    }
  },
});
