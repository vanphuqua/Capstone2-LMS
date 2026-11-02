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

   return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-medium">{t("title")}</CardTitle>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="ghost"
            size="sm"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                {t("cancel")}
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                {t("upload_new")}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isEditing && (
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">{t("title_label")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("title_placeholder")}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="description">{t("description_label")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("description_placeholder")}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label>{t("upload_file_label")}</Label>
            <FileUpload
              endpoint="noteFile"
              onChange={(url) => {
                if (url) {
                  setFileUrl(url);
                  const name = url.split("/").pop() || "document.pdf";
                  setFileName(name);
                }
              }}
            />
            {fileName && (
              <p className="text-sm text-gray-500 mt-2">
                {t("selected", { name: fileName })}
              </p>
            )}
          </div>

          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !title || !fileUrl}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isSubmitting ? t("uploading") : t("upload_note")}
          </Button>
        </CardContent>
      )}
    </Card>
  );
};