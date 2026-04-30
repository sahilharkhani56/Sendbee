"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Provider {
  id: string;
  name: string;
  specialization: string | null;
  phone: string | null;
  slotDuration: number;
  isActive: boolean;
}

export interface TimeSlot {
  time: string; // HH:mm
  available: boolean;
}

export interface Appointment {
  id: string;
  providerId: string;
  providerName: string;
  contactId: string;
  contactName: string | null;
  contactPhone: string;
  date: string; // YYYY-MM-DD
  startsAt: string; // ISO
  endsAt: string; // ISO
  status: "confirmed" | "completed" | "no_show" | "cancelled";
  notes: string | null;
  createdAt: string;
}

// ─── DEV BYPASS mock data ────────────────────────────────────────────────────

const DEV_BYPASS = true;

const MOCK_PROVIDERS: Provider[] = [
  { id: "prov-1", name: "Dr. Meera Sharma", specialization: "Dentist", phone: "+919876543210", slotDuration: 30, isActive: true },
  { id: "prov-2", name: "Dr. Rajesh Patel", specialization: "Dermatologist", phone: "+919876543211", slotDuration: 30, isActive: true },
  { id: "prov-3", name: "Dr. Ananya Gupta", specialization: "Ophthalmologist", phone: "+919876543212", slotDuration: 20, isActive: true },
  { id: "prov-4", name: "Dr. Arjun Reddy", specialization: "Physiotherapist", phone: "+919876543213", slotDuration: 45, isActive: true },
  { id: "prov-5", name: "Dr. Priya Nair", specialization: "General Physician", phone: "+919876543214", slotDuration: 15, isActive: false },
];

function generateMockSlots(date: string, providerId: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const hours = [9, 10, 11, 12, 14, 15, 16, 17]; // 9AM-12PM, 2PM-5PM (lunch break 12-2)
  const provider = MOCK_PROVIDERS.find((p) => p.id === providerId);
  const duration = provider?.slotDuration || 30;
  const slotsPerHour = Math.floor(60 / duration);

  for (const hour of hours) {
    for (let s = 0; s < slotsPerHour; s++) {
      const min = s * duration;
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      // Randomly mark some slots as booked (deterministic based on time+provider)
      const hash = (hour * 60 + min + providerId.charCodeAt(5)) % 7;
      slots.push({ time, available: hash !== 0 && hash !== 3 });
    }
  }
  return slots;
}

const today = new Date();
function dayStr(offset: number) {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
function isoAt(offset: number, hour: number, min: number) {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-1", providerId: "prov-1", providerName: "Dr. Meera Sharma",
    contactId: "c-1", contactName: "Aarav Mehta", contactPhone: "+919876543101",
    date: dayStr(0), startsAt: isoAt(0, 9, 0), endsAt: isoAt(0, 9, 30),
    status: "confirmed", notes: "Root canal follow-up", createdAt: isoAt(-2, 10, 0),
  },
  {
    id: "apt-2", providerId: "prov-2", providerName: "Dr. Rajesh Patel",
    contactId: "c-2", contactName: "Priya Sharma", contactPhone: "+919876543102",
    date: dayStr(0), startsAt: isoAt(0, 10, 0), endsAt: isoAt(0, 10, 30),
    status: "confirmed", notes: "Skin allergy consultation", createdAt: isoAt(-1, 14, 0),
  },
  {
    id: "apt-3", providerId: "prov-1", providerName: "Dr. Meera Sharma",
    contactId: "c-3", contactName: "Vikram Singh", contactPhone: "+919876543103",
    date: dayStr(0), startsAt: isoAt(0, 11, 0), endsAt: isoAt(0, 11, 30),
    status: "completed", notes: null, createdAt: isoAt(-3, 9, 0),
  },
  {
    id: "apt-4", providerId: "prov-3", providerName: "Dr. Ananya Gupta",
    contactId: "c-4", contactName: "Sneha Reddy", contactPhone: "+919876543104",
    date: dayStr(0), startsAt: isoAt(0, 14, 0), endsAt: isoAt(0, 14, 20),
    status: "no_show", notes: "Eye exam", createdAt: isoAt(-4, 11, 0),
  },
  {
    id: "apt-5", providerId: "prov-4", providerName: "Dr. Arjun Reddy",
    contactId: "c-5", contactName: "Rohan Iyer", contactPhone: "+919876543105",
    date: dayStr(1), startsAt: isoAt(1, 9, 0), endsAt: isoAt(1, 9, 45),
    status: "confirmed", notes: "Knee rehab session 3", createdAt: isoAt(-1, 16, 0),
  },
  {
    id: "apt-6", providerId: "prov-1", providerName: "Dr. Meera Sharma",
    contactId: "c-6", contactName: "Kavya Nair", contactPhone: "+919876543106",
    date: dayStr(1), startsAt: isoAt(1, 10, 30), endsAt: isoAt(1, 11, 0),
    status: "confirmed", notes: "Dental cleaning", createdAt: isoAt(0, 8, 0),
  },
  {
    id: "apt-7", providerId: "prov-2", providerName: "Dr. Rajesh Patel",
    contactId: "c-7", contactName: "Arjun Desai", contactPhone: "+919876543107",
    date: dayStr(2), startsAt: isoAt(2, 15, 0), endsAt: isoAt(2, 15, 30),
    status: "confirmed", notes: null, createdAt: isoAt(0, 12, 0),
  },
  {
    id: "apt-8", providerId: "prov-3", providerName: "Dr. Ananya Gupta",
    contactId: "c-8", contactName: "Neha Kapoor", contactPhone: "+919876543108",
    date: dayStr(-1), startsAt: isoAt(-1, 9, 30), endsAt: isoAt(-1, 9, 50),
    status: "completed", notes: "Vision test completed", createdAt: isoAt(-5, 10, 0),
  },
  {
    id: "apt-9", providerId: "prov-1", providerName: "Dr. Meera Sharma",
    contactId: "c-9", contactName: "Aditya Joshi", contactPhone: "+919876543109",
    date: dayStr(-1), startsAt: isoAt(-1, 14, 0), endsAt: isoAt(-1, 14, 30),
    status: "cancelled", notes: "Patient cancelled", createdAt: isoAt(-3, 15, 0),
  },
  {
    id: "apt-10", providerId: "prov-4", providerName: "Dr. Arjun Reddy",
    contactId: "c-10", contactName: "Meera Kulkarni", contactPhone: "+919876543110",
    date: dayStr(3), startsAt: isoAt(3, 11, 0), endsAt: isoAt(3, 11, 45),
    status: "confirmed", notes: "Back pain assessment", createdAt: isoAt(0, 9, 0),
  },
];

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      if (DEV_BYPASS) {
        return MOCK_PROVIDERS.filter((p) => p.isActive);
      }
      return apiFetch<Provider[]>("/v1/providers");
    },
  });
}

export function useSlots(providerId: string | null, date: string | null) {
  return useQuery({
    queryKey: ["slots", providerId, date],
    queryFn: async () => {
      if (DEV_BYPASS) {
        if (!providerId || !date) return [];
        return generateMockSlots(date, providerId);
      }
      return apiFetch<TimeSlot[]>(`/v1/appointments/slots?providerId=${providerId}&date=${date}`);
    },
    enabled: !!providerId && !!date,
  });
}

export function useAppointments(params?: {
  date?: string;
  providerId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["appointments", params],
    queryFn: async () => {
      if (DEV_BYPASS) {
        let filtered = [...MOCK_APPOINTMENTS];
        if (params?.date) filtered = filtered.filter((a) => a.date === params.date);
        if (params?.providerId) filtered = filtered.filter((a) => a.providerId === params.providerId);
        if (params?.status) filtered = filtered.filter((a) => a.status === params.status);
        return { data: filtered, pagination: { total: filtered.length } };
      }
      const qs = new URLSearchParams();
      if (params?.date) qs.set("date", params.date);
      if (params?.providerId) qs.set("providerId", params.providerId);
      if (params?.status) qs.set("status", params.status);
      return apiFetch<{ data: Appointment[]; pagination: { total: number } }>(`/v1/appointments?${qs}`);
    },
  });
}

export function useAllAppointments() {
  return useQuery({
    queryKey: ["appointments", "all"],
    queryFn: async () => {
      if (DEV_BYPASS) {
        return { data: MOCK_APPOINTMENTS, pagination: { total: MOCK_APPOINTMENTS.length } };
      }
      return apiFetch<{ data: Appointment[]; pagination: { total: number } }>("/v1/appointments");
    },
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      providerId: string;
      contactId: string;
      date: string;
      time: string;
      notes?: string;
    }) => {
      if (DEV_BYPASS) {
        const provider = MOCK_PROVIDERS.find((p) => p.id === data.providerId);
        const [h, m] = data.time.split(":").map(Number);
        const startsAt = new Date(data.date);
        startsAt.setHours(h, m, 0, 0);
        const endsAt = new Date(startsAt);
        endsAt.setMinutes(endsAt.getMinutes() + (provider?.slotDuration || 30));

        const newApt: Appointment = {
          id: `apt-new-${Date.now()}`,
          providerId: data.providerId,
          providerName: provider?.name || "Unknown",
          contactId: data.contactId,
          contactName: "New Patient",
          contactPhone: "+919876543200",
          date: data.date,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          status: "confirmed",
          notes: data.notes || null,
          createdAt: new Date().toISOString(),
        };
        MOCK_APPOINTMENTS.push(newApt);
        return newApt;
      }
      return apiFetch<Appointment>("/v1/appointments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["slots"] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Appointment["status"] }) => {
      if (DEV_BYPASS) {
        const apt = MOCK_APPOINTMENTS.find((a) => a.id === id);
        if (apt) apt.status = status;
        return apt;
      }
      return apiFetch<Appointment>(`/v1/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
