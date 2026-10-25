"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface LandingContent {
  description: string;
  learningOutcomes: string[];
  courseObjectives: string[];
  prerequisites: string[];
  highlights: string[];
  whoIsThisFor: string[];
  projectsIncluded: string[];
  tags: string[];
  faqs: Array<{ question: string; answer: string }>;
  chapters: Array<{ title: string; description: string }>;
  resources: Array<{ name: string; url: string; fileType?: string }>;
  finalExam?: {
    title: string;
    timeLimit: number;
    passingScore: number;
    questions: Array<{
      text: string;
      options: string[];
      answerIndex: number;
      explanation: string;
    }>;
  } | null;
  promoVideo?: {
    title: string;
    hook: string;
    outline: string[];
  } | null;
}

interface AiCourseContentGeneratorProps {
  courseId: string;
  courseTitle: string;
}

const SectionList = ({ items }: { items: string[] }) => (
  <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-700">
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
);

export const AiCourseContentGenerator = ({
  courseId,
  courseTitle,
}: AiCourseContentGeneratorProps) => {
  const t = useTranslations("teacher.ai_course_content");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("vi");
  const [content, setContent] = useState<LandingContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const [appliedSections, setAppliedSections] = useState<Set<string>>(
    new Set()
  );

  const reset = () => {
    setContent(null);
    setTopic("");
    setIsGenerating(false);
    setIsApplying(false);
    setAppliedSections(new Set());
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setContent(null);
      setAppliedSections(new Set());
      const { data } = await axios.post("/api/ai/generate-course-content", {
        courseId,
        topic: topic.trim() || undefined,
        tone,
        language,
      });
      setContent(data.content);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 503) {
        toast.error(t("not_configured"));
      } else {
        toast.error(t("failed"));
      }
    } finally {
      setIsGenerating(false);
    }
  };
  const handleApply = async () => {
    if (!content) return;
    try {
      setIsApplying(true);

      // 1) Landing page fields on the Course model
      await axios.patch(`/api/courses/${courseId}`, {
        description: content.description,
        learningOutcomes: content.learningOutcomes,
        courseObjectives: content.courseObjectives,
        prerequisites: content.prerequisites,
        highlights: content.highlights,
        whoIsThisFor: content.whoIsThisFor,
        projectsIncluded: content.projectsIncluded,
        tags: content.tags,
        faqs: content.faqs.map((faq) => JSON.stringify(faq)),
      });
      setAppliedSections((prev) => new Set([...prev, "landing"]));

      // 2) Chapters — create one row per suggested chapter
      for (const chapter of content.chapters) {
        try {
          await axios.post(`/api/courses/${courseId}/chapters`, {
            title: chapter.title,
            description: chapter.description,
          });
        } catch {
          // A duplicate chapter title (409) means the chapter already exists — skip it
        }
      }
      setAppliedSections((prev) => new Set([...prev, "chapters"]));

      // 3) Resources & attachments — create an attachment row per link
      for (const resource of content.resources ?? []) {
        try {
          await axios.post(`/api/courses/${courseId}/attachments`, {
            url: resource.url,
            name: resource.name,
            type: "link",
            fileType: resource.fileType ?? "link",
          });
        } catch {
          // skip failures (teacher can add manually)
        }
      }
      setAppliedSections((prev) => new Set([...prev, "resources"]));

      // 4) Final exam + questions
      if (content.finalExam) {
        const { data: exam } = await axios.post(
          `/api/courses/${courseId}/final-exams`,
          { title: content.finalExam.title }
        );
        for (const q of content.finalExam.questions) {
          await axios.post(
            `/api/courses/${courseId}/final-exams/${exam.id}/questions`,
            {
              title: q.text,
              explanation: q.explanation || "",
              options: q.options,
              correctAnswer: q.answerIndex,
              points: 1,
            }
          );
        }
        await axios.patch(
          `/api/courses/${courseId}/final-exams/${exam.id}`,
          {
            timeLimit: content.finalExam.timeLimit,
            passingScore: content.finalExam.passingScore,
          }
        );
        setAppliedSections((prev) => new Set([...prev, "finalExam"]));
      }

      // 5) Promo video — AI can only suggest a script, not a real video URL.
      //    Nothing to persist automatically; shown in preview for the teacher.
      setAppliedSections((prev) => new Set([...prev, "promoVideo"]));

      toast.success(t("applied"));
      setOpen(false);
      reset();
      window.location.reload();
    } catch {
      toast.error(t("apply_failed"));
      setIsApplying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" type="button">
          <Sparkles className="h-4 w-4 mr-2" />
          {t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("dialog_title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-course-topic">{t("topic_label")}</Label>
            <Textarea
              id="ai-course-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("topic_placeholder", { title: courseTitle })}
              rows={3}
              disabled={isGenerating}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("tone_label")}</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger disabled={isGenerating}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">{t("tone_pro")}</SelectItem>
                  <SelectItem value="friendly">{t("tone_friendly")}</SelectItem>
                  <SelectItem value="casual">{t("tone_casual")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("language_label")}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger disabled={isGenerating}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">{t("vietnamese")}</SelectItem>
                  <SelectItem value="en">{t("english")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t("generate")}
              </>
            )}
          </Button>

          {content && (
            <div className="space-y-4 border rounded-md p-3 text-sm">
              <div>
                <p className="font-medium mb-1">{t("preview_description")}</p>
                <p className="text-xs text-gray-700 whitespace-pre-line">
                  {content.description}
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">{t("preview_outcomes")}</p>
                <SectionList items={content.learningOutcomes} />
              </div>
              <div>
                <p className="font-medium mb-1">{t("preview_objectives")}</p>
                <SectionList items={content.courseObjectives} />
              </div>
              <div>
                <p className="font-medium mb-1">{t("preview_prerequisites")}</p>
                <SectionList items={content.prerequisites} />
              </div>
              <div>
                <p className="font-medium mb-1">{t("preview_highlights")}</p>
                <SectionList items={content.highlights} />
              </div>
              <div>
                <p className="font-medium mb-1">{t("preview_audience")}</p>
                <SectionList items={content.whoIsThisFor} />
              </div>
              {content.projectsIncluded.length > 0 && (
                <div>
                  <p className="font-medium mb-1">{t("preview_projects")}</p>
                  <SectionList items={content.projectsIncluded} />
                </div>
              )}
              <div>
                <p className="font-medium mb-1">{t("preview_tags")}</p>
                <div className="flex flex-wrap gap-1">
                  {content.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-[11px] bg-slate-200 rounded-full px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium mb-1">{t("preview_faqs")}</p>
                <div className="space-y-2">
                  {content.faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 pl-2"
                    >
                      <p className="text-xs font-semibold">{faq.question}</p>
                      <p className="text-xs text-gray-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapters */}
              <div>
                <p className="font-medium mb-1">{t("preview_chapters")}</p>
                <SectionList
                  items={content.chapters.map(
                    (c) => `${c.title} — ${c.description}`
                  )}
                />
              </div>

              {/* Resources */}
              <div>
                <p className="font-medium mb-1">{t("preview_resources")}</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-700">
                  {(content.resources ?? []).map((r, i) => (
                    <li key={i}>
                      {r.name} <span className="text-slate-500 text-[11px]">({r.fileType ?? "link"})</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Final Exam */}
              {content.finalExam && (
                <div>
                  <p className="font-medium mb-1">{t("preview_final_exam")}</p>
                  <p className="text-xs text-gray-600 mb-1">
                    {t("time_limit", {
                      minutes: content.finalExam.timeLimit,
                    })} &nbsp;•&nbsp;
                    {t("passing_score", {
                      score: content.finalExam.passingScore,
                    })}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t("preview_final_exam_questions", {
                      count: content.finalExam.questions.length,
                    })}
                  </p>
                </div>
              )}

              {/* Promo Video */}
              {content.promoVideo && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
                  <p className="font-medium mb-1 text-amber-900">
                    {t("preview_promo_video")}
                  </p>
                  <p className="text-xs text-amber-700 whitespace-pre-line">
                    {content.promoVideo.hook}
                  </p>
                  <ul className="list-disc list-inside text-xs text-amber-700 space-y-0.5 mt-1">
                    {content.promoVideo.outline.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-amber-600 italic mt-2">
                    {t("preview_promo_note")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isApplying}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={!content || isApplying || isGenerating}
          >
            {isApplying && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {t("apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiCourseContentGenerator;