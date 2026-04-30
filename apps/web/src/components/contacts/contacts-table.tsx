"use client";

import { useState, useMemo } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Search,
  Plus,
  Upload,
  MessageCircle,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  X,
  UserPlus,
  Tag,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContacts, useDeleteContact, type Contact } from "@/hooks/use-contacts";
import Link from "next/link";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string | null, phone: string): string {
  if (name) return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return phone.slice(-2);
}

function formatPhone(phone: string): string {
  if (phone.startsWith("+91") && phone.length === 13) {
    const digits = phone.slice(3);
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
}

function formatRelativeTime(date: string | null): string {
  if (!date) return "Never";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// ─── All unique tags from data ───────────────────────────────────────────────

function extractTags(contacts: Contact[]): string[] {
  const tags = new Set<string>();
  contacts.forEach((c) => c.tags.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-700">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

// ─── Contact Row ─────────────────────────────────────────────────────────────

function ContactRow({
  contact,
  onDelete,
}: {
  contact: Contact;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const initials = getInitials(contact.name, contact.phoneE164);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(contact.phoneE164);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-100 dark:border-slate-700/50"
    >
      {/* Avatar */}
      <div
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
          contact.optOut
            ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            : "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200"
        )}
      >
        {initials}
      </div>

      {/* Name + phone */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {contact.name || "Unknown"}
          </span>
          {contact.optOut && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="h-2.5 w-2.5" /> Opted out
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <button
            onClick={handleCopy}
            className="text-xs text-muted-foreground font-mono hover:text-foreground transition-colors flex items-center gap-1"
          >
            {formatPhone(contact.phoneE164)}
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="hidden md:flex items-center gap-1 max-w-[200px]">
        {contact.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-muted-foreground whitespace-nowrap"
          >
            {tag}
          </span>
        ))}
        {contact.tags.length > 2 && (
          <span className="text-[10px] text-muted-foreground">+{contact.tags.length - 2}</span>
        )}
      </div>

      {/* Last Contact */}
      <div className="hidden lg:block text-xs text-muted-foreground w-24 text-right">
        {formatRelativeTime(contact.lastContactedAt)}
      </div>

      {/* Created */}
      <div className="hidden xl:block text-xs text-muted-foreground w-20 text-right">
        {format(new Date(contact.createdAt), "MMM d, yy")}
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="p-1.5 rounded-md text-muted-foreground hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
          title="Open chat"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (confirm(`Delete ${contact.name || contact.phoneE164}?`)) {
              onDelete(contact.id);
            }
          }}
          className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </Link>
  );
}

// ─── Mobile Card ─────────────────────────────────────────────────────────────

function ContactCard({ contact, onDelete }: { contact: Contact; onDelete: (id: string) => void }) {
  const initials = getInitials(contact.name, contact.phoneE164);

  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-slate-800 hover:shadow-sm transition-shadow"
    >
      <div
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
          contact.optOut
            ? "bg-red-100 text-red-700"
            : "bg-teal-100 text-teal-800"
        )}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {contact.name || "Unknown"}
        </p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          {formatPhone(contact.phoneE164)}
        </p>
        {contact.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {contact.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-700 text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] text-muted-foreground">
          {formatRelativeTime(contact.lastContactedAt)}
        </p>
        {contact.optOut && (
          <span className="text-[9px] font-medium text-red-600">Opted out</span>
        )}
      </div>
    </Link>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ContactsTable() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const { data, isLoading } = useContacts({
    search: search || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  });
  const { mutate: deleteContact } = useDeleteContact();

  const contacts = data?.data || [];
  const allTags = useMemo(() => extractTags(contacts), [contacts]);
  const total = data?.pagination?.total ?? contacts.length;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts by name, phone, or email..."
            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Filter + Actions */}
        <div className="flex items-center gap-2">
          {/* Tag filter */}
          <div className="relative">
            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors",
                selectedTags.length > 0
                  ? "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-950/30 dark:text-teal-300"
                  : "border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <Tag className="h-3.5 w-3.5" />
              Tags
              {selectedTags.length > 0 && (
                <span className="bg-teal-600 text-white text-[10px] rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                  {selectedTags.length}
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </button>

            {showTagFilter && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 p-2">
                {allTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">No tags found</p>
                ) : (
                  allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div
                        className={cn(
                          "h-3.5 w-3.5 rounded border flex items-center justify-center",
                          selectedTags.includes(tag)
                            ? "bg-teal-600 border-teal-600"
                            : "border-slate-300 dark:border-slate-600"
                        )}
                      >
                        {selectedTags.includes(tag) && (
                          <Check className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                      {tag}
                    </button>
                  ))
                )}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="w-full text-xs text-red-600 py-1.5 mt-1 border-t border-slate-200 dark:border-slate-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* View toggle (mobile) */}
          <div className="md:hidden flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={cn("px-2.5 py-2", viewMode === "table" ? "bg-slate-100 dark:bg-slate-700" : "")}
            >
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={cn("px-2.5 py-2", viewMode === "cards" ? "bg-slate-100 dark:bg-slate-700" : "")}
            >
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
            </button>
          </div>

          {/* Import */}
          <button className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Add Contact */}
          <button className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Contact</span>
          </button>
        </div>
      </div>

      {/* Selected tags chips */}
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          {selectedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
            >
              {tag}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {total} contact{total !== 1 ? "s" : ""}
      </p>

      {/* Table / Cards */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
              <UserPlus className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-foreground">No contacts yet</p>
            <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
              Import from CSV or add contacts manually to get started
            </p>
            <div className="flex gap-2 mt-4">
              <button className="px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700">
                Import CSV
              </button>
              <button className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800">
                Add manually
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <div className="w-9" /> {/* avatar space */}
              <div className="flex-1">Contact</div>
              <div className="w-[200px]">Tags</div>
              <div className="hidden lg:block w-24 text-right">Last Contact</div>
              <div className="hidden xl:block w-20 text-right">Created</div>
              <div className="w-16" /> {/* actions */}
            </div>

            {/* Desktop rows / Mobile cards */}
            <div className={cn(viewMode === "cards" ? "md:hidden" : "hidden md:block")}>
              {/* Mobile card view */}
              <div className="p-3 grid gap-2">
                {contacts.map((c) => (
                  <ContactCard key={c.id} contact={c} onDelete={(id) => deleteContact(id)} />
                ))}
              </div>
            </div>

            <div className={cn(viewMode === "table" ? "" : "hidden md:block")}>
              {contacts.map((c) => (
                <ContactRow key={c.id} contact={c} onDelete={(id) => deleteContact(id)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
