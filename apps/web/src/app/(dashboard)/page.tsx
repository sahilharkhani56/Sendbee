import { MessageCircle, Users, CalendarDays, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiItem {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

const KPI_ITEMS: KpiItem[] = [
  { label: "Messages Today", value: "—", icon: MessageCircle, color: "text-teal-700" },
  { label: "Open Conversations", value: "—", icon: TrendingUp, color: "text-blue-700" },
  { label: "Today's Appointments", value: "—", icon: CalendarDays, color: "text-amber-700" },
  { label: "Total Contacts", value: "—", icon: Users, color: "text-green-700" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards placeholder */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_ITEMS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border bg-white dark:bg-slate-800 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts placeholder */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-6 h-64 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Message volume chart — Step 3</p>
        </div>
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-6 h-64 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Appointment chart — Step 3</p>
        </div>
      </div>
    </div>
  );
}
