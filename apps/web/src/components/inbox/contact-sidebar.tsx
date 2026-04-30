"use client";

import { Phone, Mail, Tag, Calendar, Clock, CheckCircle, XCircle, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useConversationDetail, useUpdateStatus } from "@/hooks/use-conversations";

interface ContactSidebarProps {
  conversationId: string;
}

export function ContactSidebar({ conversationId }: ContactSidebarProps) {
  const { data: conversation, isLoading } = useConversationDetail(conversationId);
  const { mutate: updateStatus } = useUpdateStatus(conversationId);

  if (isLoading || !conversation) {
    return (
      <div className="w-full h-full p-4 animate-pulse space-y-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  const { contact } = conversation;
  const initials = contact.name
    ? contact.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : contact.phoneE164.slice(-2);

  return (
    <div className="w-full h-full overflow-y-auto border-l border-slate-200 dark:border-slate-700">
      {/* Profile header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 text-center">
        <div className="h-16 w-16 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 flex items-center justify-center text-lg font-bold mx-auto">
          {initials}
        </div>
        <h3 className="text-sm font-semibold text-foreground mt-3">
          {contact.name || "Unknown"}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
          {contact.phoneE164}
        </p>
        {contact.optOut && (
          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
            <XCircle className="h-3 w-3" /> Opted out
          </span>
        )}
      </div>

      {/* Status / Actions */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-medium",
              conversation.status === "open"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                : "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300"
            )}
          >
            {conversation.status}
          </span>
        </div>

        <button
          onClick={() =>
            updateStatus(conversation.status === "open" ? "resolved" : "open")
          }
          className={cn(
            "w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
            conversation.status === "open"
              ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-400 dark:hover:bg-green-950/40"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
          )}
        >
          {conversation.status === "open" ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" /> Mark Resolved
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5" /> Reopen
            </>
          )}
        </button>
      </div>

      {/* Contact details */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Contact Info
        </h4>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-foreground font-mono">{contact.phoneE164}</span>
          </div>
          {contact.email && (
            <div className="flex items-center gap-2.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-foreground">{contact.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">
              Added {format(new Date(contact.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tags
        </h4>
        {contact.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {contact.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-muted-foreground"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/60">No tags</p>
        )}
      </div>

      {/* Assigned */}
      <div className="p-4 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Assignment
        </h4>
        <div className="flex items-center gap-2.5">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {conversation.assignedTo ? "Assigned to team member" : "Unassigned"}
          </span>
        </div>
      </div>
    </div>
  );
}
