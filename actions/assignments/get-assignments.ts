"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getAssignments(courseId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Check if user is a teacher (to see all assignments) or student (to see published only)
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return { error: "Course not found" };
    }

    const isTeacher = course.userId === userId;

    const assignments = await db.assignment.findMany({
      where: {
        courseId,
        ...(isTeacher ? {} : { isPublished: true }),
      },
      include: {
        chapter: {
          select: {
            title: true,
          },
        },
        submissions: isTeacher
          ? {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            }
          : {
              where: {
                studentId: userId,
              },
            },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return { success: true, assignments, isTeacher };
  } catch (error) {
    console.error("[GET_ASSIGNMENTS]", error);
    return { error: "Failed to fetch assignments" };
  }
}