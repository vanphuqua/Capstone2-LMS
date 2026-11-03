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

  const chapterAccess: ChapterAccess[] = [];
  let previousChapterCompleted = true; // First chapter should be accessible

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const userProgress = chapter.userProgress[0];
    const isCompleted = userProgress?.isCompleted || false;
    
    let isAccessible = false;
    let reason = "";

    // Instructors have full access
    if (isInstructor) {
      isAccessible = true;
      reason = "Instructor access";
    }
    // Free preview chapters are always accessible
    else if (chapter.isFree || chapter.isPreview) {
      isAccessible = true;
      reason = "Free/Preview chapter";
    }
    // Check if user has purchased the course
    else if (!isPurchased) {
      isAccessible = false;
      reason = "Course not purchased";
    }
    // First chapter is accessible if purchased
    else if (i === 0) {
      isAccessible = true;
      reason = "First chapter";
    }
    // Subsequent chapters require previous chapter completion
    else if (previousChapterCompleted) {
      isAccessible = true;
      reason = "Previous chapter completed";
    }
    // Chapter is locked if previous chapter not completed
    else {
      isAccessible = false;
      reason = "Previous chapter not completed";
    }

    chapterAccess.push({
      id: chapter.id,
      isAccessible,
      isCompleted,
      reason,
    });

    // Update previousChapterCompleted for next iteration
    previousChapterCompleted = isCompleted;
  }

  return chapterAccess;
}

export async function getNextAccessibleChapter(
  userId: string,
  courseId: string,
  currentChapterId: string,
  isPurchased: boolean,
  isInstructor: boolean
): Promise<string | null> {
  const accessibility = await getChapterAccessibility(userId, courseId, isPurchased, isInstructor);
  
  // Find current chapter index
  const currentIndex = accessibility.findIndex(ch => ch.id === currentChapterId);
  
  // Look for next accessible chapter
  for (let i = currentIndex + 1; i < accessibility.length; i++) {
    if (accessibility[i].isAccessible) {
      return accessibility[i].id;
    }
  }
  
  return null;
}