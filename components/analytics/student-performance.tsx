"use client";

import { BookOpen, CheckCircle2, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import { useTranslations } from "next-intl";

interface CourseProgress {
  courseId: string;
  title: string;
  imageUrl: string | null;
  totalChapters: number;
  completedChapters: number;
  progress: number;
}

interface RecentActivity {
  quizTitle: string;
  courseTitle: string;
  score: number;
  createdAt: string;
}

interface PerformanceData {
  statistics: {
    totalCourses: number;
    completedCourses: number;
    totalChapters: number;
    completedChapters: number;
    totalQuizzes: number;
    completedQuizzes: number;
    averageQuizScore: number;
  };
  courseProgress: CourseProgress[];
  recentActivity: RecentActivity[];
}

export const StudentPerformance = () => {
  const t = useTranslations("dashboard.student_performance");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const response = await axios.get("/api/student/performance");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching performance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">{t("loading")}</div>;
  }

  if (!data) {
    return <div className="p-6">{t("no_data")}</div>;
  }

  const stats = data.statistics;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">{t("title")}</h2>
        <p className="text-gray-600">{t("subtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("enrolled_courses")}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {t("completed_count", { count: stats.completedCourses })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("chapters_progress")}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedChapters}/{stats.totalChapters}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalChapters > 0
                ? Math.round((stats.completedChapters / stats.totalChapters) * 100)
                : 0}
              {t("percent_completed")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("quizzes_taken")}</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedQuizzes}/{stats.totalQuizzes}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("total_attempts")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("average_score")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageQuizScore}%</div>
            <p className="text-xs text-muted-foreground">
              {t("quiz_performance")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      <Card>
        <CardHeader>
          <CardTitle>{t("course_progress")}</CardTitle>
          <CardDescription>
            {t("course_progress_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.courseProgress.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {t("no_courses")}
            </p>
          ) : (
            data.courseProgress.map((course) => (
              <div key={course.courseId} className="space-y-2">
                <div className="flex items-center gap-4">
                  {course.imageUrl && (
                    <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={course.imageUrl}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">{course.title}</h4>
                    <p className="text-sm text-gray-600">
                      {t("chapters_completed", { completed: course.completedChapters, total: course.totalChapters })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{course.progress}%</span>
                  </div>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recent_quiz_results")}</CardTitle>
          <CardDescription>
            {t("recent_quiz_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {t("no_quiz_attempts")}
            </p>
          ) : (
            <div className="space-y-4">
              {data.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold">{activity.quizTitle}</h4>
                    <p className="text-sm text-gray-600">{activity.courseTitle}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        activity.score >= 70
                          ? "text-green-600"
                          : activity.score >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {activity.score}%
                    </div>
                    <p className="text-xs text-gray-500">{t("score_label")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};