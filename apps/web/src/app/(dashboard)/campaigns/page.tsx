"use client";

import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import {
  Plus,
  Search,
  Send,
  Pause,
  Play,
  XCircle,
  Eye,
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  MessageCircle,
  Filter,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCampaigns,
  useSendCampaign,
  usePauseCampaign,
  useCancelCampaign,
  type Campaign,
} from "@/hooks/use-campaigns";

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Campaign["status"], { label: string; color: string; dot: string }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300", dot: "bg-slate-400" },
  scheduled: { label: "Scheduled", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400", dot: "bg-purple-500" },
  sending: { label: "Sending", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400", dot: "bg-blue-500" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400", dot: "bg-green-500" },
  paused: { label: "Paused", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400", dot: "bg-amber-500" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400", dot: "bg-red-500" },
};

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", config.color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

function formatRate(num: number, denom: number): string {
  if (denom === 0) return "0%";
  return `${Math.round((num / denom) * 100)}%`;
}

// ─── Campaign Card ───────────────────────────────────────────────────────────

function CampaignRow({
  campaign,
  onSend,
  onPause,
  onCancel,
}: {
  campaign: Campaign;
  onSend: (id: string) => void;
  onPause: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-100 dark:border-slate-700/50">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/campaigns/${campaign.id}`}
            className="text-sm font-medium text-foreground hover:text-teal-700 transition-colors truncate"
          >
            {campaign.name}
          </Link>
          <StatusBadge status={campaign.status} />
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {campaign.templateName}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {campaign.totalContacts} contacts
          </span>
          {campaign.segmentTags.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              Tags: {campaign.segmentTags.join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Stats (desktop only) */}
      <div className="hidden md:flex items-center gap-4">
        {campaign.sentCount > 0 && (
          <>
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">{campaign.sentCount}</p>
              <p className="text-[9px] text-muted-foreground">Sent</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-green-600">{formatRate(campaign.deliveredCount, campaign.sentCount)}</p>
              <p className="text-[9px] text-muted-foreground">Delivered</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-blue-600">{formatRate(campaign.readCount, campaign.deliveredCount)}</p>
              <p className="text-[9px] text-muted-foreground">Read</p>
            </div>
          </>
        )}
      </div>

      {/* Date */}
      <div className="hidden lg:block text-xs text-muted-foreground w-20 text-right">
        {format(parseISO(campaign.createdAt), "MMM d, yy")}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {campaign.status === "draft" && (
          <button
            onClick={() => onSend(campaign.id)}
            className="p-1.5 rounded-md text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
        {campaign.status === "sending" && (
          <button
            onClick={() => onPause(campaign.id)}
            className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Pause"
          >
            <Pause className="h-4 w-4" />
          </button>
        )}
        {campaign.status === "paused" && (
          <button
            onClick={() => onSend(campaign.id)}
            className="p-1.5 rounded-md text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Resume"
          >
            <Play className="h-4 w-4" />
          </button>
        )}
        {(campaign.status === "sending" || campaign.status === "paused") && (
          <button
            onClick={() => onCancel(campaign.id)}
            className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Cancel"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
        <Link
          href={`/campaigns/${campaign.id}`}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data, isLoading } = useCampaigns();
  const { mutate: sendCampaign } = useSendCampaign();
  const { mutate: pauseCampaign } = usePauseCampaign();
  const { mutate: cancelCampaign } = useCancelCampaign();

  const campaigns = data?.data || [];

  const filtered = useMemo(() => {
    let result = [...campaigns];
    if (statusFilter) result = result.filter((c) => c.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.templateName.toLowerCase().includes(q));
    }
    return result;
  }, [campaigns, statusFilter, search]);

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "sending" || c.status === "scheduled").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sentCount, 0),
  }), [campaigns]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Campaigns</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Create and manage broadcast campaigns</p>
        </div>
        <Link
          href="/campaigns/new"
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors self-start"
        >
          <Plus className="h-3.5 w-3.5" /> New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Megaphone },
          { label: "Active", value: stats.active, icon: Send },
          { label: "Completed", value: stats.completed, icon: CheckCircle2 },
          { label: "Messages Sent", value: stats.totalSent.toLocaleString(), icon: MessageCircle },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border bg-white dark:bg-slate-800 p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-teal-50 dark:bg-teal-950/20 flex items-center justify-center shrink-0">
              <card.icon className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">{card.label}</p>
              <p className="text-lg font-bold text-foreground">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="sending">Sending</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Campaign list */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-48 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-64 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Megaphone className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">No campaigns yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first broadcast campaign</p>
            <Link
              href="/campaigns/new"
              className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700"
            >
              Create Campaign
            </Link>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <div className="flex-1">Campaign</div>
              <div className="flex items-center gap-4 w-[180px]">
                <div className="w-12 text-center">Sent</div>
                <div className="w-16 text-center">Delivered</div>
                <div className="w-12 text-center">Read</div>
              </div>
              <div className="w-20 text-right">Created</div>
              <div className="w-20" />
            </div>
            {filtered.map((c) => (
              <CampaignRow
                key={c.id}
                campaign={c}
                onSend={(id) => sendCampaign(id)}
                onPause={(id) => pauseCampaign(id)}
                onCancel={(id) => cancelCampaign(id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
