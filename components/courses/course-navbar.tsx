"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListChecks,
  FileQuestion,
  ClipboardList,
  Award,
  Video,
  FileText,
  Users,
  BarChart,
  GraduationCap,
} from "lucide-react";

interface CourseNavbarProps {
  courseId: string;
}

const routesConfig = [
  {
    key: "setup",
    href: "",
    icon: LayoutDashboard,
  },
  {
    key: "chapters",
    href: "/chapters",
    icon: ListChecks,
  },
  {
    key: "quizzes",
    href: "/quizzes",
    icon: FileQuestion,
  },
  {
    key: "assignments",
    href: "/assignments",
    icon: ClipboardList,
  },
  {
    key: "final_exams",
    href: "/final-exams",
    icon: GraduationCap,
  },
  {
    key: "certificates",
    href: "/certificates",
    icon: Award,
  },
  {
    key: "live_sessions",
    href: "/live-sessions",
    icon: Video,
  },
  {
    key: "resources",
    href: "/resources",
    icon: FileText,
  },
  {
    key: "students",
    href: "/students",
    icon: Users,
  },
  {
    key: "analytics",
    href: "/analytics",
    icon: BarChart,
  },
];

export const CourseNavbar = ({ courseId }: CourseNavbarProps) => {
  const pathname = usePathname();
  const t = useTranslations("teacher.course_nav");

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b bg-white dark:bg-slate-900 px-6 py-4">
      {routesConfig.map((route) => {
        const href = `/teacher/courses/${courseId}${route.href}`;
        const isActive = 
          (pathname === href) || 
          (pathname === `/teacher/courses/${courseId}` && route.href === "") ||
          (route.href !== "" && pathname?.startsWith(href));

        const Icon = route.icon;

        return (
          <Link
            key={route.href}
            href={href}
            className={cn(
              "flex items-center gap-x-2 text-sm font-medium px-4 py-2 rounded-lg transition-all whitespace-nowrap",
              isActive
                ? "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-200"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{t(route.key as any)}</span>
          </Link>
        );
      })}
    </div>
  );
};
