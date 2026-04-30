"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  MessageCircle,
  Eye,
  Edit3,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplates, type Template } from "@/hooks/use-campaigns";

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CFG: Record<Template["status"], { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400", icon: XCircle },
};

// ─── Phone Preview ───────────────────────────────────────────────────────────

function PhonePreview({ template }: { template: Template | null }) {
  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Smartphone className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-xs">Select a template to preview</p>
      </div>
    );
  }

  // Replace {{1}}, {{2}} with variable names
  let preview = template.body;
  template.variables.forEach((v, i) => {
    preview = preview.replace(`{{${i + 1}}}`, `[${v}]`);
  });

  return (
    <div className="flex flex-col items-center">
      {/* Phone mockup */}
      <div className="w-[260px] rounded-[32px] border-4 border-slate-800 dark:border-slate-600 bg-slate-800 p-1 shadow-xl">
        {/* Notch */}
        <div className="flex justify-center mb-1">
          <div className="h-4 w-20 rounded-b-xl bg-slate-800" />
        </div>
        {/* Screen */}
        <div className="rounded-[24px] bg-[#E5DDD5] dark:bg-[#0B141A] overflow-hidden">
          {/* Header */}
          <div className="bg-[#075E54] dark:bg-[#1F2C34] px-3 py-2 flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-white">Your Business</p>
              <p className="text-[8px] text-white/60">Business Account</p>
            </div>
          </div>
          {/* Message area */}
          <div className="p-3 min-h-[200px] flex flex-col justify-end">
            <div className="bg-white dark:bg-[#1F2C34] rounded-lg rounded-tl-none p-2.5 shadow-sm max-w-[200px]">
              <p className="text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {preview}
              </p>
              <p className="text-[8px] text-slate-400 text-right mt-1">
                10:30 AM ✓✓
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">Live WhatsApp Preview</p>
    </div>
  );
}

// ─── Template Card ───────────────────────────────────────────────────────────

function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const statusCfg = STATUS_CFG[template.status];
  const StatusIcon = statusCfg.icon;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all hover:shadow-sm",
        isSelected
          ? "border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/10 ring-1 ring-teal-200 dark:ring-teal-800"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{template.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium", statusCfg.color)}>
              <StatusIcon className="h-2.5 w-2.5" /> {statusCfg.label}
            </span>
            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
              {template.category}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{template.body}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-muted-foreground">
          {template.variables.length} variable{template.variables.length !== 1 ? "s" : ""}
        </span>
        <span className="text-[10px] text-muted-foreground">· {template.language.toUpperCase()}</span>
      </div>
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: templates, isLoading } = useTemplates();

  const filtered = useMemo(() => {
    let result = templates || [];
    if (statusFilter) result = result.filter((t) => t.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q));
    }
    return result;
  }, [templates, statusFilter, search]);

  const selectedTemplate = (templates || []).find((t) => t.id === selectedId) || null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Templates</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your WhatsApp message templates</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors self-start">
          <Plus className="h-3.5 w-3.5" /> New Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground"
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Split view: cards + preview */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Template grid */}
        <div>
          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-white dark:bg-slate-800 p-4 space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border rounded-xl bg-white dark:bg-slate-800">
              <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-foreground">No templates found</p>
              <p className="text-xs text-muted-foreground mt-1">Create a template to get started</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  isSelected={selectedId === tpl.id}
                  onSelect={() => setSelectedId(tpl.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Phone preview (desktop) */}
        <div className="hidden lg:flex flex-col items-center justify-start sticky top-20">
          <PhonePreview template={selectedTemplate} />
        </div>
      </div>
    </div>
  );
}
