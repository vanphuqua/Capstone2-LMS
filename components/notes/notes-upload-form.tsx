"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/file-upload";
import { Upload, X, Pencil } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface NotesUploadFormProps {
  courseId: string;
  chapterId?: string;
  onSuccess?: () => void;
}

export const NotesUploadForm = ({
  courseId,
  chapterId,
  onSuccess,
}: NotesUploadFormProps) => {
  const t = useTranslations("dashboard.notes_upload");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!title || !fileUrl || !fileName) {
        toast.error(t("fill_required"));
        return;
      }

      await axios.post("/api/notes", {
        title,
        description,
        fileUrl,
        fileName,
        courseId,
        chapterId,
      });

      toast.success(t("upload_success"));
      setTitle("");
      setDescription("");
      setFileUrl("");
      setFileName("");
      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      toast.error(t("upload_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };