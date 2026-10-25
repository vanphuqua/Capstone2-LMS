"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiAssistantWidgetProps {
  courseId: string;
}

export const AiAssistantWidget = ({ courseId }: AiAssistantWidgetProps) => {
  const t = useTranslations("course.ai_assistant");

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamReady, setStreamReady] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  const suggestions = [
    t("suggest_summary"),
    t("suggest_next"),
    t("suggest_certificate"),
  ];

  const sendQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isSending) return;

    const history = messages.slice(-6);
    setInput("");
    setIsSending(true);
    setStreamReady(false);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/course-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, question: trimmed, history }),
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 503) toast.error(t("not_configured"));
        else if (res.status === 429) toast.error(t("rate_limited"));
        else toast.error(t("failed"));
        // Remove the empty assistant placeholder
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      setStreamReady(true);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = {
            ...last,
            content: last.content + chunk,
          };
          return next;
        });
      }
    } catch {
      if (!controller.signal.aborted) {
        toast.error(t("failed"));
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant" && !last.content) {
            return next.slice(0, -1);
          }
          return next;
        });
      }
    } finally {
      abortRef.current = null;
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating action button */}
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "hover:scale-105 transition-transform",
        )}
        size="icon"
        aria-label={t("trigger")}
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg h-[75vh] flex flex-col p-0">
          <DialogHeader className="border-b p-4">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("title")}
            </DialogTitle>
          </DialogHeader>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("intro")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto text-xs whitespace-normal text-left"
                      disabled={isSending}
                      onClick={() => sendQuestion(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-line",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                >
                  {message.content}
                  {message.role === "assistant" &&
                    isSending &&
                    index === messages.length - 1 &&
                    !streamReady && (
                      <Loader2 className="inline h-4 w-4 animate-spin ml-1" />
                    )}
                  {message.role === "assistant" &&
                    isSending &&
                    index === messages.length - 1 &&
                    streamReady &&
                    message.content === "" && (
                      <span className="inline-block h-4 w-2 bg-muted-foreground/50 animate-pulse" />
                    )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendQuestion(input);
                  }
                }}
                placeholder={t("input_placeholder")}
                rows={2}
                disabled={isSending}
                className="resize-none text-sm"
              />
              <Button
                type="button"
                size="icon"
                onClick={() => sendQuestion(input)}
                disabled={isSending || !input.trim()}
                aria-label={t("send")}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {t("disclaimer")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AiAssistantWidget;