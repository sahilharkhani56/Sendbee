import { MessageSquare, CheckCircle2, Users, Calendar } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - hidden on mobile */}
      <div className="hidden md:flex md:w-[45%] flex-col justify-between bg-teal-700 p-10 text-white">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight">WA-CRM</span>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Grow your clinic<br />on WhatsApp
          </h2>
          <div className="space-y-3 text-teal-100">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span>Automated appointment reminders</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 flex-shrink-0" />
              <span>Manage all patient conversations in one inbox</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 flex-shrink-0" />
              <span>Smart scheduling with zero double-bookings</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-teal-200">
          Trusted by 500+ Indian clinics
        </p>
      </div>

      {/* Right panel */}
      <div className="flex w-full md:w-[55%] items-center justify-center bg-white dark:bg-background p-6">
        {children}
      </div>
    </div>
  );
}
