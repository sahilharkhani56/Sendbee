"use client";

import { useState, useMemo } from "react";
import { format, addDays } from "date-fns";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Search,
  Check,
  CalendarPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProviders, useSlots, useCreateAppointment, type Provider, type TimeSlot } from "@/hooks/use-appointments";

// Mock contacts for picker
const MOCK_CONTACTS = [
  { id: "c-1", name: "Aarav Mehta", phone: "+919876543101" },
  { id: "c-2", name: "Priya Sharma", phone: "+919876543102" },
  { id: "c-3", name: "Vikram Singh", phone: "+919876543103" },
  { id: "c-4", name: "Sneha Reddy", phone: "+919876543104" },
  { id: "c-5", name: "Rohan Iyer", phone: "+919876543105" },
  { id: "c-6", name: "Kavya Nair", phone: "+919876543106" },
];

type Step = 1 | 2 | 3 | 4;

export function BookingDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [contactSearch, setContactSearch] = useState("");

  const { data: providers } = useProviders();
  const { data: slots, isLoading: slotsLoading } = useSlots(selectedProvider, selectedDate);
  const { mutate: createAppointment, isPending } = useCreateAppointment();

  const filteredContacts = useMemo(() => {
    const q = contactSearch.toLowerCase();
    return MOCK_CONTACTS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [contactSearch]);

  const selectedContactObj = MOCK_CONTACTS.find((c) => c.id === selectedContact);
  const selectedProviderObj = (providers || []).find((p) => p.id === selectedProvider);
  const availableSlots = (slots || []).filter((s) => s.available);

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedContact;
      case 2: return !!selectedProvider && !!selectedDate;
      case 3: return !!selectedSlot;
      case 4: return true;
    }
  };

  const handleBook = () => {
    if (!selectedProvider || !selectedContact || !selectedSlot) return;
    createAppointment(
      { providerId: selectedProvider, contactId: selectedContact, date: selectedDate, time: selectedSlot, notes: notes || undefined },
      { onSuccess: () => onClose() }
    );
  };

  // Dates for date picker (next 14 days)
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { value: format(d, "yyyy-MM-dd"), label: format(d, "EEE, MMM d") };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-teal-600" />
            <h2 className="text-sm font-semibold text-foreground">Book Appointment</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-700"
                )}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Step {step} of 4 — {
              step === 1 ? "Select Contact" :
              step === 2 ? "Provider & Date" :
              step === 3 ? "Choose Time Slot" : "Confirm Details"
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-4 min-h-[300px]">
          {/* Step 1: Contact */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  autoFocus
                />
              </div>
              <div className="max-h-[240px] overflow-y-auto space-y-1">
                {filteredContacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContact(c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left",
                      selectedContact === c.id
                        ? "bg-teal-50 dark:bg-teal-950/20 border border-teal-300 dark:border-teal-700"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent"
                    )}
                  >
                    <div className="h-9 w-9 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-xs font-semibold text-teal-800 dark:text-teal-200 shrink-0">
                      {c.name.split(" ").map((w) => w[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{c.phone}</p>
                    </div>
                    {selectedContact === c.id && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Provider + Date */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Provider</label>
                <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto">
                  {(providers || []).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedProvider(p.id); setSelectedSlot(null); }}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left",
                        selectedProvider === p.id
                          ? "bg-teal-50 dark:bg-teal-950/20 border border-teal-300 dark:border-teal-700"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent"
                      )}
                    >
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        {p.specialization && <p className="text-[11px] text-muted-foreground">{p.specialization} · {p.slotDuration}min slots</p>}
                      </div>
                      {selectedProvider === p.id && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {dateOptions.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => { setSelectedDate(d.value); setSelectedSlot(null); }}
                      className={cn(
                        "px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors shrink-0",
                        selectedDate === d.value
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-muted-foreground hover:bg-slate-200"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Time Slot */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {selectedProviderObj?.name} · {format(new Date(selectedDate), "EEEE, MMM d")} · {selectedProviderObj?.slotDuration}min slots
              </p>
              {slotsLoading ? (
                <div className="grid grid-cols-4 gap-2 animate-pulse">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No available slots for this date</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-[260px] overflow-y-auto">
                  {availableSlots.map((slot) => {
                    const [h, m] = slot.time.split(":").map(Number);
                    const period = h >= 12 ? "PM" : "AM";
                    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
                    return (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={cn(
                          "p-2.5 rounded-lg text-xs font-medium transition-colors",
                          selectedSlot === slot.time
                            ? "bg-teal-600 text-white"
                            : "bg-slate-50 dark:bg-slate-700/50 text-foreground hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:text-teal-700"
                        )}
                      >
                        {displayHour}:{m.toString().padStart(2, "0")} {period}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-slate-50 dark:bg-slate-700/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Contact</span>
                  <span className="text-sm font-medium text-foreground">{selectedContactObj?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Provider</span>
                  <span className="text-sm font-medium text-foreground">{selectedProviderObj?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Date</span>
                  <span className="text-sm font-medium text-foreground">{format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Time</span>
                  <span className="text-sm font-medium text-foreground">{selectedSlot}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium text-foreground">{selectedProviderObj?.slotDuration} min</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for this appointment..."
                  className="w-full p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => step > 1 ? setStep((s) => (s - 1) as Step) : onClose()}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {step > 1 ? "Back" : "Cancel"}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={!canProceed()}
              className={cn(
                "flex items-center gap-1 px-4 py-2 text-xs font-medium rounded-lg transition-colors",
                canProceed()
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-muted-foreground cursor-not-allowed"
              )}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleBook}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50"
            >
              {isPending ? "Booking..." : "Confirm Booking"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
