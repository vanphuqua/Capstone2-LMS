"use client";

import { useState } from "react";
import { Clock, Edit, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

interface NoteCardProps {
  id: string;
  content: string;
  timestamp?: number;
  createdAt: Date;
  chapterTitle?: string;
  onEdit: () => void;
  onDelete: (id: string) => Promise<void>;
  onSeekTo?: (timestamp: number) => void;
}

export const NoteCard = ({
  id,
  content,
  timestamp,
  createdAt,
  chapterTitle,
  onEdit,
  onDelete,
  onSeekTo,
}: NoteCardProps) => {
  const t = useTranslations("dashboard.notes");
  const [isDeleting, setIsDeleting] = useState(false);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(id);
    } catch (error) {
      console.error("Error deleting note:", error);
    } finally {
      setIsDeleting(false);
    }
  };