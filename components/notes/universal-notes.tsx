"use client";

import { useTranslations } from "next-intl";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Download,
  FileText,
  Clock,
  BookOpen,
  Video,
  Radio,
  Trash2,
  Star,
  StarOff,
  Tag,
  Palette,
  Search,
  Filter,
  Plus,
  Edit3,
  Archive,
  MoreHorizontal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { format } from "date-fns";

// Import quill styles
import "react-quill/dist/quill.snow.css";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 rounded animate-pulse" />,
});

interface StudentNote {
  id: string;
  title: string;
  content: string;
  richContent?: any;
  context: "CHAPTER" | "VIDEO" | "LIVE_STREAM" | "GENERAL";
  timestamp?: number;
  liveSessionId?: string;
  status: "DRAFT" | "SAVED" | "ARCHIVED";
  isDraft: boolean;
  lastSaved: Date;
  pdfGenerated: boolean;
  pdfUrl?: string;
  exportCount: number;
  tags: string[];
  color?: string;
  isBookmarked: boolean;
  createdAt: Date;
  updatedAt: Date;
  chapterId?: string;
  courseId: string;
}

interface UniversalNotesProps {
  courseId: string;
  chapterId?: string;
  context: "CHAPTER" | "VIDEO" | "LIVE_STREAM" | "GENERAL";
  timestamp?: number;
  liveSessionId?: string;
  className?: string;
}

const NOTE_COLORS = [
  { name: "Default", value: "", class: "bg-white" },
  { name: "Yellow", value: "yellow", class: "bg-yellow-100" },
  { name: "Green", value: "green", class: "bg-green-100" },
  { name: "Blue", value: "blue", class: "bg-blue-100" },
  { name: "Pink", value: "pink", class: "bg-pink-100" },
  { name: "Purple", value: "purple", class: "bg-purple-100" },
];

export const UniversalNotes = ({
  courseId,
  chapterId,
  context,
  timestamp,
  liveSessionId,
  className = "",
}: UniversalNotesProps) => {
  const t = useTranslations("course.notes");
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterContext, setFilterContext] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // New note form state
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    richContent: "",
    color: "",
    tags: [] as string[],
    isBookmarked: false,
  });

  // Draft save interval
  const draftSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContent = useRef<string>("");

  // Quill modules configuration
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "image"],
      ["clean"],
    ],
  };

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        courseId,
        ...(chapterId && { chapterId }),
        ...(liveSessionId && { liveSessionId }),
      });

      // By default, we scope notes by context when tied to a
      // specific chapter or live session (VIDEO / LIVE_STREAM usage).
      // For course-level views (no chapter/liveSession), we omit
      // context so all notes for the course are shown together.
      if (chapterId || liveSessionId || context !== "GENERAL") {
        params.set("context", context);
      }

      const response = await fetch(`/api/student-notes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Failed to load notes:", error);
      toast.error(t("load_failed"));
    } finally {
      setLoading(false);
    }
  }, [courseId, chapterId, context, liveSessionId]);

  const saveDraft = useCallback(async () => {
    if (!editingNote || !newNote.content) return;

    try {
      setSaving(editingNote);
      const response = await fetch(`/api/student-notes/${editingNote}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNote.title || "Untitled Note",
          content: newNote.content,
          richContent: newNote.richContent,
        }),
      });

      if (response.ok) {
        lastSavedContent.current = newNote.content;
        // Update the note in the list
        const updatedNote = await response.json();
        setNotes((prev) =>
          prev.map((note) => (note.id === editingNote ? updatedNote : note))
        );
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setSaving(null);
    }
  }, [editingNote, newNote.content, newNote.richContent, newNote.title]);

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Auto-save drafts
  useEffect(() => {
    if (editingNote && newNote.content !== lastSavedContent.current) {
      if (draftSaveInterval.current) {
        clearTimeout(draftSaveInterval.current);
      }

      draftSaveInterval.current = setTimeout(() => {
        saveDraft();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (draftSaveInterval.current) {
        clearTimeout(draftSaveInterval.current);
      }
    };
  }, [newNote.content, editingNote, saveDraft]);

  const createNote = async () => {
    if (!newNote.title.trim() && !newNote.content.trim()) {
      toast.error("Please add some content to your note");
      return;
    }

    try {
      setSaving("new");
      const response = await fetch("/api/student-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNote.title || "Untitled Note",
          content: newNote.content,
          richContent: newNote.richContent,
          courseId,
          chapterId,
          context,
          timestamp,
          liveSessionId,
          color: newNote.color,
          tags: newNote.tags,
          isBookmarked: newNote.isBookmarked,
          status: "SAVED",
        }),
      });

      if (response.ok) {
        const createdNote = await response.json();
        setNotes((prev) => [createdNote, ...prev]);
        resetNewNote();
        setIsCreating(false);
        toast.success("Note saved successfully!");
      } else {
        toast.error("Failed to save note");
      }
    } catch (error) {
      console.error("Failed to create note:", error);
      toast.error("Failed to save note");
    } finally {
      setSaving(null);
    }
  };

  const updateNote = async (noteId: string) => {
    try {
      setSaving(noteId);
      const response = await fetch(`/api/student-notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNote.title,
          content: newNote.content,
          richContent: newNote.richContent,
          color: newNote.color,
          tags: newNote.tags,
          isBookmarked: newNote.isBookmarked,
          status: "SAVED",
        }),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes((prev) =>
          prev.map((note) => (note.id === noteId ? updatedNote : note))
        );
        setEditingNote(null);
        resetNewNote();
        toast.success("Note updated successfully!");
      } else {
        toast.error("Failed to update note");
      }
    } catch (error) {
      console.error("Failed to update note:", error);
      toast.error("Failed to update note");
    } finally {
      setSaving(null);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/student-notes/${noteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
        toast.success("Note deleted successfully!");
      } else {
        toast.error(t("delete_failed"));
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error(t("delete_failed"));
    }
  };

  const toggleBookmark = async (noteId: string) => {
    try {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;

      const response = await fetch(`/api/student-notes/${noteId}/bookmark`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isBookmarked: !note.isBookmarked,
        }),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? updatedNote : n))
        );
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    }
  };

  const exportToPDF = async (noteId: string) => {
    try {
      const response = await fetch(`/api/student-notes/${noteId}/export-pdf`, {
        method: "POST",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        const note = notes.find((n) => n.id === noteId);
        a.style.display = "none";
        a.href = url;
        a.download = `${note?.title || "note"}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("PDF downloaded successfully!");
      } else {
        toast.error("Failed to export PDF");
      }
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const resetNewNote = () => {
    setNewNote({
      title: "",
      content: "",
      richContent: "",
      color: "",
      tags: [],
      isBookmarked: false,
    });
  };

  const startEditing = (note: StudentNote) => {
    setEditingNote(note.id);
    setNewNote({
      title: note.title,
      content: note.content,
      richContent: note.richContent || "",
      color: note.color || "",
      tags: note.tags,
      isBookmarked: note.isBookmarked,
    });
    lastSavedContent.current = note.content;
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setIsCreating(false);
    resetNewNote();
  };

  // Filter notes based on search and filters
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "DRAFTS" && note.isDraft) ||
      (filterStatus === "SAVED" && !note.isDraft) ||
      (filterStatus === "BOOKMARKED" && note.isBookmarked);

    const matchesContext =
      filterContext === "ALL" || note.context === filterContext;

    return matchesSearch && matchesStatus && matchesContext;
  });

  const getContextIcon = (context: string) => {
    switch (context) {
      case "CHAPTER":
        return <BookOpen className="h-4 w-4" />;
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "LIVE_STREAM":
        return <Radio className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getContextColor = (context: string) => {
    switch (context) {
      case "CHAPTER":
        return "bg-blue-100 text-blue-800";
      case "VIDEO":
        return "bg-green-100 text-green-800";
      case "LIVE_STREAM":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }