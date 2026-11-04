import { db } from "@/lib/db";

/**
 * Result of chapter completion eligibility check.
 */
export interface CompletionCheckResult {
  eligible: boolean;
  reasons: string[];
  details: {
    hasVideo: boolean;
    videoCompleted: boolean;
    totalQuizzes: number;
    completedQuizzes: number;
    totalAssignments: number;
    completedAssignments: number;
  };
}

/**
 * Validates whether a user is eligible to mark a chapter as complete.
 *
 * Checks three conditions:
 * 1. Video: If the chapter has a video, the user must have completed watching it
 *    (VideoAnalytics.completedVideo === true).
 * 2. Quizzes: All published quizzes in the chapter must have been attempted.
 * 3. Assignments: All verified assignments in the chapter must have been submitted.
 *
 * If the chapter has no video, no quizzes, and no assignments, it is considered
 * a text-only chapter and the user is eligible to complete it directly.
 */
export async function validateChapterCompletion(
  userId: string,
  chapterId: string,
): Promise<CompletionCheckResult> {
  const reasons: string[] = [];

  // Fetch chapter info to determine what requirements exist
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    select: {
      videoUrl: true,
      quizzes: {
        where: { isPublished: true },
        select: { id: true },
      },
      assignments: {
        where: {
          verificationStatus: "verified",
        },
        select: { id: true },
      },
    },
  });

  if (!chapter) {
    return {
      eligible: false,
      reasons: ["Chapter not found"],
      details: {
        hasVideo: false,
        videoCompleted: false,
        totalQuizzes: 0,
        completedQuizzes: 0,
        totalAssignments: 0,
        completedAssignments: 0,
      },
    };
  }

  const hasVideo = !!chapter.videoUrl;
  const totalQuizzes = chapter.quizzes.length;
  const totalAssignments = chapter.assignments.length;