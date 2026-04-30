"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DashboardOverview {
  date: string;
  messages: { total: number; inbound: number; outbound: number };
  conversations: { open: number; total: number };
  appointments: {
    today: number;
    byStatus: { confirmed: number; completed: number; cancelled: number; no_show: number };
  };
  contacts: { total: number; newToday: number };
}

export interface MessageDay {
  date: string;
  total: number;
  inbound: number;
  outbound: number;
}

export interface DashboardMessages {
  period: "7d";
  startDate: string;
  endDate: string;
  days: MessageDay[];
}

export interface DashboardAppointments {
  date: string;
  today: { confirmed: number; completed: number; cancelled: number; no_show: number };
  past7Days: { confirmed: number; completed: number; cancelled: number; no_show: number };
  upcomingConfirmed: number;
}

export interface DashboardConversations {
  date: string;
  open: number;
  resolved: number;
  total: number;
  newToday: number;
  totalUnread: number;
}

// ─── Dev Bypass (mock data when API isn't running) ───────────────────────────

const DEV_BYPASS = true;

function mockOverview(): DashboardOverview {
  return {
    date: new Date().toISOString().slice(0, 10),
    messages: { total: 247, inbound: 142, outbound: 105 },
    conversations: { open: 18, total: 364 },
    appointments: {
      today: 12,
      byStatus: { confirmed: 5, completed: 4, cancelled: 2, no_show: 1 },
    },
    contacts: { total: 1284, newToday: 8 },
  };
}

function mockMessages(): DashboardMessages {
  const days: MessageDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      total: 30 + Math.floor(Math.random() * 40),
      inbound: 15 + Math.floor(Math.random() * 25),
      outbound: 10 + Math.floor(Math.random() * 20),
    });
  }
  return { period: "7d", startDate: days[0].date, endDate: days[6].date, days };
}

function mockAppointments(): DashboardAppointments {
  return {
    date: new Date().toISOString().slice(0, 10),
    today: { confirmed: 5, completed: 4, cancelled: 2, no_show: 1 },
    past7Days: { confirmed: 28, completed: 22, cancelled: 8, no_show: 4 },
    upcomingConfirmed: 15,
  };
}

function mockConversations(): DashboardConversations {
  return {
    date: new Date().toISOString().slice(0, 10),
    open: 18,
    resolved: 246,
    total: 364,
    newToday: 6,
    totalUnread: 12,
  };
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      if (DEV_BYPASS) return mockOverview();
      const res = await apiFetch<{ data: DashboardOverview }>("/dashboard/overview");
      return res.data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useDashboardMessages() {
  return useQuery({
    queryKey: ["dashboard", "messages"],
    queryFn: async () => {
      if (DEV_BYPASS) return mockMessages();
      const res = await apiFetch<{ data: DashboardMessages }>("/dashboard/messages");
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useDashboardAppointments() {
  return useQuery({
    queryKey: ["dashboard", "appointments"],
    queryFn: async () => {
      if (DEV_BYPASS) return mockAppointments();
      const res = await apiFetch<{ data: DashboardAppointments }>("/dashboard/appointments");
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useDashboardConversations() {
  return useQuery({
    queryKey: ["dashboard", "conversations"],
    queryFn: async () => {
      if (DEV_BYPASS) return mockConversations();
      const res = await apiFetch<{ data: DashboardConversations }>("/dashboard/conversations");
      return res.data;
    },
    staleTime: 30_000,
  });
}
