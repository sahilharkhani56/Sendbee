"use client";

import { useDashboardConversations } from "@/hooks/use-dashboard";
import { MessageCircle, CheckCircle, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof MessageCircle;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export function ConversationStats() {
  const { data, isLoading } = useDashboardConversations();

  if (isLoading || !data) {
    return (
      <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 animate-pulse">
        <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 rounded bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Conversations
        </h3>
        <Link
          href="/inbox"
          className="text-xs text-teal-700 hover:text-teal-800 font-medium"
        >
          View all →
        </Link>
      </div>
      <div className="divide-y">
        <StatItem
          icon={MessageCircle}
          label="Open"
          value={data.open}
          color="text-blue-600"
        />
        <StatItem
          icon={CheckCircle}
          label="Resolved"
          value={data.resolved}
          color="text-green-600"
        />
        <StatItem
          icon={AlertCircle}
          label="New today"
          value={data.newToday}
          color="text-amber-600"
        />
        <StatItem
          icon={Eye}
          label="Unread"
          value={data.totalUnread}
          color="text-red-600"
        />
      </div>
    </div>
  );
}
