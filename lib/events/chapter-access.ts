import { db } from "@/lib/db";

interface ChapterAccess {
  id: string;
  isAccessible: boolean;
  isCompleted: boolean;
  reason?: string;
}

interface ChapterWithContent {
  id: string;
  title: string;
  position: number;
  isCompleted: boolean;
  isAccessible: boolean;
  isActive: boolean;
  videoCompleted: boolean;
  quizzes: Array<{
    id: string;
    title: string;
    position: number;
    isCompleted: boolean;
    timeline?: number;
    isAccessible: boolean;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    dueDate: Date;
    isCompleted: boolean;
    isLate: boolean;
    isAccessible: boolean;
  }>;
}

export async function getChapterAccessibility(
  userId: string,
  courseId: string,
  isPurchased: boolean,
  isInstructor: boolean
): Promise<ChapterAccess[]> {
  // Get all chapters with user progress
  const chapters = await db.chapter.findMany({
    where: {
      courseId,
      isPublished: true,
    },
    include: {
      userProgress: {
        where: {
          userId,
        },
      },
    },
    orderBy: {
      position: "asc",
    },
  });