"use client";

import { useEffect, useRef, useCallback } from "react";

interface LearningTrackerProps {
  courseId: string;
  chapterId: string;
}

/**
 * LearningTracker - Proactively tracks student learning activity.
 * 
 * Features:
 * 1. Calls /start API when chapter is opened (fires CHAPTER_STARTED event)
 * 2. Sends time tracking updates every 30 seconds
 * 3. Stops tracking when tab is hidden, resumes when visible
 * 4. Cleans up on unmount
 */
export function LearningTracker({ courseId, chapterId }: LearningTrackerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const hasStartedRef = useRef(false);

  // Send time tracking update
  const sendTrackingUpdate = useCallback(async () => {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - lastTickRef.current) / 1000);
    lastTickRef.current = now;

    if (elapsedSeconds <= 0 || elapsedSeconds > 300) return; // Skip if unreasonable

    try {
      await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/tracking`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeSpentSeconds: elapsedSeconds }),
        }
      );
    } catch (error) {
      console.error("[LearningTracker] Failed to send tracking update:", error);
    }
  }, [courseId, chapterId]);

  // Start chapter session
  const startChapter = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    try {
      await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/start`,
        { method: "POST" }
      );
    } catch (error) {
      console.error("[LearningTracker] Failed to start chapter:", error);
    }
  }, [courseId, chapterId]);

  useEffect(() => {
    // Start the chapter session immediately
    startChapter();

    // Start periodic tracking (every 30 seconds)
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      sendTrackingUpdate();
    }, 30_000); // 30 seconds

    // Handle visibility change - pause tracking when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - send final update and stop timer
        sendTrackingUpdate();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Tab visible again - restart timer
        lastTickRef.current = Date.now();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            sendTrackingUpdate();
          }, 30_000);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Send final update before unmount
    const handleBeforeUnload = () => {
      sendTrackingUpdate();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Cleanup
      sendTrackingUpdate(); // Final update
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [startChapter, sendTrackingUpdate]);

  // This component renders nothing - it's purely functional
  return null;
}