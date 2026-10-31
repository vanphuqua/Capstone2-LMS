"use client";

import { BookOpen, IndianRupee, ShoppingCart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";

import axios from "axios";
import { formatPrice } from "@/lib/format";
import { useTranslations } from "next-intl";

interface CourseBreakdown {
  courseId: string;
  title: string;
  sales: number;
  earnings: number;
  price: number;
  isFree: boolean;
}

interface RecentPurchase {
  id: string;
  amount: number;
  createdAt: string;
  course: {
    title: string;
  };
}

interface AnalyticsData {
  totalEarnings: number;
  totalSales: number;
  courseBreakdown: CourseBreakdown[];
  recentPurchases: RecentPurchase[];
}

export const TeacherAnalytics = () => {
  const t = useTranslations("teacher.analytics");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get("/api/teacher/analytics");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
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
            <CardTitle className="text-sm font-medium">{t("total_earnings")}</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(data.totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("from_all_courses")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("total_sales")}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {t("course_enrollments")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("active_courses")}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.courseBreakdown.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("published_courses")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("average_price")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(
                data.totalEarnings / (data.totalSales || 1)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("per_enrollment")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t("course_performance")}</CardTitle>
          <CardDescription>
            {t("breakdown_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("col_course_title")}</TableHead>
                <TableHead>{t("col_price")}</TableHead>
                <TableHead>{t("col_sales")}</TableHead>
                <TableHead>{t("col_earnings")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.courseBreakdown.map((course) => (
                <TableRow key={course.courseId}>
                  <TableCell className="font-medium">
                    {course.title}
                  </TableCell>
                  <TableCell>
                    {course.isFree ? (
                      <span className="text-green-600 font-semibold">{t("free")}</span>
                    ) : (
                      formatPrice(course.price)
                    )}
                  </TableCell>
                  <TableCell>{course.sales}</TableCell>
                  <TableCell className="font-semibold">
                    {formatPrice(course.earnings)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recent_sales")}</CardTitle>
          <CardDescription>
            {t("recent_sales_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("col_course")}</TableHead>
                <TableHead>{t("col_amount")}</TableHead>
                <TableHead>{t("col_date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">
                    {purchase.course.title}
                  </TableCell>
                  <TableCell>
                    {formatPrice(purchase.amount || 0)}
                  </TableCell>
                  <TableCell>
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};