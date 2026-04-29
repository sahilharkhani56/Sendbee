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
CURRENT STEP:  Step 11 — Production Deployment
STEP STATUS:   NOT STARTED
COMPLETED:     Step 0 (Scaffolding), Step 1 (DB Schema), Step 2 (Auth + 3-Tier), Step 3 (WhatsApp Integration), Step 4 (Contact Management), Step 5 (Conversation Inbox), Step 6 (Appointment System), Step 7 (Campaign & Broadcast), Step 8 (Dashboard & Analytics), Step 9 (Billing & Subscription), Step 10 (Settings & Team)

E2E TEST STATUS (Steps 0–7):
  ✅ 266 passed / 1 failed / 267 total (April 29, 2026)
  ✅ Step 0: 3 tests — health check, status, timestamp
  ✅ Step 1: 5 tests — DB connectivity, route existence (contacts, conversations, auth/me, team)
  ✅ Step 2: 18 tests — OTP send/verify, signup flow, /me, token refresh, team invite/list, logout
  ✅ Step 3: 5 tests — graph.facebook.com reachability check, webhook logic, phone normalization, dedup, 24h session
  ✅ Step 4: 28 tests — CRUD, duplicate, invalid phone, list, search, tags, detail+timeline, update, opt-out, CSV import, soft delete, resurrection, pagination
  ✅ Step 5: 47 tests — conversation list/filters/pagination, detail, message thread, reply (session guard), assignment, status toggle, mark-read, internal notes, quick replies CRUD, error cases
  ✅ Step 6: 67 tests — provider CRUD/validation/list/detail/update/delete, slot availability (working hours + breaks + Sunday + missing date), booking create/double-booking/detail/list/filters/pagination/validation, complete, cancel, no-show, reschedule (atomic cancel+book), today's summary, auth errors
  ✅ Step 7: 94 tests — template CRUD/validation/duplicate/list/filter/detail/update/approve/reject, campaign CRUD/validation/detail/update/list/filter/pagination, send (approved guard + no-contacts guard + double-send lock), pause/resume, simulate delivery, stats (delivery rate + read rate + pending), cancel, delete (draft only), template delete (in-use guard + FK cleanup), auth errors
  ⚠️ WhatsApp send tests skipped (graph.facebook.com unreachable from org network)
  ⚠️ Super admin tests skipped (no seeded super admin)
  Test file: e2e-test.cjs (~1600 lines, zero npm deps, native Node.js http/https/crypto)

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

CURRENT TASK (Step 11): Production Deployment
  → Dockerfiles for each service
  → CI/CD pipeline (GitHub Actions)
  → AWS ECS + RDS + ElastiCache IaC
  → Environment-specific configs

NEXT STEP: Frontend (Next.js)

BLOCKERS / DECISIONS PENDING:
  → [x] E2E testing completed for Steps 0–7 (266/267 passing)
  → [ ] Real WhatsApp Cloud API send testing deferred (org network blocks graph.facebook.com)
  → [ ] Socket.io real-time layer deferred to frontend integration
  → [ ] Super admin seed data needed for admin auth E2E tests
  → [ ] WhatsApp booking flow deferred (requires real WA Cloud API for interactive messages)
  → [ ] BullMQ reminder worker deferred (Step 6 stores reminder keys; worker processes in apps/worker)

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
  → packages/whatsapp-sdk/src/client.ts     (Meta Cloud API typed client — WhatsAppClient class)
  → apps/webhook/src/server.ts              (webhook receiver + HMAC SHA256 verification)
  → apps/webhook/src/whatsapp-webhook.ts    (inbound message + status update processing)
  → apps/webhook/src/redis.ts               (dedup SETNX + 24h session window tracking)
  → apps/webhook/src/env.ts                 (Zod env validation for webhook service)
  → e2e-test.cjs                            (E2E test suite — 267 tests, Steps 0–7)
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
- [ ] CI/CD pipeline (GitHub Actions)
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
- [ ] Media download + S3 upload pipeline

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
- [ ] Auto-create contact on first inbound message

### 1F. Conversation Inbox ✅
- [x] Conversation list API (sorted by last_message_at DESC)
- [x] Conversation filters (status, assignee)
- [x] Message thread API (cursor pagination)
- [x] Reply from inbox (send via WhatsApp)
- [x] Conversation assignment (to team member)
- [x] Conversation status management (open → resolved)
- [x] Unread count tracking (increment on inbound, reset on open)
- [x] Mark as read
- [ ] Real-time updates (Socket.io)
- [ ] WebSocket authentication (JWT on handshake)
- [ ] WebSocket tenant isolation (room per tenant)
- [x] Quick reply templates (staff pre-saved replies)
- [x] Internal notes on conversation (not sent to patient)

### 1G. Appointment System ✅
- [x] Provider CRUD (name, specialization, photo, slot_duration)
- [x] Working hours configuration (per-provider per-day)
- [x] Break hours configuration (lunch, prayer time)
- [ ] Holiday/leave management (mark dates unavailable)
- [x] Slot availability API
- [x] Manual booking from dashboard
- [ ] WhatsApp booking flow (patient types "book" → guided flow)
- [ ] Booking state machine in Redis (TTL 10min)
- [x] Double-booking prevention (EXCLUSION constraint + distributed lock)
- [ ] Booking confirmation WhatsApp message
- [ ] Auto-reminder 24h before (BullMQ delayed job)
- [ ] Auto-reminder 2h before (BullMQ delayed job)
- [x] Appointment cancellation (slot freed + confirmation sent)
- [x] Appointment rescheduling (atomic: cancel old + book new)
- [x] No-show auto-detection (cron: end_time + 30min → flag)
- [ ] No-show follow-up message (next day)
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

*Last Updated: April 29, 2026 | Phase 1 Step 9 of 11 | E2E 266/267 passing*
