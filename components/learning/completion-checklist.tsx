"use client";

import { CheckCircle2, Circle, Play, FileText, BookOpen, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCompletionCriteria } from "./completion-criteria-context";
import { cn } from "@/lib/utils";

interface CompletionChecklistProps {
  isPurchased: boolean;
  className?: string;
}

export function CompletionChecklist({ isPurchased, className }: CompletionChecklistProps) {
  const t = useTranslations("course.chapter.completion");
  const { state } = useCompletionCriteria();

  // Don't show if already completed or not purchased
  if (!isPurchased) return null;

  // Don't show if there are no requirements at all (text-only chapter)
  if (!state.hasVideo && state.totalQuizzes === 0 && state.totalAssignments === 0) {
    return null;
  }

  const items = [
    {
      id: "video",
      icon: Play,
      label: t("watch_video"),
      completed: !state.hasVideo || state.videoCompleted,
      progress: state.hasVideo ? state.videoProgress : undefined,
      detail: state.hasVideo
        ? `${Math.round(state.videoProgress)}%`
        : undefined,
      visible: state.hasVideo,
    },
    {
      id: "quizzes",
      icon: BookOpen,
      label: t("complete_quizzes"),
      completed: state.totalQuizzes === 0 || state.completedQuizzes >= state.totalQuizzes,
      detail: state.totalQuizzes > 0
        ? `${state.completedQuizzes}/${state.totalQuizzes}`
        : undefined,
      visible: state.totalQuizzes > 0,
    },
    {
      id: "assignments",
      icon: FileText,
      label: t("submit_assignments"),
      completed: state.totalAssignments === 0 || state.completedAssignments >= state.totalAssignments,
      detail: state.totalAssignments > 0
        ? `${state.completedAssignments}/${state.totalAssignments}`
        : undefined,
      visible: state.totalAssignments > 0,
    },
  ];

  const visibleItems = items.filter((item) => item.visible);
  const completedCount = visibleItems.filter((item) => item.completed).length;
  const allDone = completedCount === visibleItems.length;

  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {allDone ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t("all_complete")}
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 text-muted-foreground" />
              {t("requirements")}
            </>
          )}
        </h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{visibleItems.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            allDone ? "bg-green-500" : "bg-primary"
          )}
          style={{ width: `${visibleItems.length > 0 ? (completedCount / visibleItems.length) * 100 : 0}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                item.completed
                  ? "bg-green-50 dark:bg-green-950/20"
                  : "bg-muted/50"
              )}
            >
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <Icon className={cn(
                "h-3.5 w-3.5 shrink-0",
                item.completed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-sm flex-1",
                item.completed
                  ? "text-green-700 dark:text-green-300 line-through"
                  : "text-foreground"
              )}>
                {item.label}
              </span>
              {item.detail && (
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  item.completed
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                )}>
                  {item.detail}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}