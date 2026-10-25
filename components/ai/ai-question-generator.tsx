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
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useState } from "react";
import { useTranslations } from "next-intl";

export interface AiGeneratedQuestion {
  /** quiz target */
  text?: string;
  type?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  answer?: string;
  /** finalExam target */
  title?: string;
  options?: string[];
  correctAnswer?: number;
  points?: number;
  /** both */
  explanation?: string;
}

interface AiQuestionGeneratorProps {
  target: "quiz" | "finalExam";
  courseId: string;
  chapterId?: string;
  quizId?: string;
  finalExamId?: string;
  /** Called with API-shaped questions; caller decides how to persist them */
  onInsert: (questions: AiGeneratedQuestion[]) => void | Promise<void>;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export const AiQuestionGenerator = ({
  target,
  courseId,
  chapterId,
  quizId,
  finalExamId,
  onInsert,
}: AiQuestionGeneratorProps) => {
  const t = useTranslations("teacher.ai_generator");

  const [open, setOpen] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [count, setCount] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [language, setLanguage] = useState("vi");
  const [questions, setQuestions] = useState<AiGeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);

  const reset = () => {
    setQuestions([]);
    setSourceText("");
    setIsGenerating(false);
    setIsInserting(false);
  };

  /** Normalize quiz vs finalExam shapes for the preview list */
  const getDisplay = (q: AiGeneratedQuestion) => {
    if (target === "quiz") {
      return {
        text: q.text ?? "",
        options: [q.option1, q.option2, q.option3, q.option4].filter(
          (o): o is string => !!o,
        ),
        answerText: q.answer ?? "",
        explanation: q.explanation ?? "",
      };
    }
    const options = q.options ?? [];
    return {
      text: q.title ?? "",
      options,
      answerText: options[q.correctAnswer ?? 0] ?? "",
      explanation: q.explanation ?? "",
    };
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setQuestions([]);
      const { data } = await axios.post("/api/ai/generate-questions", {
        target,
        courseId,
        chapterId,
        quizId,
        finalExamId,
        sourceText: sourceText.trim() || undefined,
        count: parseInt(count, 10),
        difficulty,
        language,
      });
      setQuestions(data.questions);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 503) {
        toast.error(t("not_configured"));
      } else if (
        axios.isAxiosError(error) &&
        error.response?.status === 429
      ) {
        toast.error(t("failed"));
      } else {
        toast.error(t("failed"));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = async () => {
    if (questions.length === 0) return;
    try {
      setIsInserting(true);
      await onInsert(questions);
      toast.success(t("success", { count: questions.length }));
      setOpen(false);
      reset();
    } catch {
      toast.error(t("failed"));
    } finally {
      setIsInserting(false);
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
            <Label htmlFor="ai-source-text">{t("source_label")}</Label>
            <Textarea
              id="ai-source-text"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={t("source_placeholder")}
              rows={4}
              disabled={isGenerating}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>{t("count_label")}</Label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger disabled={isGenerating}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("difficulty_label")}</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger disabled={isGenerating}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{t("easy")}</SelectItem>
                  <SelectItem value="medium">{t("medium")}</SelectItem>
                  <SelectItem value="hard">{t("hard")}</SelectItem>
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

          {questions.length > 0 && (
            <div className="space-y-3 border rounded-md p-3">
              {questions.map((q, index) => {
                const display = getDisplay(q);
                return (
                  <div key={index} className="space-y-1">
                    <p className="text-sm font-medium">
                      Q{index + 1}. {display.text}
                    </p>
                    <div className="text-xs space-y-0.5">
                      {display.options.map((option, optIndex) => {
                        const isCorrect = option === display.answerText;
                        return (
                          <p
                            key={optIndex}
                            className={cn(
                              isCorrect ? "text-green-600 font-medium" : "text-gray-600",
                            )}
                          >
                            {OPTION_LETTERS[optIndex]}. {option}
                            {isCorrect ? " ✓" : ""}
                          </p>
                        );
                      })}
                    </div>
                    {display.explanation && (
                      <p className="text-xs italic text-muted-foreground">
                        {display.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isInserting}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleInsert}
            disabled={isInserting || isGenerating || questions.length === 0}
          >
            {isInserting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {questions.length === 1
              ? t("insert_one")
              : t("insert", { count: questions.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiQuestionGenerator;