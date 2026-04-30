"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSendReply } from "@/hooks/use-conversations";

interface ReplyBoxProps {
  conversationId: string;
  contactName: string | null;
}

export function ReplyBox({ conversationId, contactName }: ReplyBoxProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: sendReply, isPending } = useSendReply(conversationId);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    sendReply(trimmed, {
      onSuccess: () => setText(""),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      {/* Quick actions row */}
      <div className="flex items-center gap-1 mb-2">
        <button
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Quick replies"
        >
          <Zap className="h-4 w-4" />
        </button>
        <button
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <button
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Emoji"
        >
          <Smile className="h-4 w-4" />
        </button>
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${contactName || "contact"}...`}
            rows={1}
            className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim() || isPending}
          className={cn(
            "shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all",
            text.trim() && !isPending
              ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-700 text-muted-foreground cursor-not-allowed"
          )}
        >
          <Send className={cn("h-4 w-4", isPending && "animate-pulse")} />
        </button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-muted-foreground/60 mt-1.5 px-1">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
