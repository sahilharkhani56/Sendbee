"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Users,
  MessageCircle,
  Tag,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplates, useCreateCampaign, type Template } from "@/hooks/use-campaigns";

const AVAILABLE_TAGS = ["active", "premium", "new", "inactive-90d", "visited-last-30d", "due-checkup", "all"];

type Step = 1 | 2 | 3 | 4;

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [scheduleLater, setScheduleLater] = useState(false);

  const { data: templates } = useTemplates("approved");
  const { mutate: createCampaign, isPending } = useCreateCampaign();

  const selectedTpl = (templates || []).find((t) => t.id === selectedTemplate);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedTags.length > 0;
      case 2: return !!selectedTemplate;
      case 3: return true; // schedule step
      case 4: return !!name.trim();
    }
  };

  const handleCreate = () => {
    if (!selectedTemplate || !name.trim()) return;
    createCampaign(
      { name, templateId: selectedTemplate, segmentTags: selectedTags },
      { onSuccess: () => router.push("/campaigns") }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => router.push("/campaigns")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Campaigns
      </button>

      <div>
        <h1 className="text-lg font-semibold text-foreground">Create Campaign</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Set up a new broadcast campaign in 4 steps</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={cn("h-1 flex-1 rounded-full", s <= step ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-700")} />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Step {step}/4 — {step === 1 ? "Select Audience" : step === 2 ? "Choose Template" : step === 3 ? "Schedule" : "Review & Create"}
      </p>

      {/* Content */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 p-6 min-h-[300px]">
        {/* Step 1: Audience */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" /> Select Audience Tags
            </h2>
            <p className="text-xs text-muted-foreground">Choose which contact tags to include in this campaign</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                    selectedTags.includes(tag)
                      ? "bg-teal-50 dark:bg-teal-950/20 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300"
                      : "border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-slate-50"
                  )}
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                  {selectedTags.includes(tag) && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-xs text-teal-600 font-medium">
                {selectedTags.length} tag{selectedTags.length > 1 ? "s" : ""} selected — estimated ~{selectedTags.length * 80} contacts
              </p>
            )}
          </div>
        )}

        {/* Step 2: Template */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-teal-600" /> Choose Message Template
            </h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {(templates || []).map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selectedTemplate === tpl.id
                      ? "bg-teal-50 dark:bg-teal-950/20 border-teal-300 dark:border-teal-700"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-200 dark:border-slate-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{tpl.name}</p>
                    {selectedTemplate === tpl.id && <Check className="h-4 w-4 text-teal-600" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.body}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{tpl.category}</span>
                    <span className="text-[10px] text-muted-foreground">{tpl.variables.length} variable{tpl.variables.length !== 1 ? "s" : ""}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">When to Send</h2>
            <div className="space-y-2">
              <button
                onClick={() => setScheduleLater(false)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-colors",
                  !scheduleLater ? "bg-teal-50 border-teal-300" : "hover:bg-slate-50 border-slate-200"
                )}
              >
                <p className="text-sm font-medium text-foreground">Send Immediately</p>
                <p className="text-xs text-muted-foreground mt-0.5">Campaign will be sent as soon as you create it</p>
              </button>
              <button
                onClick={() => setScheduleLater(true)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-colors",
                  scheduleLater ? "bg-teal-50 border-teal-300" : "hover:bg-slate-50 border-slate-200"
                )}
              >
                <p className="text-sm font-medium text-foreground">Save as Draft</p>
                <p className="text-xs text-muted-foreground mt-0.5">Create the campaign without sending — you can send later</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-teal-600" /> Review & Create
            </h2>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Campaign Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Diwali Offer 2025"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                autoFocus
              />
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/30 p-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground text-xs">Audience</span><span className="text-foreground text-xs font-medium">{selectedTags.join(", ")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground text-xs">Template</span><span className="text-foreground text-xs font-medium">{selectedTpl?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground text-xs">Action</span><span className="text-foreground text-xs font-medium">{scheduleLater ? "Save as Draft" : "Send Immediately"}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 1 ? setStep((s) => (s - 1) as Step) : router.push("/campaigns")}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> {step > 1 ? "Back" : "Cancel"}
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!canProceed()}
            className={cn(
              "flex items-center gap-1 px-4 py-2 text-xs font-medium rounded-lg transition-colors",
              canProceed() ? "bg-teal-600 hover:bg-teal-700 text-white" : "bg-slate-200 text-muted-foreground cursor-not-allowed"
            )}
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={isPending || !name.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Campaign"}
          </button>
        )}
      </div>
    </div>
  );
}
