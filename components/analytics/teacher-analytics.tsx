"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { IndianRupee, ShoppingCart, TrendingUp, BookOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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