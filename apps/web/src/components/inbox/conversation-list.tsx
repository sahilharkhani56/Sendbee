"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, Filter, Check, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversations, type Conversation } from "@/hooks/use-conversations";

type FilterTab = "all" | "mine" | "unassigned" | "open" | "resolved";

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return phone.slice(-2);
}

function getStatusIcon(status: string) {
  switch (status) {
    case "read":
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case "sent":
      return <Check className="h-3 w-3 text-muted-foreground" />;
    case "queued":
      return <Clock className="h-3 w-3 text-muted-foreground" />;
    default:
      return null;
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString("en-IN", { weekday: "short" });
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const initials = getInitials(conversation.contact.name, conversation.contact.phoneE164);
  const preview = conversation.lastMessage?.content.text || "No messages yet";
  const isInbound = conversation.lastMessage?.direction === "inbound";

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100 dark:border-slate-700/50",
        isSelected
          ? "bg-teal-50 dark:bg-teal-950/20 border-l-2 border-l-teal-600"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-2 border-l-transparent"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold",
            conversation.unreadCount > 0
              ? "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200"
              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          )}
        >
          {initials}
        </div>
        {conversation.status === "open" && conversation.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-teal-600 text-[10px] font-bold text-white flex items-center justify-center px-1">
            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm truncate",
              conversation.unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"
            )}
          >
            {conversation.contact.name || conversation.contact.phoneE164}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
            {conversation.lastMessageAt ? formatTime(conversation.lastMessageAt) : ""}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {!isInbound && conversation.lastMessage && (
            <span className="shrink-0">{getStatusIcon(conversation.lastMessage.status)}</span>
          )}
          <p
            className={cn(
              "text-xs truncate",
              conversation.unreadCount > 0
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            )}
          >
            {preview}
          </p>
        </div>
        {/* Tags */}
        {conversation.contact.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {conversation.contact.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-3 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const filters =
    activeTab === "open"
      ? { status: "open" as const }
      : activeTab === "resolved"
      ? { status: "resolved" as const }
      : activeTab === "unassigned"
      ? { unassigned: true }
      : undefined;

  const { data, isLoading } = useConversations(filters);

  const conversations = (data?.data || []).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.contact.name && c.contact.name.toLowerCase().includes(q)) ||
      c.contact.phoneE164.includes(q) ||
      c.lastMessage?.content.text?.toLowerCase().includes(q)
    );
  });

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "unassigned", label: "Unassigned" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <div className="flex flex-col h-full border-r border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Inbox</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {conversations.length} conversations
          </span>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200"
                  : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ListSkeleton />
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <Filter className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No conversations found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Try a different filter or search term
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedId}
              onSelect={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
