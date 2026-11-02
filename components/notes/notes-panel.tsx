"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Plus, Search, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteEditor } from "./note-editor";
import { NoteCard } from "./note-card";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import jsPDF from "jspdf";

interface Note {
  id: string;
  content: string;
  timestamp?: number;
  createdAt: Date;
  chapter?: {
    id: string;
    title: string;
  };
}

interface NotesPanelProps {
  courseId: string;
  chapterId?: string;
  currentVideoTime?: number;
  onSeekTo?: (timestamp: number) => void;
}

export const NotesPanel = ({
  courseId,
  chapterId,
  currentVideoTime,
  onSeekTo,
}: NotesPanelProps) => {
  const t = useTranslations("course.notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (chapterId) params.append("chapterId", chapterId);
      if (searchQuery) params.append("search", searchQuery);

      const response = await axios.get(
        `/api/courses/${courseId}/student-notes?${params.toString()}`
      );
      setNotes(response.data);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error(t("load_failed"));
    } finally {
      setIsLoading(false);
    }
  }, [courseId, chapterId, searchQuery]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSaveNote = async (content: string, timestamp?: number) => {
    try {
      if (editingNote) {
        // Update existing note
        await axios.patch(
          `/api/courses/${courseId}/student-notes/${editingNote.id}`,
          { content, timestamp }
        );
        toast.success(t("updated"));
      } else {
        // Create new note
        await axios.post(`/api/courses/${courseId}/student-notes`, {
          content,
          timestamp,
          chapterId,
        });
        toast.success("Note created");
      }
      
      setIsEditorOpen(false);
      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
      throw error;
    }
  };