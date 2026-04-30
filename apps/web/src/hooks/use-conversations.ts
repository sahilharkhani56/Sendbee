"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConversationContact {
  id: string;
  phoneE164: string;
  name: string | null;
  tags: string[];
  optOut: boolean;
}

export interface LastMessage {
  id: string;
  direction: "inbound" | "outbound";
  type: string;
  content: { text?: string; caption?: string };
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  createdAt: string;
}

export interface Conversation {
  id: string;
  status: "open" | "resolved";
  assignedTo: string | null;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  contact: ConversationContact;
  lastMessage: LastMessage | null;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  type: string;
  content: { text?: string; caption?: string; _note?: boolean };
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  waMessageId: string | null;
  sentBy: string | null;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  status: "open" | "resolved";
  assignedTo: string | null;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  contact: ConversationContact & { email: string | null; customFields: Record<string, unknown> | null; createdAt: string };
}

// ─── Dev Bypass (mock data) ──────────────────────────────────────────────────

const DEV_BYPASS = true;

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    status: "open",
    assignedTo: null,
    unreadCount: 3,
    lastMessageAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
    contact: { id: "c1", phoneE164: "+919876543210", name: "Priya Sharma", tags: ["vip", "dental"], optOut: false },
    lastMessage: { id: "m1", direction: "inbound", type: "text", content: { text: "Hi, I'd like to book an appointment for tomorrow" }, status: "delivered", createdAt: new Date(Date.now() - 2 * 60_000).toISOString() },
  },
  {
    id: "conv-2",
    status: "open",
    assignedTo: "user-1",
    unreadCount: 1,
    lastMessageAt: new Date(Date.now() - 15 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
    contact: { id: "c2", phoneE164: "+919123456789", name: "Rahul Patel", tags: ["new"], optOut: false },
    lastMessage: { id: "m2", direction: "inbound", type: "text", content: { text: "What are your clinic hours?" }, status: "delivered", createdAt: new Date(Date.now() - 15 * 60_000).toISOString() },
  },
  {
    id: "conv-3",
    status: "open",
    assignedTo: null,
    unreadCount: 0,
    lastMessageAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 86400_000).toISOString(),
    contact: { id: "c3", phoneE164: "+919555123456", name: "Anita Desai", tags: ["follow-up"], optOut: false },
    lastMessage: { id: "m3", direction: "outbound", type: "text", content: { text: "Your appointment is confirmed for 10:30 AM tomorrow" }, status: "read", createdAt: new Date(Date.now() - 45 * 60_000).toISOString() },
  },
  {
    id: "conv-4",
    status: "resolved",
    assignedTo: "user-1",
    unreadCount: 0,
    lastMessageAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400_000).toISOString(),
    contact: { id: "c4", phoneE164: "+919888777666", name: "Vikram Singh", tags: ["dental", "regular"], optOut: false },
    lastMessage: { id: "m4", direction: "outbound", type: "text", content: { text: "Thank you for visiting! Please rate your experience." }, status: "delivered", createdAt: new Date(Date.now() - 2 * 3600_000).toISOString() },
  },
  {
    id: "conv-5",
    status: "open",
    assignedTo: null,
    unreadCount: 5,
    lastMessageAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
    contact: { id: "c5", phoneE164: "+919444333222", name: "Meera Joshi", tags: ["new", "eye-care"], optOut: false },
    lastMessage: { id: "m5", direction: "inbound", type: "text", content: { text: "I need to reschedule my appointment please" }, status: "delivered", createdAt: new Date(Date.now() - 5 * 60_000).toISOString() },
  },
  {
    id: "conv-6",
    status: "open",
    assignedTo: null,
    unreadCount: 0,
    lastMessageAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400_000).toISOString(),
    contact: { id: "c6", phoneE164: "+919222111000", name: "Deepak Kumar", tags: ["regular"], optOut: false },
    lastMessage: { id: "m6", direction: "outbound", type: "text", content: { text: "Reminder: Your next check-up is due in 2 weeks" }, status: "read", createdAt: new Date(Date.now() - 4 * 3600_000).toISOString() },
  },
  {
    id: "conv-7",
    status: "open",
    assignedTo: "user-2",
    unreadCount: 2,
    lastMessageAt: new Date(Date.now() - 30 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
    contact: { id: "c7", phoneE164: "+919666555444", name: null, tags: [], optOut: false },
    lastMessage: { id: "m7", direction: "inbound", type: "text", content: { text: "book" }, status: "delivered", createdAt: new Date(Date.now() - 30 * 60_000).toISOString() },
  },
  {
    id: "conv-8",
    status: "resolved",
    assignedTo: null,
    unreadCount: 0,
    lastMessageAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 86400_000).toISOString(),
    contact: { id: "c8", phoneE164: "+919777666555", name: "Sunita Reddy", tags: ["dermatology"], optOut: false },
    lastMessage: { id: "m8", direction: "outbound", type: "text", content: { text: "Your prescription has been sent. Feel free to reach out if you have questions." }, status: "read", createdAt: new Date(Date.now() - 24 * 3600_000).toISOString() },
  },
];

function generateMockMessages(conversationId: string): Message[] {
  const now = Date.now();
  const messages: Message[] = [];
  const texts = [
    { dir: "inbound" as const, text: "Hi, I'd like to book an appointment" },
    { dir: "outbound" as const, text: "Hello! Sure, which doctor would you like to see?" },
    { dir: "inbound" as const, text: "Dr. Sharma please, tomorrow if possible" },
    { dir: "outbound" as const, text: "Let me check availability... Dr. Sharma has slots at 10:30 AM and 2:00 PM tomorrow." },
    { dir: "inbound" as const, text: "10:30 AM works for me" },
    { dir: "outbound" as const, text: "Your appointment is confirmed for tomorrow at 10:30 AM with Dr. Sharma. You'll receive a reminder 24h before." },
    { dir: "inbound" as const, text: "Thank you so much!" },
    { dir: "outbound" as const, text: "You're welcome! See you tomorrow. 😊" },
  ];

  for (let i = 0; i < texts.length; i++) {
    messages.push({
      id: `${conversationId}-msg-${i}`,
      conversationId,
      direction: texts[i].dir,
      type: "text",
      content: { text: texts[i].text },
      status: texts[i].dir === "outbound" ? "delivered" : "delivered",
      waMessageId: `wamid_${i}`,
      sentBy: texts[i].dir === "outbound" ? "user-1" : null,
      createdAt: new Date(now - (texts.length - i) * 5 * 60_000).toISOString(),
    });
  }

  return messages.reverse(); // newest first (API returns newest first)
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useConversations(filters?: {
  status?: "open" | "resolved";
  unassigned?: boolean;
}) {
  return useQuery({
    queryKey: ["conversations", filters],
    queryFn: async () => {
      if (DEV_BYPASS) {
        let result = [...MOCK_CONVERSATIONS];
        if (filters?.status) result = result.filter((c) => c.status === filters.status);
        if (filters?.unassigned) result = result.filter((c) => !c.assignedTo);
        return { data: result, pagination: { limit: 20, nextCursor: null, hasMore: false } };
      }
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.unassigned) params.set("unassigned", "true");
      return apiFetch<{ data: Conversation[]; pagination: { limit: number; nextCursor: string | null; hasMore: boolean } }>(
        `/conversations?${params.toString()}`
      );
    },
    staleTime: 10_000,
  });
}

export function useConversationDetail(id: string | null) {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      if (!id) return null;
      if (DEV_BYPASS) {
        const conv = MOCK_CONVERSATIONS.find((c) => c.id === id);
        if (!conv) return null;
        return {
          ...conv,
          contact: { ...conv.contact, email: null, customFields: null, createdAt: conv.createdAt },
        } as ConversationDetail;
      }
      return apiFetch<ConversationDetail>(`/conversations/${id}`);
    },
    enabled: !!id,
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return { data: [], pagination: { limit: 50, nextCursor: null, hasMore: false } };
      if (DEV_BYPASS) {
        return { data: generateMockMessages(conversationId), pagination: { limit: 50, nextCursor: null, hasMore: false } };
      }
      return apiFetch<{ data: Message[]; pagination: { limit: number; nextCursor: string | null; hasMore: boolean } }>(
        `/conversations/${conversationId}/messages`
      );
    },
    enabled: !!conversationId,
  });
}

export function useSendReply(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      if (DEV_BYPASS) {
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          conversationId,
          direction: "outbound",
          type: "text",
          content: { text },
          status: "sent",
          waMessageId: `wamid_${Date.now()}`,
          sentBy: "user-1",
          createdAt: new Date().toISOString(),
        };
        return newMsg;
      }
      return apiFetch<Message>(`/conversations/${conversationId}/reply`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useUpdateStatus(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: "open" | "resolved") => {
      if (DEV_BYPASS) return { id: conversationId, status };
      return apiFetch<{ id: string; status: string }>(`/conversations/${conversationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
    },
  });
}
