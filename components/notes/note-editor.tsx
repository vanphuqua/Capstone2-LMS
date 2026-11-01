"use client";

import { useState } from "react";
import { X, Save, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NoteEditorProps {
  initialContent?: string;
  initialTimestamp?: number;
  onSave: (content: string, timestamp?: number) => Promise<void>;
  onCancel: () => void;
  currentVideoTime?: number;
}

export const NoteEditor = ({
  initialContent = "",
  initialTimestamp,
  onSave,
  onCancel,
  currentVideoTime,
}: NoteEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [timestamp, setTimestamp] = useState<number | undefined>(
    initialTimestamp ?? currentVideoTime
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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