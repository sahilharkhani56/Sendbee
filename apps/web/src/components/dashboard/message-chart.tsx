"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useDashboardMessages } from "@/hooks/use-dashboard";

function ChartSkeleton() {
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 p-6 animate-pulse">
      <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700 mb-6" />
      <div className="h-[280px] flex items-end gap-3 px-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-slate-200 dark:bg-slate-700"
              style={{ height: `${40 + Math.random() * 60}%` }}
            />
            <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-700 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MessageChart() {
  const { data, isLoading } = useDashboardMessages();

  if (isLoading || !data) return <ChartSkeleton />;

  const chartData = data.days.map((day) => ({
    name: format(parseISO(day.date), "EEE"),
    date: format(parseISO(day.date), "MMM d"),
    Inbound: day.inbound,
    Outbound: day.outbound,
  }));

  const totalMessages = data.days.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Message Volume
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last 7 days · {totalMessages.toLocaleString("en-IN")} total
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-teal-500" />
            Inbound
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
            Outbound
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            width={35}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.date || ""
            }
          />
          <Bar
            dataKey="Inbound"
            fill="#0d9488"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="Outbound"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
