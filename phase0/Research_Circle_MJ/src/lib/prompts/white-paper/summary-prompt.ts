/**
 * Paper summary prompt for the Discussion Tracker.
 *
 * Generates a threaded summary of comments on a specific tag/topic.
 */

export function buildTagSummaryPrompt(tagName: string, comments: { author: string; body: string }[]) {
  const commentsText = comments
    .map((c) => `- ${c.author}: ${c.body}`)
    .join("\n");

  return [
    {
      role: "system" as const,
      content:
        "You are a discussion summarizer. Given comments on a specific tag/topic within a research paper, produce a concise summary (2-4 sentences) of the main themes, agreements, and disagreements.",
    },
    {
      role: "user" as const,
      content: `Tag: ${tagName}\n\nComments:\n${commentsText}\n\nProvide a concise summary of this discussion thread.`,
    },
  ];
}
