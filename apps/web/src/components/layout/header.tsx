"use client";

import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { useAuthStore } from "@/lib/auth";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/inbox": "Inbox",
  "/contacts": "Contacts",
  "/appointments": "Appointments",
  "/campaigns": "Campaigns",
  "/templates": "Templates",
  "/automations": "Automations",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Check prefix matches
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (path !== "/" && pathname.startsWith(path)) return title;
  }
  return "Dashboard";
}

export function Header() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const title = getPageTitle(pathname);

  function getInitials(name?: string | null) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-white dark:bg-slate-900 px-4 md:px-6 sticky top-0 z-10">
      {/* Page title */}
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      {/* Search bar - center */}
      <div className="hidden md:flex flex-1 justify-center max-w-md mx-auto">
        <button
          className="flex items-center gap-2 w-full max-w-[280px] h-9 rounded-md border bg-slate-50 dark:bg-slate-800 px-3 text-sm text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Search (Ctrl+K)"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-white dark:bg-slate-900 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications bell */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {/* Red dot for unread - hidden for now */}
          {/* <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" /> */}
        </button>

        {/* Avatar */}
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white md:hidden">
          {getInitials(user?.name)}
        </button>
      </div>
    </header>
  );
}
