"use client";

import { useState } from "react";
import {
  Building2,
  MessageCircle,
  Users,
  CreditCard,
  Clock,
  Globe,
  Phone,
  Key,
  Unlink,
  CheckCircle2,
  XCircle,
  UserPlus,
  Trash2,
  Shield,
  Mail,
  MapPin,
  Crown,
  Zap,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "general" | "whatsapp" | "team" | "billing";

const TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "general", label: "General", icon: Building2 },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "team", label: "Team", icon: Users },
  { key: "billing", label: "Billing", icon: CreditCard },
];

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_TEAM = [
  { id: "u-1", name: "Sahil Harkhani", phone: "+919876543100", role: "owner", status: "active" },
  { id: "u-2", name: "Priya Sharma", phone: "+919876543101", role: "admin", status: "active" },
  { id: "u-3", name: "Arjun Desai", phone: "+919876543102", role: "staff", status: "active" },
  { id: "u-4", name: "Neha Kapoor", phone: "+919876543103", role: "staff", status: "invited" },
];

const PLANS = [
  { id: "trial", name: "Trial", price: "Free", duration: "14 days", contacts: 100, messages: 500, team: 1, current: false },
  { id: "starter", name: "Starter", price: "₹999", duration: "/mo", contacts: 500, messages: 5000, team: 2, current: true },
  { id: "growth", name: "Growth", price: "₹2,499", duration: "/mo", contacts: 2000, messages: 20000, team: 5, current: false },
  { id: "pro", name: "Pro", price: "₹4,999", duration: "/mo", contacts: 10000, messages: 100000, team: 10, current: false },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── General Tab ─────────────────────────────────────────────────────────────

function GeneralTab() {
  const [businessName, setBusinessName] = useState("Smile Dental Clinic");
  const [email, setEmail] = useState("contact@smileclinic.in");
  const [address, setAddress] = useState("123, MG Road, Andheri West");
  const [city, setCity] = useState("Mumbai");
  const [awayEnabled, setAwayEnabled] = useState(true);
  const [awayMessage, setAwayMessage] = useState("Thanks for reaching out! We're currently closed. We'll reply when we're back.");

  return (
    <div className="space-y-6">
      {/* Business Profile */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4 text-teal-600" /> Business Profile
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Business Name</label>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
          </div>
        </div>
        <button className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors">
          Save Changes
        </button>
      </div>

      {/* Business Hours */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-600" /> Business Hours
        </h3>
        <div className="space-y-2">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-3">
              <span className="text-xs text-foreground w-24">{day}</span>
              <input type="time" defaultValue={day === "Sunday" ? "" : "09:00"} className="px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" />
              <span className="text-xs text-muted-foreground">to</span>
              <input type="time" defaultValue={day === "Sunday" ? "" : "18:00"} className="px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" />
              {day === "Sunday" && <span className="text-[10px] text-red-500">Closed</span>}
            </div>
          ))}
        </div>
        <button className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors">
          Save Hours
        </button>
      </div>

      {/* Away Message */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Away Message</h3>
          <button
            onClick={() => setAwayEnabled(!awayEnabled)}
            className={cn(
              "relative w-9 h-5 rounded-full transition-colors",
              awayEnabled ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-600"
            )}
          >
            <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm", awayEnabled ? "left-[18px]" : "left-0.5")} />
          </button>
        </div>
        <textarea
          value={awayMessage}
          onChange={(e) => setAwayMessage(e.target.value)}
          disabled={!awayEnabled}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50 resize-none"
          rows={3}
        />
      </div>
    </div>
  );
}

// ─── WhatsApp Tab ────────────────────────────────────────────────────────────

function WhatsAppTab() {
  const isConnected = true;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-teal-600" /> Connection Status
        </h3>
        <div className={cn("flex items-center gap-3 p-4 rounded-lg", isConnected ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800" : "bg-red-50 border border-red-200")}>
          {isConnected ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
          <div>
            <p className="text-sm font-medium text-foreground">{isConnected ? "Connected" : "Not Connected"}</p>
            <p className="text-xs text-muted-foreground">{isConnected ? "WhatsApp Business account is linked" : "Connect your WhatsApp account"}</p>
          </div>
        </div>

        {isConnected && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[11px] text-muted-foreground">Phone Number ID</p>
                <p className="text-sm text-foreground font-mono">1234567890*****</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[11px] text-muted-foreground">Access Token</p>
                <p className="text-sm text-foreground font-mono">••••••••••••••••</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {isConnected ? (
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
              <Unlink className="h-3.5 w-3.5" /> Unlink Account
            </button>
          ) : (
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white">
              Connect WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Team Tab ────────────────────────────────────────────────────────────────

function TeamTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Team Members</h3>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white">
          <UserPlus className="h-3.5 w-3.5" /> Invite Member
        </button>
      </div>

      <div className="rounded-xl border bg-white dark:bg-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50">
        {MOCK_TEAM.map((member) => (
          <div key={member.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
            <div className="h-9 w-9 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-xs font-semibold text-teal-800 dark:text-teal-200 shrink-0">
              {member.name.split(" ").map((w) => w[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                {member.role === "owner" && <Crown className="h-3 w-3 text-amber-500" />}
              </div>
              <p className="text-xs text-muted-foreground font-mono">{member.phone}</p>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-medium capitalize",
              member.role === "owner" ? "bg-amber-100 text-amber-700" :
              member.role === "admin" ? "bg-purple-100 text-purple-700" :
              "bg-slate-100 text-slate-600"
            )}>
              {member.role}
            </span>
            {member.status === "invited" && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">Invited</span>
            )}
            {member.role !== "owner" && (
              <button className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Billing Tab ─────────────────────────────────────────────────────────────

function BillingTab() {
  const usage = { contacts: 320, contactsLimit: 500, messages: 2150, messagesLimit: 5000 };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-teal-600" /> Current Plan
        </h3>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
            <Crown className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">Starter Plan</p>
            <p className="text-xs text-muted-foreground">₹999/month · Renews on May 15, 2026</p>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-teal-600" /> Usage This Month
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">Contacts</span>
              <span className="text-xs font-medium text-foreground">{usage.contacts} / {usage.contactsLimit}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-teal-500" style={{ width: `${(usage.contacts / usage.contactsLimit) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">Messages</span>
              <span className="text-xs font-medium text-foreground">{usage.messages.toLocaleString()} / {usage.messagesLimit.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${(usage.messages / usage.messagesLimit) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Cards */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Available Plans</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {PLANS.filter((p) => p.id !== "trial").map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                plan.current ? "border-teal-300 bg-teal-50/50 dark:bg-teal-950/10" : "bg-white dark:bg-slate-800 hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                {plan.current && <span className="text-[10px] font-medium bg-teal-600 text-white px-2 py-0.5 rounded-full">Current</span>}
              </div>
              <p className="text-xl font-bold text-foreground">{plan.price}<span className="text-xs font-normal text-muted-foreground">{plan.duration}</span></p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>{plan.contacts.toLocaleString()} contacts</p>
                <p>{plan.messages.toLocaleString()} messages/mo</p>
                <p>{plan.team} team members</p>
              </div>
              {!plan.current && (
                <button className="mt-3 w-full px-3 py-2 text-xs font-medium rounded-lg border border-teal-300 text-teal-700 hover:bg-teal-50 transition-colors">
                  Upgrade
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your workspace preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "border-teal-600 text-teal-700 dark:text-teal-400"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "general" && <GeneralTab />}
      {activeTab === "whatsapp" && <WhatsAppTab />}
      {activeTab === "team" && <TeamTab />}
      {activeTab === "billing" && <BillingTab />}
    </div>
  );
}
