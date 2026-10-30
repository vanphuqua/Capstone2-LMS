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