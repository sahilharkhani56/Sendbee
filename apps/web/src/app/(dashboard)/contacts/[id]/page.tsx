"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  CalendarPlus,
  StickyNote,
  Tag,
  CheckCheck,
  AlertCircle,
  Calendar,
  UserPlus,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContactDetail, useContactTimeline, type TimelineEvent } from "@/hooks/use-contacts";

// ─── Timeline Item ───────────────────────────────────────────────────────────

function TimelineItem({ event }: { event: TimelineEvent }) {
  const time = format(new Date(event.createdAt), "MMM d, h:mm a");

  const configs: Record<string, { icon: typeof MessageCircle; color: string; bgColor: string }> = {
    message: {
      icon: MessageCircle,
      color:
        (event.content as { direction?: string }).direction === "inbound"
          ? "text-blue-600"
          : "text-teal-600",
      bgColor:
        (event.content as { direction?: string }).direction === "inbound"
          ? "bg-blue-100 dark:bg-blue-950/30"
          : "bg-teal-100 dark:bg-teal-950/30",
    },
    appointment: { icon: Calendar, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-950/30" },
    note: { icon: StickyNote, color: "text-slate-500", bgColor: "bg-slate-100 dark:bg-slate-700" },
    contact_created: { icon: UserPlus, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-950/30" },
  };

  const config = configs[event.type] || configs.note;
  const Icon = config.icon;

  const renderContent = () => {
    switch (event.type) {
      case "message": {
        const c = event.content as { direction: string; text: string };
        return (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {c.direction === "inbound" ? "Received" : "Sent"}:
            </span>{" "}
            {c.text}
          </p>
        );
      }
      case "appointment": {
        const c = event.content as { provider: string; status: string; time: string };
        return (
          <p className="text-xs text-muted-foreground">
            Appointment with{" "}
            <span className="font-medium text-foreground">{c.provider}</span>{" "}
            — <span className={cn(
              "font-medium",
              c.status === "completed" ? "text-green-600" :
              c.status === "confirmed" ? "text-blue-600" :
              c.status === "cancelled" ? "text-red-600" : ""
            )}>{c.status}</span>
          </p>
        );
      }
      case "note": {
        const c = event.content as { text: string; author?: string };
        return (
          <p className="text-xs text-muted-foreground italic">
            📝 {c.text}
            {c.author && <span className="not-italic ml-1">— {c.author}</span>}
          </p>
        );
      }
      case "contact_created":
        return <p className="text-xs text-muted-foreground">Contact was created</p>;
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-3">
      {/* Icon + line */}
      <div className="flex flex-col items-center">
        <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0", config.bgColor)}>
          <Icon className={cn("h-3.5 w-3.5", config.color)} />
        </div>
        <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />
      </div>
      {/* Content */}
      <div className="pb-5 min-w-0 flex-1">
        {renderContent()}
        <p className="text-[10px] text-muted-foreground/70 mt-1">{time}</p>
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type TabKey = "overview" | "timeline" | "appointments" | "notes";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "timeline", label: "Timeline" },
  { key: "appointments", label: "Appointments" },
  { key: "notes", label: "Notes" },
];

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [copied, setCopied] = useState(false);

  const contactId = params.id as string;
  const { data: contact, isLoading } = useContactDetail(contactId);
  const { data: timelineData, isLoading: timelineLoading } = useContactTimeline(
    activeTab === "timeline" ? contactId : null
  );

  const handleCopy = () => {
    if (contact) {
      navigator.clipboard.writeText(contact.phoneE164);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Contact not found</p>
        <button
          onClick={() => router.push("/contacts")}
          className="mt-3 text-xs text-teal-700 hover:text-teal-800 font-medium"
        >
          ← Back to contacts
        </button>
      </div>
    );
  }

  const initials = contact.name
    ? contact.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : contact.phoneE164.slice(-2);

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/contacts")}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Contacts
      </button>

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div
          className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold shrink-0",
            contact.optOut
              ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
              : "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200"
          )}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-foreground">
              {contact.name || "Unknown Contact"}
            </h1>
            {contact.optOut && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="h-3 w-3" /> Do Not Contact
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground font-mono hover:text-foreground transition-colors"
          >
            {contact.phoneE164}
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          {contact.city && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {contact.city}{contact.state ? `, ${contact.state}` : ""}
            </div>
          )}
          {/* Tags */}
          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors">
            <MessageCircle className="h-3.5 w-3.5" /> Open Chat
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <CalendarPlus className="h-3.5 w-3.5" /> Book
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "border-teal-600 text-teal-700 dark:text-teal-400"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Info */}
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Phone</p>
                  <p className="text-sm text-foreground font-mono">{contact.phoneE164}</p>
                </div>
              </div>
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground">{contact.email}</p>
                  </div>
                </div>
              )}
              {contact.city && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Location</p>
                    <p className="text-sm text-foreground">
                      {contact.city}{contact.state ? `, ${contact.state}` : ""}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Created</p>
                  <p className="text-sm text-foreground">
                    {format(new Date(contact.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              {contact.lastContactedAt && (
                <div className="flex items-center gap-3">
                  <CheckCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Last Contact</p>
                    <p className="text-sm text-foreground">
                      {format(new Date(contact.lastContactedAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Notes</h3>
            {contact.notes ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{contact.notes}</p>
            ) : (
              <p className="text-xs text-muted-foreground/60">No notes yet</p>
            )}
            <button className="text-xs text-teal-700 hover:text-teal-800 font-medium">
              + Add note
            </button>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="max-w-2xl">
          {timelineLoading ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-48 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : timelineData && timelineData.data.length > 0 ? (
            <div>
              {timelineData.data.map((event, i) => (
                <TimelineItem key={i} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No timeline events yet
            </p>
          )}
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-5">
          <div className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No appointments</p>
            <button className="mt-3 text-xs text-teal-700 hover:text-teal-800 font-medium">
              Book appointment →
            </button>
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-4">
            <textarea
              placeholder="Add a note about this contact..."
              className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors">
                Save Note
              </button>
            </div>
          </div>
          {contact.notes && (
            <div className="rounded-xl border bg-white dark:bg-slate-800 p-4">
              <p className="text-sm text-foreground leading-relaxed">{contact.notes}</p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Last updated {format(new Date(contact.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
