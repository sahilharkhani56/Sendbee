"use client";

import { Phone, MoreVertical, CheckCircle, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationContact } from "@/hooks/use-conversations";

interface ChatHeaderProps {
  contact: ConversationContact;
  status: "open" | "resolved";
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  onBack?: () => void;
}

export function ChatHeader({
  contact,
  status,
  onToggleSidebar,
  sidebarOpen,
  onBack,
}: ChatHeaderProps) {
  const initials = contact.name
    ? contact.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : contact.phoneE164.slice(-2);

  return (
    <div className="h-[60px] flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
      <div className="flex items-center gap-3">
        {/* Back button (mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <svg className="h-5 w-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 flex items-center justify-center text-xs font-semibold">
          {initials}
        </div>

        {/* Name + Status */}
        <div>
          <h3 className="text-sm font-semibold text-foreground leading-tight">
            {contact.name || contact.phoneE164}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground font-mono">
              {contact.phoneE164}
            </span>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status === "open" ? "bg-green-500" : "bg-slate-400"
              )}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Call"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleSidebar}
          className={cn(
            "p-2 rounded-md transition-colors hidden lg:flex",
            sidebarOpen
              ? "text-teal-700 bg-teal-50 dark:bg-teal-950/30"
              : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700"
          )}
          title="Contact info"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <MoreVertical className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
