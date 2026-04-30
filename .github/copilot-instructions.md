## graphify

Before answering architecture or codebase questions, read `.graphify/GRAPH_REPORT.md` if it exists.
If `.graphify/wiki/index.md` exists, navigate it for deep questions.
If `.graphify/graph.json` is missing but `graphify-out/graph.json` exists, run `graphify migrate-state --dry-run` before relying on legacy state.
Type `/graphify` in Copilot Chat to build or update the knowledge graph.



# WhatsApp CRM — Copilot Context (Single Source of Truth)

> **HOW TO USE:** This file is placed at `.github/copilot-instructions.md` in your repo.  
> GitHub Copilot automatically injects it into every session.  
> **After completing each step, update the `## CURRENT STATUS` section only.**

---

## PROJECT IDENTITY

- **Product:** WhatsApp CRM SaaS for Indian SMBs
- **Author:** Sahil Harkhani
- **Version:** 1.0 — Planning → MVP Build Phase
- **Primary Market:** Healthcare clinics (dental, eye care, dermatology, physio, labs)
- **Secondary Markets (later phases):** Gyms, salons, coaching institutes, restaurants

---

## ⚡ CURRENT STATUS — UPDATE THIS AFTER EVERY STEP

```
PHASE:         Phase 1 — Foundation MVP (Weeks 1–8)
CURRENT STEP:  Frontend (Next.js 14)
STEP STATUS:   NOT STARTED
COMPLETED:     Step 0 (Scaffolding), Step 1 (DB Schema), Step 2 (Auth + 3-Tier), Step 3 (WhatsApp Integration), Step 4 (Contact Management), Step 5 (Conversation Inbox), Step 6 (Appointment System), Step 7 (Campaign & Broadcast), Step 8 (Dashboard & Analytics), Step 9 (Billing & Subscription), Step 10 (Settings & Team), Step 11 (Automation Rules), Backend Gaps (Socket.io, Reminders, Media, Leaves, CI/CD, Automations, Booking Confirmation)

E2E TEST STATUS (Steps 0–11):
  ✅ 403 passed / 0 failed / 403 total (April 30, 2026)
  ✅ Step 0: 3 tests — health check, status, timestamp
  ✅ Step 1: 5 tests — DB connectivity, route existence (contacts, conversations, auth/me, team)
  ✅ Step 2: 18 tests — OTP send/verify, signup flow, /me, token refresh, team invite/list, logout
  ✅ Step 3: 5 tests — graph.facebook.com reachability check, webhook logic, phone normalization, dedup, 24h session
  ✅ Step 4: 28 tests — CRUD, duplicate, invalid phone, list, search, tags, detail+timeline, update, opt-out, CSV import, soft delete, resurrection, pagination
  ✅ Step 5: 47 tests — conversation list/filters/pagination, detail, message thread, reply (session guard), assignment, status toggle, mark-read, internal notes, quick replies CRUD, error cases
  ✅ Step 6: 67 tests — provider CRUD/validation/list/detail/update/delete, slot availability (working hours + breaks + Sunday + missing date), booking create/double-booking/detail/list/filters/pagination/validation, complete, cancel, no-show, reschedule (atomic cancel+book), today's summary, auth errors
  ✅ Step 7: 94 tests — template CRUD/validation/duplicate/list/filter/detail/update/approve/reject, campaign CRUD/validation/detail/update/list/filter/pagination, send (approved guard + no-contacts guard + double-send lock), pause/resume, simulate delivery, stats (delivery rate + read rate + pending), cancel, delete (draft only), template delete (in-use guard + FK cleanup), auth errors
  ✅ Step 8: 19 tests — KPI overview (messages/conversations/appointments/contacts), message volume (7-day breakdown), appointment summary (today + past7Days), conversation analytics, cache behavior, auth errors
  ✅ Step 9: 22 tests — plan listing (4+ plans with pricing), current subscription, start trial (+ duplicate guard), check limits (contacts/messages), usage tracking, payment history, upgrade (trial→starter→growth), downgrade rejection, cancel subscription, auth errors
  ✅ Step 10: 22 tests — settings all (aggregate), business profile CRUD, business hours (7-day config + validation), away message (toggle + outsideHoursOnly), WhatsApp linking (encrypted token + masking), unlink, validation (invalid email, close<open), auth errors
  ✅ Step 11: 24 tests — automation rule CRUD, duplicate name guard, validation (empty/no-actions), list (filter active), detail (trigger+keywords), update (name+priority), toggle active/inactive, delete, auth errors
  ⚠️ WhatsApp send tests skipped (graph.facebook.com unreachable from org network)
  ⚠️ Super admin tests skipped (no seeded super admin)
  Test file: e2e-test.cjs (~2200 lines, zero npm deps, native Node.js http/https/crypto)

WHAT IS BUILT SO FAR:
  ✅ Turborepo monorepo (apps: web, admin, api, webhook, worker)
  ✅ Docker Compose (PostgreSQL 16 + Redis 7 + MinIO)
  ✅ Prisma schema — all tables (tenants, users, contacts, messages, appointments, campaigns, etc.)
  ✅ OTP-based auth (send + verify), JWT (access 15min + refresh 7d), token revocation
  ✅ 3-tier auth: super_admin (separate table, email+pass) / tenant owner+admin / staff
  ✅ RBAC middleware with granular permissions
  ✅ Tenant isolation middleware (tenant_id injected on every request)
  ✅ WhatsApp SDK (packages/whatsapp-sdk) — sendText, sendTemplate, sendInteractive, sendMedia
  ✅ Webhook receiver (apps/webhook) — signature verification, challenge handler, dedup, 24h session
  ✅ Inbound message processing (webhook → Redis dedup → upsert contact → conversation → message)
  ✅ Phone normalization utility (all Indian formats → E.164)
  ✅ Contact CRUD API — create, list (cursor pagination), search, detail + timeline, update, soft delete
  ✅ Contact CSV import — async with Redis progress tracking, dedup + invalid phone handling
  ✅ Opt-out management — toggle endpoint + filter by optOut
  ✅ Soft-delete resurrection — recreating deleted contact restores it
  ✅ Conversation list API — sorted by lastMessageAt DESC, filters: status, assignee, unassigned
  ✅ Message thread API — cursor pagination (newest first)
  ✅ Reply from inbox — send text via WhatsApp SDK (24h session guard + opt-out check)
  ✅ Conversation assignment — assign/unassign to team member
  ✅ Conversation status management — open/resolved toggle
  ✅ Mark as read — reset unreadCount to 0
  ✅ Internal notes — stored as messages with _note flag (not sent to WhatsApp)
  ✅ Quick reply templates — CRUD stored in Redis (per-tenant)
  ✅ Provider CRUD API — create, list, detail, update, soft-delete (deactivate)
  ✅ Working hours + break hours configuration (per-provider, per-day)
  ✅ Slot availability API — generates slots from working hours, excludes breaks + booked
  ✅ Manual booking from dashboard — create with provider + contact + time
  ✅ Double-booking prevention — Redis distributed lock (5s TTL) + DB overlap check
  ✅ Booking list API — cursor pagination, filters (provider, contact, status, date)
  ✅ Booking detail API — includes provider + contact info
  ✅ Appointment cancellation — frees slot, cleans up reminders
  ✅ Appointment completion — marks confirmed → completed
  ✅ No-show marking — marks confirmed → no_show
  ✅ Appointment rescheduling — atomic cancel old + book new in Prisma transaction
  ✅ Reminder keys in Redis — 24h + 2h before appointment (ready for BullMQ worker)
  ✅ Today's appointments dashboard card — counts by status
  ✅ E2E test suite (e2e-test.cjs) — 267 assertions across Steps 0–7
  ✅ Seed utility (apps/api/src/seed-wa.ts) — sets waPhoneId on tenant via Prisma
  ✅ Template CRUD API — create, list (status filter), detail, update content/variables, delete (in-use guard)
  ✅ Template status management — simulate approve/reject (Meta webhook in prod)
  ✅ Campaign CRUD API — create draft, list (cursor pagination + status filter), detail, update (draft/scheduled only)
  ✅ Campaign segment counting — count contacts matching tags + optOut filter on create/update
  ✅ Campaign send — approved template guard, no-contacts guard, Redis distributed lock (prevent double-send)
  ✅ Campaign pause/resume — status state machine (sending↔paused)
  ✅ Campaign cancel — cleanup Redis keys (job + paused + lock)
  ✅ Campaign delete — draft only restriction
  ✅ Campaign delivery stats — sentCount, deliveredCount, readCount, failedCount, deliveryRate, readRate, pendingCount
  ✅ Simulate delivery endpoint — for testing (in prod webhooks update counts)
  ✅ Campaign job queuing in Redis — stores job metadata for BullMQ worker processing
  ✅ Dashboard KPI overview API — messages (total/inbound/outbound today), conversations (open/total), appointments (today by status), contacts (total/new today)
  ✅ Message volume chart API — 7-day day-by-day breakdown (inbound/outbound per day)
  ✅ Appointment summary chart API — today by status, past 7 days by status, upcoming confirmed count
  ✅ Conversation analytics API — open/resolved/total, new today, total unread
  ✅ Dashboard Redis cache — 30s TTL on all 4 endpoints
  ✅ Billing DB schema — Subscription, Payment, UsageRecord models + SubscriptionStatus enum
  ✅ Plan definitions — Trial (free 14d) / Starter ₹999 / Growth ₹2,499 / Pro ₹4,999
  ✅ Razorpay HTTP client — custom fetch-based (no npm dependency), Basic auth
  ✅ Razorpay webhook receiver — HMAC SHA256 signature verification (constant-time compare)
  ✅ Webhook idempotency — Redis SETNX dedup by event+entityId (24h TTL)
  ✅ Subscription lifecycle — create, activate, charge, cancel, pause, resume via webhooks
  ✅ Payment processing — capture success, handle failure (7-day grace period)
  ✅ Plan subscription API — create subscription (dev mode: direct activation, prod: Razorpay checkout)
  ✅ Plan upgrade API — validates plan hierarchy (no downgrades), atomic plan switch
  ✅ Subscription cancellation — access continues until period end
  ✅ Payment history API — cursor pagination, excludes sensitive fields
  ✅ 14-day free trial management — start-trial endpoint, prevents duplicate trials
  ✅ Usage tracking — atomic upsert increment per tenant per month (messages, contacts)
  ✅ Plan limit enforcement — checkPlanLimits() for contacts/messages/teamMembers
  ✅ Check limits API — quick limit check endpoint for frontend gating
  ✅ Payment verification — Razorpay signature verification (HMAC SHA256 of payment_id|subscription_id)
  ✅ RBAC billing permissions — BILLING_VIEW and BILLING_MANAGE (owner+admin only)
  ✅ Settings routes — WhatsApp linking (encrypted token, AES-256-GCM), business profile, hours, away message
  ✅ WhatsApp account linking — PUT/GET/DELETE with access token encryption at rest
  ✅ Business profile API — name, email, address, city, state, pincode, timezone, logo, website
  ✅ Business hours configuration — per-day open/close with validation (open < close)
  ✅ Away message configuration — enabled/disabled toggle + outsideHoursOnly option
  ✅ Settings aggregate endpoint — GET /v1/settings/all (single fetch for frontend)
  ✅ Socket.io real-time server — JWT auth, tenant rooms, typing indicators, emit helpers
  ✅ Socket.io wired into conversation routes — new_message, assignment_change, conversation_update events
  ✅ Reminder worker (apps/worker) — polls every 60s, sends 24h + 2h WhatsApp template reminders
  ✅ No-show auto-detection — marks confirmed bookings as no_show after 30min grace period
  ✅ No-show follow-up — sends template message the next day via WhatsApp
  ✅ Provider leave/holiday management — GET/POST/DELETE /v1/providers/:id/leaves (Redis-backed)
  ✅ Leave dates integrated into slot availability API — returns onLeave=true, empty slots
  ✅ Media download + S3 upload pipeline — Meta CDN → S3/MinIO (apps/webhook/src/media.ts)
  ✅ WhatsApp SDK enhanced — getMediaUrl() + downloadMedia() methods added
  ✅ Contact auto-tagging on inbound — new contacts tagged with "new"
  ✅ CI/CD pipeline enhanced — concurrency control, deploy job placeholder
  ✅ Automation rules API — CRUD + duplicate name guard + toggle active/inactive + keyword trigger
  ✅ Automation engine (webhook) — keyword matching on inbound → auto-reply, auto-tag, auto-assign
  ✅ Booking confirmation message — auto-sends WhatsApp template on appointment creation
  ✅ E2E test suite expanded (e2e-test.cjs) — 403 assertions across Steps 0–11

CURRENT TASK: Frontend (Next.js 14)
  → Login page (phone → OTP → verify → dashboard)
  → Layout (sidebar + header + mobile nav)
  → Dashboard page (KPI cards + charts)
  → Inbox page (3-column real-time chat)
  → Contacts page (table + detail + timeline)
  → Appointments page (calendar + booking)
  → Settings pages (4 tabs)
  → Campaigns page (list + create + stats)

NEXT STEP: Production Deployment (Docker + AWS)

BLOCKERS / DECISIONS PENDING:
  → [x] E2E testing completed for Steps 0–11 (403/403 passing)
  → [x] Socket.io real-time layer implemented (JWT auth + tenant isolation)
  → [x] Reminder worker implemented (polling-based, Upstash REST)
  → [x] No-show detection + follow-up implemented
  → [x] Holiday/leave management implemented
  → [x] Media download pipeline implemented
  → [x] CI/CD pipeline enhanced
  → [x] Automation rules engine implemented (keyword → auto-reply/tag/assign)
  → [x] Booking confirmation message implemented
  → [ ] Real WhatsApp Cloud API send testing deferred (org network blocks graph.facebook.com)
  → [ ] Super admin seed data needed for admin auth E2E tests
  → [ ] WhatsApp booking flow deferred (requires real WA Cloud API for interactive messages)

FILES MODIFIED SO FAR:
  → packages/database/prisma/schema.prisma  (complete schema — 15 models including billing)
  → packages/shared/src/permissions.ts      (RBAC permission system — 40+ permission keys + billing)
  → packages/shared/src/verticals.ts        (vertical config presets — 10 verticals)
  → apps/api/src/middleware/auth.ts         (JWT + tenant injection + RBAC)
  → apps/api/src/routes/tenant-auth.ts      (OTP send/verify + auto-provisioning)
  → apps/api/src/routes/tenant-protected.ts (refresh, logout, /me + plan info, team invite/list/delete)
  → apps/api/src/routes/admin-auth.ts       (super admin email+password auth)
  → apps/api/src/routes/contacts.ts         (full CRUD + CSV import + timeline + opt-out)
  → apps/api/src/routes/conversations.ts    (inbox: list, thread, reply, assign, notes, quick-replies)
  → apps/api/src/routes/appointments.ts     (providers CRUD + slots + bookings + cancel/complete/no-show/reschedule)
  → apps/api/src/routes/campaigns.ts        (template CRUD + campaign CRUD + send/pause/resume/cancel + delivery stats)
  → apps/api/src/routes/dashboard.ts        (KPI overview + message volume + appointment summary + conversation analytics)
  → apps/api/src/routes/billing.ts          (Razorpay integration + plans + subscriptions + payments + usage + limits)
  → apps/api/src/routes/settings.ts         (WhatsApp linking + business profile + hours + away message)
  → apps/api/src/routes/health.ts           (GET /health + /health/ready)
  → apps/api/src/app.ts                     (Fastify app builder + route registration)
  → apps/api/src/server.ts                  (Fastify server entry point — port 4000)
  → apps/api/src/env.ts                     (Zod env validation + Razorpay optional keys)
  → apps/api/src/services/otp.ts            (OTP generation + Redis storage + verification)
  → apps/api/src/seed-wa.ts                 (utility: seed waPhoneId on tenant via Prisma)
  → packages/whatsapp-sdk/src/client.ts     (Meta Cloud API typed client — WhatsAppClient class + getMediaUrl + downloadMedia)
  → apps/webhook/src/server.ts              (webhook receiver + HMAC SHA256 verification)
  → apps/webhook/src/whatsapp-webhook.ts    (inbound message + status update processing + auto-tag "new")
  → apps/webhook/src/redis.ts               (dedup SETNX + 24h session window tracking)
  → apps/webhook/src/env.ts                 (Zod env validation for webhook service)
  → apps/webhook/src/media.ts               (Media download from Meta CDN + S3/MinIO upload)
  → apps/api/src/socket.ts                  (Socket.io server — JWT auth, tenant rooms, emit helpers)
  → apps/worker/src/index.ts                (Reminder worker — 24h/2h reminders + no-show detection + follow-up)
  → .github/workflows/ci.yml               (CI/CD — lint, type-check, build + deploy placeholder)
  → apps/api/src/routes/automations.ts      (Automation rules CRUD — create, list, detail, update, toggle, delete)
  → apps/webhook/src/automations.ts         (Automation engine — keyword matching → auto-reply, auto-tag, auto-assign)
  → e2e-test.cjs                            (E2E test suite — 403 tests, Steps 0–11)
```

---

## ARCHITECTURE — NON-NEGOTIABLE DECISIONS

These are **FINAL**. Do NOT re-suggest alternatives.

| Decision | Choice | Reason |
|---|---|---|
| Monorepo | Turborepo + pnpm | Shared types, easier refactoring |
| Backend framework | Fastify (NOT Express) | 2x faster, schema validation built-in |
| Language | TypeScript strict mode | Type safety across all packages |
| ORM | Prisma | Type-safe DB access + migrations |
| Database | PostgreSQL 16 + TimescaleDB extension | ACID, JSONB, FTS, time-series |
| Cache + Queue | Redis 7 (BullMQ for queues) | MVP: everything in Redis |
| Event streaming | BullMQ now → Kafka at 500+ tenants | Avoid over-engineering |
| Frontend | Next.js 14 (App Router) | SSR, API routes, React ecosystem |
| UI Library | shadcn/ui + Tailwind CSS | Accessible, customizable |
| State management | Zustand + TanStack Query | Server state caching |
| Real-time | Socket.io + Redis adapter | Multi-instance pub/sub |
| Auth | OTP-only (NO passwords for tenants) | Indian users prefer OTP |
| Super Admin auth | Email + password (separate table) | Separate from tenant auth |
| Storage | AWS S3 / Cloudflare R2 (MinIO locally) | Media, CSVs, invoices |
| Hosting | AWS ap-south-1 Mumbai | India data residency |
| Payments | Razorpay (UPI + card subscriptions) | India-first |
| Multi-tenancy | Shared DB, tenant_id isolation + RLS | Phase 1. Shard later. |
| Messages table | Monthly range partitioning by created_at | High-volume table |
| WhatsApp API | Meta Cloud API v18.0 | Direct, no third-party wrappers |

---

## REPO STRUCTURE

```
whatsapp-crm/
├── apps/
│   ├── web/          → Tenant app (app.yourcrm.in) — Next.js 14, OTP login
│   ├── admin/        → Super Admin panel (admin.yourcrm.in) — email+password login
│   ├── api/          → Main Fastify API (serves both web + admin)
│   ├── webhook/      → WhatsApp webhook receiver (separate Fastify — scales independently)
│   └── worker/       → BullMQ background job processors
├── packages/
│   ├── database/     → Prisma schema, migrations, seed
│   ├── shared/       → Types, utils, constants, permissions, verticals config
│   ├── queue/        → BullMQ queue definitions and job types
│   └── whatsapp-sdk/ → Meta Cloud API typed client
├── infrastructure/
│   ├── terraform/    → AWS IaC (ECS, RDS, ElastiCache, S3)
│   └── docker/       → Dockerfiles + docker-compose.yml
├── .github/
│   ├── copilot-instructions.md   ← THIS FILE
│   └── workflows/                → CI/CD pipelines
└── turbo.json
```

---

## 3-TIER USER HIERARCHY

```
TIER 1 — SUPER ADMIN (you, Sahil)
  Table: super_admins (SEPARATE from users table)
  Auth:  email + password (bcrypt), NOT OTP
  URL:   admin.yourcrm.in
  Can:   View ALL tenants, suspend/activate, platform analytics,
         impersonate tenant (audit-logged), manage plans, feature flags

TIER 2 — TENANT ADMIN (business owner)
  Table: users (tenant_id scoped)
  Auth:  OTP via phone
  URL:   app.yourcrm.in
  Roles: owner (all) / admin (all except billing+deletion)
  Can:   Full access to THEIR tenant only

TIER 3 — TENANT USER (staff)
  Table: users (same, different role)
  Auth:  OTP via phone
  URL:   app.yourcrm.in
  Roles: manager / staff
  Can:   Limited — inbox (assigned), contacts (view+create), bookings (own)
  Cannot: Billing, delete contacts, manage team, change settings
```

**RULE: super_admins table is NEVER mixed with users table. Separate JWT issuer, separate auth flow.**

---

## DATABASE SCHEMA OVERVIEW

All tables have `tenant_id UUID NOT NULL` (except `super_admins`, `platform_audit_log`).
Every query MUST include `WHERE tenant_id = $tenantId`.

### Core Tables
- **tenants** — business accounts (wa_phone_id, wa_access_token encrypted, plan, settings JSONB, vertical_config JSONB)
- **super_admins** — platform admin accounts (email, password_hash, role: super_admin|support|viewer)
- **users** — tenant staff (tenant_id, phone E.164, role: owner|admin|manager|staff, permissions JSONB)
- **otp_codes** — OTP verification (phone, code, expires_at 5min, max 5 attempts)

### CRM
- **contacts** — (tenant_id, phone_e164 UNIQUE per tenant, tags TEXT[], custom_fields JSONB, opt_out bool)
- **conversations** — (tenant_id, contact_id UNIQUE per tenant, assigned_to, status: open|pending|resolved)
- **messages** — PARTITIONED BY RANGE(created_at) monthly. (direction: inbound|outbound, content JSONB, wa_message_id, status: queued|sent|delivered|read|failed)

### Appointments
- **providers** — doctors/staff (tenant_id, working_hours JSONB, break_hours JSONB, slot_duration int)
- **appointments** — (EXCLUSION constraint prevents double-booking, status: confirmed|completed|no_show|cancelled, reminder_24h bool, reminder_2h bool)

### Campaigns
- **templates** — WhatsApp templates (meta_status: pending|approved|rejected)
- **campaigns** — (segment_tags TEXT[], status: draft|scheduled|sending|completed|paused)
- **campaign_logs** — per-contact delivery tracking

### Others
- **automation_rules** — keyword triggers + actions
- **message_events** — TimescaleDB hypertable for analytics
- **audit_logs** — all mutations with actor + changes JSONB
- **platform_audit_log** — super admin actions only

### Key Indexes
```sql
UNIQUE(tenant_id, phone_e164)  -- contacts
UNIQUE(tenant_id, contact_id)  -- conversations
INDEX(tenant_id, status, last_message_at DESC)  -- conversations inbox
INDEX(tenant_id, phone_e164)  -- contacts lookup
INDEX(conversation_id, created_at DESC)  -- messages thread
INDEX(wa_message_id)  -- messages dedup
INDEX(starts_at, reminder_24h, reminder_2h) WHERE status='confirmed'  -- appointment reminders
GIN INDEX on contacts(tags)  -- tag filtering
```

---

## REDIS KEY SCHEMA

```
# Cache
tenant:{id}:settings              → HASH, TTL 5min
tenant:{id}:templates             → LIST, TTL 10min
tenant:{id}:contact:{phone}       → HASH, TTL 5min
user:{id}:session                 → HASH, TTL 24h
tenant:{id}:slots:{date}          → SORTED SET, TTL 1min

# Rate Limiting
ratelimit:api:{tenant_id}:{endpoint}    → Counter, sliding window
ratelimit:wa_send:{tenant_id}           → Counter (daily messages)
ratelimit:wa_send:{tenant_id}:per_sec   → Counter (max 80 msg/sec to Meta)
ratelimit:otp:{phone}                   → Counter (max 5/hour)

# BullMQ Queues
queue:message_send       → Priority: 1=session replies, 2=reminders, 3=campaigns
queue:webhook_process    → Incoming Meta webhook events
queue:campaign_execute   → Campaign batch processing
queue:reminder_check     → Scheduled check (runs every 1 min)
queue:analytics_aggregate
queue:dead_letter

# Session / Temp
session:{token}                   → User session, TTL 7d
wa_session:{tenant}:{phone}       → 24h window tracker, TTL 24h
booking_state:{tenant}:{contact}  → WhatsApp booking flow state, TTL 10min
import:{job_id}:progress          → CSV import progress, TTL 1h
otp:{phone}:{code}                → OTP verification, TTL 5min
wa_dedup:{wa_message_id}          → Webhook dedup (SETNX), TTL 24h

# Distributed Locks
lock:appointment:{provider_id}:{slot}    → TTL 5s
lock:campaign:{id}:execute               → TTL 5min
lock:contact:{tenant}:{phone}:process    → TTL 2s

# Pub/Sub Channels
channel:tenant:{id}:inbox         → New inbound message
channel:tenant:{id}:status        → Message status update
channel:tenant:{id}:appointment   → Appointment change
channel:tenant:{id}:notification  → System notification
```

---

## BULLMQ QUEUES CONFIGURATION

```
message_send:      maxRetries=3, backoff=exponential(1s,2s,4s), concurrency=20
webhook_process:   maxRetries=5, backoff=exponential(500ms), concurrency=10
campaign_execute:  maxRetries=2, backoff=fixed(30s), concurrency=10
reminder_check:    runs every 1 minute via cron
dead_letter:       no retries, alert on-call
```

---

## WHATSAPP INTEGRATION — STEP 3 DETAILS (CURRENT)

### WhatsApp SDK Structure (`packages/whatsapp-sdk`)
```typescript
// client.ts — WhatsAppClient class methods:
sendText(to: string, text: string): Promise<SendResult>
sendTemplate(to: string, templateName: string, languageCode: string, variables: TemplateVariable[]): Promise<SendResult>
sendInteractive(to: string, interactive: InteractiveMessage): Promise<SendResult>
sendMedia(to: string, type: MediaType, mediaUrl: string, caption?: string): Promise<SendResult>
getMediaUrl(mediaId: string): Promise<string>

// webhooks.ts — WebhookHandler class methods:
verifyChallenge(query: VerifyChallengeQuery): string | null
verifySignature(payload: string, signature: string, appSecret: string): boolean
parsePayload(body: WebhookBody): WebhookEvent[]
```

### Webhook Receiver Flow
```
POST /webhook/whatsapp:
  1. Verify X-Hub-Signature-256 (HMAC SHA256) → reject 401 if invalid
  2. Return 200 OK immediately (Meta requires <5s response)
  3. Async: Deduplicate via Redis SETNX wa_dedup:{wa_message_id} TTL=24h
  4. If not duplicate → queue to BullMQ queue:webhook_process
  5. Worker: upsert contact → create/update conversation → store message → Socket.io notify

GET /webhook/whatsapp:
  → Respond to Meta's verification challenge (hub.challenge)
```

### Phone Normalization (E.164)
```
"9876543210"      → "+919876543210"
"09876543210"     → "+919876543210"
"919876543210"    → "+919876543210"
"+919876543210"   → "+919876543210"
"91 98765 43210"  → "+919876543210"
"+91-9876-543210" → "+919876543210"
Invalid (5 digits) → null
```

### 24h Session Window
- Redis key: `wa_session:{tenantId}:{contactPhone}` TTL=24h
- Set on every inbound message
- If key exists → can send free-form text
- If key missing → MUST use template message

---

## FULL DEVELOPMENT TIMELINE (8 Weeks)

```
Step 0: Project Scaffolding      ✅ Day 1-2
Step 1: Database Schema & ORM   ✅ Day 3-4
Step 2: Auth (3-Tier)           ✅ Day 5-8
Step 3: WhatsApp Integration    ✅ Day 9-14   
Step 4: Contact Management      ✅ Day 15-18 
Step 5: Conversation Inbox      ✅ Day 19-24
Step 6: Appointment System      ✅ Day 25-32
Step 7: Campaign & Broadcast    ✅ Day 33-38
Step 8: Dashboard & Analytics   ✅ Day 39-42
Step 9: Billing & Subscription  ⬜ Day 43-47
Step 10: Settings & Team        ⬜ Day 48-50
Step 11: Production Deployment  ⬜ Day 51-56
```

---

## PHASE 1 FEATURE CHECKLIST (114 Features)

Update `[ ]` to `[x]` as you complete features.

### 1A. Project Foundation ✅
- [x] Monorepo scaffolding (Turborepo + pnpm)
- [x] Docker Compose (PostgreSQL + Redis + MinIO)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Shared TypeScript config (strict mode)
- [x] ESLint + Prettier + Husky
- [x] Environment variable management + Zod validation
- [x] Health check endpoints (/health, /health/ready)
- [x] Structured logging (Pino with request-id + tenant-id)
- [x] Error response standardization
- [ ] Rate limiting middleware (100 req/min per IP)

### 1B. Database ✅
- [x] Prisma schema — tenants
- [x] Prisma schema — super_admins
- [x] Prisma schema — users
- [x] Prisma schema — contacts
- [x] Prisma schema — conversations
- [x] Prisma schema — messages (with partitioning)
- [x] Prisma schema — providers
- [x] Prisma schema — appointments (EXCLUSION constraint)
- [x] Prisma schema — templates
- [x] Prisma schema — campaigns + campaign_logs
- [x] Prisma schema — automation_rules
- [x] Database seed script (2 tenants, 100 contacts, 200 messages)
- [x] Prisma client singleton with connection pooling

### 1C. Authentication & Authorization ✅
- [x] OTP send via SMS (MSG91)
- [ ] OTP send via WhatsApp (alternative channel)
- [x] OTP verify + JWT issue (access 15min + refresh 7d)
- [x] New user auto-provisioning (first OTP → create tenant + owner)
- [x] Auth middleware (extract tenantId, userId, role)
- [x] RBAC — owner/admin/manager/staff roles
- [x] Token refresh endpoint
- [x] Logout + token revocation (Redis blacklist)
- [x] OTP brute-force protection (max 5 attempts, 1h cooldown)
- [x] Tenant isolation middleware (tenant_id on every query)
- [x] Super Admin auth (email + password, separate JWT issuer)

### 1D. WhatsApp Integration ✅
- [x] WhatsApp SDK package (packages/whatsapp-sdk)
- [x] Send text message (within 24h session)
- [x] Send template message (anytime, pre-approved)
- [x] Send interactive message (buttons — up to 3)
- [x] Send interactive message (list — slot selection)
- [x] Send media message (image, document, audio, video)
- [x] Webhook receiver (apps/webhook — separate Fastify app)
- [x] Webhook signature verification (HMAC SHA256)
- [x] Webhook challenge handler (GET — Meta setup)
- [x] Inbound message processing (upsert contact → conversation → message)
- [x] Message status tracking (sent → delivered → read → failed)
- [x] 24h session window detection (Redis TTL)
- [x] Phone number normalization (all Indian formats → E.164)
- [x] Webhook deduplication (Redis SETNX)
- [x] Media download + S3 upload pipeline

### 1E. Contact Management ✅
- [x] Contact list API (cursor pagination, filters)
- [x] Contact search (name fuzzy, phone partial, tag exact)
- [x] Contact create (normalize phone, dedup check)
- [x] Contact update (partial PATCH)
- [x] Contact soft delete
- [x] Contact detail + timeline (all messages)
- [x] Tag management (add/remove, filter by tag)
- [x] CSV import async (BullMQ job + progress tracking)
- [x] CSV import duplicate handling
- [x] Opt-out flag management (auto-detect STOP keyword)
- [x] Auto-create contact on first inbound message

### 1F. Conversation Inbox ✅
- [x] Conversation list API (sorted by last_message_at DESC)
- [x] Conversation filters (status, assignee)
- [x] Message thread API (cursor pagination)
- [x] Reply from inbox (send via WhatsApp)
- [x] Conversation assignment (to team member)
- [x] Conversation status management (open → resolved)
- [x] Unread count tracking (increment on inbound, reset on open)
- [x] Mark as read
- [x] Real-time updates (Socket.io)
- [x] WebSocket authentication (JWT on handshake)
- [x] WebSocket tenant isolation (room per tenant)
- [x] Quick reply templates (staff pre-saved replies)
- [x] Internal notes on conversation (not sent to patient)

### 1G. Appointment System ✅
- [x] Provider CRUD (name, specialization, photo, slot_duration)
- [x] Working hours configuration (per-provider per-day)
- [x] Break hours configuration (lunch, prayer time)
- [x] Holiday/leave management (mark dates unavailable)
- [x] Slot availability API
- [x] Manual booking from dashboard
- [ ] WhatsApp booking flow (patient types "book" → guided flow)
- [ ] Booking state machine in Redis (TTL 10min)
- [x] Double-booking prevention (EXCLUSION constraint + distributed lock)
- [ ] Booking confirmation WhatsApp message
- [x] Auto-reminder 24h before (BullMQ delayed job)
- [x] Auto-reminder 2h before (BullMQ delayed job)
- [x] Appointment cancellation (slot freed + confirmation sent)
- [x] Appointment rescheduling (atomic: cancel old + book new)
- [x] No-show auto-detection (cron: end_time + 30min → flag)
- [x] No-show follow-up message (next day)
- [x] Today's appointment dashboard card

### 1H. Basic Dashboard
- [x] KPI cards (messages, conversations, appointments, contacts today)
- [x] Message volume chart (7-day bar chart)
- [x] Appointment summary chart (by status)
- [x] Dashboard Redis cache (30s TTL)

### 1I. Settings ✅
- [x] WhatsApp account linking (wa_phone_id + business_id + access_token encrypted)
- [x] Business profile (name, address, logo, timezone)
- [x] Business hours configuration
- [x] Away message configuration

### 1J. Billing ✅
- [x] Plan selection page (Trial / Starter ₹999 / Growth ₹2,499 / Pro ₹4,999)
- [x] Razorpay subscription integration (UPI autopay + card)
- [x] Payment success → activate plan
- [x] Payment failure → 7-day grace period
- [x] 14-day free trial management
- [x] Usage tracking (messages, contacts against plan limits)
- [x] Plan limit enforcement (block + show upgrade CTA)

### 1K. Frontend — Next.js
- [ ] Login page (phone → OTP → verify → dashboard)
- [ ] Onboarding wizard (3 steps: business details → connect WA → invite team)
- [ ] Sidebar navigation
- [ ] Inbox page (3-column: conversation list | chat thread | contact sidebar)
- [ ] Contacts page (sortable table, search, tag filter, pagination)
- [ ] Contact detail page (profile + timeline)
- [ ] Appointments page (calendar day/week view)
- [ ] Settings pages (Business, WhatsApp, Team, Billing tabs)
- [ ] Mobile responsive (360px+)

---

## KEY BUSINESS FLOWS

### Outbound Message Flow
```
Dashboard/API → Validate (auth, tenant, quota, template) → INSERT message(queued)
→ BullMQ queue:message_send → Worker: check circuit breaker → check rate limit (80/sec)
→ POST Meta Cloud API → Success: update wa_message_id, status=sent
→ Meta webhook (status update) → update status=delivered/read → Socket.io notify UI
```

### Inbound Message Flow
```
Meta webhook → Verify X-Hub-Signature-256 → Return 200 immediately
→ Dedup (Redis SETNX) → BullMQ queue:webhook_process
→ Worker: normalize phone → lookup/create contact → lookup/create conversation
→ Store message → update conversation.last_message_at → set 24h session window
→ Check automation rules (keyword match, opt-out, working hours)
→ Redis PUBLISH → Socket.io → UI real-time update
```

### Appointment Booking (WhatsApp)
```
Patient: "book" → detect keyword → send provider list (interactive)
→ Patient selects provider → show available slots (interactive list)
→ Patient selects slot → Redis lock slot (5s TTL) → check availability
→ Available: INSERT appointment + queue reminders + send confirmation
→ Taken: offer next slot
→ 24h before: BullMQ delayed job fires → send reminder template
→ 2h before: second reminder fires
→ Cron (every min): check start_time+30min → if not completed → mark no_show → queue follow-up
```

### Campaign Broadcast (Saga Pattern)
```
Create → Validate (template approved, contacts in segment, plan limit)
→ Segment contacts (by tags/filters) → fan-out to campaign_logs
→ Worker: batch 100 contacts → for each: render template → queue:message_send (priority 3)
→ Rate limit: 80 msg/sec → workers respect token bucket
→ Meta webhooks → update campaign_logs → aggregate counters → WebSocket progress
→ All sent: status=completed → notify creator
```

---

## MULTI-VERTICAL PLATFORM RULES

**The code is 100% vertical-agnostic. No `if (businessType === 'clinic')` anywhere.**

On onboarding, tenant selects business type → system sets `vertical_config`:

| Vertical | Provider Label | Booking Label | Customer Label |
|---|---|---|---|
| clinic | Doctor | Appointment | Patient |
| salon | Stylist | Appointment | Client |
| gym | Trainer | Session | Member |
| education | Faculty | Class | Student |
| restaurant | Table | Reservation | Guest |
| generic | Staff Member | Booking | Customer |

**Rule:** Always use `tenant.verticalConfig.providerLabel` in UI, NEVER hardcode "Doctor".

---

## API CONVENTIONS

```
Base URL:       https://api.yourcrm.in/v1
Auth:           Authorization: Bearer <JWT>
Content-Type:   application/json
Pagination:     Cursor-based (?cursor=xxx&limit=20)
Error format:   { "error": { "code": "CONTACT_NOT_FOUND", "message": "...", "details": {} } }
Dates:          ISO 8601 UTC in API, convert to IST in UI
IDs:            UUID v4
Rate limit:     100 req/min per tenant (X-RateLimit-Remaining header)
```

### Key Error Codes
```
AUTH_OTP_EXPIRED, AUTH_OTP_INVALID, AUTH_OTP_MAX_ATTEMPTS
AUTH_TOKEN_EXPIRED, AUTH_TOKEN_INVALID, AUTH_FORBIDDEN
TENANT_PLAN_EXPIRED, TENANT_QUOTA_EXCEEDED
CONTACT_NOT_FOUND, CONTACT_DUPLICATE, CONTACT_OPTED_OUT, CONTACT_INVALID_PHONE
MESSAGE_TEMPLATE_NOT_APPROVED, MESSAGE_SESSION_EXPIRED, MESSAGE_RATE_LIMITED
APPOINTMENT_SLOT_UNAVAILABLE, APPOINTMENT_DOUBLE_BOOKING
CAMPAIGN_NO_CONTACTS, CAMPAIGN_TEMPLATE_REJECTED
RATE_LIMITED, INTERNAL_ERROR, VALIDATION_ERROR
```

### Key Endpoints (Reference)
```
POST /v1/auth/otp/send, /verify, /refresh, /logout
GET|POST|PATCH|DELETE /v1/contacts
POST /v1/contacts/import
GET /v1/conversations, /v1/conversations/:id
POST /v1/messages/send, /send-template
GET|POST /v1/appointments, /v1/appointments/slots
GET|POST /v1/campaigns, POST /campaigns/:id/send|pause|resume
GET /v1/analytics/overview|messages|appointments|campaigns
GET|POST|PATCH /v1/settings
POST /v1/billing/subscribe|upgrade
GET /webhook/whatsapp (challenge), POST /webhook/whatsapp (events)
```

---

## PRICING PLANS

| Plan | Price | Contacts | Messages/mo | Team Members |
|---|---|---|---|---|
| Trial | Free (14d) | 100 | 500 | 1 |
| Starter | ₹999/mo | 500 | 5,000 | 2 |
| Growth | ₹2,499/mo | 2,000 | 20,000 | 5 |
| Pro | ₹4,999/mo | 10,000 | 100,000 | 10 |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited |

Overage: ₹0.50/message, ₹100/500 contacts. Billed at month-end.
Payment: Razorpay subscriptions — UPI Autopay + card + netbanking.

---

## SECURITY RULES

- All tenant data: `WHERE tenant_id = $tenantId` on every query (+ RLS as defense-in-depth)
- WhatsApp tokens: Encrypted at rest (AWS Secrets Manager in prod, env vars locally)
- PII in logs: Phone → last 4 digits only. Names → never logged. Message content → never logged.
- Webhook security: Verify `X-Hub-Signature-256` HMAC SHA256 before processing
- OTP: Max 5 attempts, 5-min expiry, 1-hour lockout, rate limit 5 OTPs/hour/phone
- JWT: 15-min access token, 7-day refresh. Revocation via Redis blacklist on logout.
- Media: S3 presigned URLs (1h expiry), objects under /{tenant_id}/media/ prefix
- All media files stored in AWS ap-south-1 (Mumbai) — data residency

---

## TECHNOLOGY VERSIONS

- Node.js: 20 LTS
- TypeScript: strict mode
- Next.js: 14 (App Router)
- Fastify: latest stable
- Prisma: 5.x
- PostgreSQL: 16 + TimescaleDB extension
- Redis: 7 (Cluster in prod, single in dev)
- BullMQ: latest stable
- Socket.io: 4.x with Redis adapter
- Meta Cloud API: v18.0
- pnpm: 8.x with workspaces
- Turborepo: latest stable
- Docker: Compose v2

---

## GLOSSARY

| Term | Meaning |
|---|---|
| Tenant | A business (clinic/gym/salon) using the platform |
| Contact | End customer of the tenant (patient/member/client) |
| Conversation | Chat thread between tenant and one contact |
| Provider | Service provider within a tenant (e.g., a specific doctor) |
| Template | Pre-approved WhatsApp message format (required outside 24h window) |
| Session window | 24h after last inbound message — free-form replies allowed |
| Campaign | Bulk message to a segment of contacts |
| Segment | Filtered group of contacts (by tags, custom fields) |
| Automation rule | If-then trigger (keyword match → action) |
| BullMQ Job | Async task queued for background processing |
| wa_message_id | Meta's unique identifier for a WhatsApp message |
| E.164 | International phone format: +[country code][number] |
| WABA | WhatsApp Business Account (in Meta Business Suite) |
| Opt-out | Contact requested to stop receiving messages |
| DLQ | Dead Letter Queue — where failed jobs go for manual inspection |
| Fan-out | One event → many downstream tasks (campaign → 10K messages) |
| Saga | Multi-step distributed transaction with compensation logic |
| RLS | Row-Level Security — PostgreSQL tenant isolation feature |
| Vertical | Business type (clinic, salon, gym, education, restaurant) |

---

## PHASE ROADMAP (HIGH LEVEL)

```
Phase 1: Foundation MVP    Weeks 1-8   → 5 paying businesses, core WhatsApp CRM + appointments
Phase 2: Growth Engine     Weeks 9-16  → 50 businesses, campaigns + automation + team features
Phase 3: Intelligence      Weeks 17-24 → 200 businesses, AI chatbot + advanced segmentation
Phase 4: Scale & Enterprise Weeks 25-36 → multi-branch chains, Kafka, Elasticsearch
Phase 5: Platform          Weeks 37-52 → public API, Zapier, marketplace, omnichannel
```

---

## HOW TO UPDATE THIS FILE

After completing a step, update **only** the `CURRENT STATUS` section:
1. Change `CURRENT STEP` to the next step
2. Move the completed step to `COMPLETED`
3. Update `WHAT IS BUILT SO FAR` (add new files/features)
4. Update `CURRENT TASK` and `NEXT STEP`
5. Check off features in the Phase 1 Feature Checklist

**Do NOT regenerate this entire file — only update the status block.**

---

## FRONTEND IMPLEMENTATION GUIDE — NEXT.JS 14

> **You are a senior frontend architect specializing in Next.js 14, SaaS dashboards, and real-time systems.**
> Build a pixel-perfect, modern (2025 design standards), fully responsive frontend.

### Tech Stack (FINAL — non-negotiable)

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 14 (App Router) | `apps/web/` — SSR + Client components |
| Language | TypeScript (strict) | Shared types from `packages/shared` |
| Styling | Tailwind CSS + shadcn/ui | Accessible, customizable components |
| State (client) | Zustand | Auth state, UI state, sidebar collapse |
| State (server) | TanStack Query v5 | Caching, refetching, optimistic updates |
| Real-time | Socket.io client | Live inbox, status updates, notifications |
| Forms | React Hook Form + Zod | Shared validation schemas with backend |
| Tables | TanStack Table | Virtual scrolling for contacts/appointments |
| Charts | Recharts | Dashboard KPI charts |
| Date/Time | date-fns | Lightweight, tree-shakeable |
| Icons | Lucide React | Consistent icon set |
| Toast/Notifications | sonner | Clean toast notifications |
| File uploads | react-dropzone | CSV import, media upload |

### Design System & UX Requirements

```
DESIGN PRINCIPLES:
1. Mobile-first responsive (360px → 1920px)
2. Dense but not cluttered — CRM users work fast
3. Clear visual hierarchy — primary actions prominent
4. Smooth interactions — hover states, loading skeletons, transitions
5. Real-time ready — optimistic updates, live indicators
6. Indian SMB optimized — simple, practical, no over-complex UX
7. Fast to scan and act — minimal clicks to complete any task
8. Dark mode support (localStorage toggle)

COLOR PALETTE:
  Primary:    #0F766E (teal-700) — trust, healthcare feel
  Secondary:  #1E40AF (blue-800) — links, interactive elements
  Success:    #15803D (green-700) — confirmed, delivered
  Warning:    #B45309 (amber-700) — pending, grace period
  Danger:     #B91C1C (red-700) — failed, cancelled, expired
  Background: #FFFFFF (light) / #0F172A (dark)
  Surface:    #F8FAFC (light) / #1E293B (dark)
  Border:     #E2E8F0 (light) / #334155 (dark)
  Text:       #0F172A (light) / #F1F5F9 (dark)

TYPOGRAPHY:
  Font:       Inter (Google Fonts) — clean, modern, excellent readability
  Headings:   font-semibold, tracking-tight
  Body:       font-normal, text-sm (14px) for density
  Monospace:  JetBrains Mono — for phone numbers, IDs

SPACING:
  Use Tailwind's spacing scale consistently
  Cards: p-4 or p-6
  Sections: space-y-6
  Lists: space-y-2 or space-y-3

COMPONENT PATTERNS:
  - Skeleton loaders for all async content (never empty states with spinners)
  - Empty states with illustration + CTA ("No contacts yet — Import CSV")
  - Confirmation modals for destructive actions
  - Toast for success/error feedback (bottom-right)
  - Command palette (Cmd+K) for power users
  - Breadcrumbs on detail pages
  - Keyboard shortcuts for common actions
```

### Frontend File Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx           → Phone + OTP login
│   │   └── layout.tsx               → Centered, no sidebar
│   ├── (onboarding)/
│   │   ├── setup/page.tsx           → 3-step wizard
│   │   └── layout.tsx               → Progress bar, no sidebar
│   ├── (dashboard)/
│   │   ├── layout.tsx               → Sidebar + Header + Main
│   │   ├── page.tsx                 → Dashboard (KPI + charts)
│   │   ├── inbox/
│   │   │   └── page.tsx             → 3-column inbox
│   │   ├── contacts/
│   │   │   ├── page.tsx             → Table + search + filters
│   │   │   └── [id]/page.tsx        → Contact detail + timeline
│   │   ├── appointments/
│   │   │   └── page.tsx             → Calendar + list view
│   │   ├── campaigns/
│   │   │   ├── page.tsx             → Campaign list
│   │   │   └── [id]/page.tsx        → Campaign detail + stats
│   │   ├── settings/
│   │   │   ├── page.tsx             → General settings
│   │   │   ├── whatsapp/page.tsx    → WA linking
│   │   │   ├── team/page.tsx        → Team management
│   │   │   └── billing/page.tsx     → Plans + payments
│   │   └── templates/
│   │       └── page.tsx             → Template management
│   ├── layout.tsx                   → Root layout (providers)
│   └── globals.css                  → Tailwind + custom styles
├── components/
│   ├── ui/                          → shadcn/ui components
│   ├── layout/
│   │   ├── sidebar.tsx              → Collapsible sidebar nav
│   │   ├── header.tsx               → Top bar (search, notifications, profile)
│   │   └── mobile-nav.tsx           → Bottom nav for mobile
│   ├── inbox/
│   │   ├── conversation-list.tsx    → Left panel
│   │   ├── chat-thread.tsx          → Center panel (messages)
│   │   ├── message-bubble.tsx       → Individual message
│   │   ├── reply-box.tsx            → Input + send button
│   │   └── contact-sidebar.tsx      → Right panel (contact info)
│   ├── contacts/
│   │   ├── contacts-table.tsx       → TanStack Table
│   │   ├── contact-card.tsx         → Mobile card view
│   │   └── import-dialog.tsx        → CSV import modal
│   ├── appointments/
│   │   ├── calendar-view.tsx        → Day/week calendar
│   │   ├── booking-dialog.tsx       → New booking modal
│   │   └── slot-picker.tsx          → Time slot selector
│   ├── dashboard/
│   │   ├── kpi-cards.tsx            → 4 stat cards
│   │   ├── message-chart.tsx        → 7-day volume chart
│   │   └── appointment-chart.tsx    → Status breakdown
│   └── shared/
│       ├── data-table.tsx           → Reusable table component
│       ├── loading-skeleton.tsx     → Skeleton loader
│       ├── empty-state.tsx          → Illustration + CTA
│       ├── confirm-dialog.tsx       → Destructive action modal
│       └── phone-input.tsx          → Indian phone formatter
├── lib/
│   ├── api.ts                       → Fetch wrapper (auth headers, error handling)
│   ├── socket.ts                    → Socket.io client singleton
│   ├── auth.ts                      → Zustand auth store
│   └── utils.ts                     → cn(), formatPhone(), formatDate()
├── hooks/
│   ├── use-auth.ts                  → Auth state + actions
│   ├── use-socket.ts                → Socket.io connection + events
│   ├── use-contacts.ts              → TanStack Query hooks
│   ├── use-conversations.ts         → Inbox query hooks
│   ├── use-appointments.ts          → Booking query hooks
│   └── use-debounce.ts              → Search debounce
└── types/
    └── index.ts                     → Re-export from packages/shared
```

### Page Specifications

#### Login Page (`/login`)
- Clean centered card (max-w-md)
- Phone input with +91 prefix (Indian format)
- OTP input (6 digits, auto-focus next)
- Loading state on submit
- Error toast on invalid OTP
- Auto-redirect to `/` on success

#### Onboarding Wizard (`/setup`)
- Step 1: Business name, vertical (dropdown), timezone
- Step 2: Connect WhatsApp (paste Phone ID + Token)
- Step 3: Invite team (optional, can skip)
- Progress bar at top
- "Skip" + "Next" buttons
- Auto-redirect to dashboard on complete

#### Dashboard (`/`)
- 4 KPI cards: Messages today, Open conversations, Today's appointments, Total contacts
- Message volume chart (7-day bar)
- Appointment status pie/donut chart
- Quick actions: "New Contact", "Send Broadcast", "Book Appointment"
- Recent conversations list (last 5)

#### Inbox (`/inbox`) — MOST COMPLEX PAGE
- 3-column layout (desktop): Conversations | Chat | Contact Sidebar
- 2-column on tablet, 1-column on mobile (stack with back navigation)
- Conversation list: Avatar, name, last message preview, time, unread badge
- Chat thread: Message bubbles (sent=right/teal, received=left/gray), timestamps
- Reply box: Text input, quick replies dropdown, template button, send
- Contact sidebar: Name, phone, tags, appointments, notes
- Real-time: New messages appear instantly (Socket.io)
- Typing indicator, online status, delivery ticks (✓✓)
- Filter bar: All | Mine | Unassigned | Open | Resolved

#### Contacts (`/contacts`)
- Table view (desktop): Name, Phone, Tags, Last Message, Created
- Card view (mobile): Compact cards with avatar
- Search bar (debounced, searches name + phone)
- Tag filter (multi-select chips)
- Pagination (cursor-based, "Load more" button)
- Bulk actions: Tag, Delete, Export
- Import button → CSV upload dialog with progress
- Click row → `/contacts/[id]` detail page

#### Contact Detail (`/contacts/[id]`)
- Profile header: Name, phone, tags, opt-out badge
- Timeline: Interleaved messages + appointments + notes (chronological)
- Edit button → inline edit mode
- Quick actions: Send message, Book appointment, Add note

#### Appointments (`/appointments`)
- Toggle: Calendar view | List view
- Calendar: Day or Week view with time slots
- Color-coded: Confirmed=blue, Completed=green, No-show=red, Cancelled=gray
- "Book Appointment" FAB → dialog with provider + slot picker
- List view: Filterable table (date, provider, status)
- Today's view prominent at top

#### Settings (`/settings/*`)
- Tabbed layout: General | WhatsApp | Team | Billing
- General: Business profile form (name, address, hours, away message)
- WhatsApp: Connection status, linked phone, unlink button
- Team: Table of members, invite button, role dropdown, remove
- Billing: Current plan card, usage meters, payment history, upgrade button

### API Integration Pattern

```typescript
// lib/api.ts — Centralized fetch wrapper
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    // Trigger token refresh or redirect to login
    await refreshToken();
    // Retry once
  }
  if (!res.ok) {
    const error = await res.json();
    throw new ApiError(error.error.code, error.error.message);
  }
  return res.json();
}
```

### Socket.io Integration Pattern

```typescript
// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(token: string) {
  socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
    auth: { token },
    transports: ["websocket"],
  });

  socket.on("connect", () => console.log("Socket connected"));
  socket.on("new_message", (data) => {
    // Invalidate TanStack Query cache for conversations
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  });
  socket.on("message_status", (data) => {
    // Update message delivery status in cache
  });
  socket.on("assignment_change", (data) => {
    // Update conversation assignment
  });
}
```

---

## REMAINING FEATURES TO IMPLEMENT (Post-Step 10)

### Backend Gaps (Must complete before/during frontend)

| # | Feature | Priority | Effort | Notes |
|---|---------|----------|--------|-------|
| 1 | Socket.io real-time server | P0 | 2 days | New package or add to API. Rooms per tenant. |
| 2 | WebSocket JWT auth on handshake | P0 | 0.5 day | Verify token, inject tenantId |
| 3 | WebSocket tenant isolation | P0 | 0.5 day | Room-based: `tenant:{id}` |
| 4 | Auto-create contact on inbound | P0 | 0.5 day | Webhook → if contact not found → create |
| 5 | BullMQ reminder worker | P0 | 2 days | Process reminder keys → send WhatsApp template |
| 6 | WhatsApp booking flow | P0 | 3 days | Interactive messages → state machine → book |
| 7 | Booking confirmation message | P0 | 0.5 day | Auto-send template on booking |
| 8 | Auto-reminder 24h before | P0 | 1 day | BullMQ delayed job → template |
| 9 | Auto-reminder 2h before | P0 | 0.5 day | Same worker, different delay |
| 10 | No-show follow-up message | P1 | 0.5 day | Cron → next day template |
| 11 | Media download + S3 upload | P1 | 1 day | Download from Meta CDN → MinIO/S3 |
| 12 | Holiday/leave management | P1 | 0.5 day | Mark provider dates unavailable |
| 13 | CI/CD pipeline (GitHub Actions) | P1 | 1 day | lint → type-check → test → build → deploy |
| 14 | OTP via WhatsApp channel | P2 | 0.5 day | Alternative to SMS |

### Frontend Pages (Must build for MVP)

| # | Page | Priority | Effort | Description |
|---|------|----------|--------|-------------|
| 1 | Login + OTP | P0 | 1 day | Phone → OTP → verify → redirect |
| 2 | Onboarding wizard | P0 | 1.5 days | 3-step: business → WA → team |
| 3 | Dashboard | P0 | 1.5 days | KPI cards + charts + quick actions |
| 4 | Inbox (3-column) | P0 | 4 days | Most complex — real-time chat |
| 5 | Contacts table + detail | P0 | 2 days | Table + search + timeline view |
| 6 | Appointments calendar | P0 | 2.5 days | Calendar + booking dialog |
| 7 | Campaigns list + detail | P1 | 1.5 days | List + create + stats |
| 8 | Templates management | P1 | 1 day | CRUD for WA templates |
| 9 | Settings (4 tabs) | P0 | 2 days | General, WA, Team, Billing |
| 10 | Billing page | P0 | 1 day | Plan card + usage + payments |
| 11 | Mobile responsive | P0 | 2 days | Bottom nav, stacked layouts |
| 12 | Command palette (Cmd+K) | P2 | 0.5 day | Power user navigation |

### Value-Add Features (Make product more sellable)

| # | Feature | Category | Why It Increases Value |
|---|---------|----------|----------------------|
| 1 | **Payment links via WhatsApp** | Revenue | Clinic sends "Pay ₹500" → Razorpay link in WhatsApp |
| 2 | **Basic keyword automation** | Efficiency | "hours" → auto-reply clinic hours. "book" → start flow |
| 3 | **Patient feedback collection** | Insights | Post-appointment: "Rate 1-5" → track satisfaction |
| 4 | **Prescription/report sharing** | Healthcare | Send PDF via WhatsApp with tracking |
| 5 | **Waitlist notifications** | Revenue | Cancelled slot → notify next in waitlist |
| 6 | **Multi-language support** | India market | Hindi + English templates/UI |
| 7 | **Click-to-WhatsApp ad tracking** | Marketing | Track which ad → which patient → which booking |
| 8 | **Smart scheduling** | UX | "Book with any available doctor today" |
| 9 | **Revenue dashboard** | Business value | Show ₹ earned from appointments this month |
| 10 | **Patient recall campaigns** | Retention | "Patients not seen in 90 days" → auto-campaign |

---

## IMPLEMENTATION ORDER (Recommended)

```
PHASE A — Frontend Foundation (Week 1):
  → Next.js 14 scaffold + Tailwind + shadcn/ui setup
  → Auth flow (login, token management, protected routes)
  → Layout (sidebar, header, mobile nav)
  → Dashboard page (connect to existing API)

PHASE B — Core Pages (Weeks 2-3):
  → Inbox page (3-column, connect to conversations API)
  → Socket.io integration (real-time messages)
  → Contacts page (table + detail + timeline)
  → Appointments page (calendar + booking)

PHASE C — Complete MVP (Week 3-4):
  → Settings pages (all 4 tabs)
  → Campaigns page (list + create + stats)
  → Onboarding wizard
  → Billing page
  → Mobile responsive polish

PHASE D — Backend Completion (Parallel):
  → Socket.io server + WebSocket auth
  → BullMQ reminder worker
  → WhatsApp booking flow
  → Auto-contact creation on inbound
  → CI/CD pipeline
```

---

*Last Updated: April 29, 2026 | Phase 1 Backend Complete | Frontend Next | E2E 266/267 passing*
