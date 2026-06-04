"use client";

import type { Topic } from "@/lib/types";

interface TopicBarSimpleProps {
  activeTopicSlug?: string | null;
  onSelectTopic?: (topic: Topic | null) => void;
  onOpenTopicsTab?: () => void;
}

export default function TopicBarSimple({ activeTopicSlug, onSelectTopic, onOpenTopicsTab }: TopicBarSimpleProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-amber-100 border-b border-amber-200">
      <span className="text-amber-800 font-bold">📝 TEST TOPICBAR</span>
      <span className="text-amber-700">slug={activeTopicSlug || 'none'}</span>
      <button onClick={() => onOpenTopicsTab?.()} className="px-2 py-1 bg-amber-600 text-white text-xs rounded">
        Open Topics
      </button>
    </div>
  );
}
