"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Clock, Calendar, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActiveDate: string | null;
  totalTimeSpentSeconds: number;
  weeklyActivity: Array<{ date: string; active: boolean }>;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function LearningStreakCard() {
  const t = useTranslations("course.learning_streak");
  const dayLabels = t("day_labels") as unknown as string[];
  const [data, setData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStreak() {
      try {
        const res = await fetch("/api/student/streak");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("[LearningStreakCard] Failed to fetch:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStreak();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded w-20" />
            <div className="h-4 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Flame
              className={`h-8 w-8 ${
                data.currentStreak > 0 ? "text-orange-500" : "text-gray-300"
              }`}
            />
          </div>
          <div>
            <div className="text-3xl font-bold">
              {data.currentStreak}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {t("days")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("current_streak")}
            </p>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t("last_7_days")}
          </p>
          <div className="flex gap-1.5">
            {data.weeklyActivity.map((day, index) => {
              const date = new Date(day.date);
              const dayOfWeek = date.getDay();
              // Convert Sunday=0 to Monday-based index
              const labelIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              return (
                <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-full aspect-square rounded-md ${
                      day.active
                        ? "bg-orange-500"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                    title={`${day.date}: ${day.active ? t("active") : t("inactive")}`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {dayLabels[labelIndex]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-semibold">
                {formatTime(data.totalTimeSpentSeconds)}
              </p>
              <p className="text-[10px] text-muted-foreground">{t("total_time")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-semibold">{data.totalActiveDays}</p>
              <p className="text-[10px] text-muted-foreground">{t("active_days")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-sm font-semibold">{data.longestStreak}</p>
              <p className="text-[10px] text-muted-foreground">{t("streak_record")}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}