"use client";

import { AlertCircle, CheckCircle2, Clock, Download, FileText, FileUp, Link as LinkIcon, Type } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/lib/uploadthing";
import axios from "axios";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Assignment {
  id: string;
  title: string;
  description: string;
  questionPdfUrl?: string;
  questionPdfName?: string;
  dueDate: Date;
  maxScore: number;
  allowLateSubmission: boolean;
  latePenalty: number;
  allowFileUpload: boolean;
  allowLinkSubmission: boolean;
  allowTextSubmission: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  course: {
    id: string;
    title: string;
  };
}

interface Submission {
  id: string;
  submissionType: string;
  fileUrl?: string;
  fileName?: string;
  linkUrl?: string;
  textContent?: string;
  isLate: boolean;
  daysLate: number;
  status: string;
  score?: number;
  feedback?: string;
  submittedAt: Date;
}

interface SubmitAssignmentFormProps {
  assignmentId: string;
  courseId: string;
  assignment: Assignment;
  existingSubmission?: Submission;
  canSubmit?: boolean;
}

export function SubmitAssignmentForm({
  assignmentId,
  courseId,
  assignment,
  existingSubmission,
  canSubmit: canSubmitProp,
}: SubmitAssignmentFormProps) {
  const t = useTranslations("course.submit_assignment");
  const router = useRouter();
  const [submissionType, setSubmissionType] = useState<"file" | "link" | "text">(
    existingSubmission?.submissionType as "file" | "link" | "text" || "file"
  );
  const [fileUrl, setFileUrl] = useState(existingSubmission?.fileUrl || "");
  const [fileName, setFileName] = useState(existingSubmission?.fileName || "");
  const [fileSize, setFileSize] = useState(0);
  const [linkUrl, setLinkUrl] = useState(existingSubmission?.linkUrl || "");
  const [textContent, setTextContent] = useState(existingSubmission?.textContent || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = now > dueDate;
  const canSubmit = canSubmitProp ?? (!isOverdue || assignment.allowLateSubmission);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error(t("no_longer_accepts"));
      return;
    }

    // Validate submission content
    if (submissionType === "file" && !fileUrl) {
      toast.error(t("no_submissions_please"));
      return;
    }
    if (submissionType === "link" && !linkUrl) {
      toast.error(t("enter_url_please"));
      return;
    }
    if (submissionType === "text" && !textContent.trim()) {
      toast.error(t("enter_answer_please"));
      return;
    }

    try {
      setIsSubmitting(true);

      await axios.post(
        `/api/courses/${courseId}/assignments/${assignmentId}/submissions`,
        {
          submissionType,
          fileUrl: submissionType === "file" ? fileUrl : undefined,
          fileName: submissionType === "file" ? fileName : undefined,
          fileSize: submissionType === "file" ? fileSize : undefined,
          linkUrl: submissionType === "link" ? linkUrl : undefined,
          textContent: submissionType === "text" ? textContent : undefined,
        }
      );

      toast.success(
        existingSubmission
          ? t("submission_updated")
          : t("submitted_success")
      );
      router.refresh();
    } catch (error) {
      toast.error(t("submit_failed"));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingSubmission && existingSubmission.status === "graded") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            {t("graded")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t("score")}</Label>
            <div className="text-3xl font-bold">
              {existingSubmission.score} / {assignment.maxScore}
            </div>
            <p className="text-sm text-muted-foreground">
              {Math.round((existingSubmission.score! / assignment.maxScore) * 100)}%
            </p>
          </div>

          {existingSubmission.feedback && (
            <div>
              <Label>{t("feedback")}</Label>
              <div className="p-4 bg-muted rounded-lg mt-2">
                {existingSubmission.feedback}
              </div>
            </div>
          )}

          <div>
            <Label>{t("submitted_at")}</Label>
            <p className="text-sm">
              {format(new Date(existingSubmission.submittedAt), "PPpp")}
            </p>
            {existingSubmission.isLate && (
              <Badge variant="destructive" className="mt-2">
                {t("late_by_days", { days: existingSubmission.daysLate })}
              </Badge>
            )}
          </div>

          {existingSubmission.submissionType === "file" && existingSubmission.fileUrl && (
            <div>
              <Label>{t("submitted_file")}</Label>
              <div className="flex items-center gap-2 mt-2 p-3 bg-muted rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
                <a
                  href={existingSubmission.fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm flex-1"
                >
                  {existingSubmission.fileName}
                </a>
                <Download className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}

          {existingSubmission.submissionType === "link" && existingSubmission.linkUrl && (
            <div>
              <Label>{t("submitted_link")}</Label>
              <a
                href={existingSubmission.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm block mt-1"
              >
                {existingSubmission.linkUrl}
              </a>
            </div>
          )}

          {existingSubmission.submissionType === "text" && existingSubmission.textContent && (
            <div>
              <Label>{t("your_answer")}</Label>
              <div className="p-4 bg-muted rounded-lg mt-2 whitespace-pre-wrap">
                {existingSubmission.textContent}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("submit_assignment")}</CardTitle>
        {isOverdue && assignment.allowLateSubmission && (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">
              {t("overdue_penalty", { penalty: assignment.latePenalty })}
            </p>
          </div>
        )}
        {!canSubmit && (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{t("no_longer_accepted")}</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Question PDF Download Section */}
        {assignment.questionPdfUrl && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {t("assignment_questions")}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {assignment.questionPdfName || t("download_pdf")}
                  </p>
                </div>
              </div>
              <a
                href={assignment.questionPdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t("download_pdf")}
                </Button>
              </a>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Submission Type Selection */}
          <div className="space-y-2">
            <Label>{t("submission_type")}</Label>
            <RadioGroup
              value={submissionType}
              onValueChange={(value) => setSubmissionType(value as "file" | "link" | "text")}
              disabled={!canSubmit || isSubmitting}
            >
              {assignment.allowFileUpload && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file" id="file" />
                  <Label htmlFor="file" className="flex items-center gap-2 cursor-pointer">
                    <FileUp className="h-4 w-4" />
                    {t("upload_file")}
                  </Label>
                </div>
              )}
              {assignment.allowLinkSubmission && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="link" id="link" />
                  <Label htmlFor="link" className="flex items-center gap-2 cursor-pointer">
                    <LinkIcon className="h-4 w-4" />
                    {t("submit_link")}
                  </Label>
                </div>
              )}
              {assignment.allowTextSubmission && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="text" />
                  <Label htmlFor="text" className="flex items-center gap-2 cursor-pointer">
                    <Type className="h-4 w-4" />
                    {t("type_answer")}
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* File Upload */}
          {submissionType === "file" && (
            <div className="space-y-2">
              <Label>{t("upload_file_hint")}</Label>
              {fileUrl ? (
                <div className="space-y-2">
                  <div className="p-4 border rounded-lg bg-muted flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {(fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFileUrl("");
                        setFileName("");
                        setFileSize(0);
                      }}
                    >
                      {t("change_file")}
                    </Button>
                  </div>
                </div>
              ) : (
                <UploadDropzone
                  endpoint="assignmentSubmission"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]) {
                      const file = res[0] as any;
                      setFileUrl(file.ufsUrl || file.url);
                      setFileName(file.name);
                      setFileSize(file.size);
                      toast.success(t("file_uploaded"));
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(t("upload_failed", { message: error.message }));
                  }}
                  onBeforeUploadBegin={(files) => {
                    // Validate file size and type before upload
                    const validFiles = files.filter(file => {
                      // Check file size
                      if (file.size > assignment.maxFileSize * 1024 * 1024) {
                        toast.error(t("file_size_exceeds", {
                          size: assignment.maxFileSize,
                          actual: (file.size / 1024 / 1024).toFixed(1)
                        }));
                        return false;
                      }

                      // Check file type
                      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
                      const mimeType = file.type.toLowerCase();
                      
                      const isAllowed = assignment.allowedFileTypes.some(type => 
                        type.toLowerCase() === fileExtension || 
                        mimeType.includes(type.toLowerCase())
                      );
                      
                      if (!isAllowed) {
                        toast.error(t("file_type_not_allowed", { types: assignment.allowedFileTypes.join(', ') }));
                        return false;
                      }

                      return true;
                    });

                    return validFiles;
                  }}
                />
              )}
              <p className="text-xs text-muted-foreground">
                {t("upload_hint", { size: assignment.maxFileSize })}
              </p>
            </div>
          )}

          {/* Link Submission */}
          {submissionType === "link" && (
            <div className="space-y-2">
              <Label htmlFor="linkUrl">{t("link_url")}</Label>
              <Input
                id="linkUrl"
                type="url"
                placeholder={t("link_url_placeholder")}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                disabled={!canSubmit || isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                {t("link_hint")}
              </p>
            </div>
          )}

          {/* Text Submission */}
          {submissionType === "text" && (
            <div className="space-y-2">
              <Label htmlFor="textContent">{t("your_answer")}</Label>
              <Textarea
                id="textContent"
                placeholder={t("answer_placeholder")}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={!canSubmit || isSubmitting}
                rows={10}
              />
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting
                ? t("submitting")
                : existingSubmission
                ? t("update_submission")
                : t("submit_assignment")}
            </Button>
            {existingSubmission && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {t("cancel")}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}