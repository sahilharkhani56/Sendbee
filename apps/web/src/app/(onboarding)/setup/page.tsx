"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MessageCircle,
  Users,
  ChevronRight,
  ChevronLeft,
  Check,
  Phone,
  Key,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const VERTICALS = [
  { value: "clinic", label: "Clinic / Hospital", emoji: "🏥" },
  { value: "salon", label: "Salon / Spa", emoji: "💇" },
  { value: "gym", label: "Gym / Fitness", emoji: "🏋️" },
  { value: "education", label: "Coaching / Education", emoji: "📚" },
  { value: "restaurant", label: "Restaurant / Café", emoji: "🍽️" },
  { value: "generic", label: "Other Business", emoji: "🏢" },
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST, UTC+5:30)" },
  { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)" },
  { value: "Asia/Singapore", label: "Singapore (SGT, UTC+8)" },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const [businessName, setBusinessName] = useState("");
  const [vertical, setVertical] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const [phoneId, setPhoneId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [skipWa, setSkipWa] = useState(false);

  const [invites, setInvites] = useState<{ phone: string; role: string }[]>([
    { phone: "", role: "staff" },
  ]);

  const canProceed = () => {
    switch (step) {
      case 1: return businessName.trim().length >= 2 && !!vertical;
      case 2: return skipWa || (phoneId.trim().length > 5 && accessToken.trim().length > 10);
      case 3: return true;
    }
  };

  const handleComplete = () => {
    router.push("/");
  };

  const addInvite = () => {
    setInvites((prev) => [...prev, { phone: "", role: "staff" }]);
  };

  const updateInvite = (index: number, field: "phone" | "role", value: string) => {
    setInvites((prev) => prev.map((inv, i) => i === index ? { ...inv, [field]: value } : inv));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to Sendbee</h1>
          </div>
          <p className="text-sm text-muted-foreground">Let&apos;s set up your workspace in a few steps</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { step: 1, icon: Building2, label: "Business" },
            { step: 2, icon: MessageCircle, label: "WhatsApp" },
            { step: 3, icon: Users, label: "Team" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center">
              {i > 0 && <div className={cn("w-8 h-0.5 mx-1", s.step <= step ? "bg-teal-500" : "bg-slate-200 dark:bg-slate-700")} />}
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                s.step === step ? "bg-teal-600 text-white" :
                s.step < step ? "bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400" :
                "bg-slate-100 dark:bg-slate-700 text-muted-foreground"
              )}>
                {s.step < step ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-white dark:bg-slate-800 shadow-sm p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Business Details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Tell us about your business</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Smile Dental Clinic"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Business Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {VERTICALS.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => setVertical(v.value)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-lg border text-left transition-colors",
                        vertical === v.value
                          ? "bg-teal-50 dark:bg-teal-950/20 border-teal-300 dark:border-teal-700"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-200 dark:border-slate-700"
                      )}
                    >
                      <span className="text-lg">{v.emoji}</span>
                      <span className="text-xs font-medium text-foreground">{v.label}</span>
                      {vertical === v.value && <Check className="h-3.5 w-3.5 text-teal-600 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Connect WhatsApp</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Link your WhatsApp Business account</p>
              </div>
              {!skipWa ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone Number ID
                    </label>
                    <input
                      type="text"
                      value={phoneId}
                      onChange={(e) => setPhoneId(e.target.value)}
                      placeholder="e.g., 123456789012345"
                      className="w-full px-3 py-2.5 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Found in Meta Business Suite → WhatsApp Manager</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Key className="h-3 w-3" /> Access Token
                    </label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Permanent access token"
                      className="w-full px-3 py-2.5 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    You can connect WhatsApp later from Settings → WhatsApp.
                  </p>
                </div>
              )}
              <button onClick={() => setSkipWa(!skipWa)} className="text-xs text-muted-foreground hover:text-foreground">
                {skipWa ? "← I want to connect now" : "Skip for now →"}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Invite Your Team</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Add team members (optional — you can do this later)</p>
              </div>
              <div className="space-y-3">
                {invites.map((inv, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">+91</span>
                      <input
                        type="tel"
                        value={inv.phone}
                        onChange={(e) => updateInvite(i, "phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                    <select
                      value={inv.role}
                      onChange={(e) => updateInvite(i, "role", e.target.value)}
                      className="px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={addInvite} className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium">
                <UserPlus className="h-3.5 w-3.5" /> Add another member
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => step > 1 ? setStep((s) => (s - 1) as Step) : null}
            className={cn("flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-white dark:hover:bg-slate-800 transition-colors", step === 1 && "invisible")}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={!canProceed()}
              className={cn(
                "flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium rounded-lg transition-colors",
                canProceed() ? "bg-teal-600 hover:bg-teal-700 text-white" : "bg-slate-200 text-muted-foreground cursor-not-allowed"
              )}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" /> Launch Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
