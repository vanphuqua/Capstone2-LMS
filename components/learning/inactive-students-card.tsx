"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, Clock, Users, UserX } from "lucide-react";

interface InactiveStudent {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  courses: string[];
  courseTitles: string[];
  lastActiveAt: string | null;
  daysInactive: number;
}

interface InactiveStudentsData {
  inactiveStudents: InactiveStudent[];
  summary: {
    total: number;
    neverActive: number;
    threshold: number;
  };
}

export function InactiveStudentsCard({ courseId }: { courseId?: string }) {
  const [data, setData] = useState<InactiveStudentsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [daysThreshold, setDaysThreshold] = useState(3);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams({ days: daysThreshold.toString() });
        if (courseId) params.set("courseId", courseId);
        
        const res = await fetch(`/api/teacher/analytics/inactive-students?${params}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("[InactiveStudentsCard] Failed to fetch:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [courseId, daysThreshold]);

  const formatDaysInactive = (days: number): string => {
    if (days === -1) return "Chưa bao giờ";
    if (days === 0) return "Hôm nay";
    if (days === 1) return "1 ngày";
    return `${days} ngày`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Học viên không hoạt động
          </CardTitle>
          <select
            value={daysThreshold}
            onChange={(e) => setDaysThreshold(parseInt(e.target.value))}
            className="text-xs border rounded px-2 py-1 bg-background"
          >
            <option value={1}>1 ngày</option>
            <option value={3}>3 ngày</option>
            <option value={7}>7 ngày</option>
            <option value={14}>14 ngày</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        ) : !data || data.inactiveStudents.length === 0 ? (
          <div className="text-center py-4">
            <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Tất cả học viên đều đang hoạt động! 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary */}
            <div className="flex gap-4 text-xs text-muted-foreground pb-2 border-b">
              <span className="flex items-center gap-1">
                <UserX className="h-3 w-3" />
                {data.summary.total} học viên
              </span>
              <span>
                {data.summary.neverActive} chưa bao giờ học
              </span>
            </div>

            {/* Student List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.inactiveStudents.slice(0, 10).map((student) => (
                <div
                  key={student.userId}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={student.image || undefined} />
                    <AvatarFallback>
                      {student.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {student.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {student.courseTitles.join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        student.daysInactive === -1
                          ? "destructive"
                          : student.daysInactive >= 7
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {formatDaysInactive(student.daysInactive)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {data.inactiveStudents.length > 10 && (
              <p className="text-xs text-center text-muted-foreground">
                Và {data.inactiveStudents.length - 10} học viên khác...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}