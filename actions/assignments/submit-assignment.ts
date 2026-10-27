"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

interface SubmitAssignmentParams {
  assignmentId: string;
  submissionType: "file" | "link" | "text";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  linkUrl?: string;
  textContent?: string;
}

export async function submitAssignment(params: SubmitAssignmentParams) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get assignment details
    const assignment = await db.assignment.findUnique({
      where: { id: params.assignmentId },
      include: {
        course: true,
      },
    });

    if (!assignment) {
      return { error: "Assignment not found" };
    }

    if (!assignment.isPublished) {
      return { error: "Assignment not available" };
    }

    // Check if student is enrolled in the course
    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: assignment.courseId,
        },
      },
    });

    if (!purchase && !assignment.course.isFree) {
      return { error: "You must be enrolled in this course" };
    }

    // Calculate if submission is late
    const now = new Date();
    const isLate = now > assignment.dueDate;
    const daysLate = isLate
      ? Math.ceil((now.getTime() - assignment.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (isLate && !assignment.allowLateSubmission) {
      return { error: "This assignment no longer accepts submissions" };
    }

    // Validate submission type
    if (params.submissionType === "file" && !assignment.allowFileUpload) {
      return { error: "File uploads not allowed for this assignment" };
    }
    if (params.submissionType === "link" && !assignment.allowLinkSubmission) {
      return { error: "Link submissions not allowed for this assignment" };
    }
    if (params.submissionType === "text" && !assignment.allowTextSubmission) {
      return { error: "Text submissions not allowed for this assignment" };
    }
