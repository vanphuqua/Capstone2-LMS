"use client";

import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  User,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface AssignmentSubmission {
  id: string;
  submissionType: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  linkUrl?: string;
  textContent?: string;
  isLate: boolean;
  daysLate: number;
  status: string;
  score?: number;
  feedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
  student: {
    id: string;
    name: string;
    email: string;
  };
  grader?: {
    id: string;
    name: string;
  };
}

interface AssignmentSubmissionViewerProps {
  assignmentId: string;
  assignmentTitle: string;
  submissions: AssignmentSubmission[];
}

export const AssignmentSubmissionViewer = ({ 
  assignmentId, 
  assignmentTitle, 
  submissions 
}: AssignmentSubmissionViewerProps) => {
  const t = useTranslations("course.assignments");
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const router = useRouter();

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      setIsGrading(true);
      
      await axios.patch(`/api/assignments/submissions/${selectedSubmission.id}/grade`, {
        score,
        feedback,
      });

      toast.success(t("submission_graded_success"));
      router.refresh();
      setSelectedSubmission(null);
    } catch (error) {
      toast.error(t("submission_graded_failed"));
    } finally {
      setIsGrading(false);
    }
  };

  const getStatusBadge = (submission: AssignmentSubmission) => {
    switch (submission.status) {
      case "graded":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t("status_graded")}
          </Badge>
        );
      case "submitted":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            {t("status_pending_review")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {t("status_unknown")}
          </Badge>
        );
    }
  };

  const renderSubmissionContent = (submission: AssignmentSubmission) => {
    switch (submission.submissionType) {
      case "file":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">{submission.fileName}</p>
                <p className="text-sm text-gray-500">
                  {submission.fileSize ? `${(submission.fileSize / 1024 / 1024).toFixed(2)} MB` : t("file_label")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(submission.fileUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                {t("view_download")}
              </Button>
            </div>
          </div>
        );
      case "link":
        return (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">{t("submitted_link_label")}</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input 
                  value={submission.linkUrl || ""} 
                  readOnly 
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(submission.linkUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      case "text":
        return (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">{t("text_submission_label")}</Label>
              <div className="mt-2">
                <Textarea 
                  value={submission.textContent || ""} 
                  readOnly 
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center text-gray-500 py-4">
            {t("no_content")}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("student_submissions")}</h3>
        <Badge variant="outline">
          {t("submission_count", { count: submissions.length })}
        </Badge>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">{t("no_submissions")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{submission.student.name}</p>
                      <p className="text-sm text-gray-500">{submission.student.email}</p>
                    </div>
                  </div>
                  {getStatusBadge(submission)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {t("submitted_at", { date: format(new Date(submission.submittedAt), 'PPp') })}
                  </div>
                  {submission.isLate && (
                    <Badge variant="destructive" className="text-xs">
                      {t("late_by_days", { days: submission.daysLate })}
                    </Badge>
                  )}
                </div>

                {submission.status === "graded" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-green-800">{t("grade_value", { score: submission.score ?? 0 })}</span>
                      <span className="text-sm text-green-600">
                        {t("graded_by_on", {
                          name: submission.grader?.name ?? "",
                          date: submission.gradedAt ? format(new Date(submission.gradedAt), 'PPp') : ""
                        })}
                      </span>
                    </div>
                    {submission.feedback && (
                      <div>
                        <p className="text-sm font-medium text-green-800">{t("feedback_label")}</p>
                        <p className="text-sm text-green-700">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t("view_submission_btn")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{t("submission_details_title", { title: assignmentTitle })}</DialogTitle>
                        <DialogDescription>
                          {t("submitted_by_on", {
                            name: submission.student.name,
                            date: format(new Date(submission.submittedAt), 'PPp')
                          })}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {renderSubmissionContent(submission)}

                        {submission.status !== "graded" && (
                          <div className="border-t pt-4 space-y-4">
                            <h4 className="font-medium">{t("grade_submission")}</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="score">{t("score_0_100")}</Label>
                                <Input
                                  id="score"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={score}
                                  onChange={(e) => setScore(Number(e.target.value))}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="feedback">{t("feedback_optional_label")}</Label>
                              <Textarea
                                id="feedback"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder={t("feedback_placeholder")}
                                className="min-h-[80px]"
                              />
                            </div>
                            <Button
                              onClick={handleGradeSubmission}
                              disabled={isGrading}
                              className="w-full"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {isGrading ? t("grading") : t("grade_submission")}
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {submission.status !== "graded" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setScore(submission.score || 0);
                        setFeedback(submission.feedback || "");
                      }}
                    >
                      {t("grade")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};