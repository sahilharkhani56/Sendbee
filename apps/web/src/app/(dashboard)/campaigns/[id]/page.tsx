"use client";

import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Send,
  Pause,
  Play,
  XCircle,
  Users,
  MessageCircle,
  CheckCircle2,
  Eye,
  AlertTriangle,
  Clock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCampaignDetail,
  useCampaignLogs,
  useSendCampaign,
  usePauseCampaign,
  useCancelCampaign,
  type Campaign,
  type CampaignLog,
} from "@/hooks/use-campaigns";

const STATUS_CONFIG: Record<Campaign["status"], { label: string; color: string; dot: string }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  scheduled: { label: "Scheduled", color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  sending: { label: "Sending", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  paused: { label: "Paused", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

const LOG_STATUS_CONFIG: Record<CampaignLog["status"], { label: string; color: string }> = {
  queued: { label: "Queued", color: "text-slate-500" },
  sent: { label: "Sent", color: "text-blue-600" },
  delivered: { label: "Delivered", color: "text-teal-600" },
  read: { label: "Read", color: "text-green-600" },
  failed: { label: "Failed", color: "text-red-600" },
};

function formatRate(num: number, denom: number): string {
  if (denom === 0) return "0%";
  return `${Math.round((num / denom) * 100)}%`;
}

// ─── Funnel Bar ──────────────────────────────────────────────────────────────

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium text-foreground">{value} ({Math.round(pct)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const { data: campaign, isLoading } = useCampaignDetail(campaignId);
  const { data: logs, isLoading: logsLoading } = useCampaignLogs(campaignId);
  const { mutate: sendCampaign } = useSendCampaign();
  const { mutate: pauseCampaign } = usePauseCampaign();
  const { mutate: cancelCampaign } = useCancelCampaign();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-6 w-64 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-40 rounded-xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">Campaign not found</p>
        <button onClick={() => router.push("/campaigns")} className="mt-3 text-xs text-teal-700 font-medium">
          ← Back to campaigns
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[campaign.status];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => router.push("/campaigns")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Campaigns
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{campaign.name}</h1>
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", statusCfg.color)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {campaign.templateName}</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {campaign.totalContacts} contacts</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(parseISO(campaign.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {campaign.status === "draft" && (
            <button onClick={() => sendCampaign(campaignId)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white">
              <Send className="h-3.5 w-3.5" /> Send Now
            </button>
          )}
          {campaign.status === "sending" && (
            <button onClick={() => pauseCampaign(campaignId)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white">
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
          )}
          {campaign.status === "paused" && (
            <button onClick={() => sendCampaign(campaignId)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white">
              <Play className="h-3.5 w-3.5" /> Resume
            </button>
          )}
          {(campaign.status === "sending" || campaign.status === "paused") && (
            <button onClick={() => cancelCampaign(campaignId)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white">
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Delivery Funnel */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-600" /> Delivery Funnel
          </h3>
          <div className="space-y-3">
            <FunnelBar label="Sent" value={campaign.sentCount} total={campaign.totalContacts} color="bg-blue-500" />
            <FunnelBar label="Delivered" value={campaign.deliveredCount} total={campaign.sentCount} color="bg-teal-500" />
            <FunnelBar label="Read" value={campaign.readCount} total={campaign.deliveredCount} color="bg-green-500" />
            <FunnelBar label="Failed" value={campaign.failedCount} total={campaign.sentCount} color="bg-red-500" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Delivery Rate", value: formatRate(campaign.deliveredCount, campaign.sentCount), icon: CheckCircle2, color: "text-teal-600" },
              { label: "Read Rate", value: formatRate(campaign.readCount, campaign.deliveredCount), icon: Eye, color: "text-blue-600" },
              { label: "Failure Rate", value: formatRate(campaign.failedCount, campaign.sentCount), icon: AlertTriangle, color: "text-red-600" },
              { label: "Pending", value: (campaign.totalContacts - campaign.sentCount).toString(), icon: Clock, color: "text-amber-600" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                <stat.icon className={cn("h-5 w-5 shrink-0", stat.color)} />
                <div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-contact logs */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-foreground">Contact Delivery Log</h3>
        </div>

        {/* Header */}
        <div className="hidden md:grid grid-cols-[1fr_120px_100px_100px_100px_140px] gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b">
          <div>Contact</div>
          <div>Phone</div>
          <div>Status</div>
          <div>Sent</div>
          <div>Delivered</div>
          <div>Failure Reason</div>
        </div>

        {logsLoading ? (
          <div className="animate-pulse divide-y divide-slate-100 dark:divide-slate-700/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex gap-4">
                <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : (logs || []).length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No delivery logs yet</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-[400px] overflow-y-auto">
            {(logs || []).map((log) => {
              const logCfg = LOG_STATUS_CONFIG[log.status];
              return (
                <div key={log.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px_100px_100px_100px_140px] gap-1 md:gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs">
                  <div className="font-medium text-foreground">{log.contactName || "Unknown"}</div>
                  <div className="text-muted-foreground font-mono">{log.contactPhone}</div>
                  <div className={cn("font-medium", logCfg.color)}>{logCfg.label}</div>
                  <div className="text-muted-foreground">{log.sentAt ? format(parseISO(log.sentAt), "h:mm a") : "—"}</div>
                  <div className="text-muted-foreground">{log.deliveredAt ? format(parseISO(log.deliveredAt), "h:mm a") : "—"}</div>
                  <div className="text-red-500 text-[11px]">{log.failedReason || ""}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
