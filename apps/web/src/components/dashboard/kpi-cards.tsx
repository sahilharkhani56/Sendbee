"use client";

import {
  MessageCircle,
  Users,
  CalendarDays,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDashboardOverview } from "@/hooks/use-dashboard";

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend?: "up" | "down" | "neutral";
  trendText?: string;
}

function KpiCard({
  label,
  value,
  subValue,
  icon: Icon,
  color,
  bgColor,
  trend,
  trendText,
}: KpiCardProps) {
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      {trend && trendText && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend === "up" && (
            <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
          )}
          {trend === "down" && (
            <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
          )}
          <span
            className={
              trend === "up"
                ? "font-medium text-green-600"
                : trend === "down"
                ? "font-medium text-red-600"
                : "text-muted-foreground"
            }
          >
            {trendText}
          </span>
        </div>
      )}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-7 w-16 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

export function KpiCards() {
  const { data, isLoading } = useDashboardOverview();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards: KpiCardProps[] = [
    {
      label: "Messages Today",
      value: data.messages.total.toLocaleString("en-IN"),
      subValue: `${data.messages.inbound} in · ${data.messages.outbound} out`,
      icon: MessageCircle,
      color: "text-teal-700",
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      trend: "up",
      trendText: `${data.messages.inbound} inbound today`,
    },
    {
      label: "Open Conversations",
      value: data.conversations.open,
      subValue: `${data.conversations.total.toLocaleString("en-IN")} total`,
      icon: TrendingUp,
      color: "text-blue-700",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      trend: data.conversations.open > 20 ? "up" : "neutral",
      trendText: `${data.conversations.open} need attention`,
    },
    {
      label: "Today's Appointments",
      value: data.appointments.today,
      subValue: `${data.appointments.byStatus.confirmed} confirmed · ${data.appointments.byStatus.completed} done`,
      icon: CalendarDays,
      color: "text-amber-700",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      trend: data.appointments.byStatus.no_show > 0 ? "down" : "neutral",
      trendText:
        data.appointments.byStatus.no_show > 0
          ? `${data.appointments.byStatus.no_show} no-show`
          : "All on track",
    },
    {
      label: "Total Contacts",
      value: data.contacts.total.toLocaleString("en-IN"),
      subValue: `+${data.contacts.newToday} today`,
      icon: Users,
      color: "text-green-700",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      trend: data.contacts.newToday > 0 ? "up" : "neutral",
      trendText: `${data.contacts.newToday} new contacts`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
