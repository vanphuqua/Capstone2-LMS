"use client";

import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  Archive,
  Settings,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTranslations } from "next-intl";

// ============================================================================
// Types
// ============================================================================

interface NotificationV2 {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface SSEMessage {
  type: string;
  data: any;
  clientId?: string;
}

// Category badge colors
const categoryColors: Record<string, string> = {
  COURSE: "bg-blue-100 text-blue-700",
  LIVE_SESSION: "bg-red-100 text-red-700",
  ASSIGNMENT: "bg-orange-100 text-orange-700",
  QUIZ: "bg-purple-100 text-purple-700",
  ANNOUNCEMENT: "bg-green-100 text-green-700",
  CERTIFICATE: "bg-yellow-100 text-yellow-700",
  PAYMENT: "bg-emerald-100 text-emerald-700",
  SYSTEM: "bg-gray-100 text-gray-700",
  DISCUSSION: "bg-indigo-100 text-indigo-700",
  GRADE: "bg-pink-100 text-pink-700",
};

const priorityDot: Record<string, string> = {
  LOW: "bg-gray-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500 animate-pulse",
};

// ============================================================================
// Enhanced Notification Bell with SSE
// ============================================================================

export const EnhancedNotificationBell = () => {
  const t = useTranslations("common.notifications");
  const [notifications, setNotifications] = useState<NotificationV2[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [showLiveIndicator, setShowLiveIndicator] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const user = useCurrentUser();

  // Fetch notifications from the v2 API
  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (filter) params.set("category", filter);

      const response = await axios.get(`/api/notifications/v2?${params}`);
      const data = response.data;

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [filter]);

  // Connect to SSE stream for real-time updates
  const connectSSE = useCallback(() => {
    if (!user?.id || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource("/api/notifications/stream");
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);

          switch (message.type) {
            case "notification":
              // Add new notification to the top
              setNotifications((prev) => [message.data, ...prev.slice(0, 19)]);
              setUnreadCount((prev) => prev + 1);
              // Flash the bell
              setShowLiveIndicator(true);
              setTimeout(() => setShowLiveIndicator(false), 3000);
              break;

            case "live_session_started":
              // Show live indicator
              setShowLiveIndicator(true);
              // Add to notifications
              setNotifications((prev) => [
                {
                  id: `live_${message.data.sessionId}`,
                  title: "🔴 Live Session Started!",
                  body: `${message.data.teacherName} is now LIVE: "${message.data.sessionTitle}"`,
                  category: "LIVE_SESSION",
                  priority: "URGENT",
                  actionUrl: message.data.url,
                  isRead: false,
                  createdAt: new Date().toISOString(),
                },
                ...prev.slice(0, 19),
              ]);
              setUnreadCount((prev) => prev + 1);
              break;

            case "live_session_ended":
              setShowLiveIndicator(false);
              break;

            case "global_announcement":
              setNotifications((prev) => [
                {
                  id: `ga_${message.data.id}`,
                  title: "📢 " + message.data.title,
                  body: message.data.content,
                  category: "ANNOUNCEMENT",
                  priority: "HIGH",
                  isRead: false,
                  createdAt: new Date().toISOString(),
                },
                ...prev.slice(0, 19),
              ]);
              setUnreadCount((prev) => prev + 1);
              break;

            case "system_maintenance":
              setNotifications((prev) => [
                {
                  id: `sys_${Date.now()}`,
                  title: "⚠️ System Maintenance",
                  body: message.data.message,
                  category: "SYSTEM",
                  priority: "URGENT",
                  isRead: false,
                  createdAt: new Date().toISOString(),
                },
                ...prev.slice(0, 19),
              ]);
              setUnreadCount((prev) => prev + 1);
              break;
          }
        } catch (e) {
          // Ignore parse errors (heartbeats, etc.)
        }
      };