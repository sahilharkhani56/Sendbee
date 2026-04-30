"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Template {
  id: string;
  name: string;
  body: string;
  category: string;
  language: string;
  status: "pending" | "approved" | "rejected";
  variables: string[];
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  segmentTags: string[];
  status: "draft" | "scheduled" | "sending" | "completed" | "paused" | "cancelled";
  scheduledAt: string | null;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  totalContacts: number;
  createdAt: string;
  completedAt: string | null;
}

export interface CampaignLog {
  id: string;
  contactName: string | null;
  contactPhone: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedReason: string | null;
}

// ─── DEV BYPASS mock data ────────────────────────────────────────────────────

const DEV_BYPASS = true;

const now = new Date();
function daysAgo(d: number) { const dt = new Date(now); dt.setDate(dt.getDate() - d); return dt.toISOString(); }

const MOCK_TEMPLATES: Template[] = [
  { id: "tpl-1", name: "appointment_reminder", body: "Hi {{1}}, this is a reminder for your appointment with {{2}} on {{3}}.", category: "UTILITY", language: "en", status: "approved", variables: ["name", "provider", "date"], createdAt: daysAgo(30) },
  { id: "tpl-2", name: "welcome_message", body: "Welcome to {{1}}! We're glad to have you. Reply HELP for assistance.", category: "MARKETING", language: "en", status: "approved", variables: ["business_name"], createdAt: daysAgo(25) },
  { id: "tpl-3", name: "offer_diwali", body: "🪔 Happy Diwali from {{1}}! Get {{2}}% off on all services. Book now!", category: "MARKETING", language: "en", status: "approved", variables: ["business_name", "discount"], createdAt: daysAgo(15) },
  { id: "tpl-4", name: "feedback_request", body: "Hi {{1}}, how was your recent visit? Reply 1-5 to rate.", category: "UTILITY", language: "en", status: "approved", variables: ["name"], createdAt: daysAgo(20) },
  { id: "tpl-5", name: "new_service_launch", body: "Exciting news! {{1}} now offers {{2}}. Book your slot today!", category: "MARKETING", language: "en", status: "pending", variables: ["business_name", "service"], createdAt: daysAgo(3) },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "camp-1", name: "Diwali Offer 2025", templateId: "tpl-3", templateName: "offer_diwali", segmentTags: ["active", "premium"], status: "completed", scheduledAt: daysAgo(10), sentCount: 450, deliveredCount: 438, readCount: 312, failedCount: 12, totalContacts: 450, createdAt: daysAgo(12), completedAt: daysAgo(10) },
  { id: "camp-2", name: "Welcome New Patients", templateId: "tpl-2", templateName: "welcome_message", segmentTags: ["new"], status: "sending", scheduledAt: null, sentCount: 85, deliveredCount: 72, readCount: 45, failedCount: 3, totalContacts: 120, createdAt: daysAgo(1), completedAt: null },
  { id: "camp-3", name: "January Checkup Reminder", templateId: "tpl-1", templateName: "appointment_reminder", segmentTags: ["due-checkup"], status: "draft", scheduledAt: null, sentCount: 0, deliveredCount: 0, readCount: 0, failedCount: 0, totalContacts: 200, createdAt: daysAgo(0), completedAt: null },
  { id: "camp-4", name: "Feedback Collection Q4", templateId: "tpl-4", templateName: "feedback_request", segmentTags: ["visited-last-30d"], status: "completed", scheduledAt: daysAgo(5), sentCount: 180, deliveredCount: 175, readCount: 142, failedCount: 5, totalContacts: 180, createdAt: daysAgo(7), completedAt: daysAgo(5) },
  { id: "camp-5", name: "Re-engagement Campaign", templateId: "tpl-2", templateName: "welcome_message", segmentTags: ["inactive-90d"], status: "paused", scheduledAt: daysAgo(2), sentCount: 60, deliveredCount: 55, readCount: 20, failedCount: 5, totalContacts: 300, createdAt: daysAgo(3), completedAt: null },
  { id: "camp-6", name: "New Year Special", templateId: "tpl-3", templateName: "offer_diwali", segmentTags: ["all"], status: "scheduled", scheduledAt: new Date(now.getFullYear(), 0, 1).toISOString(), sentCount: 0, deliveredCount: 0, readCount: 0, failedCount: 0, totalContacts: 500, createdAt: daysAgo(1), completedAt: null },
];

const MOCK_LOGS: CampaignLog[] = Array.from({ length: 20 }, (_, i) => ({
  id: `log-${i}`,
  contactName: ["Aarav Mehta", "Priya Sharma", "Vikram Singh", "Sneha Reddy", "Rohan Iyer", "Kavya Nair", "Arjun Desai", "Neha Kapoor"][i % 8],
  contactPhone: `+91987654${(3100 + i).toString()}`,
  status: (["sent", "delivered", "read", "delivered", "failed", "read", "sent", "delivered"] as const)[i % 8],
  sentAt: daysAgo(0),
  deliveredAt: i % 5 !== 4 ? daysAgo(0) : null,
  readAt: i % 3 === 0 ? daysAgo(0) : null,
  failedReason: i % 5 === 4 ? "Phone unreachable" : null,
}));

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useTemplates(status?: string) {
  return useQuery({
    queryKey: ["templates", status],
    queryFn: async () => {
      if (DEV_BYPASS) {
        let filtered = [...MOCK_TEMPLATES];
        if (status) filtered = filtered.filter((t) => t.status === status);
        return filtered;
      }
      const qs = status ? `?status=${status}` : "";
      return apiFetch<Template[]>(`/v1/templates${qs}`);
    },
  });
}

export function useCampaigns(status?: string) {
  return useQuery({
    queryKey: ["campaigns", status],
    queryFn: async () => {
      if (DEV_BYPASS) {
        let filtered = [...MOCK_CAMPAIGNS];
        if (status) filtered = filtered.filter((c) => c.status === status);
        return { data: filtered, pagination: { total: filtered.length } };
      }
      const qs = status ? `?status=${status}` : "";
      return apiFetch<{ data: Campaign[]; pagination: { total: number } }>(`/v1/campaigns${qs}`);
    },
  });
}

export function useCampaignDetail(id: string | null) {
  return useQuery({
    queryKey: ["campaigns", id],
    queryFn: async () => {
      if (DEV_BYPASS) return MOCK_CAMPAIGNS.find((c) => c.id === id) || null;
      return apiFetch<Campaign>(`/v1/campaigns/${id}`);
    },
    enabled: !!id,
  });
}

export function useCampaignLogs(campaignId: string | null) {
  return useQuery({
    queryKey: ["campaign-logs", campaignId],
    queryFn: async () => {
      if (DEV_BYPASS) return MOCK_LOGS;
      return apiFetch<CampaignLog[]>(`/v1/campaigns/${campaignId}/logs`);
    },
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; templateId: string; segmentTags: string[] }) => {
      if (DEV_BYPASS) {
        const tpl = MOCK_TEMPLATES.find((t) => t.id === data.templateId);
        const newCamp: Campaign = {
          id: `camp-new-${Date.now()}`,
          name: data.name,
          templateId: data.templateId,
          templateName: tpl?.name || "",
          segmentTags: data.segmentTags,
          status: "draft",
          scheduledAt: null,
          sentCount: 0, deliveredCount: 0, readCount: 0, failedCount: 0,
          totalContacts: Math.floor(Math.random() * 200) + 50,
          createdAt: new Date().toISOString(),
          completedAt: null,
        };
        MOCK_CAMPAIGNS.push(newCamp);
        return newCamp;
      }
      return apiFetch<Campaign>("/v1/campaigns", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (DEV_BYPASS) {
        const camp = MOCK_CAMPAIGNS.find((c) => c.id === id);
        if (camp) camp.status = "sending";
        return camp;
      }
      return apiFetch<Campaign>(`/v1/campaigns/${id}/send`, { method: "POST" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function usePauseCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (DEV_BYPASS) {
        const camp = MOCK_CAMPAIGNS.find((c) => c.id === id);
        if (camp) camp.status = "paused";
        return camp;
      }
      return apiFetch<Campaign>(`/v1/campaigns/${id}/pause`, { method: "POST" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useCancelCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (DEV_BYPASS) {
        const camp = MOCK_CAMPAIGNS.find((c) => c.id === id);
        if (camp) camp.status = "cancelled";
        return camp;
      }
      return apiFetch<Campaign>(`/v1/campaigns/${id}/cancel`, { method: "POST" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}
