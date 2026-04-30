"use client";

import { useRef, useEffect } from "react";
import { format } from "date-fns";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages, type Message } from "@/hooks/use-conversations";

function getStatusIcon(status: string) {
  switch (status) {
    case "read":
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-slate-400" />;
    case "sent":
      return <Check className="h-3 w-3 text-slate-400" />;
    case "queued":
      return <Clock className="h-3 w-3 text-slate-400" />;
    case "failed":
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    default:
      return null;
  }
}

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === "outbound";
  const isNote = message.content._note;
  const time = format(new Date(message.createdAt), "h:mm a");

  if (isNote) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5 max-w-[80%]">
          <p className="text-xs text-amber-800 dark:text-amber-200 italic">
            📝 {message.content.text}
          </p>
          <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60 mt-0.5">{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex mb-1", isOutbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm",
          isOutbound
            ? "bg-teal-700 text-white rounded-br-md"
            : "bg-white dark:bg-slate-700 text-foreground rounded-bl-md border border-slate-100 dark:border-slate-600"
        )}
      >
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
          {message.content.text || message.content.caption || "[Media]"}
        </p>
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1",
            isOutbound ? "text-teal-100/80" : "text-muted-foreground"
          )}
        >
          <span className="text-[10px]">{time}</span>
          {isOutbound && getStatusIcon(message.status)}
        </div>
      </div>
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-0.5">
        <span className="text-[11px] text-muted-foreground font-medium">{date}</span>
      </div>
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
          <div
            className={cn(
              "rounded-2xl",
              i % 2 === 0 ? "bg-slate-200 dark:bg-slate-700" : "bg-teal-200 dark:bg-teal-900"
            )}
            style={{ width: `${140 + Math.random() * 120}px`, height: "40px" }}
          />
        </div>
      ))}
    </div>
  );
}

interface ChatThreadProps {
  conversationId: string | null;
}

export function ChatThread({ conversationId }: ChatThreadProps) {
  const { data, isLoading } = useMessages(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages load or change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900/30">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Select a conversation</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Choose from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) return <ThreadSkeleton />;

  // Messages come newest first from API — reverse for display
  const messages = [...(data?.data || [])].reverse();

  // Group messages by date
  let lastDate = "";

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-3 bg-slate-50/50 dark:bg-slate-900/20"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.344 0L13.858 8.485 15.272 9.9l9.9-9.9h-2.828zM27.998 0L19.514 8.485 20.928 9.9l9.9-9.9H27.998zm5.656 0L25.17 8.485 26.584 9.9l9.9-9.9h-2.83zM0 5.373l.828-.83 1.415 1.415L0 8.2V5.374zm0 5.656l.828-.829 7.072 7.071-1.414 1.415L0 12.03v-1zm0 5.656l.828-.828 12.728 12.728-1.414 1.414L0 17.686v-1zm0 5.657l.828-.828L18.384 30.07l-1.414 1.414L0 23.342v-1zM0 28.97l.828-.828L24.042 35.7l-1.414 1.415L0 29.028v-.057z' fill='%239C92AC' fill-opacity='.02'/%3E%3C/svg%3E\")" }}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">No messages yet</p>
        </div>
      ) : (
        messages.map((msg) => {
          const msgDate = format(new Date(msg.createdAt), "MMM d, yyyy");
          const showDate = msgDate !== lastDate;
          lastDate = msgDate;

          return (
            <div key={msg.id}>
              {showDate && <DateSeparator date={msgDate} />}
              <MessageBubble message={msg} />
            </div>
          );
        })
      )}
    </div>
  );
}
