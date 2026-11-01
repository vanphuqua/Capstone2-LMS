"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Trash } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface Note {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  downloads: number;
  createdAt: string;
  teacher: {
    id: string;
    name: string | null;
    image: string | null;
  };
}
interface NotesListProps {
  courseId: string;
  chapterId?: string;
  isTeacher?: boolean;
  onDelete?: () => void;
}

export const NotesList = ({
  courseId,
  chapterId,
  isTeacher = false,
  onDelete,
}: NotesListProps) => {
  const t = useTranslations("course.notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ courseId });
      if (chapterId) params.append("chapterId", chapterId);

      const response = await axios.get(`/api/notes?${params.toString()}`);
      setNotes(response.data);
    } catch (error) {
      toast.error(t("load_failed"));
    } finally {
      setIsLoading(false);
    }
  }, [courseId, chapterId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleDownload = async (
    noteId: string,
    fileUrl: string,
    fileName: string,
  ) => {
    try {
      // Increment download count
      await axios.patch(`/api/notes/${noteId}`);

      // Trigger download
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t("download_started"));
      fetchNotes(); // Refresh to update download count
    } catch (error) {
      toast.error(t("download_failed"));
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm(t("confirm_delete"))) return;

    try {
      await axios.delete(`/api/notes/${noteId}`);
      toast.success(t("deleted"));
      fetchNotes();
      onDelete?.();
    } catch (error) {
      toast.error(t("delete_failed"));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">{t("loading")}</div>
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            {isTeacher ? t("no_teacher") : t("no_student")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                </div>
                {note.description && (
                  <CardDescription className="mt-2">
                    {note.description}
                  </CardDescription>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span>{t("by")} {note.teacher.name}</span>
                  <Badge variant="secondary">{note.downloads} {t("downloads")}</Badge>
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    handleDownload(note.id, note.fileUrl, note.fileName)
                  }
                  size="sm"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />{t("download")}</Button>
                {isTeacher && (
                  <Button
                    onClick={() => handleDelete(note.id)}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};