"use client";

/**
 * useTabNotification — Research Circle MJ.
 *
 * Displays an unread-count badge in the browser tab title when new posts
 * arrive while the user is not looking. Zero backend, zero permissions,
 * zero intrusion.
 *
 * How it works:
 *   - Listens for "lc:new-post" custom events dispatched by
 *     useRealtimePosts whenever a post lands via Supabase Realtime.
 *   - Increments a counter only when the tab is backgrounded (hidden
 *     or another window is focused). Own posts are excluded.
 *   - Clears the counter (and restores the title) the moment the user
 *     returns: visibilitychange OR window focus — whichever fires first.
 *
 * Why this specific design:
 *   - No duplicate Realtime subscription — piggybacks on the existing
 *     posts channel via a window custom event, keeping socket count low.
 *   - Clears on focus only, not on a timer. Timers breed anxiety
 *     ("I have 3 unread things") — clearing on return is respectful.
 *   - No badge for own posts — you know you posted.
 */

import { useEffect, useRef, useState } from "react";

const BASE_TITLE = "Research Circle MJ";

export function useTabNotification(userId: string): void {
  const [unseenCount, setUnseenCount] = useState(0);
  const isHiddenRef = useRef(false);

  // Track visibility state so the event handler can read it synchronously.
  useEffect(() => {
    isHiddenRef.current =
      typeof document !== "undefined" && document.visibilityState === "hidden";

    const handleVisibilityChange = () => {
      const hidden = document.visibilityState === "hidden";
      isHiddenRef.current = hidden;
      if (!hidden) setUnseenCount(0);
    };

    const handleFocus = () => {
      isHiddenRef.current = false;
      setUnseenCount(0);
    };

    const handleBlur = () => {
      isHiddenRef.current = true;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Receive new-post signals from useRealtimePosts (no extra channel).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ authorId: string | null }>).detail;
      if (detail.authorId === userId) return;
      if (isHiddenRef.current) {
        setUnseenCount((c) => c + 1);
      }
    };

    window.addEventListener("lc:new-post", handler);
    return () => window.removeEventListener("lc:new-post", handler);
  }, [userId]);

  // Sync document title. Restores on unmount.
  useEffect(() => {
    document.title =
      unseenCount > 0 ? `(${unseenCount}) ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [unseenCount]);
}
