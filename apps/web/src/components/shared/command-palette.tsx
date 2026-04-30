"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  Users,
  CalendarDays,
  Megaphone,
  FileText,
  Settings,
  Zap,
  Search,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: typeof LayoutDashboard;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const items: CommandItem[] = [
    { id: "dashboard", label: "Go to Dashboard", category: "Navigation", icon: LayoutDashboard, action: () => router.push("/") },
    { id: "inbox", label: "Go to Inbox", category: "Navigation", icon: MessageCircle, action: () => router.push("/inbox") },
    { id: "contacts", label: "Go to Contacts", category: "Navigation", icon: Users, action: () => router.push("/contacts") },
    { id: "appointments", label: "Go to Appointments", category: "Navigation", icon: CalendarDays, action: () => router.push("/appointments") },
    { id: "campaigns", label: "Go to Campaigns", category: "Navigation", icon: Megaphone, action: () => router.push("/campaigns") },
    { id: "templates", label: "Go to Templates", category: "Navigation", icon: FileText, action: () => router.push("/templates") },
    { id: "automations", label: "Go to Automations", category: "Navigation", icon: Zap, action: () => router.push("/automations") },
    { id: "settings", label: "Go to Settings", category: "Navigation", icon: Settings, action: () => router.push("/settings") },
    { id: "new-contact", label: "Create New Contact", category: "Actions", icon: Users, action: () => router.push("/contacts") },
    { id: "new-campaign", label: "Create New Campaign", category: "Actions", icon: Megaphone, action: () => router.push("/campaigns/new") },
    { id: "book-appointment", label: "Book Appointment", category: "Actions", icon: CalendarDays, action: () => router.push("/appointments") },
  ];

  const filtered = query
    ? items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Arrow key navigation
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          setOpen(false);
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, filtered, selectedIndex]);

  // Reset index on filter change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, actions..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No results found</p>
          ) : (
            Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category} className="mb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">{category}</p>
                {categoryItems.map((item) => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { item.action(); setOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        idx === selectedIndex
                          ? "bg-teal-50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-100"
                          : "text-foreground hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      )}
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-[9px]">↑↓</kbd> Navigate
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-[9px]">↵</kbd> Select
          </span>
        </div>
      </div>
    </div>
  );
}
