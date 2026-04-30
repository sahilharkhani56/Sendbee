"use client";

import { useState } from "react";
import {
  Zap,
  Plus,
  Search,
  MoreVertical,
  MessageCircle,
  Tag,
  UserPlus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types & Mock Data ───────────────────────────────────────────────────────

interface AutomationRule {
  id: string;
  name: string;
  keywords: string[];
  actions: { type: "reply" | "tag" | "assign"; value: string }[];
  active: boolean;
  priority: number;
  triggeredCount: number;
}

const MOCK_RULES: AutomationRule[] = [
  {
    id: "ar-1",
    name: "Auto-reply Hours",
    keywords: ["hours", "timing", "open"],
    actions: [{ type: "reply", value: "We are open Mon-Sat, 9 AM to 6 PM." }],
    active: true,
    priority: 1,
    triggeredCount: 142,
  },
  {
    id: "ar-2",
    name: "Book Appointment Trigger",
    keywords: ["book", "appointment", "schedule"],
    actions: [
      { type: "reply", value: "I'd love to help you book! Please call us or reply with your preferred date." },
      { type: "tag", value: "interested" },
    ],
    active: true,
    priority: 2,
    triggeredCount: 89,
  },
  {
    id: "ar-3",
    name: "New Lead Tagger",
    keywords: ["pricing", "cost", "how much"],
    actions: [
      { type: "tag", value: "hot-lead" },
      { type: "assign", value: "Priya Sharma" },
    ],
    active: true,
    priority: 3,
    triggeredCount: 56,
  },
  {
    id: "ar-4",
    name: "Stop / Opt-out",
    keywords: ["stop", "unsubscribe", "opt out"],
    actions: [{ type: "reply", value: "You've been unsubscribed. Reply START to re-subscribe." }],
    active: false,
    priority: 4,
    triggeredCount: 12,
  },
];

const ACTION_ICONS = { reply: MessageCircle, tag: Tag, assign: UserPlus };

// ─── Create/Edit Dialog ──────────────────────────────────────────────────────

function RuleDialog({
  rule,
  onClose,
}: {
  rule?: AutomationRule | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(rule?.name || "");
  const [keywords, setKeywords] = useState<string[]>(rule?.keywords || []);
  const [keywordInput, setKeywordInput] = useState("");
  const [actions, setActions] = useState(rule?.actions || [{ type: "reply" as const, value: "" }]);

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{rule ? "Edit Rule" : "Create Automation Rule"}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Rule Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Auto-reply Hours"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Trigger Keywords</label>
          <div className="flex gap-2">
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              placeholder="Type and press Enter"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <button onClick={addKeyword} className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
              Add
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {keywords.map((kw) => (
                <span key={kw} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-[11px]">
                  {kw}
                  <button onClick={() => setKeywords(keywords.filter((k) => k !== kw))} className="hover:text-red-500">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Actions</label>
          <div className="space-y-2">
            {actions.map((action, i) => (
              <div key={i} className="flex gap-2">
                <select
                  value={action.type}
                  onChange={(e) => {
                    const updated = [...actions];
                    updated[i] = { ...updated[i], type: e.target.value as "reply" | "tag" | "assign" };
                    setActions(updated);
                  }}
                  className="px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="reply">Auto Reply</option>
                  <option value="tag">Add Tag</option>
                  <option value="assign">Assign To</option>
                </select>
                <input
                  value={action.value}
                  onChange={(e) => {
                    const updated = [...actions];
                    updated[i] = { ...updated[i], value: e.target.value };
                    setActions(updated);
                  }}
                  placeholder={action.type === "reply" ? "Reply message..." : action.type === "tag" ? "Tag name..." : "Team member..."}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => setActions([...actions, { type: "reply", value: "" }])}
            className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            + Add Action
          </button>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white">
            {rule ? "Save Changes" : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [rules] = useState<AutomationRule[]>(MOCK_RULES);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const filtered = search
    ? rules.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.keywords.some((k) => k.includes(search.toLowerCase())))
    : rules;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Automations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Keyword triggers that auto-reply, tag, or assign conversations</p>
        </div>
        <button
          onClick={() => { setEditingRule(null); setDialogOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="h-3.5 w-3.5" /> New Rule
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rules or keywords..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {filtered.map((rule) => (
          <div
            key={rule.id}
            className={cn(
              "rounded-xl border bg-white dark:bg-slate-800 p-4 transition-colors",
              !rule.active && "opacity-60"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                rule.active ? "bg-teal-100 dark:bg-teal-900/40" : "bg-slate-100 dark:bg-slate-700"
              )}>
                <Zap className={cn("h-4 w-4", rule.active ? "text-teal-600" : "text-slate-400")} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{rule.name}</h3>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                    rule.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  )}>
                    {rule.active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {rule.keywords.map((kw) => (
                    <span key={kw} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[11px] text-muted-foreground font-mono">
                      &quot;{kw}&quot;
                    </span>
                  ))}
                </div>

                {/* Actions Summary */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {rule.actions.map((action, i) => {
                    const Icon = ACTION_ICONS[action.type];
                    return (
                      <span key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Icon className="h-3 w-3" />
                        <span className="capitalize">{action.type}:</span>
                        <span className="text-foreground truncate max-w-[120px]">{action.value}</span>
                      </span>
                    );
                  })}
                </div>

                <p className="text-[10px] text-muted-foreground mt-2">Triggered {rule.triggeredCount} times</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditingRule(rule); setDialogOpen(true); }}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-600 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Zap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No automation rules found</p>
          </div>
        )}
      </div>

      {/* Dialog */}
      {dialogOpen && <RuleDialog rule={editingRule} onClose={() => setDialogOpen(false)} />}
    </div>
  );
}
