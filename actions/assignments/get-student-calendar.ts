"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export async function getStudentAssignmentCalendar() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get all courses the student is enrolled in
    const purchases = await db.purchase.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const enrolledCourseIds = purchases.map((p) => p.courseId);

    // Also get free courses with progress
    const freeCoursesWithProgress = await db.userProgress.findMany({
      where: { userId },
      select: { 
        chapter: {
          select: { courseId: true }
        }
      },
    });