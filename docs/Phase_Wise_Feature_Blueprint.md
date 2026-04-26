# Phase-Wise Feature Blueprint
## WhatsApp CRM Platform — Competitive Analysis & Complete Feature Roadmap

<table>
<tr><td><b>Document ID</b></td><td>FBP-2026-001</td></tr>
<tr><td><b>Version</b></td><td>2.0</td></tr>
<tr><td><b>Author</b></td><td>Sahil Harkhani</td></tr>
<tr><td><b>Date</b></td><td>April 25, 2026</td></tr>
<tr><td><b>Reference</b></td><td>Technical_Design_Document.md, Development_Guide_And_Testing_Playbook.md</td></tr>
</table>

---

## Table of Contents

1. [Competitive Landscape Analysis](#1-competitive-landscape-analysis)
2. [Feature Sourcing Matrix](#2-feature-sourcing-matrix)
3. [Phase Overview](#3-phase-overview)
4. [Phase 1 — Foundation MVP (Weeks 1-8)](#phase-1--foundation-mvp-weeks-1-8)
5. [Phase 2 — Growth Engine (Weeks 9-16)](#phase-2--growth-engine-weeks-9-16)
6. [Phase 3 — Intelligence Layer (Weeks 17-24)](#phase-3--intelligence-layer-weeks-17-24)
7. [Phase 4 — Scale & Enterprise (Weeks 25-36)](#phase-4--scale--enterprise-weeks-25-36)
8. [Phase 5 — Platform & Ecosystem (Weeks 37-52)](#phase-5--platform--ecosystem-weeks-37-52)
9. [Feature Priority Scoring](#9-feature-priority-scoring)
10. [Competitive Differentiation Strategy](#10-competitive-differentiation-strategy)
11. [Development Steps Per Phase — Complete Build Guide](#11-development-steps-per-phase--complete-build-guide)

---

## 1. Competitive Landscape Analysis

### 1.1 Competitors Studied

| Tool | HQ | Focus | Pricing (Starter) | Core Strength | Key Weakness |
|------|-----|-------|-------------------|---------------|--------------|
| **Zoho CRM** | India | General CRM + Omnichannel | ₹800/user/mo | Deep customization, AI (Zia), huge ecosystem | Not WhatsApp-native; WhatsApp is a bolt-on |
| **WATI** | HK/India | WhatsApp-first CRM | ₹2,499/mo | No-code chatbot, team inbox, 16K+ customers | Expensive for small clinics; no appointment module |
| **AiSensy** | India | WhatsApp marketing | ₹999/mo | Broadcast + retargeting, click-to-WA ads, 210K+ businesses | Weak CRM; no appointment or pipeline management |
| **DoubleTick** | India (Mumbai) | WhatsApp at scale | ₹2,500/mo est. | Multi-WABA, AI governance, SLA tracking, PII masking | Overkill for SMBs; enterprise-focused pricing |
| **Freshworks CRM** | India/US | Full-stack CRM | ₹1,199/user/mo | 360° customer view, marketing automation, Freddy AI | Not WhatsApp-native; complex for clinic owners |
| **Respond.io** | Malaysia | Omnichannel messaging | $79/mo | Omnichannel (WA + IG + FB + Email + Calls), AI agents | Expensive; no healthcare/India-specific features |
| **Interakt** | India | WhatsApp commerce | ₹999/mo | Shopify integration, WhatsApp catalog, order notifications | E-commerce focused; weak CRM, no appointments |
| **Gallabox** | India | WhatsApp shared inbox | ₹999/mo | Simple shared inbox, chatbot, Zoho integration | Limited analytics; no industry vertical features |

### 1.2 Feature Gap Analysis — What NOBODY Does Well for Indian SMBs (Clinics)

```
OUR MOAT — Features we will OWN that competitors either don't have or do poorly:

1. ⭐ WhatsApp-Native Appointment Booking
   → WATI: No appointment module
   → AiSensy: No appointment module
   → DoubleTick: No appointment module
   → Zoho: Has CRM appointments but not WhatsApp-native booking flow
   → WE: Patient types "book" → provider list → slot selection → booked. Done in WhatsApp.

2. ⭐ Double-Booking Prevention (EXCLUSION Constraints)
   → No WhatsApp CRM tool handles concurrent booking race conditions
   → WE: PostgreSQL EXCLUSION constraint makes double-booking mathematically impossible

3. ⭐ Auto-Reminders via WhatsApp
   → Generic CRMs have email/SMS reminders. Not WhatsApp.
   → WE: 24h + 2h WhatsApp template reminders with one-tap reschedule button

4. ⭐ No-Show Tracking + Auto Follow-Up
   → Nobody offers this
   → WE: Auto-detect no-show → send follow-up next day → track no-show rate

5. ⭐ Clinic-Specific Dashboard
   → Competitors show generic business KPIs
   → WE: Today's appointments, no-show rate, provider utilization, patient retention

6. ⭐ Pricing for Indian SMBs
   → Starter at ₹999/mo (vs WATI ₹2,499, DoubleTick ₹2,500+)
   → UPI autopay (not just credit card)
   → GST-compliant invoicing built-in
```

---

## 2. Feature Sourcing Matrix

Every feature we build is inspired by what works in the market. Here's where each idea comes from:

| Feature | Inspired By | Our Twist |
|---------|-------------|-----------|
| Shared team inbox | WATI, DoubleTick, Respond.io | Add patient context sidebar (last visit, tags, appointments) |
| No-code chatbot | WATI, AiSensy, DoubleTick | Pre-built healthcare templates (booking bot, FAQ bot) |
| Broadcast campaigns | AiSensy, WATI, DoubleTick | Segment by appointment history (no-shows, regular, new) |
| Retargeting campaigns | AiSensy, DoubleTick | Retarget patients who missed follow-ups |
| Click-to-WhatsApp ads | AiSensy, WATI, DoubleTick, Respond.io | One-click CTWA ad creation with conversion tracking |
| AI agents | WATI (Astra), DoubleTick, Respond.io | AI handles appointment FAQs ("What time is Dr available?") |
| Contact scoring | Freshworks, Zoho | Score patients by visit frequency, spend, engagement |
| Custom fields | Zoho, Freshworks | Pre-built clinic fields (blood group, allergies, DOB) |
| Pipeline management | Zoho, Freshworks | Patient journey pipeline: New → Consulted → Treatment → Follow-up |
| Sales sequences / cadences | Zoho, Freshworks | Patient nurture sequences (post-procedure check-ins) |
| 360° contact view | Freshworks, Zoho | Patient 360°: appointments, messages, bills, medical notes |
| Multi-currency | Zoho | Not needed now. Indian market first (INR only) |
| Audit logs | Zoho, Freshworks, DoubleTick | Full audit for HIPAA-like compliance |
| PII masking | DoubleTick | Mask Aadhaar, PAN in chat for staff with limited access |
| SLA tracking | DoubleTick | Response time SLAs for clinics (reply within 5 min) |
| AI sentiment analysis | DoubleTick | Detect unhappy patients before they churn |
| WhatsApp forms | AiSensy | Patient registration forms via WhatsApp |
| WhatsApp webviews | AiSensy | Lab reports, prescriptions viewable inside WhatsApp |
| Appointment system | Our original (none have it) | Full scheduling + slot management + reminders |
| Mobile app | DoubleTick, Freshworks | Doctor/staff app for on-the-go patient replies |
| Multi-WABA | DoubleTick | Support clinic chains with multiple numbers |
| Marketing attribution | Respond.io | Track which campaigns drive most appointments |
| Catalog | WATI, Interakt | Treatment catalog (services + pricing) viewable in WhatsApp |
| WhatsApp Business Calling | WATI, Respond.io | Voice calls through WA Business API |
| Omnichannel (Instagram, FB) | WATI, Respond.io | Phase 5 — start WhatsApp-only |

---

## 3. Phase Overview

```
PHASE 1 — Foundation MVP             Weeks 1-8      "Can businesses use it daily?"
PHASE 2 — Growth Engine              Weeks 9-16     "Can businesses grow with it?"
PHASE 3 — Intelligence Layer         Weeks 17-24    "Can it make businesses smarter?"
PHASE 4 — Scale & Enterprise         Weeks 25-36    "Can business chains use it?"
PHASE 5 — Platform & Ecosystem       Weeks 37-52    "Is it an industry platform?"

Phase 1: Get to revenue. 5 paying businesses (mix of verticals).
Phase 2: Make users sticky. 50 paying businesses.
Phase 3: Add AI moat. 200 paying businesses.
Phase 4: Go upmarket. Multi-location chains, hospitals.
Phase 5: Become the platform. Partner ecosystem, marketplace.
```

```
Feature Count Growth:
Phase 1: 67 features  ← Ship & charge money
Phase 2: 48 features  ← Retention & growth
Phase 3: 42 features  ← AI & intelligence
Phase 4: 38 features  ← Enterprise & scale
Phase 5: 35 features  ← Platform & ecosystem
─────────────────────
Total:  230 features over 12 months

NOTE: Product is multi-vertical (clinics, salons, gyms, education,
restaurants, etc.) with vertical-agnostic core code.
See Development_Guide_And_Testing_Playbook.md Part Zero for details.
```

---

## Phase 1 — Foundation MVP (Weeks 1-8)

> **Goal:** Get 5 clinics paying ₹999/mo. Prove the core value: "Manage your clinic's WhatsApp from one dashboard."

### 1A. Project Foundation (Week 1-2)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 1 | Monorepo scaffolding | Turborepo + pnpm with apps/web, api, webhook, worker + shared packages | — | P0 |
| 2 | Docker Compose dev environment | PostgreSQL 16 + Redis 7 + MinIO (S3-compatible) in one command | — | P0 |
| 3 | CI/CD pipeline | GitHub Actions: lint → type-check → test → build on every push | — | P0 |
| 4 | Shared TypeScript configuration | Strict mode, path aliases, barrel exports across all packages | — | P0 |
| 5 | ESLint + Prettier + Husky | Auto-format on save, block bad commits with pre-commit hook | — | P0 |
| 6 | Environment variable management | `.env.example` with all vars, Zod validation on startup, fail-fast on missing | — | P0 |
| 7 | Health check endpoints | `GET /health` (basic) + `GET /health/ready` (DB + Redis connectivity) | — | P0 |
| 8 | Structured logging | Pino logger with request-id correlation, tenant-id in every log line | DoubleTick | P0 |
| 9 | Error response standardization | Consistent `{ error: { code, message, details? } }` across all endpoints | Respond.io | P0 |
| 10 | Rate limiting middleware | Global rate limiter (100 req/min per IP) + per-endpoint limits | All competitors | P0 |

### 1B. Database & ORM (Week 2)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 11 | Prisma schema — Tenants | Multi-tenant foundation with settings JSONB, plan info, WA credentials | Zoho (multi-org) | P0 |
| 12 | Prisma schema — Users | OTP auth users with roles (owner/admin/staff), belongs to tenant | All | P0 |
| 13 | Prisma schema — Contacts | E.164 phone, name, email, tags[], custom_fields JSONB, opt_out flag | Freshworks, WATI | P0 |
| 14 | Prisma schema — Conversations | Per-contact conversation with status (open/resolved), assigned_to, unread count | WATI, DoubleTick | P0 |
| 15 | Prisma schema — Messages | WhatsApp message store with type enum, content JSONB, status tracking, wa_message_id | All | P0 |
| 16 | Prisma schema — Providers | Doctor/provider profiles with working_hours JSONB, break_hours, slot_duration | Original (no competitor) | P0 |
| 17 | Prisma schema — Appointments | Booking with EXCLUSION constraint (no double-booking), status state machine | Original (no competitor) | P0 |
| 18 | Prisma schema — Templates | WhatsApp template cache with approval status, variables, category | AiSensy, WATI | P0 |
| 19 | Prisma schema — Campaigns | Broadcast campaigns with segment rules, schedule, status, progress tracking | AiSensy, WATI | P1 |
| 20 | Prisma schema — Automation Rules | Keyword triggers + auto-reply rules table | WATI, AiSensy | P1 |
| 21 | Database seed script | 2 tenants, 5 users, 100 contacts, 20 appointments, 200 messages — realistic data | — | P0 |
| 22 | Prisma client singleton | Connection pooling with tenant-aware query helper `prisma.withTenant(tenantId)` | — | P0 |
| 23 | Composite indexes | `(tenant_id, phone_e164)`, `(tenant_id, created_at)`, `(tenant_id, status)` on all tables | — | P0 |

### 1C. Authentication & Authorization (Week 2-3)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 24 | OTP send via SMS (MSG91) | `POST /v1/auth/otp/send` → Generate OTP → Redis (5min TTL) → Send SMS | MSG91 | P0 |
| 25 | OTP send via WhatsApp | Alternative channel: Send OTP as WhatsApp template message | AiSensy (WA OTP) | P1 |
| 26 | OTP verify + JWT issue | `POST /v1/auth/otp/verify` → Validate → Issue access (15min) + refresh (7d) tokens | All | P0 |
| 27 | New user auto-provisioning | First OTP verify → Create Tenant + User → Return onboarding flag | — | P0 |
| 28 | Auth middleware (Fastify plugin) | Extract JWT → Verify → Inject `req.tenantId`, `req.userId`, `req.role` | All | P0 |
| 29 | Role-based access control (RBAC) | Owner (full) / Admin (no billing) / Staff (limited) — enforced at route level | Zoho, Freshworks, DoubleTick | P0 |
| 30 | Token refresh endpoint | `POST /v1/auth/token/refresh` → Issue new access token using refresh token | All | P0 |
| 31 | Logout + token revocation | `POST /v1/auth/logout` → Blacklist refresh token in Redis | All | P0 |
| 32 | OTP brute-force protection | Max 5 attempts per OTP, 1-hour cooldown after lockout, rate limit 5 OTPs/hour/phone | DoubleTick (security) | P0 |
| 33 | Tenant isolation middleware | Every DB query MUST include `WHERE tenant_id = req.tenantId` — enforced programmatically | All multi-tenant CRMs | P0 |

### 1D. WhatsApp Integration (Week 3-4)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 34 | WhatsApp SDK package | `packages/whatsapp-sdk` — typed client for Meta Cloud API v18.0+ | All | P0 |
| 35 | Send text message | Within 24h window — free-form text reply | All | P0 |
| 36 | Send template message | Outside 24h window — pre-approved template with variables | All | P0 |
| 37 | Send interactive message (buttons) | Up to 3 quick-reply buttons (e.g., "Confirm / Reschedule / Cancel") | WATI, AiSensy | P0 |
| 38 | Send interactive message (list) | List menu for slot selection, provider selection | WATI, AiSensy | P0 |
| 39 | Send media message | Image, document, audio, video with optional caption | All | P1 |
| 40 | Webhook receiver | `POST /webhook/whatsapp` — receive all Meta webhook events | All | P0 |
| 41 | Webhook signature verification | HMAC SHA256 validation of `X-Hub-Signature-256` header — reject tampered payloads | All (security) | P0 |
| 42 | Webhook challenge handler | `GET /webhook/whatsapp` — respond to Meta's verification challenge | All | P0 |
| 43 | Inbound message processing | Parse text/image/document/audio → Upsert contact → Create/update conversation → Store message | All | P0 |
| 44 | Message status tracking | Track sent → delivered → read → failed status from webhook events | All | P0 |
| 45 | 24-hour session window detection | Redis key `session:{tenantId}:{contactPhone}` TTL 24h — know when free-form replies are allowed | All | P0 |
| 46 | Phone number normalization | Handle all Indian formats → E.164 (`+91XXXXXXXXXX`) | — | P0 |
| 47 | Webhook deduplication | Redis `SETNX wa_dedup:{wa_message_id}` TTL 24h — prevent processing same event twice | DoubleTick | P0 |
| 48 | Media download + S3 upload | Download received media from Meta CDN → Upload to MinIO/S3 → Store URL in message | All | P1 |

### 1E. Contact Management (Week 4-5)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 49 | Contact list API | `GET /v1/contacts` — cursor-based pagination, sorted by last interaction | Freshworks, Zoho | P0 |
| 50 | Contact search | Search by name (fuzzy), phone (partial), tag (exact) — combined query | All | P0 |
| 51 | Contact create | `POST /v1/contacts` — normalize phone, check duplicate, create | All | P0 |
| 52 | Contact update | `PATCH /v1/contacts/:id` — partial update (name, tags, custom fields) | All | P0 |
| 53 | Contact soft delete | `DELETE /v1/contacts/:id` → status='deleted', excluded from queries | All | P0 |
| 54 | Contact detail + timeline | `GET /v1/contacts/:id` — full profile with message history, appointments, notes | Freshworks (360° view) | P0 |
| 55 | Tag management | Add/remove tags, list all tags for tenant, filter contacts by tag | WATI, AiSensy, DoubleTick | P0 |
| 56 | CSV import (async) | Upload CSV → BullMQ job → Stream parse → Upsert contacts → Progress tracking | AiSensy, WATI | P1 |
| 57 | CSV import duplicate handling | Match by phone — existing: update if newer; new: create; invalid: log error | Freshworks (dedup) | P1 |
| 58 | Opt-out flag management | `opt_out: true` → Contact excluded from all campaigns, staff warned on send | All (compliance) | P0 |
| 59 | Contact auto-creation on inbound | First message from unknown number → Auto-create contact with phone + "new" tag | WATI, AiSensy | P0 |

### 1F. Conversation Inbox (Week 5-6)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 60 | Conversation list API | Sorted by `last_message_at DESC`, shows preview + unread count + assigned_to | WATI, DoubleTick | P0 |
| 61 | Conversation filters | Filter by status (open/resolved/all), assignment (mine/unassigned/all) | WATI, DoubleTick | P0 |
| 62 | Message thread API | `GET /v1/conversations/:id/messages` — cursor pagination, newest first | All | P0 |
| 63 | Reply from inbox | `POST /v1/conversations/:id/messages` — send via WhatsApp, store in thread | All | P0 |
| 64 | Conversation assignment | Assign conversation to team member, re-assign, unassign | WATI, DoubleTick, Respond.io | P0 |
| 65 | Conversation status management | Open → Resolved workflow, re-open on new inbound message | WATI, DoubleTick | P0 |
| 66 | Unread count tracking | Increment on inbound, reset to 0 when staff opens conversation | All | P0 |
| 67 | Mark as read | `POST /v1/conversations/:id/read` — reset unread count | All | P0 |
| 68 | Real-time updates (WebSocket) | Socket.io — new messages, status updates, assignment changes pushed instantly | WATI, DoubleTick | P0 |
| 69 | WebSocket authentication | JWT verification on Socket.io handshake, auto-join tenant room | WATI, DoubleTick | P0 |
| 70 | WebSocket tenant isolation | Tenant A events NEVER visible to Tenant B — enforced by room structure | All (security) | P0 |
| 71 | Quick reply templates | Staff can save & send pre-written replies ("Clinic hours are 9-6 Mon-Sat") | WATI, Respond.io | P1 |
| 72 | Internal notes on conversation | Staff can add internal notes (not sent to patient) visible to team | DoubleTick (Notes), WATI | P1 |

### 1G. Appointment System (Week 6-7)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 73 | Provider CRUD | Add/edit/remove doctors, set name, specialization, photo, slot duration | Original (no competitor) | P0 |
| 74 | Working hours configuration | Per-provider, per-day schedule (Mon 9:00-13:00, 14:00-18:00) | Original | P0 |
| 75 | Break hours configuration | Lunch break, prayer time — excluded from available slots | Original | P0 |
| 76 | Holiday/leave management | Mark specific dates as unavailable for a provider | Original | P1 |
| 77 | Slot availability API | `GET /v1/appointments/slots?providerId=X&date=Y` — returns free slot list | Original | P0 |
| 78 | Manual booking (dashboard) | Staff books appointment from dashboard — select patient, provider, slot | Original | P0 |
| 79 | WhatsApp booking flow | Patient types "book" → Interactive provider list → Slot list → Confirm | Original (KEY DIFFERENTIATOR) | P0 |
| 80 | Booking state machine (Redis) | Track booking conversation state per contact — auto-expire after 10 min | Original | P0 |
| 81 | Double-booking prevention | PostgreSQL EXCLUSION constraint + distributed lock — mathematically impossible | Original (KEY DIFFERENTIATOR) | P0 |
| 82 | Booking confirmation message | Auto-send WhatsApp template: "Your appointment with Dr. Sharma on Apr 25 at 10:00 AM is confirmed" | Original | P0 |
| 83 | Auto-reminder (24h before) | BullMQ delayed job → Send WhatsApp template reminder 24 hours before | Original (KEY DIFFERENTIATOR) | P0 |
| 84 | Auto-reminder (2h before) | BullMQ delayed job → Send WhatsApp template reminder 2 hours before | Original | P0 |
| 85 | Appointment cancellation | Patient or staff cancels → Slot freed → Cancellation confirmation sent | Original | P0 |
| 86 | Appointment rescheduling | Cancel old + book new in atomic transaction | Original | P1 |
| 87 | No-show auto-detection | Cron: appointment_end + 30min, not marked completed → flag as no_show | Original (KEY DIFFERENTIATOR) | P1 |
| 88 | No-show follow-up | Auto-send message next day: "We missed you! Would you like to rebook?" | Original | P1 |
| 89 | Today's appointment dashboard | Dashboard card: Today's bookings, status (confirmed/completed/no-show), provider-wise | Original | P0 |

### 1H. Basic Dashboard (Week 7)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 90 | KPI cards | Today's stats: New messages, Open conversations, Today's appointments, Active contacts | All dashboards | P0 |
| 91 | Message volume chart (7d) | Bar chart: Messages sent vs received per day | AiSensy, WATI | P0 |
| 92 | Appointment summary chart | Today's appointments by status (confirmed, completed, cancelled, no-show) | Original | P0 |
| 93 | Dashboard caching | Redis cache with 30-second TTL for dashboard queries | — | P0 |

### 1I. Basic Settings (Week 7)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 94 | WhatsApp account linking | Enter WA Phone ID, Business ID, Access Token → Verify → Store encrypted | All | P0 |
| 95 | Business profile setting | Clinic name, address, logo, business type, timezone | Zoho, Freshworks | P0 |
| 96 | Business hours configuration | Set operating hours → Auto-reply outside hours ("We'll reply when we open at 9 AM") | WATI, DoubleTick | P0 |
| 97 | Away message configuration | Custom auto-reply text for outside business hours | WATI, AiSensy | P0 |

### 1J. Billing MVP (Week 8)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 98 | Plan selection page | Show Starter (₹999), Growth (₹2,499), Pro (₹4,999) with feature comparison | All | P0 |
| 99 | Razorpay subscription integration | Create recurring subscription, UPI autopay + card + netbanking | — | P0 |
| 100 | Payment success → activate plan | Webhook: payment.captured → Update tenant plan + expiry date | — | P0 |
| 101 | Payment failure → grace period | Webhook: payment.failed → 7-day grace, notify user, retry | — | P0 |
| 102 | Trial management | 14-day free trial, feature-limited after expiry until subscription | All | P0 |
| 103 | Usage tracking | Track messages sent, contacts created against plan limits | WATI, AiSensy | P0 |
| 104 | Plan limit enforcement | Block message send / contact create when limit reached → Show upgrade CTA | All | P0 |

### 1K. Frontend — Next.js Web App (Throughout Weeks 3-8)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 105 | Login page | Phone input → OTP → Verify → Dashboard or Onboarding | All | P0 |
| 106 | Onboarding wizard (3 steps) | Step 1: Business details → Step 2: Connect WhatsApp → Step 3: Invite team | WATI onboarding | P0 |
| 107 | Sidebar navigation | Dashboard, Inbox, Contacts, Appointments, Campaigns (locked), Settings | All | P0 |
| 108 | Inbox page — 3-column layout | Left: conversation list + filters, Center: chat thread, Right: contact sidebar | WATI, DoubleTick | P0 |
| 109 | Contacts page — table view | Sortable table with search, tag filter, pagination, bulk actions | Freshworks, Zoho | P0 |
| 110 | Contact detail page | Profile + timeline (messages, appointments, notes) in single view | Freshworks (360°) | P0 |
| 111 | Appointments page — calendar | Day/week view with drag-drop, slot creation, status color-coding | Original | P0 |
| 112 | Settings pages | Business, WhatsApp, Team, Billing — tabbed layout | All | P0 |
| 113 | Mobile responsive | All pages usable on 360px+ screens — clinic staff often use phones | All mobile apps | P0 |
| 114 | Dark mode | Toggle dark/light theme — stored in localStorage | Modern standard | P2 |

### Phase 1 Summary

```
TOTAL FEATURES: 114
P0 (Must Have): 91
P1 (Should Have): 17
P2 (Nice to Have): 6

Revenue Target: 5 paying businesses × ₹999/mo = ₹4,995/mo MRR
Success Metric: A business can book slots, reply to customers, and send reminders
                entirely from our dashboard within 10 minutes of signup.
```

---

## Phase 2 — Growth Engine (Weeks 9-16)

> **Goal:** Make users sticky. Add campaign engine, automation, and features that grow clinic revenue. Target: 50 paying clinics.

### 2A. Campaign & Broadcast Engine

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 115 | Campaign creation wizard | Name → Select template → Define segment → Schedule → Review → Send | AiSensy, WATI | P0 |
| 116 | Segment builder | Filter contacts by: tags, last visit date, appointment count, opt-in status | AiSensy (smart segments), Freshworks | P0 |
| 117 | Advanced segment conditions | AND/OR logic, nested conditions: "tag = 'dental' AND last_visit > 30 days ago" | Freshworks, Zoho | P1 |
| 118 | Campaign scheduling | Schedule for future date/time, or send immediately | AiSensy (WhatsApp Scheduler) | P0 |
| 119 | Timezone-aware scheduling | Schedule broadcasts in tenant's timezone (IST default) | AiSensy | P0 |
| 120 | Batched execution | Queue messages in batches of 100, rate-limited at 80 msg/sec to Meta API | AiSensy, WATI | P0 |
| 121 | Campaign progress (real-time) | WebSocket push: live counter of sent/delivered/read/failed during campaign | AiSensy, DoubleTick | P0 |
| 122 | Pause / Resume campaign | Pause mid-send, resume from where it stopped | DoubleTick | P1 |
| 123 | Cancel campaign | Stop remaining messages, mark campaign as cancelled | DoubleTick | P1 |
| 124 | Campaign analytics dashboard | Per-campaign: sent count, delivery rate, read rate, response rate, failure rate | AiSensy (Broadcast Analytics), DoubleTick | P0 |
| 125 | Failed message retry | Button to retry failed messages (individual or bulk) | AiSensy | P1 |
| 126 | Campaign contact exclusion | Auto-exclude: opted-out contacts, recently contacted (24h), invalid numbers | All (compliance) | P0 |
| 127 | Retargeting campaigns | Re-broadcast to contacts who didn't read/respond to a previous campaign | AiSensy (Smart Retargeting), DoubleTick | P1 |
| 128 | Campaign A/B testing | Send 2 template variants to 10% sample → Pick winner → Send to rest | Respond.io | P2 |

### 2B. Template Management

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 129 | Template CRUD (in-dashboard) | Create/edit WhatsApp message templates directly from dashboard | AiSensy, WATI | P0 |
| 130 | Template submission to Meta | Submit template for approval via API → Track approval status | AiSensy ("Quick Fast Approval") | P0 |
| 131 | Template variable preview | Live preview showing how template renders with sample data | WATI | P0 |
| 132 | Pre-built template library | 15+ ready-made templates for clinics: appointment reminder, booking confirmation, follow-up, welcome, feedback request, holiday greeting, payment reminder | Original (industry-specific) | P1 |
| 133 | Template categorization | Organize by type: marketing, utility, authentication, service | Meta API requirement | P0 |
| 134 | Template usage analytics | Track which templates perform best (delivery rate, read rate) | DoubleTick | P1 |

### 2C. Automation Rules

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 135 | Keyword auto-reply | If incoming message contains "hours" → Auto-reply with business hours | WATI, AiSensy | P0 |
| 136 | Welcome message (new contact) | First message from new number → Auto-send welcome template | AiSensy, WATI | P0 |
| 137 | Working hours auto-reply | Message outside business hours → "Sorry, we're closed. We'll reply at 9 AM" | WATI, DoubleTick | P0 |
| 138 | Auto-assign rules | Route conversations by keyword/tag: "dental" → assign to Dr. Mehta | DoubleTick (Auto Lead Assignment), WATI | P1 |
| 139 | Auto-tag on keyword | Message contains "emergency" → Auto-add "urgent" tag to contact | AiSensy (Agent Rules) | P1 |
| 140 | Appointment booking trigger | Message contains "book" / "appointment" / "schedule" → Trigger booking flow | Original | P0 |
| 141 | Automation rule builder UI | Visual rule builder: IF [condition] THEN [action] — no code needed | WATI (no-code), AiSensy | P1 |

### 2D. Team Management

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 142 | Invite team member | Enter phone → Send OTP → On verify → Create user with selected role | All | P0 |
| 143 | Remove/deactivate team member | Soft-delete user → Can't login → Conversations reassigned | All | P0 |
| 144 | Role management | Owner / Admin / Staff / Custom role with fine-grained permissions | Zoho, Freshworks, DoubleTick (Hierarchy) | P0 |
| 145 | Team activity log | See who sent what message, who handled which conversation | DoubleTick (Agent Productivity) | P1 |
| 146 | Agent online status | Show which staff are currently online/offline | WATI, DoubleTick | P1 |
| 147 | Conversation transfer | Transfer conversation from one agent to another with context notes | WATI, DoubleTick | P0 |

### 2E. CSV Export & Reporting

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 148 | Contact CSV export | Export filtered contacts to CSV (for offline use, backup) | AiSensy, WATI | P0 |
| 149 | Campaign report export | Download campaign analytics as CSV/PDF | AiSensy, DoubleTick | P1 |
| 150 | Appointment report | Monthly appointment summary: booked, completed, no-show, cancelled, by provider | Original | P0 |
| 151 | Message volume report | Weekly/monthly message stats: sent, received, template vs free-form | All | P0 |
| 152 | Invoice/billing history | List of invoices, download as PDF, GST details | — | P0 |

### 2F. Enhanced Dashboard

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 153 | Appointment calendar view | Full calendar with day/week/month views, drag to reschedule | Zoho Calendar | P0 |
| 154 | Message volume chart (30d) | Extended time range with toggle: 7d / 30d / custom range | DoubleTick, AiSensy | P0 |
| 155 | Contact growth trend | Line chart: New contacts per day/week over 30 days | Freshworks | P1 |
| 156 | Campaign performance summary | Table: Last 10 campaigns with delivery/read rates at a glance | AiSensy, DoubleTick | P0 |
| 157 | Provider utilization chart | Per-doctor: booked slots / available slots = utilization % | Original | P1 |
| 158 | No-show rate tracking | Overall + per-provider no-show rate with trend line | Original | P1 |
| 159 | Date range selector | Pick custom date range for all dashboard analytics | All | P0 |

### 2G. UX Improvements

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 160 | Quick actions menu | From inbox: one-click "Book Appointment" / "Add Tag" / "Assign to" | Respond.io | P1 |
| 161 | Keyboard shortcuts | `/` to search, `Ctrl+Enter` to send, `E` to resolve, `A` to assign | DoubleTick (productivity) | P2 |
| 162 | Notification center | Bell icon → Recent events: new messages, appointment reminders, campaign complete | Freshworks | P1 |

### Phase 2 Summary

```
TOTAL NEW FEATURES: 48 (cumulative: 162)
P0 (Must Have): 27
P1 (Should Have): 16
P2 (Nice to Have): 5

Revenue Target: 50 businesses × avg ₹1,500/mo = ₹75,000/mo MRR
Success Metric: Businesses send 3+ campaigns/month AND use booking reminders weekly
Churn Gate: If businesses use campaigns + bookings, churn drops below 5%/month
```

---

## Phase 3 — Intelligence Layer (Weeks 17-24)

> **Goal:** Add AI and intelligence features that make the platform smarter than competitors. Target: 200 paying clinics.

### 3A. No-Code Chatbot Builder

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 163 | Chatbot flow builder (drag & drop) | Visual canvas: Message → Button → Condition → Action nodes | WATI, AiSensy (No-Code Chatbot) | P0 |
| 164 | Message node types | Text, Image, Document, Interactive (buttons/list), Template | WATI | P0 |
| 165 | Condition nodes | Branch on: keyword match, contact tag, time of day, custom field value | WATI, DoubleTick | P0 |
| 166 | Action nodes | Auto-tag, assign conversation, trigger booking flow, send to human agent | WATI, DoubleTick | P0 |
| 167 | Delay node | Wait X minutes/hours before next step (drip sequence within WhatsApp) | WATI, Freshworks (Sales Sequences) | P1 |
| 168 | Human handoff node | Smoothly transfer from bot to human agent with context summary | AiSensy ("Smooth Bot-to-Human Transfer"), WATI | P0 |
| 169 | Pre-built bot templates | 5 clinic-specific templates: Appointment Booking Bot, FAQ Bot, Feedback Collection Bot, New Patient Registration Bot, Treatment Info Bot | Original (industry-specific) | P0 |
| 170 | Bot analytics | Per-bot: trigger count, completion rate, drop-off point, handoff rate | DoubleTick (Bot Journey Analytics) | P1 |
| 171 | Bot debug/test mode | Test bot flow before publishing — simulate patient messages | DoubleTick (Bot Runs Log) | P1 |
| 172 | Bot active hours | Only activate bot during/outside business hours (configurable) | DoubleTick (Working Hours) | P1 |

### 3B. AI Features (Phase 3 — Early AI)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 173 | AI auto-reply suggestions | AI reads incoming message → Suggests 2-3 reply options for staff to click | WATI (AI Support Agent), Respond.io (AI Agents) | P0 |
| 174 | AI message summarization | Long conversation → One-paragraph summary (for agent taking over) | DoubleTick (Chat Summaries) | P1 |
| 175 | AI smart-compose | Staff types partial reply → AI autocompletes the sentence | Respond.io | P2 |
| 176 | AI FAQ auto-responder | Train on clinic's FAQ document → Auto-answer common questions ("Where is your clinic?") | WATI (AI Support Agent — "60% queries answered"), DoubleTick | P0 |
| 177 | Sentiment detection | Detect positive/negative/neutral — flag negative conversations for priority handling | DoubleTick (CX Topics/Sentiment) | P1 |
| 178 | AI contact deduplication | Detect potential duplicate contacts by name similarity, auto-suggest merge | Freshworks (Freddy Deduplication) | P1 |
| 179 | Knowledge base for AI | Upload clinic's documents (services, policies, pricing) → AI uses as context | WATI (train on knowledge base), DoubleTick | P0 |

### 3C. Custom Fields & Contact Enrichment

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 180 | Custom field builder | Tenants define custom fields: text, number, date, dropdown, checkbox | Zoho, Freshworks (Custom Fields) | P0 |
| 181 | Pre-built clinic fields | Blood group, allergies, DOB, gender, insurance_id, patient_id — ready to use | Original (industry-specific) | P0 |
| 182 | Custom field in contact card | Display custom fields in contact detail sidebar + edit inline | Freshworks (Summary Section) | P0 |
| 183 | Filter by custom field | Search contacts by custom field value ("blood_group = O+") | Zoho, Freshworks | P1 |
| 184 | Auto-profile enrichment | Extract details from chat (name, DOB, address) → Suggest updates to contact profile | Freshworks (Auto-Profile Enrichment) | P2 |

### 3D. Patient Journey Pipeline

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 185 | Pipeline view (Kanban) | Visual board: New → Enquiry → Appointment Booked → Consulted → Treatment → Follow-Up | Zoho, Freshworks (Multiple Pipelines) | P0 |
| 186 | Auto-move on event | Appointment booked → Move contact to "Booked" stage automatically | Zoho (Workflows), Freshworks | P1 |
| 187 | Pipeline stage actions | Configurable: when contact enters stage → auto-send template message | Zoho (Cadences), Freshworks (Sales Sequences) | P1 |
| 188 | Pipeline analytics | Conversion rates per stage, average time in each stage, drop-off rate | Zoho (Forecasting), Freshworks | P1 |

### 3E. WhatsApp Forms & Catalog

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 189 | WhatsApp forms (patient registration) | Collect patient details via structured form within WhatsApp (name, DOB, allergies) | AiSensy (WhatsApp Forms) | P1 |
| 190 | Treatment/service catalog | List treatments with price in WhatsApp catalog format (viewable in chat) | WATI (Catalog), Interakt | P1 |
| 191 | Catalog browsing in WhatsApp | Patients can browse treatments, ask about specific service → Bot answers | WATI (WhatsApp Catalog) | P2 |

### 3F. Advanced Inbox Features

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 192 | Conversation labels/categories | Add labels: urgent, follow-up, billing, feedback — in addition to tags | DoubleTick (Advanced Filters) | P1 |
| 193 | Canned responses library | Team-shared quick replies organized by category ("greetings", "billing", "appointments") | WATI, Respond.io | P0 |
| 194 | Conversation search | Full-text search across all conversations and messages | DoubleTick, WATI | P0 |
| 195 | Chat history export | Export specific conversation as PDF (for medical records) | Original (healthcare-specific) | P1 |
| 196 | Starred/pinned conversations | Pin important conversations to top of inbox | DoubleTick | P2 |
| 197 | Typing indicator | Show "Staff is typing..." to patient (WhatsApp supports this) | All messaging apps | P2 |
| 198 | Read receipts display | Show blue ticks, double ticks, single tick in chat UI | All messaging apps | P0 |

### 3G. Notifications & Alerts

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 199 | Browser push notifications | New message in assigned conversation → Desktop push notification | WATI, Freshworks | P0 |
| 200 | Email notifications | Daily summary: unresolved conversations, upcoming appointments, campaign results | Freshworks (Internal Notifications) | P1 |
| 201 | WhatsApp notification to staff | Urgent flagged conversation → Send WhatsApp alert to clinic owner | Original | P2 |
| 202 | Configurable notification preferences | Per-user: which events trigger which notification channel | Freshworks, Zoho | P1 |
| 203 | Slack/Discord integration for notifications | Push alerts to team's Slack/Discord channel | Freshworks (Slack), Zoho | P2 |
| 204 | Low balance alert | WhatsApp conversation credit running low → Alert owner | AiSensy, WATI | P1 |

### Phase 3 Summary

```
TOTAL NEW FEATURES: 42 (cumulative: 204)
P0 (Must Have): 17
P1 (Should Have): 18
P2 (Nice to Have): 7

Revenue Target: 200 businesses × avg ₹2,000/mo = ₹4,00,000/mo MRR
Success Metric: 50% of businesses use chatbot or AI features
Competitive Gate: No WhatsApp CRM tool has an AI-powered booking + chatbot
                  combo with no-code builder specifically for Indian SMBs
```

---

## Phase 4 — Scale & Enterprise (Weeks 25-36)

> **Goal:** Go upmarket. Support clinic chains, hospitals, large practices. Target: Multi-location tenants paying ₹10K+/mo.

### 4A. Multi-Location Support

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 205 | Multi-WABA support | One tenant → Multiple WhatsApp numbers (one per branch/location) | DoubleTick (Multi-WABA), WATI (Multiple Numbers) | P0 |
| 206 | Location management | Add branches: name, address, phone number, providers, operating hours per location | DoubleTick | P0 |
| 207 | Per-location inbox | Filter inbox by location — see only that branch's conversations | DoubleTick | P0 |
| 208 | Cross-location broadcast | Send campaign from central HQ to contacts across all locations | DoubleTick (Multi-Number Campaigns) | P1 |
| 209 | Cross-location analytics | Aggregate dashboard comparing performance across branches | DoubleTick (Multi-Number Analytics) | P1 |
| 210 | Per-location team assignment | Staff assigned to specific location, see only their branch's data | DoubleTick (Hierarchical Team Management) | P0 |

### 4B. Advanced Security & Compliance

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 211 | PII masking in chat | Auto-mask Aadhaar, PAN, bank account numbers in conversation view for limited-access staff | DoubleTick (PII Masking) | P1 |
| 212 | Audit trail | Every action logged: who did what, when, on which record — immutable log | DoubleTick (SLA Tracking), Zoho (Audit Logs), Freshworks | P0 |
| 213 | Data retention policies | Auto-archive conversations older than configurable period (90/180/365 days) | Enterprise standard | P1 |
| 214 | Two-factor authentication | Optional 2FA for admin/owner accounts (OTP on every login) | Enterprise standard | P1 |
| 215 | IP allowlisting | Restrict dashboard access to specific IP ranges (for hospital IT policies) | Enterprise standard | P2 |
| 216 | Field-level permissions | Certain custom fields (e.g., medical history) visible only to specific roles | Freshworks (Field Permissions) | P1 |
| 217 | Session management | View active sessions, force-logout from all devices | Enterprise standard | P1 |

### 4C. SLA & Governance

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 218 | SLA configuration | Set response time targets: "Reply within 5 minutes during business hours" | DoubleTick (SLA Tracking) | P1 |
| 219 | SLA breach alerts | Real-time alert when conversation exceeds response time target | DoubleTick ("Flag SLA breaches in real time") | P1 |
| 220 | SLA dashboard | Team-wise SLA adherence rates, average response times, breach count | DoubleTick (Team-Wise SLA Reports) | P1 |
| 221 | Agent performance scoring | Score agents on: response time, resolution rate, customer satisfaction | DoubleTick (Agent Productivity), Freshworks | P1 |
| 222 | Conversation rating | Patients rate conversation (1-5 stars) via WhatsApp interactive message | DoubleTick (CX Governance) | P2 |

### 4D. Advanced AI

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 223 | AI Agent (autonomous) | Fully autonomous AI handles appointment queries, FAQs, and basic booking without human | WATI (Inbound Intelligence Agent), Respond.io (AI Agents), DoubleTick (AI Conversation Agents) | P0 |
| 224 | AI Agent training interface | Upload documents, website URL, past conversations → AI learns clinic's context | WATI ("Train in minutes"), DoubleTick | P0 |
| 225 | AI Agent handoff rules | Escalate to human when: sentiment negative, 3+ failed answers, patient asks for human | WATI, Respond.io, AiSensy (Bot-to-Human Transfer) | P0 |
| 226 | AI topic analysis | Categorize conversations by topic: appointment, billing, complaint, inquiry, feedback | DoubleTick (CX Topics Charts) | P1 |
| 227 | AI-powered contact scoring | Score contacts by: visit frequency, engagement rate, spend, appointment adherence | Freshworks (Freddy Contact Scoring), Zoho | P1 |
| 228 | Predictive no-show | ML model: predict which patients are likely to no-show → Send extra reminder | Original (healthcare-specific AI) | P2 |

### 4E. Integrations

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 229 | Zapier integration | Connect to 5000+ apps via Zapier webhooks (trigger: new appointment, new contact, etc.) | WATI, AiSensy, DoubleTick | P0 |
| 230 | Google Sheets sync | Two-way sync contacts and appointments to Google Sheets | DoubleTick (Google Sheets), WATI | P1 |
| 231 | Google Calendar sync | Sync appointments to doctor's Google Calendar (two-way) | Original (healthcare-specific) | P1 |
| 232 | Webhook API (outbound) | Fire webhooks on events (new message, new appointment, status change) → External systems | Freshworks (Webhooks) | P0 |
| 233 | REST API for developers | Documented public API for custom integrations (rate-limited, API key auth) | All enterprise products | P0 |
| 234 | Zoho CRM sync | Two-way contact sync with Zoho CRM (hugely popular in India) | WATI (Zoho Integration) | P2 |

### 4F. Click-to-WhatsApp Ads

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 235 | CTWA campaign creation | Create Facebook/Instagram ads that open WhatsApp chat from within our dashboard | AiSensy (Drive 5x Leads with CTWA), WATI (CTWA), DoubleTick (CTWA Campaigns) | P1 |
| 236 | CTWA conversion tracking | Track: ad click → WhatsApp conversation → appointment booked (full funnel) | Respond.io (Attribution), DoubleTick | P1 |
| 237 | CTWA auto-responder | When lead comes from ad → Auto-trigger specific chatbot flow | AiSensy, DoubleTick | P1 |
| 238 | Ad source attribution | Tag contacts with `source: facebook_ad_{campaign_id}` for ROI measurement | Respond.io, Freshworks (Attribution Reports) | P1 |

### 4G. Performance & Scaling

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 239 | BullMQ → Kafka migration | Replace BullMQ with Kafka for message processing at 500+ tenants | Architecture decision from TDD | P0 |
| 240 | Database read replicas | Route analytics/reporting queries to read replica | Architecture decision from TDD | P0 |
| 241 | Connection pooling (PgBouncer) | Pool database connections for multi-tenant efficiency | Architecture decision from TDD | P0 |
| 242 | CDN for media | Serve uploaded images/documents via CloudFront CDN | Architecture decision from TDD | P0 |

### Phase 4 Summary

```
TOTAL NEW FEATURES: 38 (cumulative: 242)
P0 (Must Have): 14
P1 (Should Have): 18
P2 (Nice to Have): 6

Revenue Target: 500 businesses × avg ₹3,000/mo + 10 chains × ₹15,000/mo = ₹16.5L/mo MRR
Success Metric: First multi-location business chain onboarded
Enterprise Gate: Audit trail + PII masking + SLA tracking → enterprise-ready
```

---

## Phase 5 — Platform & Ecosystem (Weeks 37-52)

> **Goal:** Transform from a tool into a platform. Build an ecosystem with integrations, marketplace, and partner network. Target: ₹50L+/mo MRR.

### 5A. Omnichannel Expansion

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 243 | Instagram DM integration | Manage Instagram messages in the same unified inbox | WATI (Instagram/Facebook Messenger), Respond.io | P1 |
| 244 | Facebook Messenger integration | Manage FB Messenger conversations alongside WhatsApp | WATI, Respond.io | P1 |
| 245 | SMS channel | Send/receive SMS (Gupshup/MSG91 provider) from unified inbox | Respond.io, Freshworks (SMS) | P2 |
| 246 | Email channel | Basic email support (receive patient emails, reply from inbox) | Respond.io, Freshworks (Email), Zoho | P2 |
| 247 | WhatsApp Business Calling | In-app VoIP calls via WhatsApp Business API (new Meta feature) | WATI (WhatsApp Business Calling), Respond.io | P1 |
| 248 | Call recording + transcription | Record WhatsApp calls, AI transcription for review | DoubleTick (Call Summaries), Respond.io | P2 |
| 249 | Unified contact merge (cross-channel) | Same patient on WA + IG + Email → Merge into single contact profile | Respond.io (unified inbox) | P1 |

### 5B. Marketplace & Platform

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 250 | Integration marketplace | Browse and install integrations from a curated marketplace | Freshworks (Marketplace), Zoho | P1 |
| 251 | Webhook builder (no-code) | Visual interface to create webhook integrations without developer help | Zoho (Kiosk Studio) | P2 |
| 252 | Custom module builder | Tenants create custom data modules (e.g., "Lab Reports", "Procedures") | Zoho (Custom Modules) | P2 |
| 253 | Public API v2 (comprehensive) | Full REST + Webhook API with API key management, rate limits, usage dashboard | Zoho, Freshworks | P0 |
| 254 | Developer portal & docs | Developer documentation with API reference, guides, code samples | All enterprise platforms | P0 |
| 255 | Partner portal | Resellers/agencies can manage multiple clinic accounts, earn commission | WATI (Partners), DoubleTick (Channel Partner), AiSensy (Partner) | P1 |

### 5C. Advanced Analytics & BI

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 256 | Custom report builder | Drag-and-drop report builder: choose metrics, dimensions, chart types, filters | Zoho (Analytics), DoubleTick (Custom Reports), Freshworks (Custom Reports) | P0 |
| 257 | Scheduled report delivery | Auto-send reports weekly/monthly via email or WhatsApp | Zoho, Freshworks | P1 |
| 258 | Cohort analysis | Patient retention by signup month — are patients returning? | Advanced analytics | P2 |
| 259 | Funnel analysis | Track patient journey: First contact → Appointment → Visit → Follow-up → Return visit | Freshworks (Conversion Reports), DoubleTick (Campaign Funnels) | P1 |
| 260 | Attribution analytics | Which channel/campaign/ad drove the most appointments/revenue? | Respond.io (Attribution), Freshworks (Attribution Reports) | P1 |
| 261 | Comparative benchmarks | Compare your clinic's metrics against anonymized industry averages | Original (unique selling point) | P2 |
| 262 | Patient lifetime value (LTV) | Calculate per-patient LTV based on visit frequency and treatment value | Zoho (Forecasting), Freshworks (Deal Insights) | P2 |

### 5D. Mobile App (Native)

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 263 | Mobile app (React Native) | Full-featured mobile app for doctors/staff — inbox, appointments, dashboard | DoubleTick (Mobile App), WATI (AppStore), Freshworks (Mobile) | P0 |
| 264 | Push notifications (mobile) | Real-time push notification for new messages, upcoming appointments | All mobile apps | P0 |
| 265 | Quick reply from notification | Reply to patient directly from push notification without opening app | Modern messaging apps | P1 |
| 266 | Offline mode | View contacts, appointments, recent conversations offline — sync when back online | Freshworks (Mobile Offline Mode) | P2 |
| 267 | Voice notes | Record and send voice notes to patients via WhatsApp | Freshworks (Voice Notes) | P2 |
| 268 | QR code check-in | Patient scans QR at clinic → Auto-marks arrival, notifies doctor | Original (healthcare-specific) | P2 |

### 5E. Advanced Patient Engagement

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 269 | Patient nurture sequences | Automated multi-step follow-up: Day 1 → Day 3 → Day 7 → Day 30 post-treatment | Zoho (Cadences), Freshworks (Sales Sequences) | P0 |
| 270 | Feedback collection | Post-visit: auto-send feedback form via WhatsApp → Store rating → Alert on negative | Respond.io, Original | P1 |
| 271 | Birthday/anniversary greetings | Auto-send personalized birthday greeting (if DOB stored) | Common CRM feature | P1 |
| 272 | Re-activation campaigns | Contacts inactive >90 days → Auto-send "We miss you" campaign | AiSensy (Retargeting), Freshworks | P1 |
| 273 | Referral tracking | Patient refers friend → Track referral source → Reward program hooks | Original | P2 |
| 274 | WhatsApp payments | Collect payments via WhatsApp Pay (UPI) directly in chat | AiSensy ("Collect payments within WhatsApp") | P2 |
| 275 | Prescription/report sharing | Share lab reports, prescriptions as secure PDF via WhatsApp | Original (healthcare-specific) | P1 |

### 5F. Enterprise-Grade Operations

| # | Feature | Description | Inspired By | Priority |
|---|---------|-------------|-------------|----------|
| 276 | SSO (SAML/OIDC) | Single sign-on for hospital IT integration | Enterprise standard | P2 |
| 277 | Custom branding (white-label) | Remove our branding, replace with clinic's logo and colors | Enterprise feature | P2 |

### Phase 5 Summary

```
TOTAL NEW FEATURES: 35 (cumulative: 277)
P0 (Must Have): 8
P1 (Should Have): 15
P2 (Nice to Have): 12

Revenue Target: 1000 businesses × avg ₹3,500/mo + 30 chains × ₹20K + enterprise deals = ₹50L+/mo MRR
Platform Gate: Public API + marketplace + partner portal → ecosystem lock-in
```

---

## 9. Feature Priority Scoring

### 9.1 Scoring Framework (RICE)

Each feature is scored using RICE:

```
RICE Score = (Reach × Impact × Confidence) / Effort

Reach:      How many users benefit? (1-10)
Impact:     How big is the benefit? (0.25, 0.5, 1, 2, 3)
Confidence: How sure are we? (Low=0.5, Medium=0.8, High=1.0)
Effort:     Person-days to build (1-20)
```

### 9.2 Top 20 Features by RICE Score

| Rank | Feature | Reach | Impact | Conf | Effort | RICE | Phase |
|------|---------|-------|--------|------|--------|------|-------|
| 1 | WhatsApp booking flow (#79) | 10 | 3 | 1.0 | 5 | 6.0 | 1 |
| 2 | Auto-reminder 24h (#83) | 10 | 3 | 1.0 | 2 | 15.0 | 1 |
| 3 | Shared team inbox (#60-70) | 10 | 3 | 1.0 | 8 | 3.75 | 1 |
| 4 | Keyword auto-reply (#135) | 9 | 2 | 0.8 | 2 | 7.2 | 2 |
| 5 | Broadcast campaigns (#115-128) | 8 | 3 | 0.8 | 10 | 1.92 | 2 |
| 6 | No-show tracking (#87-88) | 8 | 2 | 1.0 | 3 | 5.33 | 1 |
| 7 | Working hours auto-reply (#137) | 10 | 1 | 1.0 | 1 | 10.0 | 2 |
| 8 | Chatbot flow builder (#163-172) | 7 | 3 | 0.8 | 15 | 1.12 | 3 |
| 9 | AI FAQ auto-responder (#176) | 7 | 2 | 0.8 | 8 | 1.4 | 3 |
| 10 | Mobile app (#263-268) | 9 | 2 | 0.8 | 20 | 0.72 | 5 |
| 11 | CSV import (#56-57) | 6 | 1 | 1.0 | 3 | 2.0 | 1 |
| 12 | Template management (#129-134) | 8 | 2 | 1.0 | 5 | 3.2 | 2 |
| 13 | Pipeline view (#185-188) | 5 | 2 | 0.8 | 8 | 1.0 | 3 |
| 14 | Multi-WABA (#205-210) | 3 | 3 | 0.8 | 10 | 0.72 | 4 |
| 15 | Zapier integration (#229) | 6 | 2 | 0.8 | 5 | 1.92 | 4 |
| 16 | AI Agent autonomous (#223-225) | 5 | 3 | 0.5 | 15 | 0.5 | 4 |
| 17 | CTWA campaigns (#235-238) | 4 | 2 | 0.8 | 8 | 0.8 | 4 |
| 18 | Custom report builder (#256) | 4 | 2 | 0.8 | 10 | 0.64 | 5 |
| 19 | Patient nurture sequences (#269) | 6 | 2 | 0.8 | 8 | 1.2 | 5 |
| 20 | Retargeting campaigns (#127) | 5 | 2 | 0.8 | 5 | 1.6 | 2 |

### 9.3 Kill List — Features We Consciously SKIP

| Feature | Exists In | Why We Skip It |
|---------|-----------|---------------|
| Email marketing (newsletters) | Zoho, Freshworks | Our audience is WhatsApp-first, not email-first |
| Landing page builder | Freshworks, Zoho | Not core to clinic workflow — use Carrd.co instead |
| Social CRM (Twitter/X) | Zoho, Freshworks | Indian clinics don't get patients via Twitter |
| Complex sales forecasting | Zoho, Freshworks | Clinics don't have a "sales pipeline" in the Zoho sense |
| Territory management | Zoho | Overkill for SMBs, maybe Phase 5+ for hospital chains |
| CPQ (Configure-Price-Quote) | Zoho | Not relevant for appointment-based businesses |
| Conversion rate optimization (heatmaps) | Freshworks | We're not a website analytics tool |
| Multi-language UI (10+ languages) | Zoho | English + Hindi is sufficient for V1 India market |
| Ecommerce shopping cart | Interakt, WATI | We're healthcare-focused, not e-commerce |
| Product catalog for e-commerce | Interakt, WATI (Shop) | Treatment catalog (Phase 3) is enough |

---

## 10. Competitive Differentiation Strategy

### 10.1 Positioning Matrix

```
                 LOW PRICE                    HIGH PRICE
                    │
     AiSensy ───────┤
     Gallabox ──────┤                 
     Interakt ──────┤
                    │
 GENERIC ───────────┼─────────────────────── VERTICAL
                    │
     ★ OUR CRM ────┤───── (Healthcare-vertical, affordable)
                    │
                    │          WATI ──────────┤
                    │          DoubleTick ────┤
                    │          Respond.io ────┤
                    │
                 BEST IN CLASS              EXPENSIVE
```

### 10.2 How We Win Each Phase

```
Phase 1: WIN ON VERTICAL FIT
├── "The only WhatsApp CRM with built-in appointment booking"
├── "Send appointment reminders on WhatsApp in 1 click"
├── Pricing: ₹999/mo vs WATI's ₹2,499 — 60% cheaper
└── Pitch: "Built for clinics, not for everyone"

Phase 2: WIN ON STICKINESS
├── Campaign engine → clinics use us for marketing too
├── Automation → "Set it and forget it" workflows
├── Templates library → specifically for healthcare
└── Lock-in: Too much value to switch

Phase 3: WIN ON INTELLIGENCE
├── AI that understands healthcare queries
├── Chatbot templates for clinics (competitors have generic ones)
├── Patient pipeline → clinics visualize their patient journey
└── Intelligence moat: Data flywheel (more clinics → smarter AI)

Phase 4: WIN ON ENTERPRISE
├── Multi-location → clinic chains can use us
├── SLA + PII masking + audit → enterprise compliance
├── No competitor has all of: WhatsApp + Appointments + Multi-location + AI
└── Price anchor: ₹15K/mo for chain vs build custom (₹5L+/mo)

Phase 5: WIN ON ECOSYSTEM
├── Platform → partners build on top of us
├── Marketplace → third-party integrations expand use cases
├── Mobile app → staff live in our app all day
└── Network effect: More partners → more features → more clinics → more partners
```

### 10.3 Feature Comparison Table (For Marketing Site)

| Feature | Our CRM | WATI | AiSensy | DoubleTick | Zoho |
|---------|---------|------|---------|------------|------|
| WhatsApp messaging | ✅ | ✅ | ✅ | ✅ | ⚠️ (add-on) |
| Team inbox | ✅ | ✅ | ✅ | ✅ | ✅ |
| Broadcast campaigns | ✅ | ✅ | ✅ | ✅ | ❌ |
| No-code chatbot | ✅ (Phase 3) | ✅ | ✅ | ✅ | ❌ |
| **Appointment booking** | **✅ Native** | ❌ | ❌ | ❌ | ⚠️ (generic) |
| **WhatsApp booking flow** | **✅** | ❌ | ❌ | ❌ | ❌ |
| **Auto-reminders (WA)** | **✅** | ❌ | ❌ | ❌ | ❌ |
| **No-show tracking** | **✅** | ❌ | ❌ | ❌ | ❌ |
| **Double-booking prevention** | **✅** (DB-level) | ❌ | ❌ | ❌ | ❌ |
| Patient journey pipeline | ✅ (Phase 3) | ❌ | ❌ | ❌ | ✅ |
| Retargeting campaigns | ✅ (Phase 2) | ❌ | ✅ | ✅ | ❌ |
| Click-to-WA ads | ✅ (Phase 4) | ✅ | ✅ | ✅ | ❌ |
| AI agents | ✅ (Phase 4) | ✅ | ❌ | ✅ | ❌ |
| PII masking | ✅ (Phase 4) | ❌ | ❌ | ✅ | ❌ |
| Multi-location | ✅ (Phase 4) | ✅ | ❌ | ✅ | ✅ |
| Mobile app | ✅ (Phase 5) | ✅ | ✅ | ✅ | ✅ |
| CRM integrations | ✅ (Phase 4) | ✅ | ✅ | ✅ | ✅ (native) |
| **Clinic-specific templates** | **✅ 15+** | ❌ | ❌ | ❌ | ❌ |
| **UPI autopay billing** | **✅** | ❌ | ❌ | ❌ | ❌ |
| **Pricing (starter)** | **₹999** | ₹2,499 | ₹999 | ~₹2,500 | ₹800/user |

### 10.4 One-Line Pitch Per Phase

```
Phase 1: "WhatsApp CRM with built-in booking system — made for Indian SMBs"
Phase 2: "Grow your business with WhatsApp campaigns and smart automation"
Phase 3: "AI-powered customer engagement — chatbot + CRM in one"
Phase 4: "The enterprise WhatsApp CRM for multi-location business chains"
Phase 5: "India's #1 customer engagement platform"
```

---

## 11. Development Steps Per Phase — Complete Build Guide

> **This section maps every build step from the Development Guide to its corresponding phase.**
> Each step includes: what you build, which features it delivers, the tech involved, and acceptance criteria.
> Reference: `Development_Guide_And_Testing_Playbook.md` v2.0 for full implementation details.

```
HOW TO READ THIS SECTION:

Each phase lists the Dev Guide Steps you must complete.
Each step links to specific Blueprint feature numbers (#1-#277).
"DoD" = Definition of Done — the checklist to confirm the step is complete.

Architecture Note:
  The platform is MULTI-VERTICAL (clinics, salons, gyms, restaurants, etc.)
  Core code is vertical-agnostic. Labels come from verticalConfig JSONB.
  3-Tier Users: Super Admin → Tenant Admin → Tenant User (staff)
  See Part Zero of Development Guide for full design.
```

---

### PHASE 1 — Foundation MVP (Weeks 1-8)

> **Goal:** 5 paying businesses × ₹999/mo. Prove core value: "Manage your business's WhatsApp from one dashboard."

```
BUILD ORDER:
  Step 0 → Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7* → Step 8* → Step 9 → Step 10*
  (* = partial — complete in Phase 2)

WHAT YOU SHIP:
  ✔ Multi-vertical WhatsApp CRM with team inbox
  ✔ Booking system that works for any service business
  ✔ OTP auth with 3-tier user hierarchy
  ✔ Contact management with CSV import
  ✔ Basic dashboard with KPIs
  ✔ Billing via Razorpay (trial → paid)
  ✔ Super Admin panel (foundation)
```

#### Step 0: Project Scaffolding (Week 1)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #1-#10 (Monorepo, Docker, CI/CD, ESLint, logging, health checks, rate limiting) |
| **What You Build** | Turborepo monorepo: `apps/web`, `apps/admin`, `apps/api`, `apps/webhook`, `apps/worker` + `packages/database`, `packages/shared`, `packages/queue`, `packages/whatsapp-sdk` |
| **Tech** | Turborepo + pnpm, Docker Compose (PostgreSQL 16, Redis 7, MinIO), GitHub Actions, Pino logger, Zod env validation |
| **DoD** | `pnpm turbo build` compiles all apps; `docker compose up` starts all services; CI green on push; `/health` returns 200 |

```
KEY FILES CREATED:
├── turbo.json                    ← Turborepo pipeline config
├── docker-compose.yml            ← PostgreSQL + Redis + MinIO
├── .github/workflows/ci.yml     ← Lint → Type-check → Test → Build
├── apps/web/                     ← Next.js 14 (tenant app)
├── apps/admin/                   ← Next.js 14 (super admin panel) ← NEW
├── apps/api/                     ← Fastify backend
├── apps/webhook/                 ← WhatsApp webhook receiver
├── apps/worker/                  ← BullMQ background processors
├── packages/database/            ← Prisma schema + client
├── packages/shared/              ← Types, utils, permissions, verticals
├── packages/queue/               ← BullMQ queue definitions
└── packages/whatsapp-sdk/        ← Meta Cloud API client
```

#### Step 1: Database Schema & ORM (Week 2)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #11-#23 (All Prisma models: Tenant, User, Contact, Conversation, Message, Provider, Booking, Template, Campaign, AutomationRule + SuperAdmin, PlatformAuditLog) |
| **What You Build** | Complete Prisma schema with multi-vertical support, 3-tier user model, EXCLUSION constraint for double-booking prevention, composite indexes, seed script |
| **Tech** | Prisma 5, PostgreSQL 16 (uuid, JSONB, EXCLUSION, GiST indexes), bcrypt (super admin password) |
| **DoD** | All migrations run cleanly; seed creates 1 super admin + 2 multi-vertical tenants (salon + clinic) + 3 users per tenant; EXCLUSION constraint blocks double-booking; Prisma types compile |

```
KEY MODELS:
├── SuperAdmin        ← Tier 1 (email+password auth, separate from tenants)
├── PlatformAuditLog  ← Every super admin action logged
├── Tenant            ← businessVertical enum + verticalConfig JSONB
├── User              ← role enum (owner/admin/manager/staff) + permissions JSONB
├── Contact           ← E.164 phone, tags[], custom_fields JSONB
├── Conversation      ← Per-contact, status (open/resolved), assigned_to
├── Message           ← WhatsApp messages with status tracking
├── Provider          ← Generic (Doctor/Stylist/Trainer per vertical)
├── Booking           ← EXCLUSION constraint (was: Appointment)
├── Template          ← WhatsApp template cache
├── Campaign          ← Broadcast campaigns
└── AutomationRule    ← Keyword triggers + actions
```

#### Step 2: Authentication & 3-Tier Authorization (Week 2-3)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #24-#33 (OTP send/verify, JWT, auto-provisioning, RBAC, rate limiting, tenant isolation) |
| **What You Build** | 4 auth flows: Super Admin email+password login, Tenant Admin OTP signup, Staff invite+join, returning user OTP login. Separate JWT secrets. Permission middleware. |
| **Tech** | JWT (jsonwebtoken), bcrypt, Redis (OTP storage + token blacklist), MSG91 (SMS OTP), Fastify hooks |
| **DoD** | Super Admin logs in at `/admin/auth`; new user OTP → tenant auto-created with vertical config; staff invited → joins correct tenant; permission middleware blocks unauthorized access; tenant isolation enforced on every query |

```
AUTH FLOWS:
├── Flow A: Super Admin → POST /admin/auth/login (email+password → admin JWT)
├── Flow B: New Business Owner → OTP verify → Tenant + User created (role: owner)
├── Flow C: Staff Invite → Admin invites → Staff verifies OTP → Joins tenant
├── Flow D: Returning User → OTP verify → Existing JWT issued
│
MIDDLEWARE:
├── tenantAuthMiddleware   → Protects /v1/* routes (OTP JWT)
├── superAdminAuthMiddleware → Protects /admin/* routes (password JWT)
└── requirePermission()    → Checks granular permissions per endpoint
```

#### Step 3: WhatsApp API Integration (Week 3-4)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #34-#48 (SDK, send text/template/interactive/media, webhook receiver, signature verification, status tracking, 24h window, deduplication) |
| **What You Build** | `packages/whatsapp-sdk` — typed client for Meta Cloud API. Webhook receiver at `apps/webhook`. Message processing pipeline. |
| **Tech** | Meta Cloud API v18.0+, Fastify (webhook), HMAC SHA256 verification, Redis (dedup + 24h session), S3/MinIO (media), BullMQ (async processing) |
| **DoD** | Send text + template + interactive messages; receive inbound messages; auto-create contact on first message; track sent→delivered→read→failed; 24h window detection works; webhook dedup prevents double-processing |

```
MESSAGE FLOW:
  Outbound: Dashboard → API → WhatsApp SDK → Meta API → Customer's phone
  Inbound:  Customer's phone → Meta → Webhook → Validate → Queue → Process
            → Upsert Contact → Create/Update Conversation → Store Message
            → WebSocket push to Inbox
```

#### Step 4: Contact Management (Week 4-5)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #49-#59 (CRUD, search, tags, CSV import, opt-out, auto-creation, timeline) |
| **What You Build** | Full contact CRM with cursor-based pagination, fuzzy search, tag management, async CSV import via BullMQ, contact auto-creation on inbound message |
| **Tech** | Prisma (CRUD), BullMQ (CSV import), csv-parse (streaming), Redis (import progress tracking) |
| **DoD** | CRUD works; search by name (fuzzy) + phone (partial) + tag; CSV import 100 rows async with progress; opt-out flag excludes from campaigns; auto-create on first inbound message; tenant isolation verified |

#### Step 5: Conversation Inbox — Real-Time (Week 5-6)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #60-#72 (Conversation list, filters, message thread, reply, assignment, WebSocket, tenant isolation, quick replies, internal notes) |
| **What You Build** | Real-time team inbox with 3-column layout (list → chat → contact sidebar). Socket.io for live updates. Assignment workflow. |
| **Tech** | Socket.io (WebSocket with Redis adapter), Fastify (REST APIs), Redis (pub/sub for real-time) |
| **DoD** | Conversations sorted by last message; reply sends via WhatsApp; new messages appear instantly (WebSocket); assignment works; unread count accurate; tenant isolation on WebSocket (Tenant A never sees Tenant B events); mobile responsive on 360px |

#### Step 6: Booking System — Multi-Vertical (Week 6-7)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #73-#89 (Provider CRUD, slot availability, manual + WhatsApp booking, reminders, cancellation, no-show detection, booking dashboard) |
| **What You Build** | Vertical-agnostic booking engine — uses `verticalConfig` labels (Doctor/Stylist/Trainer). Interactive WhatsApp booking flow. Auto-reminders via BullMQ delayed jobs. |
| **Tech** | PostgreSQL EXCLUSION constraint, Redis (booking state machine, distributed lock), BullMQ (delayed reminders), WhatsApp interactive messages |
| **DoD** | Slot calculation respects configurable duration per vertical; WhatsApp booking flow uses correct labels ("Choose a Stylist" for salon); concurrent booking test: 10 simultaneous requests → exactly 1 success; auto-reminders at T-24h and T-2h; no-show auto-detected |

```
BOOKING FLOW (WhatsApp):
  Customer: "book"
  Bot: "Choose a {providerLabel}:" → [Priya (Stylist), Rahul (Colorist)]  ← labels from verticalConfig
  Customer: selects "Priya"
  Bot: "Available slots for Priya:" → [10:00, 10:45, 11:30, ...]          ← configurable duration
  Customer: selects "10:00"
  Bot: "Your {bookingLabel} with Priya at 10:00 AM is confirmed! ✅"       ← labels from verticalConfig
  System: Schedules reminders at T-24h and T-2h
```

#### Step 8: Basic Dashboard (Week 7) — Partial
| Detail | Value |
|--------|-------|
| **Features Delivered** | #90-#93 (KPI cards, message volume 7d chart, booking summary, dashboard caching) |
| **What You Build** | Overview dashboard with today's KPIs and basic charts. Role-based visibility (staff sees own metrics). |
| **Tech** | Next.js 14 (SSR), Redis (30s cache), Recharts or Chart.js |
| **DoD** | Dashboard loads <2s; KPI numbers verified against raw DB; chart data accurate; zero-data shows empty state; tenant-scoped |

#### Step 9: Billing MVP (Week 8)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #98-#104 (Plan selection, Razorpay subscription, payment webhooks, trial management, usage tracking, plan limits) |
| **What You Build** | Subscription billing with Razorpay. UPI autopay. Plan limits enforcement. GST invoicing foundation. |
| **Tech** | Razorpay Subscriptions API (TEST mode first), webhooks (payment.captured, payment.failed), Fastify webhook routes |
| **DoD** | Subscription created via Razorpay; payment success activates plan; payment failure starts 7-day grace; trial expires after 14 days with feature limits; message + contact limits enforced; Razorpay webhook signature verified |

#### Step 10: Basic Settings & Team (Week 7-8) — Partial
| Detail | Value |
|--------|-------|
| **Features Delivered** | #94-#97, partial #142-#147 (WhatsApp linking, business profile, business hours, away message, basic team invite/remove) |
| **What You Build** | Settings pages: WhatsApp linking, business hours, auto-reply. Basic team invite via WhatsApp with role selection. |
| **Tech** | Next.js 14 (forms), Fastify (settings API), WhatsApp invite message |
| **DoD** | WhatsApp account linked (encrypted token stored); auto-reply fires outside business hours; invite team member → OTP → joins with assigned role; remove member → deactivated |

#### Step 11: Super Admin Panel — Foundation (Week 7-8) — Partial
| Detail | Value |
|--------|-------|
| **Features Delivered** | Super Admin login, platform dashboard (basic), tenant list, suspend/activate |
| **What You Build** | Separate Next.js app at `apps/admin`. Email+password auth. Basic tenant management. |
| **Tech** | Next.js 14, bcrypt, separate JWT (JWT_ADMIN_SECRET), Fastify /admin/* routes |
| **DoD** | Admin login works; tenant list with search; suspend/activate tenant with audit log; platform dashboard shows total tenants + total users |

#### Phase 1 Frontend — Next.js Web App (Throughout Weeks 3-8)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #105-#114 (Login, onboarding, sidebar nav, inbox 3-column, contacts table, contact detail, booking calendar, settings, mobile responsive) |
| **What You Build** | Full tenant-facing web app with all Phase 1 features accessible via UI |
| **Tech** | Next.js 14 App Router, shadcn/ui, Tailwind CSS, React Query (TanStack), Socket.io client |
| **DoD** | All pages functional; mobile responsive at 360px; onboarding wizard works end-to-end; vertical-specific labels rendered from `verticalConfig` |

```
PHASE 1 DEFINITION OF DONE:
□ A new user signs up → tenant created with vertical config → dashboard accessible
□ Send first WhatsApp message from inbox within 10 minutes of signup
□ Book a slot via WhatsApp interactive flow (with correct vertical labels)
□ Auto-reminder fires 24h before booking
□ CSV import 100 contacts
□ Billing: Subscribe via Razorpay → plan activated
□ Super Admin: Login → see all tenants → suspend one
□ All tests pass (unit + integration)
□ CI green
□ Feature flags: #1-#114 features working
```

---

### PHASE 2 — Growth Engine (Weeks 9-16)

> **Goal:** 50 paying businesses × avg ₹1,500/mo. Make businesses sticky with campaigns, automation, and advanced team features.

```
BUILD ORDER:
  Step 7 (full) → Step 8 (enhanced) → Step 10 (full) → Step 11 (enhanced)

WHAT YOU SHIP:
  ✔ Campaign & broadcast engine with real-time progress
  ✔ Template management with Meta API submission
  ✔ Automation rules (keyword triggers, auto-reply, auto-assign)
  ✔ Full team management with granular permissions
  ✔ Enhanced dashboard with 30d charts + reports
  ✔ CSV export + appointment/message reports
  ✔ Super Admin: Full tenant data access, impersonation, plan management
```

#### Step 7: Campaign & Broadcast Engine (Week 9-11) — Full
| Detail | Value |
|--------|-------|
| **Features Delivered** | #115-#128 (Campaign wizard, segments, scheduling, batched execution, real-time progress, pause/resume/cancel, analytics, retargeting) |
| **What You Build** | Full campaign engine: create → segment → schedule → execute (batched at 80msg/sec) → track progress (WebSocket) → analytics. Retargeting campaigns. |
| **Tech** | BullMQ (batched sends), Redis (progress tracking, rate limiter), Socket.io (real-time progress), Prisma (segment queries) |
| **DoD** | Campaign to 1000 contacts completes in <15s; real-time progress via WebSocket; pause/resume works; 10K campaign without OOM; opted-out contacts excluded; duplicate prevention; plan quota checked |

#### Template Management (Week 10)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #129-#134 (Template CRUD, Meta API submission, variable preview, pre-built library, categorization, usage analytics) |
| **What You Build** | In-dashboard template creation with live variable preview. Submit to Meta for approval. Pre-built library with 15+ industry templates (booking reminder, welcome, follow-up — for all verticals). |
| **Tech** | Meta Template API, Next.js 14 (template editor), Prisma |
| **DoD** | Create template → submit to Meta → track approval; variable preview renders correctly; pre-built templates available per vertical |

#### Automation Rules (Week 11-12)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #135-#141 (Keyword auto-reply, welcome message, working hours reply, auto-assign, auto-tag, booking trigger, rule builder UI) |
| **What You Build** | IF-THEN automation engine: keyword match → auto-reply / auto-tag / auto-assign / trigger booking flow. Visual rule builder UI. |
| **Tech** | BullMQ (rule execution), Redis (fast keyword matching), Next.js (rule builder) |
| **DoD** | Keyword "book" triggers booking flow; message outside hours → auto-reply; new contact → welcome message; rule builder UI creates/edits rules without code |

#### Step 10: Full Team Management (Week 12-13)
| Detail | Value |
|--------|-------|
| **Features Delivered** | Full #142-#147 (Invite/remove, role management, activity log, online status, conversation transfer) + permission overrides + vertical config editor |
| **What You Build** | Complete team management: invite via WhatsApp → OTP → join with role. Custom permission overrides per user. Vertical config editor (change labels). Agent online status. Conversation transfer with notes. |
| **Tech** | Socket.io (online status), Prisma (permissions JSONB), Redis (presence tracking) |
| **DoD** | Full invite→join flow works; owner can customize staff permissions; conversation transfer preserves context; vertical labels editable (reflected across all UI) |

#### Step 8: Enhanced Dashboard (Week 13-14) — Full
| Detail | Value |
|--------|-------|
| **Features Delivered** | #148-#159 (CSV export, appointment report, message volume report, invoice history, calendar view, 30d charts, contact growth, campaign summary, provider utilization, no-show rate, date range selector) |
| **What You Build** | Full analytics dashboard with 7d/30d/custom range. Reports exportable as CSV. Calendar view for bookings. Per-provider metrics. |
| **Tech** | Recharts/Chart.js, Next.js (SSR), Redis (cache), csv-stringify (export) |
| **DoD** | All charts data-accurate; CSV export matches on-screen; provider utilization calculated correctly; no-show rate with trend line; date range filter works |

#### UX Improvements (Week 14-15)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #160-#162 (Quick actions, keyboard shortcuts, notification center) |
| **What You Build** | Quick actions from inbox (one-click book/tag/assign), keyboard shortcuts, notification bell with recent events |
| **Tech** | Next.js (hotkey library), Socket.io (notification push) |
| **DoD** | Quick actions accessible from inbox; Ctrl+Enter sends; notifications received in real-time |

#### Step 11: Super Admin Panel — Enhanced (Week 15-16)
| Detail | Value |
|--------|-------|
| **Features Delivered** | Full tenant data access (messages, contacts, bookings, export), impersonation mode, plan/pricing management, feature flags, audit log viewer, announcements |
| **What You Build** | Complete super admin panel: direct tenant data view (all messages, contacts, bookings), data export, impersonation (full access, time-limited, audit-logged), plan CRUD, feature flag toggles, platform announcements |
| **Tech** | Next.js 14 (admin UI), Fastify /admin/* routes, platform_audit_log, Redis (feature flags) |
| **DoD** | View any tenant's messages/contacts/bookings; export tenant data (CSV/JSON); impersonate tenant (30-min limit, audit-logged); create/edit plans; toggle feature flags per tenant; broadcast announcement to all tenants |

```
PHASE 2 DEFINITION OF DONE:
□ Send campaign to 1000 contacts with real-time progress tracking
□ Keyword "book" triggers automated WhatsApp booking flow
□ Auto-reply fires outside business hours
□ CSV export: contacts, campaigns, appointments
□ Full team management: invite → join → permissions → transfer conversations
□ Super Admin: View any tenant's data, impersonate, manage plans
□ All tests pass
□ Feature flags: #115-#162 features + enhanced Step 10/11
```

---

### PHASE 3 — Intelligence Layer (Weeks 17-24)

> **Goal:** 200 paying businesses × avg ₹2,000/mo. AI & chatbot features that no competitor has for Indian SMBs.

```
BUILD ORDER:
  Chatbot Engine → AI Features → Custom Fields → Patient Journey Pipeline
  → WhatsApp Forms/Catalog → Advanced Inbox → Notifications

WHAT YOU SHIP:
  ✔ No-code chatbot builder (drag & drop)
  ✔ AI auto-reply suggestions + FAQ auto-responder
  ✔ Custom fields per vertical
  ✔ Customer journey pipeline (Kanban)
  ✔ WhatsApp forms & service catalog
  ✔ Conversation search + canned responses
  ✔ Browser push notifications
```

#### Chatbot Engine (Week 17-19)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #163-#172 (Flow builder, message/condition/action/delay nodes, human handoff, pre-built templates, bot analytics, test mode, active hours) |
| **What You Build** | Visual drag-and-drop chatbot builder. Pre-built bot templates per vertical (Booking Bot, FAQ Bot, Registration Bot, Feedback Bot). Bot analytics with drop-off tracking. |
| **Tech** | React Flow (visual canvas), Redis (bot state machine), BullMQ (delay nodes), Prisma (bot config storage) |
| **DoD** | Drag-and-drop creates working bot; bot handles booking flow end-to-end; human handoff passes conversation history; pre-built templates work per vertical; analytics show completion rates |

#### AI Features — Early AI (Week 19-21)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #173-#179 (AI reply suggestions, message summarization, smart-compose, FAQ auto-responder, sentiment detection, contact dedup, knowledge base) |
| **What You Build** | AI reply suggestion engine (2-3 options per incoming message). Knowledge base upload (clinic docs, FAQs). AI FAQ auto-responder. Sentiment detection on conversations. |
| **Tech** | OpenAI API / Claude API (LLM), vector embeddings (Pinecone or pgvector), RAG pipeline, Redis (sentiment cache) |
| **DoD** | AI suggests relevant replies; FAQ auto-responder answers 60%+ common questions; knowledge base trained on tenant's uploaded documents; sentiment flagged on negative conversations; no hallucinated answers |

#### Custom Fields & Contact Enrichment (Week 21-22)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #180-#184 (Custom field builder, pre-built vertical fields, field in contact card, filter by custom field, auto-profile enrichment) |
| **What You Build** | Tenant custom field builder (text, number, date, dropdown, checkbox). Pre-built fields per vertical from `VERTICAL_PRESETS`. Filter contacts by custom field values. |
| **Tech** | Prisma (custom_fields JSONB), Next.js (field builder UI) |
| **DoD** | Tenant adds custom fields; pre-built fields auto-appear based on vertical; filter "blood_group = O+" returns correct results; AI extracts details from chat to suggest profile updates |

#### Customer Journey Pipeline (Week 22-23)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #185-#188 (Kanban pipeline view, auto-move on event, stage actions, pipeline analytics) |
| **What You Build** | Visual Kanban board: New → Enquiry → Booked → Visited → Follow-Up. Auto-move contacts on events (booking created → move to "Booked"). Per-stage automations (enter stage → send template). |
| **Tech** | React (Kanban library), Prisma (pipeline stage tracking), BullMQ (stage actions) |
| **DoD** | Drag-and-drop moves contacts; auto-move on booking event; stage action sends template; conversion rates per stage calculated |

#### WhatsApp Forms & Catalog (Week 23)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #189-#191 (Registration forms, service catalog, catalog browsing) |
| **What You Build** | WhatsApp forms for customer registration. Service/treatment catalog viewable in WhatsApp. |
| **Tech** | WhatsApp interactive messages, Meta Catalog API |
| **DoD** | Form collects customer details via WhatsApp; catalog shows services with prices; browsing triggers bot flow |

#### Advanced Inbox (Week 23-24)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #192-#198 (Labels, canned responses, conversation search, chat export, starred conversations, typing indicator, read receipts) |
| **What You Build** | Conversation labels, team-shared canned responses library, full-text search across messages, PDF chat export. |
| **Tech** | PostgreSQL full-text search (tsvector), Next.js (inbox enhancements) |
| **DoD** | Full-text search returns results across all conversations; canned responses organized by category; chat exported as PDF; read receipt ticks display correctly |

#### Notifications & Alerts (Week 24)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #199-#204 (Browser push, email digest, WhatsApp alert to staff, configurable preferences, Slack/Discord, low balance alert) |
| **What You Build** | Browser push notifications for assigned conversations. Daily email summary. Configurable per-user notification preferences. |
| **Tech** | Web Push API (service worker), Nodemailer (email), BullMQ (scheduled digest) |
| **DoD** | Push notification fires on new message in assigned conversation; daily email summary sent; notification preferences configurable per user |

```
PHASE 3 DEFINITION OF DONE:
□ Chatbot handles booking conversation end-to-end without human
□ AI suggests 2-3 relevant replies per incoming message
□ FAQ auto-responder answers common questions from knowledge base
□ Custom fields configured per vertical
□ Pipeline Kanban: contacts auto-move on booking events
□ Full-text conversation search works
□ Browser push notifications for assigned conversations
□ Feature flags: #163-#204 features working
```

---

### PHASE 4 — Scale & Enterprise (Weeks 25-36)

> **Goal:** Multi-location businesses and chains paying ₹10K+/mo. Enterprise-grade security and compliance.

```
BUILD ORDER:
  Multi-Location → Security & Compliance → SLA & Governance
  → Advanced AI → Integrations → CTWA Ads → Performance Scaling

WHAT YOU SHIP:
  ✔ Multi-WABA support (one tenant, multiple WhatsApp numbers)
  ✔ Per-location inbox, teams, and analytics
  ✔ PII masking, audit trail, 2FA, field-level permissions
  ✔ SLA tracking with breach alerts
  ✔ Autonomous AI agent (handles queries without human)
  ✔ Zapier integration, REST API, Google Calendar sync
  ✔ Click-to-WhatsApp ad campaign management
  ✔ Infrastructure: Kafka, read replicas, CDN
```

#### Multi-Location Support (Week 25-27)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #205-#210 (Multi-WABA, location management, per-location inbox, cross-location broadcast/analytics, per-location team assignment) |
| **What You Build** | One tenant → multiple WhatsApp business numbers (one per branch). Location management with per-location provider schedules. Cross-location dashboard. |
| **Tech** | Prisma (Location model), WhatsApp SDK (multi-WABA routing), Redis (per-location message routing) |
| **DoD** | Tenant adds 3 locations with different WhatsApp numbers; each location has own inbox; broadcast sends from specific location or all; analytics aggregated and per-location; staff scoped to their location |

#### Security & Compliance (Week 27-29)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #211-#217 (PII masking, audit trail, data retention, 2FA, IP allowlisting, field-level permissions, session management) |
| **What You Build** | PII auto-masking (Aadhaar, PAN, bank account) for limited-access staff. Immutable audit trail. Optional 2FA. Data retention policies. |
| **Tech** | Regex (PII detection), Prisma (audit log), TOTP (2FA), Redis (session tracking) |
| **DoD** | PII masked for staff without permission; every action logged immutably; 2FA configurable; stale data auto-archived; sessions manageable by admin |

#### SLA & Governance (Week 29-30)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #218-#222 (SLA configuration, breach alerts, SLA dashboard, agent performance scoring, conversation rating) |
| **What You Build** | SLA rules per tenant (reply within X minutes). Real-time breach alerts. Agent performance dashboard. Customer satisfaction rating after conversation. |
| **Tech** | BullMQ (SLA timer), Redis (real-time breach tracking), WhatsApp interactive (rating message) |
| **DoD** | SLA breach alert fires in real-time; agent performance scored on response time + resolution rate; customers rate conversation via WhatsApp button |

#### Advanced AI (Week 30-32)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #223-#228 (Autonomous AI agent, training interface, handoff rules, topic analysis, AI contact scoring, predictive no-show) |
| **What You Build** | Fully autonomous AI agent that handles FAQs, booking queries, and basic booking without human intervention. Training interface (upload docs, website URL). Smart handoff to human on escalation triggers. |
| **Tech** | LLM (OpenAI/Claude), RAG with pgvector, ML model (no-show prediction), Redis (AI context cache) |
| **DoD** | AI agent handles 60%+ of booking queries autonomously; escalates on negative sentiment / 3 failed answers / explicit human request; topic analysis categorizes conversations; predictive no-show flags high-risk bookings |

#### Integrations (Week 32-34)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #229-#234 (Zapier, Google Sheets, Google Calendar, outbound webhooks, REST API, Zoho CRM sync) |
| **What You Build** | Zapier triggers (new booking, new contact). Outbound webhooks on events. Public REST API with API key auth + rate limiting + documentation. Google Calendar two-way sync. |
| **Tech** | Zapier webhook triggers, Google Calendar API, Fastify (API key auth), OpenAPI spec (Swagger) |
| **DoD** | Zapier triggers fire on events; Google Calendar shows bookings; REST API documented with Swagger; webhook payloads correct and signed |

#### Click-to-WhatsApp Ads (Week 34-35)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #235-#238 (CTWA campaign creation, conversion tracking, auto-responder, source attribution) |
| **What You Build** | Create Facebook/Instagram ads from dashboard. Track full funnel: ad click → WhatsApp chat → booking. Auto-trigger chatbot when lead comes from ad. |
| **Tech** | Facebook Marketing API, UTM tracking, Redis (attribution cache) |
| **DoD** | CTWA ad created from dashboard; conversion tracked through to booking; auto-responder triggers for ad leads; contacts tagged with source campaign |

#### Performance & Scaling (Week 35-36)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #239-#242 (Kafka migration, DB read replicas, PgBouncer, CDN for media) |
| **What You Build** | Replace BullMQ → Kafka for message processing at scale. PostgreSQL read replicas for analytics. PgBouncer connection pooling. CloudFront CDN for media files. |
| **Tech** | Apache Kafka, PgBouncer, AWS RDS read replicas, CloudFront CDN |
| **DoD** | Message processing handles 500+ tenants at 80 msg/sec total; analytics queries hit read replica; media served from CDN; zero downtime migration from BullMQ to Kafka |

```
PHASE 4 DEFINITION OF DONE:
□ Multi-location tenant: 3 branches, 3 WhatsApp numbers, separate inboxes
□ PII masking: Aadhaar numbers hidden for staff roles
□ SLA breach alert fires within seconds
□ AI agent handles booking query autonomously
□ Zapier integration: new booking → fires webhook → Zapier catches
□ Google Calendar: bookings appear in provider's calendar
□ Public REST API: documented, authenticated, rate-limited
□ Infrastructure: Kafka processing 1000 msg/sec, read replicas active
□ Feature flags: #205-#242 features working
```

---

### PHASE 5 — Platform & Ecosystem (Weeks 37-52)

> **Goal:** ₹50L+/mo MRR. Transform from tool to platform. Partner ecosystem, marketplace, native mobile app.

```
BUILD ORDER:
  Omnichannel → Marketplace & Platform → Advanced Analytics
  → Mobile App → Patient Engagement → Enterprise Operations

WHAT YOU SHIP:
  ✔ Instagram DM + Facebook Messenger in unified inbox
  ✔ WhatsApp Business Calling + call recording
  ✔ Integration marketplace + partner portal
  ✔ Public API v2 + developer documentation portal
  ✔ Custom report builder
  ✔ React Native mobile app with push notifications
  ✔ Nurture sequences, feedback collection, referral tracking
  ✔ SSO + white-label branding
```

#### Omnichannel Expansion (Week 37-40)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #243-#249 (Instagram DM, Facebook Messenger, SMS, email, WhatsApp Calling, call recording, cross-channel contact merge) |
| **What You Build** | Unified inbox across WhatsApp + Instagram DM + Facebook Messenger. WhatsApp Business Calling with call recording + AI transcription. Contact merge across channels. |
| **Tech** | Instagram Graph API, FB Messenger Platform, MSG91/Gupshup (SMS), WhatsApp VoIP API, Whisper (transcription) |
| **DoD** | Same contact on WA + IG + FB → merged into single profile; instagram DM visible in unified inbox; WhatsApp call recorded + transcribed; reply from any channel |

#### Marketplace & Platform (Week 40-43)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #250-#255 (Integration marketplace, no-code webhook builder, custom modules, API v2, developer portal, partner portal) |
| **What You Build** | Curated integration marketplace. Partner portal (resellers manage multiple tenant accounts). Comprehensive REST API v2 with developer docs. |
| **Tech** | Next.js (marketplace + partner + dev portal), OpenAPI 3.0, Stripe Connect (partner commissions) |
| **DoD** | Browse and install integrations from marketplace; partners manage 5+ tenant accounts; API v2 fully documented with code samples; developer portal live |

#### Advanced Analytics & BI (Week 43-46)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #256-#262 (Custom report builder, scheduled delivery, cohort analysis, funnel analysis, attribution analytics, benchmarks, LTV) |
| **What You Build** | Drag-and-drop report builder. Auto-schedule reports via email/WhatsApp. Full funnel analysis: lead → booking → visit → return. Customer lifetime value calculation. |
| **Tech** | React (report builder), Prisma (analytics queries), BullMQ (scheduled reports), PDF generation |
| **DoD** | Custom report created with drag-and-drop; report auto-delivered weekly; funnel shows drop-off rates; LTV calculated per customer; benchmarks compared against anonymized industry averages |

#### Mobile App — React Native (Week 46-49)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #263-#268 (Mobile app, push notifications, quick reply from notification, offline mode, voice notes, QR code check-in) |
| **What You Build** | Full-featured React Native mobile app: inbox, bookings, dashboard, quick reply from push notification. Offline mode for basic features. |
| **Tech** | React Native (Expo), Firebase Cloud Messaging (push), SQLite (offline cache), QR scanner |
| **DoD** | Inbox functional on mobile with real-time messages; push notification with quick reply; view contacts + bookings offline; QR scan at location auto-marks arrival |

#### Advanced Customer Engagement (Week 49-51)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #269-#275 (Nurture sequences, feedback collection, birthday greetings, re-activation campaigns, referral tracking, WhatsApp payments, report sharing) |
| **What You Build** | Multi-step nurture sequences (Day 1 → Day 3 → Day 7 post-visit). Auto-feedback collection post-visit. Re-activation for inactive contacts. |
| **Tech** | BullMQ (sequence scheduler), WhatsApp templates (greetings), WhatsApp Pay UPI integration |
| **DoD** | Nurture sequence executes on schedule; feedback rating collected via WhatsApp; birthday greeting auto-sent; inactive contacts re-targeted; referral tracked |

#### Enterprise Operations (Week 51-52)
| Detail | Value |
|--------|-------|
| **Features Delivered** | #276-#277 (SSO SAML/OIDC, white-label branding) |
| **What You Build** | SSO for hospital IT integration. White-label: replace platform branding with tenant's logo/colors. |
| **Tech** | passport-saml, OIDC, Next.js (theme system) |
| **DoD** | SSO login works with hospital's identity provider; white-label tenant sees only their branding; custom domain supported |

```
PHASE 5 DEFINITION OF DONE:
□ Instagram DM + Facebook Messenger in unified inbox
□ WhatsApp call recorded + AI transcribed
□ Integration marketplace with 5+ integrations listed
□ Partner manages 5 tenant accounts
□ API v2 + developer portal live
□ Custom report builder: create report with drag-and-drop
□ Mobile app on App Store + Play Store
□ Nurture sequence runs multi-step follow-up
□ White-label tenant sees only their branding
□ Feature flags: #243-#277 features working
```

---

### Master Build Order — All Steps, All Phases

```
PHASE 1 (Weeks 1-8) — Foundation MVP
│
├── Week 1        Step 0:  Project Scaffolding (Turborepo + Docker + CI)
├── Week 2        Step 1:  Database Schema (Prisma + multi-vertical + 3-tier)
├── Week 2-3      Step 2:  Auth & 3-Tier Authorization
├── Week 3-4      Step 3:  WhatsApp API Integration
├── Week 4-5      Step 4:  Contact Management
├── Week 5-6      Step 5:  Conversation Inbox (Real-Time)
├── Week 6-7      Step 6:  Booking System (Multi-Vertical)
├── Week 7        Step 8:  Basic Dashboard (partial)
├── Week 7-8      Step 10: Basic Settings & Team (partial)
├── Week 7-8      Step 11: Super Admin Panel (foundation)
├── Week 8        Step 9:  Billing MVP (Razorpay)
└── Weeks 3-8     Frontend: Next.js tenant app (all Phase 1 pages)
│
PHASE 2 (Weeks 9-16) — Growth Engine
│
├── Week 9-11     Step 7:  Campaign & Broadcast Engine (full)
├── Week 10       Template Management
├── Week 11-12    Automation Rules Engine
├── Week 12-13    Step 10: Full Team Management + Permissions
├── Week 13-14    Step 8:  Enhanced Dashboard + Reports (full)
├── Week 14-15    UX Improvements (quick actions, shortcuts, notifications)
└── Week 15-16    Step 11: Super Admin Panel (full: data access, impersonate, plans)
│
PHASE 3 (Weeks 17-24) — Intelligence Layer
│
├── Week 17-19    Chatbot Engine (drag-and-drop builder)
├── Week 19-21    AI Features (reply suggestions, FAQ auto-responder, knowledge base)
├── Week 21-22    Custom Fields & Vertical Presets
├── Week 22-23    Customer Journey Pipeline (Kanban)
├── Week 23       WhatsApp Forms & Service Catalog
├── Week 23-24    Advanced Inbox (search, canned responses, labels)
└── Week 24       Notifications & Alerts (push, email, Slack)
│
PHASE 4 (Weeks 25-36) — Scale & Enterprise
│
├── Week 25-27    Multi-Location Support (Multi-WABA)
├── Week 27-29    Security & Compliance (PII masking, audit, 2FA)
├── Week 29-30    SLA & Governance
├── Week 30-32    Advanced AI (autonomous agent, predictive no-show)
├── Week 32-34    Integrations (Zapier, Google Calendar, REST API)
├── Week 34-35    Click-to-WhatsApp Ads
└── Week 35-36    Performance Scaling (Kafka, read replicas, CDN)
│
PHASE 5 (Weeks 37-52) — Platform & Ecosystem
│
├── Week 37-40    Omnichannel (Instagram, FB Messenger, WhatsApp Calling)
├── Week 40-43    Marketplace & Platform (API v2, dev portal, partners)
├── Week 43-46    Advanced Analytics & BI (report builder, funnels)
├── Week 46-49    Mobile App (React Native, push notifications)
├── Week 49-51    Advanced Customer Engagement (sequences, feedback)
└── Week 51-52    Enterprise Operations (SSO, white-label)
```

---

## Appendix: Complete Feature Count Summary

| Phase | Duration | New Features | Cumulative | P0 | P1 | P2 | MRR Target |
|-------|----------|-------------|------------|-----|-----|-----|------------|
| Phase 1 | Weeks 1-8 | 114 | 114 | 91 | 17 | 6 | ₹5K |
| Phase 2 | Weeks 9-16 | 48 | 162 | 27 | 16 | 5 | ₹75K |
| Phase 3 | Weeks 17-24 | 42 | 204 | 17 | 18 | 7 | ₹4L |
| Phase 4 | Weeks 25-36 | 38 | 242 | 14 | 18 | 6 | ₹16.5L |
| Phase 5 | Weeks 37-52 | 35 | 277 | 8 | 15 | 12 | ₹50L+ |
| **TOTAL** | **52 weeks** | **277** | — | **157** | **84** | **36** | — |

```
Priority Breakdown:
P0 (Must have — ship or die):        157 features (57%)
P1 (Should have — competitive edge):  84 features (30%)
P2 (Nice to have — delight):          36 features (13%)
```

---

*Document Last Updated: April 25, 2026*
*Competitors Analyzed: Zoho CRM, WATI, AiSensy, DoubleTick, Freshworks, Respond.io, Interakt, Gallabox*
*Reference: Technical_Design_Document.md (TDD-2026-001 v2.0)*
