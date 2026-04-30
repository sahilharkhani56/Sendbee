"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Users, CalendarDays, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_TABS = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/inbox", label: "Inbox", icon: MessageCircle, badge: true },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/appointments", label: "Appts", icon: CalendarDays },
  { href: "/settings", label: "More", icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  // Hide when virtual keyboard is open
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handler = () => {
      setHidden(vv.height < window.innerHeight * 0.75);
    };

    vv.addEventListener("resize", handler);
    return () => vv.removeEventListener("resize", handler);
  }, []);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t bg-white dark:bg-slate-900 md:hidden",
        hidden && "hidden"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {MOBILE_TABS.map((tab) => {
        const active = isActive(tab.href, tab.exact);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-[56px] min-h-[44px]",
              active ? "text-teal-700" : "text-slate-400"
            )}
          >
            <div className="relative">
              <Icon className={cn("h-5 w-5", active && "fill-teal-700/10")} />
              {tab.badge && (
                <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  0
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
