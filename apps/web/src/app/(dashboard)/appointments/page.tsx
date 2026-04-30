"use client";

import { useState, useMemo } from "react";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, parseISO } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  List,
  Clock,
  User,
  Phone,
  Search,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useProviders,
  useAllAppointments,
  useUpdateAppointmentStatus,
  type Appointment,
  type Provider,
} from "@/hooks/use-appointments";
import { BookingDialog } from "@/components/appointments/booking-dialog";

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400", dot: "bg-blue-500" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400", dot: "bg-green-500" },
  no_show: { label: "No Show", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400", dot: "bg-amber-500" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400", dot: "bg-red-500" },
};

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", config.color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

// ─── Week Calendar ───────────────────────────────────────────────────────────

function WeekCalendar({
  currentDate,
  appointments,
  onDateClick,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8AM - 5PM

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-700">
        <div className="p-2" />
        {days.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => onDateClick(day)}
            className={cn(
              "p-2 text-center border-l border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors",
              isToday(day) && "bg-teal-50 dark:bg-teal-950/20"
            )}
          >
            <p className="text-[10px] font-medium text-muted-foreground uppercase">{format(day, "EEE")}</p>
            <p className={cn(
              "text-lg font-semibold",
              isToday(day) ? "text-teal-700 dark:text-teal-400" : "text-foreground"
            )}>
              {format(day, "d")}
            </p>
          </button>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] max-h-[500px] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="contents">
            <div className="p-2 text-[10px] text-muted-foreground text-right pr-3 border-b border-slate-100 dark:border-slate-700/50">
              {hour.toString().padStart(2, "0")}:00
            </div>
            {days.map((day) => {
              const dayAppts = appointments.filter((a) => {
                const aDate = parseISO(a.startsAt);
                return isSameDay(aDate, day) && aDate.getHours() === hour;
              });
              return (
                <div
                  key={day.toISOString() + hour}
                  className="relative min-h-[48px] border-l border-b border-slate-100 dark:border-slate-700/50 p-0.5"
                >
                  {dayAppts.map((apt) => {
                    const statusCfg = STATUS_CONFIG[apt.status];
                    return (
                      <div
                        key={apt.id}
                        className={cn(
                          "px-1.5 py-1 rounded text-[9px] leading-tight mb-0.5 cursor-pointer hover:opacity-80 transition-opacity",
                          statusCfg.color
                        )}
                        title={`${apt.contactName} with ${apt.providerName}`}
                      >
                        <p className="font-medium truncate">{apt.contactName}</p>
                        <p className="truncate opacity-70">{apt.providerName}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Day View ────────────────────────────────────────────────────────────────

function DayView({
  date,
  appointments,
  onAction,
}: {
  date: Date;
  appointments: Appointment[];
  onAction: (id: string, status: Appointment["status"]) => void;
}) {
  const hours = Array.from({ length: 10 }, (_, i) => i + 8);
  const dateStr = format(date, "yyyy-MM-dd");
  const dayAppts = appointments.filter((a) => a.date === dateStr);

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 overflow-hidden">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {format(date, "EEEE, MMMM d")}
          {isToday(date) && <span className="ml-2 text-xs font-normal text-teal-600">(Today)</span>}
        </h3>
        <span className="text-xs text-muted-foreground">{dayAppts.length} appointment{dayAppts.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        {hours.map((hour) => {
          const hourAppts = dayAppts.filter((a) => parseISO(a.startsAt).getHours() === hour);
          return (
            <div key={hour} className="flex min-h-[56px]">
              <div className="w-16 shrink-0 p-2 text-xs text-muted-foreground text-right pr-3 border-r border-slate-100 dark:border-slate-700/50">
                {hour.toString().padStart(2, "0")}:00
              </div>
              <div className="flex-1 p-1.5 space-y-1">
                {hourAppts.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <div className={cn("h-8 w-1 rounded-full shrink-0", STATUS_CONFIG[apt.status].dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{apt.contactName}</p>
                        <StatusBadge status={apt.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(apt.startsAt), "h:mm a")} – {format(parseISO(apt.endsAt), "h:mm a")}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {apt.providerName}
                        </span>
                      </div>
                      {apt.notes && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                          <StickyNote className="h-2.5 w-2.5" /> {apt.notes}
                        </p>
                      )}
                    </div>
                    {/* Actions */}
                    {apt.status === "confirmed" && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => onAction(apt.id, "completed")}
                          className="p-1.5 rounded-md text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                          title="Complete"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onAction(apt.id, "no_show")}
                          className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          title="No Show"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onAction(apt.id, "cancelled")}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Cancel"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── List View ───────────────────────────────────────────────────────────────

function ListView({
  appointments,
  onAction,
}: {
  appointments: Appointment[];
  onAction: (id: string, status: Appointment["status"]) => void;
}) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-foreground">No appointments found</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50">
      {appointments.map((apt) => (
        <div key={apt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
          <div className={cn("h-10 w-1 rounded-full shrink-0", STATUS_CONFIG[apt.status].dot)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">{apt.contactName}</span>
              <StatusBadge status={apt.status} />
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {format(parseISO(apt.startsAt), "MMM d")}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(parseISO(apt.startsAt), "h:mm a")}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {apt.providerName}
              </span>
            </div>
          </div>
          {apt.status === "confirmed" && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => onAction(apt.id, "completed")} className="p-1.5 rounded-md text-green-600 hover:bg-green-50" title="Complete">
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <button onClick={() => onAction(apt.id, "no_show")} className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50" title="No Show">
                <AlertTriangle className="h-4 w-4" />
              </button>
              <button onClick={() => onAction(apt.id, "cancelled")} className="p-1.5 rounded-md text-red-600 hover:bg-red-50" title="Cancel">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "day" | "list">("day");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showBooking, setShowBooking] = useState(false);

  const { data: providers } = useProviders();
  const { data: appointmentsData, isLoading } = useAllAppointments();
  const { mutate: updateStatus } = useUpdateAppointmentStatus();

  const appointments = appointmentsData?.data || [];

  const filtered = useMemo(() => {
    let result = [...appointments];
    if (selectedProvider) result = result.filter((a) => a.providerId === selectedProvider);
    if (selectedStatus) result = result.filter((a) => a.status === selectedStatus);
    // Sort by startsAt
    result.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    return result;
  }, [appointments, selectedProvider, selectedStatus]);

  const todaySummary = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayAppts = appointments.filter((a) => a.date === todayStr);
    return {
      total: todayAppts.length,
      confirmed: todayAppts.filter((a) => a.status === "confirmed").length,
      completed: todayAppts.filter((a) => a.status === "completed").length,
      noShow: todayAppts.filter((a) => a.status === "no_show").length,
    };
  }, [appointments]);

  const handleAction = (id: string, status: Appointment["status"]) => {
    updateStatus({ id, status });
  };

  const navigateDate = (offset: number) => {
    setCurrentDate((d) => addDays(d, viewMode === "week" ? offset * 7 : offset));
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Appointments</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage bookings and schedules</p>
        </div>
        <button
          onClick={() => setShowBooking(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors self-start"
        >
          <Plus className="h-3.5 w-3.5" /> Book Appointment
        </button>
      </div>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Today", value: todaySummary.total, color: "text-foreground" },
          { label: "Confirmed", value: todaySummary.confirmed, color: "text-blue-600" },
          { label: "Completed", value: todaySummary.completed, color: "text-green-600" },
          { label: "No Show", value: todaySummary.noShow, color: "text-amber-600" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border bg-white dark:bg-slate-800 p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">{card.label}</p>
            <p className={cn("text-2xl font-bold mt-0.5", card.color)}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Today
          </button>
          <button onClick={() => navigateDate(1)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-foreground ml-1">
            {viewMode === "week"
              ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy")}`
              : format(currentDate, "MMMM d, yyyy")
            }
          </span>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          {/* View mode toggle */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {[
              { key: "day" as const, icon: CalendarIcon },
              { key: "week" as const, icon: CalendarIcon },
              { key: "list" as const, icon: List },
            ].map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={cn(
                  "px-3 py-2 text-[11px] font-medium capitalize transition-colors",
                  viewMode === key ? "bg-slate-100 dark:bg-slate-700 text-foreground" : "text-muted-foreground hover:bg-slate-50"
                )}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Provider filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground"
          >
            <option value="">All Providers</option>
            {(providers || []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground"
          >
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="no_show">No Show</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-8 animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-1 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-56 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "week" ? (
        <WeekCalendar
          currentDate={currentDate}
          appointments={filtered}
          onDateClick={(d) => { setCurrentDate(d); setViewMode("day"); }}
        />
      ) : viewMode === "day" ? (
        <DayView date={currentDate} appointments={filtered} onAction={handleAction} />
      ) : (
        <ListView appointments={filtered} onAction={handleAction} />
      )}

      {/* Booking Dialog */}
      {showBooking && (
        <BookingDialog onClose={() => setShowBooking(false)} />
      )}
    </div>
  );
}
