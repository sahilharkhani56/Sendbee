"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  name: string | null;
  phoneE164: string;
  email: string | null;
  tags: string[];
  optOut: boolean;
  city: string | null;
  state: string | null;
  customFields: Record<string, unknown> | null;
  assignedTo: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  deletedAt: string | null;
}

export interface ContactDetail extends Contact {
  notes: string | null;
}

export interface TimelineEvent {
  type: "message" | "appointment" | "note" | "contact_created";
  createdAt: string;
  content: Record<string, unknown>;
}

// ─── Dev Bypass ──────────────────────────────────────────────────────────────

const DEV_BYPASS = true;

const MOCK_CONTACTS: Contact[] = [
  { id: "c1", name: "Priya Sharma", phoneE164: "+919876543210", email: "priya@example.com", tags: ["vip", "dental"], optOut: false, city: "Mumbai", state: "Maharashtra", customFields: null, assignedTo: null, lastContactedAt: new Date(Date.now() - 2 * 3600_000).toISOString(), createdAt: new Date(Date.now() - 30 * 86400_000).toISOString(), deletedAt: null },
  { id: "c2", name: "Rahul Patel", phoneE164: "+919123456789", email: null, tags: ["new"], optOut: false, city: "Ahmedabad", state: "Gujarat", customFields: null, assignedTo: "user-1", lastContactedAt: new Date(Date.now() - 15 * 60_000).toISOString(), createdAt: new Date(Date.now() - 3 * 86400_000).toISOString(), deletedAt: null },
  { id: "c3", name: "Anita Desai", phoneE164: "+919555123456", email: "anita.d@gmail.com", tags: ["follow-up", "eye-care"], optOut: false, city: "Pune", state: "Maharashtra", customFields: null, assignedTo: null, lastContactedAt: new Date(Date.now() - 45 * 60_000).toISOString(), createdAt: new Date(Date.now() - 14 * 86400_000).toISOString(), deletedAt: null },
  { id: "c4", name: "Vikram Singh", phoneE164: "+919888777666", email: null, tags: ["dental", "regular"], optOut: false, city: "Delhi", state: "Delhi", customFields: null, assignedTo: "user-1", lastContactedAt: new Date(Date.now() - 2 * 3600_000).toISOString(), createdAt: new Date(Date.now() - 60 * 86400_000).toISOString(), deletedAt: null },
  { id: "c5", name: "Meera Joshi", phoneE164: "+919444333222", email: "meera.j@yahoo.com", tags: ["new", "eye-care"], optOut: false, city: "Bangalore", state: "Karnataka", customFields: null, assignedTo: null, lastContactedAt: new Date(Date.now() - 5 * 60_000).toISOString(), createdAt: new Date(Date.now() - 2 * 86400_000).toISOString(), deletedAt: null },
  { id: "c6", name: "Deepak Kumar", phoneE164: "+919222111000", email: null, tags: ["regular"], optOut: false, city: "Chennai", state: "Tamil Nadu", customFields: null, assignedTo: null, lastContactedAt: new Date(Date.now() - 4 * 3600_000).toISOString(), createdAt: new Date(Date.now() - 90 * 86400_000).toISOString(), deletedAt: null },
  { id: "c7", name: null, phoneE164: "+919666555444", email: null, tags: [], optOut: false, city: null, state: null, customFields: null, assignedTo: null, lastContactedAt: new Date(Date.now() - 30 * 60_000).toISOString(), createdAt: new Date(Date.now() - 5 * 86400_000).toISOString(), deletedAt: null },
  { id: "c8", name: "Sunita Reddy", phoneE164: "+919777666555", email: "sunita.r@hotmail.com", tags: ["dermatology"], optOut: true, city: "Hyderabad", state: "Telangana", customFields: null, assignedTo: null, lastContactedAt: new Date(Date.now() - 24 * 3600_000).toISOString(), createdAt: new Date(Date.now() - 120 * 86400_000).toISOString(), deletedAt: null },
  { id: "c9", name: "Amit Verma", phoneE164: "+919333222111", email: "amit@clinic.in", tags: ["vip", "dental", "regular"], optOut: false, city: "Jaipur", state: "Rajasthan", customFields: null, assignedTo: "user-2", lastContactedAt: new Date(Date.now() - 12 * 3600_000).toISOString(), createdAt: new Date(Date.now() - 200 * 86400_000).toISOString(), deletedAt: null },
  { id: "c10", name: "Kavita Nair", phoneE164: "+919111222333", email: null, tags: ["new"], optOut: false, city: "Kochi", state: "Kerala", customFields: null, assignedTo: null, lastContactedAt: null, createdAt: new Date(Date.now() - 1 * 86400_000).toISOString(), deletedAt: null },
  { id: "c11", name: "Rajesh Gupta", phoneE164: "+919888111333", email: "rajesh.g@outlook.com", tags: ["follow-up"], optOut: false, city: "Lucknow", state: "Uttar Pradesh", customFields: null, assignedTo: null, lastContactedAt: new Date(Date.now() - 48 * 3600_000).toISOString(), createdAt: new Date(Date.now() - 45 * 86400_000).toISOString(), deletedAt: null },
  { id: "c12", name: "Neha Agarwal", phoneE164: "+919777333111", email: null, tags: ["dental"], optOut: false, city: "Kolkata", state: "West Bengal", customFields: null, assignedTo: null, lastContactedAt: new Date(Date.now() - 6 * 3600_000).toISOString(), createdAt: new Date(Date.now() - 75 * 86400_000).toISOString(), deletedAt: null },
];

function mockTimeline(): TimelineEvent[] {
  const now = Date.now();
  return [
    { type: "message", createdAt: new Date(now - 2 * 3600_000).toISOString(), content: { direction: "inbound", text: "Hi, I'd like to reschedule my appointment" } },
    { type: "message", createdAt: new Date(now - 2.5 * 3600_000).toISOString(), content: { direction: "outbound", text: "Sure! When would you prefer?" } },
    { type: "appointment", createdAt: new Date(now - 24 * 3600_000).toISOString(), content: { provider: "Dr. Sharma", status: "completed", time: new Date(now - 24 * 3600_000).toISOString() } },
    { type: "note", createdAt: new Date(now - 48 * 3600_000).toISOString(), content: { text: "Patient prefers morning appointments", author: "Dr. Patel" } },
    { type: "message", createdAt: new Date(now - 72 * 3600_000).toISOString(), content: { direction: "outbound", text: "Your appointment is confirmed for tomorrow at 10:30 AM" } },
    { type: "appointment", createdAt: new Date(now - 7 * 86400_000).toISOString(), content: { provider: "Dr. Sharma", status: "confirmed", time: new Date(now + 2 * 86400_000).toISOString() } },
    { type: "contact_created", createdAt: new Date(now - 30 * 86400_000).toISOString(), content: {} },
  ];
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useContacts(params?: {
  search?: string;
  tags?: string[];
  optOut?: boolean;
}) {
  return useQuery({
    queryKey: ["contacts", params],
    queryFn: async () => {
      if (DEV_BYPASS) {
        let result = [...MOCK_CONTACTS];
        if (params?.search) {
          const q = params.search.toLowerCase();
          result = result.filter(
            (c) =>
              (c.name && c.name.toLowerCase().includes(q)) ||
              c.phoneE164.includes(q) ||
              (c.email && c.email.toLowerCase().includes(q))
          );
        }
        if (params?.tags && params.tags.length > 0) {
          result = result.filter((c) =>
            params.tags!.some((t) => c.tags.includes(t))
          );
        }
        if (params?.optOut !== undefined) {
          result = result.filter((c) => c.optOut === params.optOut);
        }
        return { data: result, pagination: { nextCursor: null, total: result.length } };
      }
      const qp = new URLSearchParams();
      if (params?.search) qp.set("search", params.search);
      if (params?.tags?.length) qp.set("tags", params.tags.join(","));
      return apiFetch<{ data: Contact[]; pagination: { nextCursor: string | null; total: number } }>(
        `/contacts?${qp.toString()}`
      );
    },
    staleTime: 15_000,
  });
}

export function useContactDetail(id: string | null) {
  return useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      if (!id) return null;
      if (DEV_BYPASS) {
        const c = MOCK_CONTACTS.find((c) => c.id === id);
        if (!c) return null;
        return { ...c, notes: "Patient prefers morning appointments. Allergic to penicillin." } as ContactDetail;
      }
      return apiFetch<ContactDetail>(`/contacts/${id}`);
    },
    enabled: !!id,
  });
}

export function useContactTimeline(id: string | null) {
  return useQuery({
    queryKey: ["contact-timeline", id],
    queryFn: async () => {
      if (!id) return { data: [] };
      if (DEV_BYPASS) return { data: mockTimeline() };
      return apiFetch<{ data: TimelineEvent[] }>(`/contacts/${id}/timeline`);
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; phone: string; tags?: string[]; city?: string }) => {
      if (DEV_BYPASS) {
        return { id: `c-${Date.now()}`, ...data, phoneE164: data.phone } as unknown as Contact;
      }
      return apiFetch<Contact>("/contacts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useUpdateContact(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      if (DEV_BYPASS) return { id, ...data } as Contact;
      return apiFetch<Contact>(`/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (DEV_BYPASS) return;
      return apiFetch(`/contacts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}
