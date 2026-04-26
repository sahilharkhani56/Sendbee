# Technical Design Document
## WhatsApp-Native CRM Platform for Indian SMBs

<table>
<tr><td><b>Classification</b></td><td>Confidential — Internal Use Only</td></tr>
<tr><td><b>Document ID</b></td><td>TDD-2026-001</td></tr>
<tr><td><b>Version</b></td><td>2.0</td></tr>
<tr><td><b>Author</b></td><td>Sahil Harkhani, Founding Engineer</td></tr>
<tr><td><b>Date</b></td><td>April 20, 2026</td></tr>
<tr><td><b>Status</b></td><td>Under Review</td></tr>
<tr><td><b>Reviewers</b></td><td>[Technical Advisory Board]</td></tr>
</table>

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Apr 20, 2026 | S. Harkhani | Initial draft — feature spec & architecture |
| 2.0 | Apr 20, 2026 | S. Harkhani | Professional rewrite — system design rationale, market analysis, engineering rigor |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Analysis & Opportunity](#2-market-analysis--opportunity)
3. [Problem Statement & Value Proposition](#3-problem-statement--value-proposition)
4. [Product Architecture Overview](#4-product-architecture-overview)
5. [System Design Principles](#5-system-design-principles)
6. [Functional Specification](#6-functional-specification)
7. [Technology Selection & Rationale](#7-technology-selection--rationale)
8. [Data Architecture](#8-data-architecture)
9. [Distributed Systems Design](#9-distributed-systems-design)
10. [Scalability Engineering](#10-scalability-engineering)
11. [Reliability & Fault Tolerance](#11-reliability--fault-tolerance)
12. [Security Architecture](#12-security-architecture)
13. [Observability Stack](#13-observability-stack)
14. [Infrastructure & Deployment](#14-infrastructure--deployment)
15. [API Contract Design](#15-api-contract-design)
16. [Performance Engineering](#16-performance-engineering)
17. [Cost Model & Unit Economics](#17-cost-model--unit-economics)
18. [Risk Assessment & Mitigation](#18-risk-assessment--mitigation)
19. [Implementation Roadmap](#19-implementation-roadmap)
20. [Appendices](#20-appendices)

---

## 1. Executive Summary

### 1.1 Thesis

India's 63.4 million SMBs generate an estimated ₹80 lakh crore in annual revenue, yet fewer than 5% utilize any form of customer relationship management software. WhatsApp, with 535 million monthly active users in India (as of 2025), has become the de facto communication platform for business-customer interactions — yet no purpose-built, vertical CRM exists that leverages this channel at an accessible price point.

We propose building a **multi-tenant, WhatsApp-native CRM platform** that automates customer lifecycle management for Indian service-sector SMBs — beginning with healthcare clinics as the beachhead market.

### 1.2 Key Differentiators

| Dimension | Horizontal Competitors (Wati, Interakt) | Our Platform |
|-----------|----------------------------------------|--------------|
| **Positioning** | Generic messaging tool | Vertical CRM (appointments, no-show reduction, lifecycle) |
| **Pricing** | ₹5,000–15,000/month | ₹999–4,999/month (3–10× more accessible) |
| **Value metric** | Messages sent | Revenue saved (quantifiable: ₹50K–1L/month per clinic) |
| **Switching cost** | Low (commodity messaging) | High (workflow + data dependency) |
| **ICP** | Mid-market, e-commerce | Micro-SMBs, service businesses |

### 1.3 Technical Summary

- **Architecture:** Event-driven, multi-tenant SaaS on shared infrastructure
- **Primary interface:** WhatsApp Business Cloud API (Meta)
- **Core stack:** TypeScript, Next.js 14, Fastify, PostgreSQL 16, Redis 7, BullMQ → Kafka
- **Infrastructure:** AWS ap-south-1 (Mumbai), ECS Fargate, Terraform-managed
- **Target SLA:** 99.9% availability, P99 latency <500ms, zero message loss

### 1.4 Business Metrics Target (18 months)

| Metric | Target |
|--------|--------|
| Tenants (paying) | 1,000 |
| MRR | ₹20,00,000 |
| Gross margin | >85% |
| Net Revenue Retention | >120% |
| Monthly churn | <4% |
| CAC:LTV ratio | 1:5+ |

---

## 2. Market Analysis & Opportunity

### 2.1 Total Addressable Market (TAM)

```
India SMB landscape (2025-26):
├── Total registered SMBs: 63.4 million (MSME Ministry)
├── Service-sector SMBs: ~24 million
├── Digitally active (smartphone + internet): ~12 million
├── Using WhatsApp for business: ~8 million (est.)
└── Willingness to pay for SaaS (₹500+/mo): ~2 million
    
TAM = 2M × ₹24,000/year = ₹4,800 Cr/year (~$5.7B)
SAM (healthcare + fitness + education) = ~400K × ₹24,000 = ₹960 Cr
SOM (realistic 3-year capture) = 5,000 × ₹30,000 = ₹15 Cr ARR
```

### 2.2 Why Now

| Macro Trend | Implication |
|-------------|-------------|
| WhatsApp Business API democratization (2023-24) | Cloud API now free for first 1,000 conversations/month. Previously required BSPs with ₹25K+ setup fees |
| UPI penetration (500M+ users) | Digital payment literacy enables SaaS subscriptions for micro-businesses |
| Post-COVID digital acceleration | 73% of Indian SMBs adopted at least one digital tool post-2020 (RedSeer) |
| India Stack maturity | Aadhaar, UPI, ONDC creating infra rails for SMB digitization |
| DPDP Act 2023 | Forces organized data handling — advantage to compliant platforms |
| WhatsApp Commerce expansion | Meta investing heavily in India commerce — aligned tailwind |

### 2.3 Beachhead Market Selection: Healthcare Clinics

**Selection criteria (scored 1–5):**

| Criterion | Clinics | Gyms | Salons | Coaching | Real Estate |
|-----------|---------|------|--------|----------|-------------|
| Pain severity | 5 | 4 | 3 | 4 | 3 |
| Willingness to pay | 5 | 3 | 2 | 4 | 5 |
| Decision-maker access | 5 | 4 | 3 | 4 | 3 |
| Network effects (referral) | 5 | 3 | 2 | 3 | 2 |
| Quantifiable ROI | 5 | 3 | 2 | 3 | 3 |
| **Total** | **25** | **17** | **12** | **18** | **16** |

**Rationale:** A single dental clinic with 15 daily appointments and a 35% no-show rate loses ₹3,500/day in unrealized revenue. A ₹999/month product that reduces no-shows to 10% delivers **25:1 ROI** — making the sale a mathematical inevitability.

### 2.4 Competitive Landscape

```
                    HIGH PRICE
                        │
           Wati         │         Salesforce
        (₹5-15K/mo)    │       (₹50K+/mo)
      Generic+Feature   │     Enterprise+Overkill
                        │
 GENERIC ───────────────┼─────────────────── VERTICAL
                        │
        AiSensy         │         ★ OUR POSITION ★
       (₹999/mo)       │         (₹999-5K/mo)
     Cheap+Basic        │       Affordable+Deep
                        │
                    LOW PRICE

Defensibility: Vertical depth (appointment logic, no-show ML, clinic workflows)
              + data compounding (more usage → better predictions)
              + workflow lock-in (hard to migrate once embedded)
```

---

## 3. Problem Statement & Value Proposition

### 3.1 Current State (As-Is)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TYPICAL CLINIC WORKFLOW TODAY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Patient calls ─→ Receptionist picks up (if available)                       │
│       │              └── If busy → patient hangs up → LOST                   │
│       ▼                                                                       │
│  Manual diary entry (paper or Excel)                                         │
│       │              └── No deduplication, no searchability                   │
│       ▼                                                                       │
│  No automated reminder sent                                                   │
│       │              └── 30-40% patients simply forget                        │
│       ▼                                                                       │
│  Day of appointment: 35% no-show rate                                         │
│       │              └── Empty slot = ₹500-2000 lost revenue                 │
│       ▼                                                                       │
│  No follow-up system                                                          │
│       │              └── 85% of patients never return for next visit          │
│       ▼                                                                       │
│  Zero marketing capability                                                    │
│                      └── Can't reach existing patients for new services       │
│                                                                               │
│  RESULT: ₹50,000 – ₹1,50,000/month in lost revenue per clinic               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Proposed State (To-Be)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WITH OUR PLATFORM                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Patient messages on WhatsApp ─→ Auto-reply with available slots             │
│       │                                                                       │
│       ▼                                                                       │
│  Selects slot ─→ Atomic booking (no double-booking)                          │
│       │                                                                       │
│       ▼                                                                       │
│  Auto-reminder at T-24h and T-2h ─→ Confirm/Cancel buttons                  │
│       │                                                                       │
│       ▼                                                                       │
│  No-show rate: 8-12% (from 35%)                                              │
│       │                                                                       │
│       ▼                                                                       │
│  Auto follow-up at T+6 months ─→ "Due for checkup"                          │
│       │                                                                       │
│       ▼                                                                       │
│  Targeted campaigns ─→ "20% off teeth whitening this week"                   │
│                                                                               │
│  RESULT: ₹50K-1L/month SAVED + new revenue from reactivation                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Quantified Value Proposition

| Metric | Before | After | Δ (for avg. clinic with 15 appts/day) |
|--------|--------|-------|---------------------------------------|
| No-show rate | 35% | 10% | -25 percentage points |
| Revenue lost to no-shows | ₹1,05,000/mo | ₹30,000/mo | **₹75,000/mo saved** |
| Repeat visit rate | 15% | 45% | +30pp → ₹40K incremental/mo |
| Receptionist phone time | 3.5 hrs/day | 0.5 hrs/day | 3 hrs freed for patient care |
| Marketing reach | 0 patients | Entire database | New revenue channel |
| **Net value delivered** | — | — | **₹1,00,000+/month** |
| **Platform cost** | — | — | **₹999–2,499/month** |
| **ROI** | — | — | **40–100× return** |

---

## 4. Product Architecture Overview

### 4.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                       │
│    ┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────────┐               │
│    │   Web    │   │  Mobile  │   │   WhatsApp   │   │  Public API  │               │
│    │Dashboard │   │   App    │   │  End Users   │   │  (Partners)  │               │
│    └────┬─────┘   └────┬─────┘   └──────┬───────┘   └──────┬───────┘               │
│         │               │                │                   │                       │
│         └───────────────┼────────────────┼───────────────────┘                       │
│                         │                │                                            │
│                         ▼                ▼                                            │
│             ┌───────────────────────────────────────────┐                            │
│             │         EDGE LAYER                         │                            │
│             │   Cloudflare (CDN + WAF + DDoS + DNS)     │                            │
│             └─────────────────────┬─────────────────────┘                            │
│                                   │                                                   │
│                                   ▼                                                   │
│             ┌───────────────────────────────────────────┐                            │
│             │       INGRESS (AWS ALB)                    │                            │
│             │   TLS termination, health checks, routing │                            │
│             └──────┬──────────────┬──────────────┬──────┘                            │
│                    │              │              │                                    │
│              ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐                              │
│              │  API SVC  │ │ Webhook   │ │ WebSocket │                              │
│              │ (Fastify) │ │ Receiver  │ │  Server   │                              │
│              │  ×2-8     │ │  ×2-4     │ │  ×2-4     │                              │
│              └─────┬─────┘ └─────┬─────┘ └─────┬─────┘                              │
│                    │              │              │                                    │
│              ┌─────▼──────────────▼──────────────▼─────┐                             │
│              │       SERVICE LAYER (Business Logic)      │                            │
│              │                                           │                            │
│              │  Auth │ CRM │ Messaging │ Appointments   │                            │
│              │  Campaigns │ Analytics │ Automation      │                            │
│              │  Billing │ Notifications                  │                            │
│              └─────────────────────┬────────────────────┘                            │
│                                    │                                                  │
│              ┌─────────────────────▼────────────────────┐                            │
│              │       ASYNC PROCESSING LAYER              │                            │
│              │                                           │                            │
│              │  BullMQ (MVP) ──→ Apache Kafka (Scale)   │                            │
│              │                                           │                            │
│              │  Queues:                                  │                            │
│              │  • message_send (prioritized)             │                            │
│              │  • webhook_process                        │                            │
│              │  • campaign_execute (batched)             │                            │
│              │  • reminder_scheduler                     │                            │
│              │  • analytics_aggregate                    │                            │
│              │  • dead_letter (isolation)                │                            │
│              └─────────────────────┬────────────────────┘                            │
│                                    │                                                  │
│              ┌─────────────────────▼────────────────────┐                            │
│              │       WORKER POOL (Independently Scaled)  │                            │
│              │                                           │                            │
│              │  Message Sender (×3-10) │ Webhook (×2-5) │                            │
│              │  Campaign (×2-5) │ Reminder (×1)         │                            │
│              │  Analytics (×1-2) │ Automation (×1-2)    │                            │
│              └─────────────────────┬────────────────────┘                            │
│                                    │                                                  │
│              ┌─────────────────────▼────────────────────┐                            │
│              │       DATA LAYER                          │                            │
│              │                                           │                            │
│              │  ┌────────────┐  ┌──────────────┐        │                            │
│              │  │PostgreSQL16│  │ Redis 7      │        │                            │
│              │  │(RDS,Multi- │  │ (ElastiCache │        │                            │
│              │  │AZ,Partitnd)│  │  Cluster)    │        │                            │
│              │  └────────────┘  └──────────────┘        │                            │
│              │                                           │                            │
│              │  ┌────────────┐  ┌──────────────┐        │                            │
│              │  │TimescaleDB │  │ AWS S3       │        │                            │
│              │  │(Analytics) │  │ (Media/Docs) │        │                            │
│              │  └────────────┘  └──────────────┘        │                            │
│              └──────────────────────────────────────────┘                            │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

EXTERNAL DEPENDENCIES:
├── Meta WhatsApp Cloud API (messaging)
├── Razorpay (billing/subscriptions)
├── MSG91 (SMS OTP fallback)
├── Grafana Cloud (observability)
└── Sentry (error tracking)
```

### 4.2 Architecture Style Classification

| Property | Decision | Rationale |
|----------|----------|-----------|
| **Decomposition** | Modular monolith → microservices | Complexity managed; split at proven boundaries |
| **Communication** | Sync (REST) + Async (events) | REST for reads/commands, events for side effects |
| **Data ownership** | Shared DB (Phase 1) → Service-owned (Phase 3) | Avoid premature distributed transactions |
| **Consistency model** | Strong for bookings, eventual for analytics | CAP-aware: CP where correctness matters |
| **Deployment unit** | Independently deployable containers | Each process (API, webhook, worker) scales independently |
| **State management** | Stateless compute, stateful storage | Horizontal scaling without session affinity (except WS) |

---

## 5. System Design Principles

### 5.1 Architectural Tenets (Ordered by Priority)

1. **Correctness over performance** — A double-booked appointment or lost message is unacceptable. Strong consistency where business logic demands it.
2. **Simplicity over cleverness** — Premature optimization is the root of all evil. Ship with PostgreSQL + Redis; introduce Kafka/Elasticsearch only when load demands.
3. **Isolation between tenants** — One tenant's activity must never degrade another's experience. Enforced at application, database, cache, and queue layers.
4. **Observability-first** — Every system behavior must be measurable. If it can't be monitored, it can't be managed.
5. **Graceful degradation** — If an external dependency fails (Meta API, payment gateway), the system continues operating in a reduced capacity rather than crashing.
6. **Cost-proportional scaling** — Infrastructure cost should grow linearly (or sub-linearly) with revenue. Never over-provision.

### 5.2 System Design Concepts Applied

| Concept | Where Applied | Implementation |
|---------|---------------|----------------|
| **Load Balancing** | API tier | ALB round-robin; WebSocket uses sticky sessions |
| **Horizontal Scaling** | All compute | ECS auto-scaling on CPU (>70%) and queue depth (>1000) |
| **Database Partitioning** | Messages table | Range partition by `created_at` (monthly) — query locality + easy archival |
| **Database Sharding** | Phase 3 (>5000 tenants) | Hash(tenant_id) mod N; Citus extension on PostgreSQL |
| **Read Replicas** | Analytics queries | Route dashboard reads to replica; writes to primary |
| **Caching Strategy** | Contact lookups, config | L1: Redis (TTL-based), L2: CDN (static), invalidation via pub/sub |
| **CQRS** | Inbox vs. Analytics | Write path: normalized PostgreSQL. Read path: denormalized views / TimescaleDB |
| **Event Sourcing (partial)** | Message lifecycle | Status transitions (queued→sent→delivered→read) stored as events |
| **Circuit Breaker** | Meta API calls | 5 failures/30s → circuit OPEN → 60s cooldown → HALF-OPEN → test |
| **Saga Pattern** | Campaign execution | Orchestrated saga: segment → batch → send → track → complete |
| **Backpressure** | Queue consumption | If downstream (Meta API) responds slowly, reduce consumer concurrency dynamically |
| **Idempotency** | Webhook processing | Deduplicate by `wa_message_id` using Redis SETNX (TTL: 24h) |
| **Bulkhead Isolation** | Per-tenant queuing | Max 1000 pending jobs per tenant — prevents queue monopolization |
| **Consistent Hashing** | Kafka partitioning | `tenant_id` as partition key ensures message ordering per tenant |
| **Optimistic Concurrency** | Contact edits | Version column; retry on conflict |
| **Pessimistic Locking** | Appointment booking | PostgreSQL EXCLUSION constraint + Redis distributed lock (Redlock) |
| **Fan-out on Write** | Campaign sends | 1 campaign → N individual message jobs (bounded: 100/batch) |
| **Graceful Shutdown** | All services | SIGTERM → stop accepting new work → drain in-flight → exit |

### 5.3 Consistency Boundaries

```
                    ┌─────────────────────────────────────┐
                    │     STRONG CONSISTENCY (ACID)        │
                    │                                       │
                    │  • Appointment slot booking           │
                    │  • Contact opt-out status             │
                    │  • Plan/billing state changes         │
                    │  • Campaign cancellation              │
                    │  • Team member permission changes     │
                    │                                       │
                    │  Strategy: Primary DB, transactions,  │
                    │  SELECT FOR UPDATE / exclusion locks  │
                    └─────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │   EVENTUAL CONSISTENCY (Acceptable)   │
                    │                                       │
                    │  • Message delivery status (1-5s)     │
                    │  • Analytics dashboard (5-30s)        │
                    │  • Read replica queries (<1s)         │
                    │  • Campaign progress counter (30s)    │
                    │  • Engagement score (hourly)          │
                    │                                       │
                    │  Strategy: Async events, batch agg,   │
                    │  replica lag tolerance                 │
                    └─────────────────────────────────────┘
```

---

## 6. Functional Specification

### 6.1 Feature Classification by Development Stage

Features are classified using **MoSCoW** (Must/Should/Could/Won't) per phase:

#### Phase 1 — MVP (Weeks 1–8) | Goal: First 10 paying customers

| ID | Feature | Priority | Acceptance Criteria |
|----|---------|----------|-------------------|
| **F1.01** | OTP-based authentication | Must | 6-digit OTP, 5-min expiry, rate-limited (5/hour), JWT issued on verify |
| **F1.02** | Multi-tenant provisioning | Must | Signup creates tenant + owner; complete data isolation verified |
| **F1.03** | WhatsApp Cloud API connect | Must | Tenant links WABA; webhook receives messages within 1s |
| **F1.04** | Send template messages | Must | Select approved template, fill variables, queue for delivery |
| **F1.05** | Receive & store messages | Must | Inbound text/media stored, contact auto-created, real-time in inbox |
| **F1.06** | Contact management | Must | CRUD, CSV import (10K rows <30s), tags, phone normalization |
| **F1.07** | Conversation inbox | Must | Real-time (WebSocket), assignment, status (open/resolved), search |
| **F1.08** | Appointment booking | Must | Provider slots, atomic booking (no double-book), WhatsApp flow |
| **F1.09** | Auto-reminders | Must | 24h + 2h before; template-based; delayed job queue |
| **F1.10** | Broadcast campaigns | Must | Segment by tags, schedule, rate-limited sending, delivery stats |
| **F1.11** | Dashboard (basic) | Must | Messages today, appointments today, no-show rate |
| **F1.12** | Razorpay billing | Must | Subscribe, charge, invoice (GST), grace period on failure |
| **F1.13** | Opt-out handling | Must | Detect "STOP", flag contact, cease all messaging immediately |
| **F1.14** | Role-based access | Should | Owner (all), Admin (no billing), Staff (assigned convos only) |
| **F1.15** | Reply within 24h window | Must | Detect session; free-form allowed; else require template |

#### Phase 2 — Growth (Months 3–6) | Goal: 100→500 customers

| ID | Feature | Priority |
|----|---------|----------|
| **F2.01** | Mobile app (React Native) | Must |
| **F2.02** | Automation rules (keyword triggers) | Must |
| **F2.03** | Multi-provider scheduling | Must |
| **F2.04** | Campaign A/B testing | Should |
| **F2.05** | Drip sequences (multi-day) | Should |
| **F2.06** | Payment links in messages (Razorpay) | Should |
| **F2.07** | Custom fields per contact | Should |
| **F2.08** | Google Calendar bi-sync | Could |
| **F2.09** | Advanced analytics (cohort, retention) | Should |
| **F2.10** | Multi-language templates (Hindi) | Should |

#### Phase 3 — Scale (Months 6–12) | Goal: 500→2000 customers

| ID | Feature | Priority |
|----|---------|----------|
| **F3.01** | Kafka event streaming migration | Must |
| **F3.02** | AI chatbot builder (visual) | Should |
| **F3.03** | Intent classification (LLM) | Could |
| **F3.04** | Full-text search (Elasticsearch) | Must |
| **F3.05** | API for partners (public, rate-limited) | Must |
| **F3.06** | Zapier/Make integration | Should |
| **F3.07** | White-label option | Could |
| **F3.08** | Multi-branch per tenant | Should |
| **F3.09** | Predictive no-show scoring (ML) | Could |
| **F3.10** | Instagram DM channel | Could |

### 6.2 Core Flow Specifications

#### 6.2.1 Outbound Message Flow (Critical Path)

```
Trigger: Staff clicks "Send" OR system automation fires
    │
    ├─[1] Request validation ─────────────────────────────────────────────────
    │     • JWT valid + tenant active + plan not expired
    │     • Contact exists, not opted-out, phone valid (E.164)
    │     • Template approved by Meta (if outside 24h window)
    │     • Daily message quota not exceeded
    │     • Per-endpoint rate limit not hit
    │     └── Fail: Return appropriate 4xx with error code
    │
    ├─[2] Persist & queue ────────────────────────────────────────────────────
    │     • BEGIN TRANSACTION
    │     │   INSERT INTO messages (status='queued', content, metadata)
    │     │   UPDATE conversations SET last_message_at = NOW()
    │     • COMMIT
    │     • BullMQ.add('message_send', {message_id}, {priority, attempts: 3})
    │     • Redis INCR ratelimit:wa_send:{tenant_id}:daily
    │     • Return 202 Accepted { message_id }
    │     └── Fail: Transaction rollback, return 500
    │
    ├─[3] Worker processing ──────────────────────────────────────────────────
    │     • Dequeue job (concurrency: 20 per worker instance)
    │     • Check circuit breaker state for Meta API
    │     │   └── OPEN: re-queue with 60s delay
    │     • Check per-second rate limit (80 msg/s)
    │     │   └── Exceeded: re-queue with 1s delay
    │     • Build Meta API payload (template + variables OR session text)
    │     • POST https://graph.facebook.com/v18.0/{phone_id}/messages
    │     │   ├── 200: Extract wa_message_id → UPDATE messages SET status='sent'
    │     │   ├── 429: Re-queue with exponential backoff
    │     │   ├── 400 (invalid template): Mark FAILED, notify admin
    │     │   └── 5xx: Retry (max 3), then DLQ
    │     • Emit event: message.sent → Redis PUBLISH for real-time UI
    │     • Write to analytics: message_events hypertable
    │     └── Fail after retries: Move to DLQ, alert monitoring
    │
    └─[4] Delivery confirmation (async, webhook-driven) ──────────────────────
          • Meta sends webhook: status = delivered/read/failed
          • Verify X-Hub-Signature-256
          • Deduplicate (Redis SETNX on wa_message_id, TTL 24h)
          • UPDATE messages SET status=?, status_updated_at=NOW()
          • Update campaign_logs if campaign-originated
          • Publish real-time status via Socket.io
          └── Metrics: wa_message_delivery_duration_seconds
```

#### 6.2.2 Appointment Booking Flow (State Machine)

```
States: IDLE → PROVIDER_SELECTED → SLOT_DISPLAYED → CONFIRMED → REMINDED → COMPLETED/NO_SHOW

                    ┌───────────────────────────────────────────────────┐
                    │           BOOKING STATE MACHINE                    │
                    │   (Redis hash: booking:{tenant}:{contact})        │
                    │   (TTL: 10 minutes — auto-expire stale sessions)  │
                    └───────────────────────────────────────────────────┘

Patient: "book" / "appointment"
    │
    ▼ [Keyword detected by automation engine]
    │
    ├── Is there only 1 provider? ──YES──→ Skip to slot display
    │                               NO
    │                               ▼
    ├── Send interactive list: "Choose your doctor"
    │   [Dr. A] [Dr. B] [Dr. C]
    │
    ▼ [Patient selects provider]
    │
    ├── Query available slots:
    │   • SELECT slots WHERE provider_id = ?
    │     AND date BETWEEN NOW() AND NOW() + 7 days
    │     AND NOT EXISTS (conflicting confirmed appointment)
    │     AND within working_hours AND NOT in break_hours
    │   • Cache result: Redis SORTED SET (TTL: 60s)
    │
    ├── Send slot options (max 10):
    │   📅 Mon: 10:00 AM | 11:30 AM | 2:00 PM
    │   📅 Tue: 9:00 AM | 4:00 PM
    │
    ▼ [Patient selects slot]
    │
    ├── ATOMIC BOOKING:
    │   ┌─────────────────────────────────────────────────────────┐
    │   │ 1. ACQUIRE LOCK: Redis SET lock:slot:{provider}:{time}  │
    │   │    NX EX 5 (5-second TTL)                                │
    │   │    └── Lock failed → "Sorry, that slot was just taken"  │
    │   │                                                          │
    │   │ 2. RE-VERIFY: SELECT 1 FROM appointments                │
    │   │    WHERE provider_id=? AND tstzrange overlaps            │
    │   │    AND status NOT IN ('cancelled')                       │
    │   │    └── Conflict → release lock → offer alternatives     │
    │   │                                                          │
    │   │ 3. INSERT: appointments (status='confirmed')             │
    │   │                                                          │
    │   │ 4. SCHEDULE REMINDERS:                                   │
    │   │    BullMQ.add('reminder_24h', delay: T-24h)             │
    │   │    BullMQ.add('reminder_2h', delay: T-2h)               │
    │   │                                                          │
    │   │ 5. RELEASE LOCK                                          │
    │   │                                                          │
    │   │ 6. INVALIDATE CACHE: DEL tenant:{id}:slots:{date}       │
    │   └─────────────────────────────────────────────────────────┘
    │
    ├── Send confirmation:
    │   "✅ Confirmed! Dr. Sharma — Mon Apr 21, 10:00 AM
    │    Reply CANCEL to cancel or RESCHEDULE to change."
    │
    ├── T-24h: "Reminder: Tomorrow at 10:00 AM with Dr. Sharma.
    │           Reply CONFIRM ✓ or CANCEL ✗"
    │
    └── T-2h:  "Your appointment is in 2 hours.
                📍 ABC Dental, MG Road. See you soon!"

EDGE CASES HANDLED:
├── Concurrent booking: Redis lock guarantees first-come-first-served
├── Timeout (no response 10 min): State expired, clean reply if they return
├── Invalid input: Re-display options with hint text
├── Already has booking same day: "You have an existing appointment at..."
├── Clinic holiday/closed: "Closed on [date], next available..."
├── Cancellation: Release slot → re-enters available pool → notify waitlist
└── Reschedule: Cancel + rebook (atomic)
```

#### 6.2.3 Campaign Execution (Saga Orchestration)

```
Campaign Saga States: DRAFT → VALIDATING → SEGMENTING → SENDING → TRACKING → COMPLETED

Compensation at each step ensures no partial/corrupt state.

Step 1: VALIDATE
├── Template status = 'approved'?
├── Segment returns >0 contacts?
├── Tenant plan allows campaign size?
├── Sufficient message quota remaining?
└── FAIL → Status = 'validation_failed', notify creator with reason

Step 2: SEGMENT (Fan-out)
├── SELECT contacts WHERE tags && segment_tags AND NOT opt_out
├── Deduplicate (same contact in multiple tag groups)
├── Batch into chunks of 100
├── INSERT campaign_logs (status='queued') per contact
├── Enqueue N batch jobs
└── FAIL → Rollback: DELETE campaign_logs, status = 'failed'

Step 3: SEND (Per-batch, parallelized)
├── For each contact in batch (sequential within, parallel across batches):
│   ├── Render template variables for this contact
│   ├── Final check: opt_out? already_sent? quota?
│   ├── Enqueue individual message_send job (priority: LOW)
│   └── Rate limiting: Token bucket (80/sec aggregate)
├── Progress: INCR campaign.sent_count (atomic)
└── FAIL → Pause campaign, alert, retry batch later

Step 4: TRACK (Event-driven, not polled)
├── Webhook updates → UPDATE campaign_logs per message
├── Periodic aggregation (every 30s):
│   delivered_count = COUNT WHERE status='delivered'
│   read_count = COUNT WHERE status='read'
├── WebSocket push: real-time progress to dashboard
└── Timeout: If no progress for 15 min → alert, investigate

Step 5: COMPLETE
├── All messages accounted for (sent + failed = total)
├── Generate summary metrics
├── Status = 'completed'
└── Notify creator: "Campaign complete: 8,500 delivered, 234 failed"

COMPENSATION TABLE:
├── Meta API outage → PAUSE, retry when recovered
├── Rate limited (tier exceeded) → Slow to 50% speed, extend duration
├── Template rejected mid-campaign → ABORT, notify, offer template swap
├── Admin clicks "Cancel" → Stop enqueueing, drain in-flight, mark cancelled
└── Worker crash → BullMQ stalled job detection, re-queue after visibility timeout
```

---

## 7. Technology Selection & Rationale

### 7.1 Decision Matrix

Each technology was evaluated against: **Performance**, **Developer Experience**, **Ecosystem/Community**, **Cost at Scale**, **India-specific Fit**.

| Layer | Selected | Runner-up | Key Reason for Selection |
|-------|----------|-----------|-------------------------|
| **Frontend Framework** | Next.js 14 (App Router) | Vite + React | SSR for SEO (landing pages), API routes, streaming, React Server Components reduce client JS |
| **UI Components** | shadcn/ui + Tailwind CSS | Chakra UI | Zero runtime overhead (Tailwind = build-time), fully customizable, accessible by default |
| **State Mgmt** | Zustand + TanStack Query | Redux Toolkit | TanStack Query handles 90% of state (server-fetched); Zustand for UI-only state. Less boilerplate |
| **Backend Runtime** | Node.js 20 LTS | Go, Deno | Shared language with frontend (TypeScript fullstack), largest ecosystem, adequate performance for our scale |
| **Backend Framework** | Fastify 4 | Express 5 | 2× throughput over Express (benchmarked), built-in JSON schema validation, better lifecycle hooks |
| **Language** | TypeScript 5.4 | JavaScript | Type safety catches bugs at compile time, shared types across monorepo, better IDE support |
| **ORM** | Prisma 5 | Drizzle, TypeORM | Best migration tooling, type inference from schema, excellent DX, predictable SQL output |
| **Primary DB** | PostgreSQL 16 | MySQL 8, CockroachDB | JSONB for flexible fields, EXCLUSION constraints (appointments), RLS (tenants), full-text search, extensions (TimescaleDB, Citus) |
| **Cache/Queue Backend** | Redis 7 (Cluster) | Memcached, DragonflyDB | Multi-purpose: cache + queue (BullMQ) + pub/sub + locks + rate-limit in single infra |
| **Job Queue (MVP)** | BullMQ 5 | Agenda, pg-boss | Redis-backed = fast, delayed jobs, priorities, rate limiting, dashboard (Bull Board), battle-tested |
| **Event Stream (Scale)** | Apache Kafka (MSK) | RabbitMQ, Pulsar | Higher throughput (100K+/sec), event replay for debugging, ordering guarantees per partition, exactly-once semantics |
| **Time-series Analytics** | TimescaleDB | ClickHouse, Druid | PostgreSQL extension = same connection, SQL familiarity, continuous aggregates, compression. ClickHouse if >1B events/month |
| **Object Storage** | AWS S3 | Cloudflare R2, MinIO | Native AWS integration, lifecycle policies, CDN (CloudFront), proven durability (11 9's) |
| **Search (Phase 3)** | Elasticsearch 8 | Meilisearch, Typesense | Mature, handles complex queries, good with large datasets. Lighter alternatives evaluated for Phase 2 |
| **Container Orchestration** | ECS Fargate | EKS, bare EC2 | No cluster management overhead, per-second billing, simpler than K8s for <50 services. Migrate to EKS at Phase 3 |
| **IaC** | Terraform | Pulumi, CDK | Provider-agnostic (future portability), declarative, largest community, state management |
| **CI/CD** | GitHub Actions | GitLab CI, CircleCI | Native GitHub integration, generous free tier, marketplace actions, matrix builds |
| **Monitoring** | Grafana + Prometheus + Loki | Datadog, New Relic | Open-source stack = no vendor lock-in at scale. Grafana Cloud free tier for MVP |
| **Error Tracking** | Sentry | Bugsnag, Rollbar | Best source map support, performance monitoring included, good free tier |
| **WhatsApp API** | Meta Cloud API (direct) | 360dialog, Gupshup | No middleman = lower cost, direct webhook, full feature access, Meta's recommended path |
| **Payments** | Razorpay | Stripe, Cashfree | Best UPI autopay support, Indian SMB-focused, subscription billing API, GST invoicing |

### 7.2 Monorepo Structure

```
whatsapp-crm/                         (Turborepo + pnpm workspaces)
│
├── apps/
│   ├── web/                          Next.js 14 frontend (deployed to Vercel or S3+CloudFront)
│   │   ├── src/
│   │   │   ├── app/                  App Router pages
│   │   │   │   ├── (auth)/          Login, OTP verify
│   │   │   │   ├── (dashboard)/     Protected routes
│   │   │   │   │   ├── inbox/       Conversation inbox
│   │   │   │   │   ├── contacts/    CRM
│   │   │   │   │   ├── appointments/ Calendar + booking
│   │   │   │   │   ├── campaigns/   Campaign builder
│   │   │   │   │   ├── analytics/   Dashboards
│   │   │   │   │   └── settings/    Config + billing
│   │   │   │   └── layout.tsx
│   │   │   ├── components/           Reusable UI components
│   │   │   ├── hooks/                Custom React hooks
│   │   │   ├── lib/                  API client, utils
│   │   │   └── stores/              Zustand stores
│   │   └── tailwind.config.ts
│   │
│   ├── api/                          Fastify API server (deployed to ECS)
│   │   ├── src/
│   │   │   ├── server.ts            Entry point, plugin registration
│   │   │   ├── routes/              Route handlers (one file per resource)
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── contacts.routes.ts
│   │   │   │   ├── conversations.routes.ts
│   │   │   │   ├── messages.routes.ts
│   │   │   │   ├── appointments.routes.ts
│   │   │   │   ├── campaigns.routes.ts
│   │   │   │   ├── templates.routes.ts
│   │   │   │   ├── analytics.routes.ts
│   │   │   │   └── settings.routes.ts
│   │   │   ├── services/            Business logic (testable, framework-agnostic)
│   │   │   ├── middleware/           Auth, rate-limit, tenant-ctx, error-handler
│   │   │   ├── plugins/             Fastify plugins (prisma, redis, socket.io)
│   │   │   └── schemas/             Zod schemas for request/response validation
│   │   └── Dockerfile
│   │
│   ├── webhook/                      Webhook receiver (separate scaling from API)
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── handlers/            Per webhook type: message, status, error
│   │   │   └── verification.ts      Meta signature verification
│   │   └── Dockerfile
│   │
│   └── worker/                       Background job processors
│       ├── src/
│       │   ├── index.ts             Worker entry, queue registration
│       │   ├── processors/          One file per job type
│       │   │   ├── message-sender.ts
│       │   │   ├── webhook-processor.ts
│       │   │   ├── campaign-executor.ts
│       │   │   ├── reminder-scheduler.ts
│       │   │   ├── analytics-aggregator.ts
│       │   │   └── dlq-monitor.ts
│       │   └── lib/                 Shared worker utilities
│       └── Dockerfile
│
├── packages/
│   ├── database/                     Prisma schema + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma        Single source of truth for DB schema
│   │   │   ├── migrations/          Version-controlled migrations
│   │   │   └── seed.ts              Dev/staging seed data
│   │   └── src/
│   │       └── client.ts            Configured Prisma client export
│   │
│   ├── shared/                       Cross-package types & utilities
│   │   └── src/
│   │       ├── types/               TypeScript interfaces (shared FE/BE)
│   │       ├── constants/           Error codes, plan limits, config
│   │       ├── utils/               Phone normalization, date helpers
│   │       └── validators/          Zod schemas used by both FE & BE
│   │
│   ├── queue/                        BullMQ job definitions
│   │   └── src/
│   │       ├── queues.ts            Queue name constants + connection
│   │       ├── jobs/                Job type definitions (type-safe)
│   │       └── index.ts
│   │
│   └── whatsapp-sdk/                Meta Cloud API wrapper
│       └── src/
│           ├── client.ts            HTTP client with retry + circuit breaker
│           ├── messages.ts          Send text, template, media, interactive
│           ├── templates.ts         CRUD against Management API
│           ├── media.ts             Upload/download media
│           ├── webhooks.ts          Parse + verify webhook payloads
│           └── types.ts             Meta API type definitions
│
├── infrastructure/
│   ├── terraform/                   AWS IaC
│   │   ├── modules/                Reusable: vpc, ecs, rds, redis, s3
│   │   ├── environments/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── main.tf
│   ├── docker/
│   │   ├── docker-compose.yml      Local dev: PG, Redis, Kafka, MinIO, MailHog
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.webhook
│   │   └── Dockerfile.worker
│   └── k8s/                        [Phase 3] Kubernetes manifests
│
├── scripts/                         Operational scripts
│   ├── seed.ts
│   ├── create-monthly-partitions.ts
│   └── migrate-prod.sh
│
├── .github/workflows/
│   ├── ci.yml                      Lint + type-check + test + build
│   ├── deploy-staging.yml          Auto on push to main
│   └── deploy-production.yml       Manual trigger (workflow_dispatch)
│
├── turbo.json                       Pipeline: build, test, lint, dev
├── pnpm-workspace.yaml
├── tsconfig.base.json               Shared compiler options
└── .env.example                     Required environment variables
```

---

## 8. Data Architecture

### 8.1 Entity-Relationship Model

```
┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│   TENANTS   │──1:N──│    USERS    │       │   PROVIDERS  │
│             │       │ (team members)│       │  (doctors)   │
└──────┬──────┘       └─────────────┘       └──────┬───────┘
       │                                            │
       │ 1:N                                        │ 1:N
       ▼                                            ▼
┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│  CONTACTS   │──1:1──│CONVERSATIONS│       │ APPOINTMENTS │
│             │       │             │       │              │
└──────┬──────┘       └──────┬──────┘       └──────────────┘
       │                      │
       │                      │ 1:N
       │                      ▼
       │              ┌─────────────┐
       │              │  MESSAGES   │  ← Partitioned monthly
       │              │             │
       │              └─────────────┘
       │
       │ M:N (via campaign_logs)
       ▼
┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│  CAMPAIGNS  │──1:N──│CAMPAIGN_LOGS│       │  TEMPLATES   │
│             │       │             │       │              │
└─────────────┘       └─────────────┘       └──────────────┘

┌─────────────┐       ┌─────────────────┐
│ AUTOMATION  │       │  MESSAGE_EVENTS  │  ← TimescaleDB hypertable
│   RULES     │       │  (analytics)     │
└─────────────┘       └─────────────────┘
```

### 8.2 Schema Design (Key Tables)

```sql
-- ═══════════════════════════════════════════════════════════════════
-- TENANCY & AUTH
-- Design decisions:
--   • UUID PKs (no sequential ID leakage)
--   • JSONB for extensible settings (avoids ALTER TABLE as features grow)
--   • Encrypted sensitive fields at application layer (marked with 🔒)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE tenants (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(255) NOT NULL,
    slug              VARCHAR(100) UNIQUE NOT NULL,
    phone             VARCHAR(15) NOT NULL,
    email             VARCHAR(255),
    business_type     VARCHAR(50) NOT NULL,         -- enum: clinic, gym, salon...
    wa_phone_id       VARCHAR(50),                  -- 🔒 encrypted
    wa_business_id    VARCHAR(50),                  -- 🔒 encrypted
    wa_access_token   TEXT,                         -- 🔒 encrypted (AES-256)
    plan              VARCHAR(20) DEFAULT 'trial',  -- trial|starter|pro|business|enterprise
    plan_expires_at   TIMESTAMPTZ,
    settings          JSONB DEFAULT '{}',           -- business_hours, auto_reply, timezone
    metadata          JSONB DEFAULT '{}',           -- onboarding_step, referral_source
    status            VARCHAR(20) DEFAULT 'active', -- active|suspended|churned
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- MESSAGES (High-volume, partitioned)
-- Design decisions:
--   • Partitioned by created_at (monthly) for query locality & archival
--   • tenant_id denormalized for partition-pruning efficiency
--   • JSONB content field supports text, media, template, interactive
--   • wa_message_id indexed for webhook correlation
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE messages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id   UUID NOT NULL REFERENCES conversations(id),
    tenant_id         UUID NOT NULL,                -- denormalized for partition pruning
    contact_id        UUID NOT NULL,
    direction         VARCHAR(10) NOT NULL,         -- inbound | outbound
    type              VARCHAR(20) NOT NULL,         -- text|image|document|audio|video|template|interactive
    content           JSONB NOT NULL,               -- {text: "..."} or {template_name, variables}
    wa_message_id     VARCHAR(100),                 -- Meta's unique ID (for idempotent updates)
    status            VARCHAR(20) DEFAULT 'queued', -- queued→sent→delivered→read | failed
    status_updated_at TIMESTAMPTZ,
    error_code        VARCHAR(50),
    error_message     TEXT,
    metadata          JSONB DEFAULT '{}',           -- {campaign_id, template_id, automation_id}
    created_at        TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Partition creation automated via cron (creates next 2 months ahead)
CREATE TABLE messages_y2026m04 PARTITION OF messages
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- Indexes on partitions (not parent)
CREATE INDEX idx_msg_conv_created ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_msg_wa_id ON messages (wa_message_id) WHERE wa_message_id IS NOT NULL;
CREATE INDEX idx_msg_tenant_status ON messages (tenant_id, status, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- APPOINTMENTS
-- Design decisions:
--   • EXCLUSION constraint prevents double-booking at DB level
--     (even if application lock fails)
--   • reminder_sent flags prevent duplicate reminders
--   • GiST index on tstzrange for efficient overlap queries
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE appointments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    provider_id     UUID NOT NULL REFERENCES providers(id),
    contact_id      UUID NOT NULL REFERENCES contacts(id),
    starts_at       TIMESTAMPTZ NOT NULL,
    ends_at         TIMESTAMPTZ NOT NULL,
    status          VARCHAR(20) DEFAULT 'confirmed',
    notes           TEXT,
    reminder_24h_sent BOOLEAN DEFAULT FALSE,
    reminder_2h_sent  BOOLEAN DEFAULT FALSE,
    source          VARCHAR(20) DEFAULT 'whatsapp',
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    -- CRITICAL: Database-level double-booking prevention
    -- This constraint uses GiST to ensure no two confirmed appointments
    -- for the same provider overlap in time.
    EXCLUDE USING gist (
        provider_id WITH =,
        tstzrange(starts_at, ends_at) WITH &&
    ) WHERE (status NOT IN ('cancelled', 'rescheduled'))
);
```

### 8.3 Data Lifecycle & Retention

| Data Category | Hot Storage | Warm | Cold | Delete |
|---------------|-------------|------|------|--------|
| Messages | 90 days (active partition) | 12 months (compressed partition) | S3 Parquet (2+ years) | 5 years |
| Media files | 90 days (S3 Standard) | 1 year (S3 IA) | Glacier Deep Archive | 3 years |
| Analytics events | 30 days (TimescaleDB) | 1 year (compressed chunks) | — | 2 years |
| Contacts | Indefinite | — | — | On tenant deletion |
| Audit logs | 6 months | 2 years (S3) | — | 7 years (compliance) |

---

## 9. Distributed Systems Design

### 9.1 Redis Architecture

Redis serves **five distinct purposes** in this system. Each is evaluated for whether Redis is the optimal choice.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        REDIS USAGE MAP                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  PURPOSE 1: APPLICATION CACHE                                             │
│  ─────────────────────────────────────────────────────────────────────── │
│  Keys:                                                                    │
│  ├── tenant:{id}:config     HASH   TTL:5m    (settings, plan, limits)    │
│  ├── tenant:{id}:templates  LIST   TTL:10m   (approved templates)        │
│  ├── contact:{tenant}:{ph}  HASH   TTL:5m    (name, tags, opt_out)       │
│  └── slots:{provider}:{date} ZSET  TTL:60s   (available appointment slots)│
│                                                                           │
│  Invalidation: Write-through on mutation + event-based (pub/sub)         │
│  Eviction: allkeys-lru (graceful degradation on cache miss)              │
│                                                                           │
│  PURPOSE 2: JOB QUEUE (BullMQ Backend)                                    │
│  ─────────────────────────────────────────────────────────────────────── │
│  Queues:                                                                  │
│  ├── message_send       Priority queue (P1: replies, P2: reminders, P3: bulk)│
│  ├── webhook_process    High-throughput, idempotent processing           │
│  ├── campaign_execute   Batched, rate-limited                            │
│  ├── reminder_check     Repeatable (every 60s)                           │
│  ├── analytics_aggregate  Repeatable (every 1h)                          │
│  └── dead_letter        Inspection + manual retry                        │
│                                                                           │
│  Config: maxRetries=3, backoff=exponential, concurrency=20/worker        │
│  CRITICAL: No eviction policy on queue data (separate Redis instance if needed)│
│                                                                           │
│  PURPOSE 3: RATE LIMITING                                                  │
│  ─────────────────────────────────────────────────────────────────────── │
│  Algorithm: Sliding window (ZRANGEBYSCORE on timestamp-scored ZSET)       │
│  Keys:                                                                    │
│  ├── rl:api:{tenant}:{route}     100 req/min per tenant endpoint         │
│  ├── rl:wa_send:{tenant}:daily   Plan-limited daily message count        │
│  ├── rl:wa_send:global:per_sec   80 msg/sec aggregate (Meta API limit)   │
│  └── rl:otp:{phone}              5 OTPs/hour per phone                   │
│                                                                           │
│  PURPOSE 4: REAL-TIME PUB/SUB                                              │
│  ─────────────────────────────────────────────────────────────────────── │
│  Pattern: Socket.io Redis Adapter (@socket.io/redis-adapter)             │
│  Channels:                                                                │
│  ├── tenant:{id}:inbox       → New message arrived                       │
│  ├── tenant:{id}:status      → Delivery status update                    │
│  ├── tenant:{id}:appointment → Booking confirmed/cancelled               │
│  └── tenant:{id}:system      → System notifications                      │
│                                                                           │
│  Why: Enables horizontal scaling of WebSocket servers (any server can    │
│       broadcast to any tenant's connected clients)                        │
│                                                                           │
│  PURPOSE 5: DISTRIBUTED LOCKS & COORDINATION                              │
│  ─────────────────────────────────────────────────────────────────────── │
│  Implementation: Redlock (redis/node-redlock) for safety                 │
│  Locks:                                                                   │
│  ├── lock:slot:{provider}:{time}      5s TTL (appointment booking)       │
│  ├── lock:campaign:{id}:exec          5min TTL (prevent double-start)    │
│  ├── lock:webhook:{wa_msg_id}         2s TTL (dedup processing)          │
│  └── lock:partition:create            60s TTL (monthly maintenance)       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Kafka Architecture (Phase 2+)

**Introduction criteria:** Kafka is introduced when:
- Message volume exceeds 50K/day (BullMQ throughput adequate up to ~100K/day)
- Need for event replay (debugging production issues)
- Multiple consumers per event (analytics + automation + notification)
- Ordering guarantees become critical at scale

```
                        KAFKA CLUSTER (AWS MSK, 3 brokers)
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  TOPIC                     PARTITIONS  KEY           CONSUMERS            │
│  ──────────────────────────────────────────────────────────────────────  │
│  whatsapp.inbound.raw      12          tenant_id     • webhook-processor  │
│                                                      • automation-engine  │
│                                                      • analytics-writer   │
│                                                                           │
│  whatsapp.outbound.send    12          tenant_id     • message-sender     │
│                                        (ordering)                          │
│                                                                           │
│  message.status.updates    6           message_id    • status-updater     │
│                                                      • campaign-tracker   │
│                                                      • notification-svc   │
│                                                                           │
│  appointment.events        6           tenant_id     • reminder-scheduler │
│                                                      • analytics-writer   │
│                                                                           │
│  analytics.events          12          tenant_id     • timescaledb-writer │
│                                                                           │
│  dlq.all                   3           —             • dlq-monitor        │
│                                                                           │
│  SETTINGS:                                                                │
│  ├── replication.factor = 3                                               │
│  ├── min.insync.replicas = 2                                              │
│  ├── acks = all (no message loss)                                         │
│  ├── compression = lz4 (fastest)                                          │
│  ├── retention = 7 days (except dlq: 30 days)                            │
│  └── max.message.bytes = 1MB                                              │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

WHY tenant_id AS PARTITION KEY:
├── Messages from same tenant always land on same partition
├── Guarantees ordering per tenant (important for conversation thread)
├── Enables per-tenant consumer lag tracking
└── Balances load (assuming uniform tenant distribution)
```

### 9.3 Multi-Tenant Isolation Model

```
ISOLATION DEPTH:

Layer 1: APPLICATION (Always enforced)
├── JWT contains tenant_id → injected into every request context
├── Every database query: WHERE tenant_id = $current_tenant
├── Test suite verifies: no query escapes tenant boundary
└── Code review checklist item: "Is tenant isolation enforced?"

Layer 2: DATABASE (Defense-in-depth)
├── PostgreSQL Row-Level Security (RLS):
│   CREATE POLICY tenant_policy ON contacts
│     USING (tenant_id = current_setting('app.tenant_id')::uuid);
├── Composite indexes: (tenant_id, ...) — partition prune optimization
└── No cross-tenant foreign keys possible

Layer 3: STORAGE
├── S3 prefix: /{tenant_id}/media/{file}
├── Presigned URLs: tenant-scoped, 1-hour expiry
└── IAM policy prevents cross-prefix access

Layer 4: CACHE
├── Key prefix: tenant:{id}:*
├── No global cache that mixes tenant data
└── Eviction of one tenant's cache doesn't affect others

Layer 5: QUEUE
├── Job payload always contains tenant_id
├── Per-tenant max pending: 1000 jobs (bulkhead)
├── Priority not affected by other tenants' volume
└── Kafka partition key = tenant_id (physical separation)

EVOLUTION:
Phase 1 → Shared tables, RLS (0-1000 tenants)
Phase 2 → Pool + dedicated (big tenants get own schema)
Phase 3 → Physical sharding (Citus) for 10K+ tenants
```

---

## 10. Scalability Engineering

### 10.1 Scaling Trajectory

| Phase | Tenants | Messages/Day | API RPS (peak) | Infrastructure | Monthly Cost |
|-------|---------|-------------|----------------|----------------|-------------|
| MVP | 0–100 | <5K | 50 | Single-instance × service | ₹8,000 |
| Growth | 100–1,000 | 5K–100K | 500 | Multi-instance, read replica | ₹50,000 |
| Scale | 1K–10K | 100K–2M | 5,000 | Kafka, sharding, K8s | ₹3,00,000 |
| Platform | 10K+ | 2M+ | 50,000+ | Multi-region, dedicated infra | ₹15,00,000+ |

### 10.2 Horizontal Scaling Triggers

| Component | Metric | Threshold | Action |
|-----------|--------|-----------|--------|
| API Servers | CPU utilization | >70% sustained 5min | Add container (ECS target tracking) |
| API Servers | P99 latency | >500ms sustained 3min | Add container |
| Message Workers | Queue depth (message_send) | >1000 pending | Add worker instance |
| Campaign Workers | Active campaigns | >10 simultaneous | Dedicated worker pool |
| Webhook Receiver | Response time | >3s (Meta SLA is 5s) | Scale up immediately |
| WebSocket Servers | Connection count | >5000/instance | Add instance |
| PostgreSQL | Read IOPS | >80% provisioned | Add read replica |
| PostgreSQL | Write IOPS | >70% provisioned | Vertical scale (then shard) |
| Redis | Memory utilization | >75% | Cluster resharding |
| Kafka Consumer | Consumer lag | >10,000 messages | Add consumer to group |

### 10.3 Database Scaling Path

```
Stage 1: Single Writer (Phase 1)
┌─────────────────────────────────┐
│  PostgreSQL db.r6g.large        │
│  • 2 vCPU, 16GB RAM             │
│  • 3000 IOPS (gp3)              │
│  • PgBouncer (connection pool)  │
│  • Handles: ≤200 tenants        │
└─────────────────────────────────┘

Stage 2: Read Replicas (Phase 2)
┌─────────────────────────────────┐     ┌─────────────────────┐
│  PRIMARY (writes)               │────▶│  REPLICA (reads)    │
│  • API write operations         │     │  • Analytics queries│
│  • Transaction integrity        │     │  • Search/filter    │
│  • Handles: ≤1000 tenants       │     │  • Dashboard reads  │
└─────────────────────────────────┘     └─────────────────────┘

Stage 3: Partitioning + Archive (Phase 2-3)
├── Messages: Monthly range partitions (active: 3 months, compressed: 12 months)
├── Analytics: TimescaleDB hypertables with continuous aggregation
├── Archive: pg_dump old partitions → S3 (Parquet via pg_analytics)
└── Handles: ≤3000 tenants, 200M messages

Stage 4: Horizontal Sharding (Phase 3+)
├── Strategy: Hash(tenant_id) mod N
├── Implementation: Citus extension (distributed PostgreSQL)
├── Shard count: Start with 4, reshard at utilization
├── Cross-shard queries: Only for internal analytics (not user-facing)
└── Handles: 10K+ tenants, 1B+ messages
```

---

## 11. Reliability & Fault Tolerance

### 11.1 Failure Mode Analysis

| Component | Failure Mode | Blast Radius | Detection | MTTR | Recovery Strategy |
|-----------|-------------|--------------|-----------|------|-------------------|
| API Server | OOM / crash | Single container | Health check failure (<30s) | <30s | ECS auto-replacement |
| Worker | Crash mid-job | Job stalls | BullMQ stalled job detection (5min) | <5min | Job re-queued automatically |
| PostgreSQL Primary | AZ outage | All writes fail | RDS event notification | <60s | Multi-AZ automatic failover |
| PostgreSQL | Corrupt query | Degraded performance | Slow query alert (>5s) | <10min | Kill query + fix in code |
| Redis | Primary failure | Cache miss + queue stall | ElastiCache failover event | <30s | Replica auto-promoted |
| Redis | Full cluster down | All caching/queuing halts | Health check | <2min | Cluster recreation from snapshot |
| Meta API | Rate limited (429) | Messages delayed | 429 response tracking | Self-healing | Exponential backoff, queue |
| Meta API | Full outage | All messaging halted | Circuit breaker opens | External | Queue messages, retry on recovery |
| Webhook Receiver | Overloaded | Webhooks pile at Meta | Response time >5s | <1min | Auto-scale + Meta retries (7 days) |
| S3 | Unavailable | Media upload/download fails | AWS health dashboard | External | Queue operations for retry (extremely rare) |
| Kafka Broker | Single broker failure | Temporary under-replication | Under-replicated partitions | <5min | Automatic rebalance to surviving brokers |
| DNS / Cloudflare | DNS failure | Total app unreachable | External uptime monitor | External | Cloudflare SLA: 100% DNS; failover: direct IP |

### 11.2 Circuit Breaker Configuration (Meta API)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CIRCUIT BREAKER STATE MACHINE                      │
│                                                                       │
│            Success              ┌────────┐               Timeout     │
│         ┌────────────────┐     │  HALF  │         ┌─────────────┐   │
│         │                │     │  OPEN  │         │             │   │
│    ┌────▼───┐            │     │        │         │   ┌─────────▼┐  │
│    │ CLOSED │            │     │ Test 1 │         │   │   OPEN   │  │
│    │        │            │     │ request│         │   │          │  │
│    │ Normal │            │     │ passes?│         │   │All calls │  │
│    │ traffic│            │     │        │         │   │ rejected │  │
│    └────┬───┘            │     └───┬────┘         │   │ (queued) │  │
│         │                │         │YES           │   └─────────┬┘  │
│         │ 5 failures     │         │              │             │   │
│         │ in 30s         │         ▼              │    60s      │   │
│         │                │    Back to CLOSED       │  cooldown   │   │
│         └────────────────┴─────────────────────────┘             │   │
│                                                                   │   │
│  ═══════════════════════════════════════════════════════════════  │   │
│  Config:                                                          │   │
│  • Failure threshold: 5 errors in 30-second window               │   │
│  • Errors counted: HTTP 5xx, timeout (>10s), connection refused  │   │
│  • NOT counted: 4xx (client error), 429 (handled by rate limiter)│   │
│  • Open duration: 60 seconds                                     │   │
│  • Half-open: Allow 1 test request                               │   │
│  • On open: Queue messages with delay, alert Slack               │   │
│  • On recovery: Gradually increase throughput (10%, 25%, 50%,100%)│  │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.3 Data Durability Guarantees

| Layer | Guarantee | Mechanism |
|-------|-----------|-----------|
| PostgreSQL | Zero data loss (RPO=0 within AZ) | Synchronous replication within Multi-AZ |
| PostgreSQL | RPO <5min (cross-region disaster) | Automated backups + WAL archiving to S3 |
| Redis | Tolerate single node failure, <1s data loss | AOF persistence (every second) + cluster replication |
| S3 | 99.999999999% (11 9's) durability | Cross-AZ replication (inherent) |
| Kafka | Zero message loss (committed) | replication.factor=3, acks=all, min.insync.replicas=2 |
| BullMQ | Job guaranteed delivery (at-least-once) | Redis AOF + job acknowledgement pattern |

---

## 12. Security Architecture

### 12.1 Defense-in-Depth Model

```
Layer 1: NETWORK
├── Cloudflare WAF (OWASP Top 10 rule set)
├── DDoS protection (automatic, unlimited)
├── IP allowlisting for Meta webhook IPs
├── VPC: Private subnets for DB/Redis (no public IP)
├── Security Groups: Least-privilege port access
└── NAT Gateway for outbound (no inbound except via ALB)

Layer 2: TRANSPORT
├── TLS 1.3 everywhere (Cloudflare → ALB → services)
├── mTLS between internal services (Phase 3)
├── HSTS header (max-age: 1 year, includeSubDomains)
└── Certificate auto-renewal (Cloudflare managed)

Layer 3: APPLICATION
├── Authentication: OTP-based (no password storage)
│   ├── OTP: 6-digit, 5-min expiry, max 5 attempts, cooldown 1hr on exhaust
│   ├── JWT: Access (15-min), Refresh (7-day, rotatable)
│   └── API Keys: SHA-256 hashed, rotatable, scope-limited
├── Authorization: RBAC (Owner > Admin > Staff)
│   └── Middleware checks role + resource ownership on every request
├── Input Validation: Zod schemas on all endpoints (reject unknown fields)
├── Output Encoding: React (auto-XSS prevention), JSON responses (no HTML)
├── CORS: Allowlist specific origins only
├── Rate Limiting: Per-tenant, per-endpoint, per-IP (Redis sliding window)
└── Webhook Verification: HMAC SHA-256 (X-Hub-Signature-256)

Layer 4: DATA
├── Encryption at rest: AES-256 (RDS, S3, ElastiCache, EBS)
├── Application-level encryption: WhatsApp access tokens (AES-256-GCM, per-tenant key)
├── PII handling: Phone/name never logged; masked in error reports
├── Tenant isolation: RLS + application enforcement (see Section 9.3)
└── Audit trail: All mutations logged (who, what, when, from where)

Layer 5: OPERATIONAL
├── Secrets management: AWS Secrets Manager (auto-rotation)
├── Zero hardcoded credentials (env injection via ECS task definition)
├── Dependency scanning: Snyk in CI pipeline (block on high/critical)
├── Container scanning: ECR native scanning (CVE detection)
├── Principle of least privilege: IAM roles scoped per service
└── Incident response: Runbook documented, war room process defined
```

### 12.2 Compliance Matrix

| Regulation | Scope | Our Compliance Approach |
|------------|-------|------------------------|
| **DPDP Act 2023** (India) | All personal data | Consent-at-collection (WhatsApp opt-in), data deletion API, DPO appointed, breach notification <72h |
| **IT Act 2000** (India) | Digital services | Reasonable security practices (ISO 27001 alignment), data localization (India servers) |
| **WhatsApp Commerce Policy** | All messaging | Opt-in required before first message, respect opt-out, no prohibited content |
| **PCI DSS** | Payment data | Never touch card data (Razorpay handles PCI); only store subscription_id |
| **SOC 2 Type II** (future) | Enterprise trust | Phase 3 target; evidence collection automated from Day 1 |

---

## 13. Observability Stack

### 13.1 Three Pillars Implementation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  METRICS (Prometheus + Grafana)                                           │
│  ─────────────────────────────────────────────────────────────────────── │
│  Collection: OpenTelemetry SDK → Prometheus scrape endpoint (/metrics)   │
│  Storage: Grafana Cloud (managed) or self-hosted Prometheus + Thanos     │
│  Dashboards: 5 pre-built (System, Messaging, Business, Queues, Kafka)   │
│                                                                           │
│  Key metrics:                                                             │
│  ├── http_request_duration_seconds{method,route,status} [histogram]      │
│  ├── wa_messages_total{tenant,direction,type,status} [counter]           │
│  ├── bullmq_queue_depth{queue} [gauge]                                   │
│  ├── appointments_booked_total{tenant} [counter]                         │
│  ├── circuit_breaker_state{service} [gauge: 0=closed,1=open,2=half]     │
│  └── active_tenants_daily [gauge]                                        │
│                                                                           │
│  LOGGING (Loki + Grafana)                                                 │
│  ─────────────────────────────────────────────────────────────────────── │
│  Format: Structured JSON (Pino logger)                                   │
│  Fields: timestamp, level, service, trace_id, tenant_id, message, meta  │
│  Shipping: Promtail sidecar → Loki                                       │
│  Retention: 30 days hot, 90 days cold (S3)                               │
│  PII: Phone masked (last 4 only), names never logged                     │
│                                                                           │
│  TRACING (OpenTelemetry + Jaeger)                                         │
│  ─────────────────────────────────────────────────────────────────────── │
│  Instrumentation: @opentelemetry/sdk-node (auto + manual spans)          │
│  Propagation: W3C TraceContext (traceparent header)                      │
│  Sampling: 10% in production (100% for errors)                           │
│  Critical traces:                                                         │
│  ├── Send message: API → Queue → Worker → Meta API → Webhook → Update   │
│  ├── Appointment book: API → Lock → DB → Cache invalidate → Confirm msg │
│  └── Campaign send: API → Segment → Batch → Queue → Send × N → Complete │
│                                                                           │
│  ALERTING (Grafana Alerting → PagerDuty/Slack)                           │
│  ─────────────────────────────────────────────────────────────────────── │
│  Severity levels:                                                         │
│  ├── P0 (Critical): App down, data loss risk → PagerDuty (immediate)    │
│  ├── P1 (High): Major degradation → PagerDuty (15-min SLA)              │
│  ├── P2 (Medium): Partial issue → Slack #alerts                         │
│  └── P3 (Low): Warning → Slack #monitoring (business hours)             │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Alert Definitions

| Alert | Condition | Severity | Notification |
|-------|-----------|----------|-------------|
| API Down | Health check fails 3× consecutive | P0 | PagerDuty + SMS |
| Error Rate Spike | 5xx rate >5% for 3 min | P1 | PagerDuty |
| API Latency Degraded | P99 >2s for 5 min | P2 | Slack |
| Queue Backlog | message_send depth >5000 for 10 min | P1 | Slack + auto-scale |
| Dead Letter Queue Growth | DLQ >100 items | P2 | Slack |
| DB Replication Lag | Lag >10s for 2 min | P1 | PagerDuty |
| Redis Memory Critical | >85% used | P2 | Slack |
| Kafka Consumer Lag | >50K messages behind | P1 | Slack + auto-scale |
| Meta API Circuit Open | Circuit breaker opened | P2 | Slack |
| Certificate Expiry | <7 days | P2 | Slack |
| Daily: Zero Messages Sent | Tenant active but 0 messages in 24h | P3 | Internal review |

---

## 14. Infrastructure & Deployment

### 14.1 Environment Strategy

| Environment | Purpose | Deployment Trigger | Data |
|-------------|---------|-------------------|------|
| **Local** | Development | `docker compose up` | Seed data (10 tenants, 100 contacts) |
| **Staging** | Pre-production validation | Auto (push to `main`) | Anonymized production subset |
| **Production** | Live customers | Manual (semver tag `v*.*.*`) | Real data |

### 14.2 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CI PIPELINE (Every Push/PR)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  [1] Checkout → [2] Install (pnpm, cached) → [3] Lint (ESLint+Prettier) │
│       │                                                                   │
│       └→ [4] Type Check (tsc --noEmit) → [5] Unit Tests (Vitest, >80%)  │
│               │                                                           │
│               └→ [6] Integration Tests (Testcontainers: PG, Redis)       │
│                       │                                                   │
│                       └→ [7] Build All Apps → [8] Security Scan (Snyk)   │
│                               │                                           │
│                               └→ [9] Docker Build (multi-stage)          │
│                                       │                                   │
│                                       └→ [10] Push to ECR (SHA tag)      │
│                                                                           │
│  GATE: All steps must pass. Coverage must not decrease.                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     CD PIPELINE (Staging: auto, Prod: manual)             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  STAGING:                                                                 │
│  [1] Pull ECR image → [2] Run migrations → [3] Deploy (ECS blue/green)  │
│       → [4] Smoke tests → [5] Notify Slack ✓                            │
│                                                                           │
│  PRODUCTION (manual workflow_dispatch):                                    │
│  [1] Backup database → [2] Run migrations (with rollback plan)           │
│       → [3] Deploy ECS (rolling, 1-at-a-time) → [4] Health check (5 min)│
│       → [5] Auto-rollback if unhealthy → [6] Invalidate CDN             │
│       → [7] Tag release → [8] Notify Slack + status page                │
└─────────────────────────────────────────────────────────────────────────┘
```

### 14.3 Zero-Downtime Deployment

```
Strategy: Rolling update (ECS)

┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Container v1 │     │  Container v1 │     │  Container v2 │
│   (draining)  │     │   (healthy)   │     │  (starting)   │
└───────────────┘     └───────────────┘     └───────────────┘
        │                      │                      │
        ▼                      ▼                      ▼
  Receives no new       Handles traffic        Passes health
  requests, drains      normally               check → ALB
  in-flight (30s)                              routes traffic

Process:
1. New task definition registered with v2 image
2. ECS launches new container (v2)
3. v2 passes health check → added to ALB target group
4. v1 marked for draining → no new connections
5. v1 finishes in-flight requests (30s grace)
6. v1 terminated
7. Repeat for next container (minimumHealthyPercent: 100%)

Worker-specific:
- SIGTERM received → stop accepting new jobs
- Process in-flight jobs to completion (up to 5 min)
- If job can't complete: release back to queue
- Then exit
```

---

## 15. API Contract Design

### 15.1 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Versioning** | URL prefix: `/v1/`. Breaking changes → new version. |
| **Authentication** | Bearer token (JWT) in `Authorization` header |
| **Content type** | `application/json` exclusively |
| **Pagination** | Cursor-based (opaque token). Never offset-based at scale |
| **Filtering** | Query params: `?status=open&tags=vip&created_after=2026-01-01` |
| **Sorting** | `?sort=-created_at` (prefix `-` for descending) |
| **Error format** | `{"error": {"code": "MACHINE_READABLE", "message": "Human text", "details": {}}}` |
| **Rate limiting** | Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| **Idempotency** | `Idempotency-Key` header for write operations |
| **Dates** | ISO 8601 UTC in API. Client converts to tenant timezone |

### 15.2 Core Endpoints

```
Authentication
POST   /v1/auth/otp/send          Send OTP to phone
POST   /v1/auth/otp/verify        Verify → JWT tokens
POST   /v1/auth/refresh           Refresh access token
POST   /v1/auth/logout            Revoke refresh token

Contacts (CRM)
GET    /v1/contacts               List (cursor paginated, filterable)
POST   /v1/contacts               Create contact
GET    /v1/contacts/:id           Detail + timeline
PATCH  /v1/contacts/:id           Update fields
DELETE /v1/contacts/:id           Soft delete
POST   /v1/contacts/import        Async CSV import → returns job_id
GET    /v1/contacts/import/:jobId Import progress

Conversations
GET    /v1/conversations          List (sorted by last_message_at DESC)
GET    /v1/conversations/:id      Messages (cursor paginated, newest first)
PATCH  /v1/conversations/:id      Update status/assignment
POST   /v1/conversations/:id/read Mark as read (reset unread_count)

Messages
POST   /v1/messages/send          Send session or template message
GET    /v1/messages/:id           Message detail + delivery status

Appointments
GET    /v1/appointments           List (date range, provider filter)
POST   /v1/appointments           Create booking (returns 201 or 409 conflict)
PATCH  /v1/appointments/:id       Update (cancel, mark completed, no-show)
GET    /v1/appointments/slots     Available slots query

Campaigns
GET    /v1/campaigns              List
POST   /v1/campaigns              Create (draft)
GET    /v1/campaigns/:id          Detail + live stats
POST   /v1/campaigns/:id/start   Begin execution
POST   /v1/campaigns/:id/pause   Pause
POST   /v1/campaigns/:id/resume  Resume

Templates
GET    /v1/templates              List (filtered by approval status)
POST   /v1/templates              Create + submit to Meta
DELETE /v1/templates/:id          Delete

Analytics
GET    /v1/analytics/overview     Dashboard KPIs (cached 30s)
GET    /v1/analytics/messages     Time-series message volume
GET    /v1/analytics/appointments Booking/no-show rates

Settings
GET    /v1/settings               Tenant configuration
PATCH  /v1/settings               Update (business hours, auto-reply, etc.)
GET    /v1/settings/team          Team members
POST   /v1/settings/team/invite   Invite member (sends OTP link)

Billing
GET    /v1/billing/plan           Current plan + usage
POST   /v1/billing/subscribe     Create Razorpay subscription
GET    /v1/billing/invoices       Invoice history

Webhooks (Meta → Our System)
GET    /webhook/whatsapp          Verification challenge
POST   /webhook/whatsapp          Incoming events (messages, statuses)
```

---

## 16. Performance Engineering

### 16.1 Performance Budgets

| Operation | Target (P95) | Measurement |
|-----------|-------------|-------------|
| API: GET /conversations (list) | <200ms | Application + DB time |
| API: POST /messages/send | <150ms (queue, not send) | Application time |
| API: GET /appointments/slots | <300ms | Includes cache miss scenario |
| WebSocket: New message to client | <1s end-to-end | Webhook receive → client render |
| Dashboard page load (initial) | <2s | Largest Contentful Paint |
| Dashboard (subsequent navigation) | <500ms | Client-side routing |
| CSV import (10K contacts) | <30s (job duration) | Worker processing time |
| Campaign segment (50K contacts) | <5s (query time) | PostgreSQL query |

### 16.2 Optimization Strategies

```
DATABASE:
├── Connection pooling: PgBouncer (transaction mode, 100 connections)
├── Query optimization: EXPLAIN ANALYZE on all queries >50ms
├── Indexes: Composite (tenant_id, ...) for partition pruning
├── Pagination: Cursor-based (avoid OFFSET for >1000 rows)
├── Denormalization: conversation.last_message_preview (avoids JOIN)
└── Partitioning: Monthly messages (queries only scan relevant partition)

CACHING:
├── Redis L1: Frequently-read tenant config, active templates
├── HTTP Cache: GET endpoints with Cache-Control + ETag
├── CDN: Static assets (immutable hashed filenames)
├── Computed: Pre-compute available slots on booking/cancel (not on query)
└── Stale-while-revalidate: Dashboard stats served from cache while aggregating

APPLICATION:
├── Async processing: All non-critical work pushed to queues
├── Batching: Campaign messages batched (100/job, not 1/job)
├── Connection reuse: Keep-alive to Meta API, DB connection pool
├── Streaming: Large exports streamed (not loaded into memory)
└── Compression: gzip responses (Fastify compress plugin)

FRONTEND:
├── Code splitting: Route-based (Next.js automatic)
├── React Server Components: Reduce client-side JS bundle
├── Virtual scrolling: Contact/message lists (TanStack Virtual)
├── Optimistic UI: Show sent message immediately (before server confirms)
├── WebSocket multiplexing: Single connection per tenant (not per page)
└── Image optimization: Next/Image with blur placeholder
```

---

## 17. Cost Model & Unit Economics

### 17.1 Infrastructure Cost (Monthly)

| Component | Phase 1 (₹) | Phase 2 (₹) | Phase 3 (₹) |
|-----------|-------------|-------------|-------------|
| ECS Fargate (API + Workers) | 3,000 | 15,000 | 60,000 |
| RDS PostgreSQL (Multi-AZ) | 2,500 | 8,000 | 30,000 |
| ElastiCache Redis (Cluster) | 1,500 | 5,000 | 15,000 |
| S3 + CloudFront | 500 | 2,000 | 8,000 |
| MSK Kafka | — | 10,000 | 40,000 |
| Monitoring (Grafana Cloud) | 0 | 3,000 | 8,000 |
| Sentry | 0 | 2,000 | 5,000 |
| Cloudflare (Pro) | 0 | 1,500 | 5,000 |
| WhatsApp API (Meta conversations) | 0 | 5,000 | 50,000 |
| Domain + miscellaneous | 500 | 500 | 500 |
| **Total Infrastructure** | **₹8,000** | **₹52,000** | **₹2,21,500** |

### 17.2 Unit Economics

```
Phase 2 Example (500 paying customers):

Revenue:
├── 300 × Starter (₹999/mo)  = ₹2,99,700
├── 150 × Pro (₹2,499/mo)    = ₹3,74,850
├── 50  × Business (₹4,999/mo)= ₹2,49,950
└── Total MRR                  = ₹9,24,500

Costs:
├── Infrastructure             = ₹52,000   (5.6% of revenue)
├── WhatsApp API (Meta)        = ₹25,000   (2.7%)
├── Payment gateway (2%)       = ₹18,490   (2.0%)
├── Support (1 FTE)            = ₹40,000   (4.3%)
└── Total COGS                 = ₹1,35,490 (14.7%)

Gross Margin: 85.3%

CAC (target): ₹3,000 (via content + referrals + paid ads)
LTV (at 4% churn): ₹1,850 ARPU × 25 months = ₹46,250
CAC:LTV = 1:15 (excellent)
```

---

## 18. Risk Assessment & Mitigation

### 18.1 Risk Register

| # | Risk | Probability | Impact | Severity | Mitigation Strategy |
|---|------|-------------|--------|----------|-------------------|
| R1 | Meta changes WhatsApp API pricing significantly | Medium | High | **Critical** | Build email/SMS secondary channels from Day 1; abstract messaging layer behind interface |
| R2 | Meta revokes API access (policy violation) | Low | Critical | **High** | Strict template compliance; automated content scanning; maintain BSP backup (360dialog) |
| R3 | Well-funded competitor enters vertical | Medium | Medium | **Medium** | Speed-to-market advantage; data moat; community/brand building; niche deeper (AI no-show prediction) |
| R4 | Indian data protection regulation tightens | Medium | Low | **Low** | Already DPDP-compliant design; data residency in India; consent management built-in |
| R5 | Single engineer (founder) gets sick/busy | High | High | **Critical** | Automate everything; comprehensive docs; hire first engineer at ₹5L MRR |
| R6 | Clinic owners resist SaaS subscription model | Medium | Medium | **Medium** | Offer annual with 30% discount; quantify ROI in first-meeting pitch; 30-day free trial |
| R7 | WhatsApp introduces competing native CRM | Low | Critical | **High** | Meta serves large enterprises; our niche (vertical + affordable) remains underserved; pivot to multi-channel if needed |
| R8 | Security breach / data leak | Low | Critical | **High** | Encryption at rest + transit; minimal PII stored; incident response plan; cyber insurance |

### 18.2 Technical Debt Budget

**Principle:** Allocate 20% of each sprint to debt reduction. Track debt items explicitly.

Acceptable debt (MVP, to be resolved in Phase 2):
- [ ] No Elasticsearch — use PostgreSQL trigram indexes (acceptable to ~50K contacts per tenant)
- [ ] No separate analytics DB — use primary with materialized views (acceptable to ~500 tenants)
- [ ] Single Redis instance (not cluster) — acceptable to ~200 tenants
- [ ] No mobile app — web is responsive
- [ ] Manual partition creation (cron script, not pg_partman)

---

## 19. Implementation Roadmap

### 19.1 Phase 1 — MVP (8 Weeks)

```
Week 1-2: FOUNDATION
├── Project scaffolding (Turborepo, Docker Compose, CI pipeline)
├── Database schema + migrations (Prisma)
├── Auth service (OTP send/verify, JWT, middleware)
├── Tenant provisioning on first signup
├── Health endpoints, structured logging, error handling
└── Deliverable: Auth works, local env runs in one command

Week 3-4: WHATSAPP INTEGRATION
├── Meta Cloud API wrapper (send text, send template, receive)
├── Webhook receiver (signature verify, dedup, queue)
├── Message status tracking (sent → delivered → read)
├── Template CRUD + Meta submission
├── Phone normalization utility
└── Deliverable: Can send/receive WhatsApp messages programmatically

Week 5-6: CORE CRM + APPOINTMENTS
├── Contact management (CRUD, import, tags, search)
├── Conversation inbox (real-time via WebSocket)
├── Appointment booking (provider setup, slot calc, atomic reserve)
├── Auto-reminders (24h + 2h, BullMQ delayed jobs)
├── Opt-out detection and handling
└── Deliverable: Full patient lifecycle working end-to-end

Week 7-8: CAMPAIGNS + BILLING + POLISH
├── Broadcast campaigns (segment, schedule, rate-limit, track)
├── Dashboard (messages/appts today, delivery rate, no-show rate)
├── Razorpay integration (subscribe, invoice, usage tracking)
├── Settings (business hours, auto-reply, team members)
├── Bug fixes, performance tuning, staging deployment
└── Deliverable: Production-ready for first 10 customers
```

### 19.2 Key Milestones

| Milestone | Date | Success Criteria |
|-----------|------|-----------------|
| M1: Local dev environment | Week 2 | `docker compose up` → all services healthy |
| M2: First message sent via API | Week 3 | Send + receive WhatsApp message programmatically |
| M3: Appointment booked via WhatsApp | Week 5 | End-to-end: patient messages → books → gets confirmed |
| M4: Staging deployment | Week 7 | Full app running on AWS, accessible via domain |
| M5: First beta customer onboarded | Week 8 | Real clinic using product (free beta) |
| M6: First paying customer | Week 10 | Conversion from beta → paid plan |
| M7: 10 paying customers | Week 14 | Product-market fit validation |
| M8: ₹1L MRR | Month 4 | Unit economics proven |

---

## 20. Appendices

### 20.1 Appendix A: Context for AI-Assisted Development

> When starting a new conversation with an AI coding assistant, provide this context block:

```
PROJECT: WhatsApp-native CRM SaaS for Indian SMBs (clinics)
STACK: TypeScript, Next.js 14, Fastify, PostgreSQL 16, Redis 7, BullMQ
INFRA: AWS ap-south-1, ECS Fargate, Terraform, GitHub Actions
REPO: Turborepo monorepo (apps/web, apps/api, apps/webhook, apps/worker)
ORM: Prisma 5 | QUEUE: BullMQ (MVP) → Kafka (scale)
AUTH: OTP-only (no passwords), JWT (15-min access, 7-day refresh)
DB PATTERN: Multi-tenant shared DB, tenant_id in every table, RLS
MESSAGING: Meta WhatsApp Cloud API (direct, no BSP)
PAYMENTS: Razorpay Subscriptions API

NON-NEGOTIABLE DECISIONS:
1. Shared PostgreSQL with tenant_id isolation (not DB-per-tenant)
2. BullMQ for async jobs in MVP (not Kafka until 500+ tenants)
3. OTP-only auth (Indian users don't use email/password)
4. Monorepo with Turborepo
5. India-only hosting (AWS Mumbai ap-south-1)

CURRENT STATE: [Update: Planning / Building / Live]
CURRENT FILE: [Paste the file you need help with]
WHAT I NEED: [Specific request]
```

### 20.2 Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **Tenant** | A business entity (clinic, gym) using the platform |
| **Contact** | An end-customer of the tenant (patient, member) |
| **WABA** | WhatsApp Business Account (Meta's business entity) |
| **Template** | Pre-approved message format required for initiating conversations |
| **Session window** | 24h period after last customer message; free-form replies allowed |
| **E.164** | International phone format: `+[country][number]` (e.g., +919876543210) |
| **DLQ** | Dead Letter Queue — isolation of poison messages for inspection |
| **Circuit breaker** | Pattern to prevent cascading failure from a failing dependency |
| **Saga** | Multi-step distributed operation with compensation (rollback) logic |
| **RLS** | Row-Level Security — PostgreSQL native tenant isolation |
| **Bulkhead** | Isolation pattern preventing one tenant from consuming all resources |
| **Fan-out** | One event producing many downstream tasks (campaign → N messages) |
| **Idempotency** | Processing the same event multiple times produces the same result |

### 20.3 Appendix C: Competitor Pricing Intelligence

| Provider | Starter | Professional | Scale |
|----------|---------|-------------|-------|
| **Wati** | ₹4,999/mo (1000 contacts) | ₹14,999/mo | Custom |
| **Interakt** | ₹2,499/mo | ₹5,999/mo | ₹9,999/mo |
| **AiSensy** | ₹999/mo | ₹2,399/mo | ₹4,999/mo |
| **Gallabox** | ₹2,999/mo | ₹6,999/mo | Custom |
| **Us (target)** | ₹999/mo | ₹2,499/mo | ₹4,999/mo |

**Price position:** At or below cheapest competitor, but with **vertical features (appointments, no-show reduction)** that others lack entirely.

### 20.4 Appendix D: Pre-Launch Checklist

```
LEGAL & COMPLIANCE
□ Company registered (LLP or Private Limited)
□ GST registration
□ Terms of Service + Privacy Policy (lawyer-reviewed)
□ Data Processing Agreement template
□ DPDP Act compliance: consent management, deletion API

WHATSAPP API
□ Meta Business verified (green badge)
□ WhatsApp Business API approved
□ ≥5 message templates approved
□ Webhook receiving correctly (verified in staging)
□ End-to-end test: send + receive + status tracking

INFRASTRUCTURE
□ Production environment on AWS Mumbai
□ Domain + SSL configured (Cloudflare)
□ Database backup verified (restore drill executed)
□ Monitoring alerts firing correctly
□ Error tracking (Sentry) capturing errors
□ Status page live

PRODUCT
□ Core flows working: messaging, contacts, appointments, campaigns
□ Billing flow E2E: signup → trial → pay → use → invoice
□ Onboarding: first message in <10 minutes
□ Responsive on mobile browsers
□ Performance budgets met (see Section 16.1)

SECURITY
□ Penetration test (OWASP Top 10)
□ Rate limiting active on all endpoints
□ Webhook signature verification enforced
□ No secrets in codebase (only Secrets Manager)
□ Dependency vulnerability scan passing

GO-TO-MARKET
□ Landing page live with value proposition
□ 5 beta clinics onboarded and validated
□ Pricing page with comparison
□ Help center (10 key articles)
□ Support channel (WhatsApp, ironically)
□ Referral program designed
```

---

<div align="center">

**— End of Document —**

*This document serves as the single source of truth for all technical decisions.  
All implementation work should reference this document.  
Changes to architecture require an ADR (Architecture Decision Record) addendum.*

</div>
