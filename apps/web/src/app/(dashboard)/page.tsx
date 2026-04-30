"use client";

import { KpiCards } from "@/components/dashboard/kpi-cards";
import { MessageChart } from "@/components/dashboard/message-chart";
import { AppointmentChart } from "@/components/dashboard/appointment-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ConversationStats } from "@/components/dashboard/conversation-stats";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCards />

      {/* Charts Row */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Message volume — takes more space */}
        <div className="lg:col-span-3">
          <MessageChart />
        </div>
        {/* Appointment donut */}
        <div className="lg:col-span-2">
          <AppointmentChart />
        </div>
      </div>

      {/* Bottom Row — Quick Actions + Conversation Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <QuickActions />
        <ConversationStats />
      </div>
    </div>
  );
}
