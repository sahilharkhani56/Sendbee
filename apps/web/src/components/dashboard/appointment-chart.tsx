"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useDashboardAppointments } from "@/hooks/use-dashboard";

const STATUS_COLORS: Record<string, string> = {
  Confirmed: "#0d9488",
  Completed: "#16a34a",
  Cancelled: "#dc2626",
  "No-show": "#d97706",
};

function ChartSkeleton() {
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 p-6 animate-pulse">
      <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700 mb-6" />
      <div className="flex items-center justify-center">
        <div className="h-[200px] w-[200px] rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

export function AppointmentChart() {
  const { data, isLoading } = useDashboardAppointments();

  if (isLoading || !data) return <ChartSkeleton />;

  const chartData = [
    { name: "Confirmed", value: data.today.confirmed },
    { name: "Completed", value: data.today.completed },
    { name: "Cancelled", value: data.today.cancelled },
    { name: "No-show", value: data.today.no_show },
  ].filter((d) => d.value > 0);

  const total =
    data.today.confirmed +
    data.today.completed +
    data.today.cancelled +
    data.today.no_show;

  const hasData = total > 0;

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Today's Appointments
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total} total · {data.upcomingConfirmed} upcoming this week
          </p>
        </div>
      </div>

      {hasData ? (
        <div className="flex items-center gap-6">
          <div className="relative">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{total}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Today</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2.5 flex-1 min-w-0">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[item.name] }}
                  />
                  <span className="text-xs text-muted-foreground truncate">
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-medium text-foreground tabular-nums">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[180px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No appointments today
          </p>
        </div>
      )}
    </div>
  );
}
