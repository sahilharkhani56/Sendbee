"use client";

import { Plus, Send, CalendarPlus, Upload } from "lucide-react";
import Link from "next/link";

const ACTIONS = [
  {
    label: "New Contact",
    icon: Plus,
    href: "/contacts?action=new",
    color: "text-teal-700 bg-teal-50 dark:bg-teal-950/30",
  },
  {
    label: "Send Broadcast",
    icon: Send,
    href: "/campaigns?action=new",
    color: "text-blue-700 bg-blue-50 dark:bg-blue-950/30",
  },
  {
    label: "Book Appointment",
    icon: CalendarPlus,
    href: "/appointments?action=book",
    color: "text-amber-700 bg-amber-50 dark:bg-amber-950/30",
  },
  {
    label: "Import CSV",
    icon: Upload,
    href: "/contacts?action=import",
    color: "text-purple-700 bg-purple-50 dark:bg-purple-950/30",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <div className={`rounded-lg p-2 ${action.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-foreground">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
