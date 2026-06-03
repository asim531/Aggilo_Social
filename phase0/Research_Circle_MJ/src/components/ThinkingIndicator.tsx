"use client";

/**
 * ThinkingIndicator — rotating status messages while Sage or Clio
 * processes an LLM response. Cycles through a set of human-friendly
 * messages every 3 seconds.
 */

import { useState, useEffect } from "react";
import { withBasePath } from "@/lib/path";

interface ThinkingIndicatorProps {
  agent: "sage" | "clio";
}

const SAGE_MESSAGES = [
  "Sage is reading the thread…",
  "Sage is gathering context…",
  "Sage is formulating a response…",
  "Sage is checking her notes…",
  "Sage is almost there…",
];

const CLIO_MESSAGES = [
  "Clio is reviewing the room…",
  "Clio is listening carefully…",
  "Clio is preparing her thoughts…",
  "Clio is consulting the archive…",
  "Clio is readying her reply…",
];

export default function ThinkingIndicator({ agent }: ThinkingIndicatorProps) {
  const [index, setIndex] = useState(0);
  const messages = agent === "sage" ? SAGE_MESSAGES : CLIO_MESSAGES;
  const avatar = agent === "sage" ? "/characters/sage.png" : "/characters/clio.png";
  const label = agent === "sage" ? "Sage" : "Clio";
  const tint = agent === "sage" ? "bg-husl-sageSoft/20" : "bg-husl-clio/10";
  const textColor = agent === "sage" ? "text-husl-sage" : "text-husl-clio";

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={`border-t border-stone-200 px-4 py-3 pl-8 ${tint} flex items-center gap-2`}>
      <div className="relative w-4 h-4 rounded-full overflow-hidden bg-white/60 shrink-0">
        <img src={withBasePath(avatar)} alt={label} className="object-contain w-full h-full" />
      </div>
      <span className={`text-xs font-medium ${textColor} animate-pulse`}>
        {messages[index]}
      </span>
      <span className="flex gap-0.5 items-center" aria-label="Loading">
        <span className={`w-1 h-1 rounded-full ${agent === "sage" ? "bg-husl-sage/60" : "bg-husl-clio/60"} animate-bounce`} style={{ animationDelay: "0ms" }} />
        <span className={`w-1 h-1 rounded-full ${agent === "sage" ? "bg-husl-sage/60" : "bg-husl-clio/60"} animate-bounce`} style={{ animationDelay: "150ms" }} />
        <span className={`w-1 h-1 rounded-full ${agent === "sage" ? "bg-husl-sage/60" : "bg-husl-clio/60"} animate-bounce`} style={{ animationDelay: "300ms" }} />
      </span>
    </div>
  );
}
