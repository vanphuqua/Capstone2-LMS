"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

// ─── Types ───

export interface CompletionCriteriaState {
  // Video
  hasVideo: boolean;
  videoCompleted: boolean;
  videoProgress: number; // 0-100

  // Quizzes
  totalQuizzes: number;
  completedQuizzes: number;

  // Assignments
  totalAssignments: number;
  completedAssignments: number;

  // Computed
  isEligibleToComplete: boolean;
}

interface CompletionCriteriaContextValue {
  state: CompletionCriteriaState;
  setVideoProgress: (progress: number) => void;
  setVideoCompleted: (completed: boolean) => void;
  refresh: () => void;
}

const CompletionCriteriaContext = createContext<CompletionCriteriaContextValue | null>(null);

// ─── Provider Props ───

interface CompletionCriteriaProviderProps {
  children: React.ReactNode;
  hasVideo: boolean;
  initialVideoCompleted: boolean;
  totalQuizzes: number;
  completedQuizzes: number;
  totalAssignments: number;
  completedAssignments: number;
}

// ─── Provider ───

export function CompletionCriteriaProvider({
  children,
  hasVideo,
  initialVideoCompleted,
  totalQuizzes,
  completedQuizzes,
  totalAssignments,
  completedAssignments,
}: CompletionCriteriaProviderProps) {
  const [videoCompleted, setVideoCompleted] = useState(initialVideoCompleted);
  const [videoProgress, setVideoProgress] = useState(initialVideoCompleted ? 100 : 0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSetVideoProgress = useCallback((progress: number) => {
    setVideoProgress(progress);
    if (progress >= 95) {
      setVideoCompleted(true);
    }
  }, []);

  const handleSetVideoCompleted = useCallback((completed: boolean) => {
    setVideoCompleted(completed);
    if (completed) {
      setVideoProgress(100);
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const state = useMemo<CompletionCriteriaState>(() => {
    const isVideoDone = !hasVideo || videoCompleted;
    const isQuizzesDone = totalQuizzes === 0 || completedQuizzes >= totalQuizzes;
    const isAssignmentsDone = totalAssignments === 0 || completedAssignments >= totalAssignments;

    return {
      hasVideo,
      videoCompleted,
      videoProgress,
      totalQuizzes,
      completedQuizzes,
      totalAssignments,
      completedAssignments,
      isEligibleToComplete: isVideoDone && isQuizzesDone && isAssignmentsDone,
    };
  }, [hasVideo, videoCompleted, videoProgress, totalQuizzes, completedQuizzes, totalAssignments, completedAssignments, refreshKey]);

  const value = useMemo<CompletionCriteriaContextValue>(() => ({
    state,
    setVideoProgress: handleSetVideoProgress,
    setVideoCompleted: handleSetVideoCompleted,
    refresh,
  }), [state, handleSetVideoProgress, handleSetVideoCompleted, refresh]);

  return (
    <CompletionCriteriaContext.Provider value={value}>
      {children}
    </CompletionCriteriaContext.Provider>
  );
}

// ─── Hook ───

export function useCompletionCriteria() {
  const context = useContext(CompletionCriteriaContext);
  if (!context) {
    throw new Error("useCompletionCriteria must be used within a CompletionCriteriaProvider");
  }
  return context;
}