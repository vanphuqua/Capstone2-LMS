"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell, Mail, Smartphone, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

const NOTIFICATION_CATEGORIES = [
  {
    key: "COURSE",
    label: "Course Updates",
    description: "New chapters, updates, and completion",
  },
  {
    key: "LIVE_SESSION",
    label: "Live Sessions",
    description: "Session starts, scheduled events, and reminders",
  },
  {
    key: "ASSIGNMENT",
    label: "Assignments",
    description: "New assignments, due reminders, and grading",
  },
  { key: "QUIZ", label: "Quizzes", description: "New quizzes and results" },
  {
    key: "ANNOUNCEMENT",
    label: "Announcements",
    description: "Course and platform announcements",
  },
  {
    key: "CERTIFICATE",
    label: "Certificates",
    description: "Certificate issuance and downloads",
  },
  {
    key: "PAYMENT",
    label: "Payments",
    description: "Payment confirmations and failures",
  },
  {
    key: "DISCUSSION",
    label: "Discussions",
    description: "Replies and mentions",
  },
  { key: "GRADE", label: "Grades", description: "Assignment and exam grades" },
  {
    key: "SYSTEM",
    label: "System",
    description: "Maintenance and platform updates",
  },
];

const DIGEST_OPTIONS = [
  {
    value: "INSTANT",
    label: "Instant",
    description: "Get notified immediately",
  },
  {
    value: "DAILY",
    label: "Daily Digest",
    description: "Once per day summary",
  },
  {
    value: "WEEKLY",
    label: "Weekly Digest",
    description: "Once per week summary",
  },
];

export function NotificationPreferences() {
  const t = useTranslations("course.notify_prefs");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    categoryPreferences: {} as Record<string, boolean>,
    quietHoursStart: null as number | null,
    quietHoursEnd: null as number | null,
    digestFrequency: "INSTANT",
  });

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await axios.get("/api/notifications/preferences");
      setPreferences({
        emailEnabled: response.data.emailEnabled ?? true,
        pushEnabled: response.data.pushEnabled ?? true,
        inAppEnabled: response.data.inAppEnabled ?? true,
        categoryPreferences: response.data.categoryPreferences || {},
        quietHoursStart: response.data.quietHoursStart,
        quietHoursEnd: response.data.quietHoursEnd,
        digestFrequency: response.data.digestFrequency || "INSTANT",
      });
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const savePreferences = async () => {
    setSaving(true);
    try {
      await axios.put("/api/notifications/preferences", preferences);
      toast.success("Notification preferences saved!");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (key: string) => {
    setPreferences((prev) => ({
      ...prev,
      categoryPreferences: {
        ...prev.categoryPreferences,
        [key]: !(prev.categoryPreferences[key] ?? true),
      },
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }