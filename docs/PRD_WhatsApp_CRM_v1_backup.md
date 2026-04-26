# WhatsApp CRM for Indian SMBs — Product & Architecture Document

**Product Name:** [TBD — e.g., "ChatClinic", "BizWhats", "PingCRM"]  
**Version:** 1.0  
**Author:** Sahil Harkhani  
**Date:** April 20, 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Target Audience](#2-target-audience)
3. [Features & Functionality](#3-features--functionality)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Database Design](#6-database-design)
7. [Redis Usage](#7-redis-usage)
8. [Kafka Usage](#8-kafka-usage)
9. [Scaling Strategy](#9-scaling-strategy)
10. [DevOps & CI/CD](#10-devops--cicd)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Security & Compliance](#12-security--compliance)
13. [Pricing & Billing](#13-pricing--billing)
14. [Roadmap](#14-roadmap)
15. [System Design — How It Applies Here](#15-system-design--how-it-applies-here)
16. [Feature Detail by Level (What to Build When)](#16-feature-detail-by-level-what-to-build-when)
17. [Architecture Diagrams (Draw.io XML)](#17-architecture-diagrams-drawio-xml)
18. [Context Guide for Future Chat Sessions](#18-context-guide-for-future-chat-sessions)
19. [Non-Functional Requirements (NFR)](#19-non-functional-requirements-nfr)
20. [API Design (Key Endpoints)](#20-api-design-key-endpoints)
21. [Error Handling Strategy](#21-error-handling-strategy)
22. [Testing Strategy](#22-testing-strategy)
- [Appendix A: Key Decisions & Trade-offs](#appendix-a-key-decisions--trade-offs)
- [Appendix B: Cost Estimation](#appendix-b-cost-estimation-monthly)
- [Appendix C: Competitor Analysis](#appendix-c-competitor-analysis)
- [Appendix D: Launch Checklist](#appendix-d-launch-checklist)

---

## 1. Product Vision

A WhatsApp-first CRM platform designed for Indian SMBs (initially clinics) that automates customer communication, appointment management, and marketing — reducing no-shows by 70%, increasing repeat visits by 3x, and saving 3-4 hours of daily manual work.

### Problem Statement

Indian SMBs manage customer relationships manually via personal WhatsApp, paper registers, and phone calls. This leads to:
- 30-40% appointment no-shows
- Zero automated follow-ups
- No marketing or re-engagement capability
- Receptionist time wasted on repetitive calls
- No analytics or customer insights

### Solution

A multi-tenant SaaS platform that provides:
- WhatsApp Business API integration for automated messaging
- Smart appointment booking & reminder system
- Contact management with segmentation
- Broadcast campaigns with analytics
- AI-powered chatbot for common queries
- Revenue attribution and engagement scoring

---

## 2. Target Audience

### Primary (Phase 1): Healthcare Clinics
- Dental clinics
- Eye care / Ophthalmology
- Dermatology clinics
- Physiotherapy centers
- Diagnostic labs

### Secondary (Phase 2): Service Businesses
- Gyms & fitness studios
- Coaching institutes (IELTS, JEE, NEET)
- Salons & spas
- Real estate agents

### Tertiary (Phase 3): Retail & Others
- Used car dealers
- E-commerce D2C brands
- Restaurants
- Event planners

### User Personas

| Persona | Role | Pain Point | Key Feature Needed |
|---------|------|------------|-------------------|
| Dr. Sharma | Clinic Owner | Loses ₹50K/month to no-shows | Auto-reminders |
| Priya | Receptionist | 4hrs/day on phone booking | WhatsApp auto-booking |
| Rajesh | Gym Owner | Members forget to renew | Renewal reminders + offers |
| Meera | Coaching Center | Can't reach 500 students | Bulk broadcast |

---

## 3. Features & Functionality

### 3.1 Core Features (MVP)

#### A. WhatsApp Messaging Engine
| Feature | Description | Priority |
|---------|-------------|----------|
| Send text messages | Send template & session messages via Cloud API | P0 |
| Receive messages | Webhook-based incoming message processing | P0 |
| Media messages | Send/receive images, PDFs, documents, voice notes | P0 |
| Message templates | Create, submit for approval, manage templates | P0 |
| Template variables | Dynamic personalization (name, date, amount) | P0 |
| Delivery tracking | Sent → Delivered → Read status tracking | P0 |
| Session messaging | Free-form replies within 24h window | P0 |
| Quick replies | Pre-defined response buttons | P1 |
| Interactive messages | List messages, reply buttons, CTAs | P1 |
| Message scheduling | Schedule messages for future delivery | P1 |

#### B. Contact Management (CRM)
| Feature | Description | Priority |
|---------|-------------|----------|
| Contact CRUD | Add, edit, delete, view contacts | P0 |
| CSV/Excel import | Bulk import contacts with mapping | P0 |
| Phone normalization | Auto-convert to E.164 format (+91XXXXXXXXXX) | P0 |
| Tags & labels | Custom tags for segmentation | P0 |
| Custom fields | Tenant-defined fields (e.g., "Treatment Type") | P1 |
| Contact timeline | Full message history per contact | P0 |
| Duplicate detection | Phone-based deduplication on import | P0 |
| Opt-out management | Auto-detect "STOP" and flag contacts | P0 |
| Contact scoring | Engagement score based on interactions | P2 |
| Notes | Staff can add internal notes per contact | P1 |

#### C. Appointment Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Slot configuration | Define available slots per day/week | P0 |
| WhatsApp booking | Patient sends "book" → gets available slots | P0 |
| Manual booking | Staff books from dashboard | P0 |
| Auto-reminders | 24h + 2h before appointment | P0 |
| Confirmation flow | Patient confirms/reschedules via WhatsApp reply | P0 |
| No-show tracking | Mark no-shows, auto follow-up | P1 |
| Recurring appointments | Weekly/monthly repeating slots | P1 |
| Google Calendar sync | Two-way sync with doctor's calendar | P2 |
| Waitlist | Auto-notify if cancelled slot opens up | P2 |
| Multi-provider | Support multiple doctors per clinic | P1 |

#### D. Broadcast Campaigns
| Feature | Description | Priority |
|---------|-------------|----------|
| Segment-based targeting | Send to contacts with specific tags | P0 |
| Template selection | Choose approved template for campaign | P0 |
| Variable personalization | Auto-fill name, date, etc. | P0 |
| Scheduled campaigns | Send at specified date/time | P0 |
| Campaign analytics | Sent, delivered, read, replied, failed counts | P0 |
| A/B testing | Test 2 templates, pick winner | P2 |
| Drip campaigns | Multi-message sequences over days | P2 |
| Rate-limited sending | Respect API limits, spread over time | P0 |
| Failed message retry | Auto-retry failed messages with backoff | P1 |

#### E. Conversation Inbox
| Feature | Description | Priority |
|---------|-------------|----------|
| Unified inbox | All WhatsApp conversations in one view | P0 |
| Assignment | Assign conversation to team member | P0 |
| Status management | Open, pending, resolved states | P0 |
| Canned responses | Pre-saved reply templates | P1 |
| Internal notes | Team notes within conversation (not sent to customer) | P1 |
| Search | Full-text search across messages | P1 |
| Filters | Filter by status, assignee, tag, date | P0 |
| Real-time updates | WebSocket-based live message updates | P0 |

### 3.2 Advanced Features (Post-MVP)

#### F. AI & Automation
| Feature | Description | Priority |
|---------|-------------|----------|
| Chatbot builder | Visual flow builder for auto-responses | P2 |
| Intent detection | Classify incoming messages (booking, query, complaint) | P2 |
| Smart replies | AI-suggested responses for staff | P2 |
| Auto-tagging | Auto-tag contacts based on conversation content | P3 |
| Sentiment analysis | Detect unhappy customers, escalate | P3 |
| Language detection | Identify Hindi/English/regional language | P2 |
| AI summary | Summarize long conversations for staff | P3 |

#### G. Analytics & Reporting
| Feature | Description | Priority |
|---------|-------------|----------|
| Dashboard overview | Messages sent, delivery rate, active conversations | P0 |
| Appointment analytics | Bookings, no-shows, cancellations by day/week | P1 |
| Campaign performance | Open rate, reply rate, conversion by campaign | P1 |
| Contact growth | New contacts over time | P1 |
| Response time tracking | Average time to first reply by staff | P2 |
| Revenue attribution | Link messages to appointments/revenue | P3 |
| Custom reports | Export to CSV/PDF | P2 |
| Scheduled reports | Auto-email weekly summary to owners | P2 |

#### H. Integrations
| Feature | Description | Priority |
|---------|-------------|----------|
| Google Calendar | Bi-directional appointment sync | P2 |
| Razorpay/Cashfree | Payment links in WhatsApp messages | P1 |
| Google Sheets | Auto-export contacts/appointments | P2 |
| Zapier/Make | Webhook-based integration platform | P3 |
| Practo | Import patient data (if API available) | P3 |
| IVR/Telephony | Missed call → WhatsApp auto-reply | P3 |

#### I. Multi-tenant & Team
| Feature | Description | Priority |
|---------|-------------|----------|
| Multi-tenant isolation | Complete data separation between businesses | P0 |
| Role-based access | Owner, Admin, Staff roles | P0 |
| Team management | Add/remove team members | P0 |
| Audit log | Track who did what, when | P1 |
| Multi-branch | One account, multiple locations | P2 |
| White-labeling | Remove branding for enterprise clients | P3 |

---

## 4. Technology Stack

### 4.1 Frontend

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Web Framework | Next.js 14 (App Router) | SSR, SEO, API routes, React ecosystem |
| UI Library | shadcn/ui + Tailwind CSS | Beautiful, accessible, customizable |
| State Management | Zustand + React Query (TanStack) | Server state caching, minimal boilerplate |
| Real-time | Socket.io client | Live message updates in inbox |
| Charts | Recharts | Lightweight, React-native charts |
| Forms | React Hook Form + Zod | Performant forms with validation |
| Tables | TanStack Table | Virtual scrolling for large datasets |
| Mobile | React Native (Phase 2) | Cross-platform mobile app |

### 4.2 Backend

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Runtime | Node.js 20 LTS | Non-blocking I/O, JavaScript ecosystem |
| Framework | Fastify | 2x faster than Express, schema validation built-in |
| Language | TypeScript | Type safety, better DX, fewer bugs |
| API Style | REST + WebSocket | REST for CRUD, WS for real-time inbox |
| Validation | Zod | Shared schemas with frontend |
| ORM | Prisma | Type-safe DB access, migrations |
| Auth | Custom JWT + OTP (no password) | Indian users prefer OTP login |
| File Upload | Multer + S3 SDK | Stream to S3, no local storage |
| Job Queue | BullMQ | Redis-backed, reliable, delayed jobs |
| WebSocket | Socket.io | Room-based real-time per tenant |
| Rate Limiting | @fastify/rate-limit + Redis | Per-tenant, per-endpoint limits |

### 4.3 Database

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Primary DB | PostgreSQL 16 | ACID, JSONB, full-text search, mature |
| Cache | Redis 7 (Cluster mode) | Session, cache, queues, pub/sub |
| Search | PostgreSQL FTS (initially) → Elasticsearch (scale) | Avoid early complexity |
| Analytics | TimescaleDB (PostgreSQL extension) | Time-series optimized, same ecosystem |
| Media Storage | AWS S3 / Cloudflare R2 | Cheap, durable, CDN-integrated |
| Migrations | Prisma Migrate | Version-controlled schema changes |

### 4.4 Message Queue & Event Streaming

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Task Queue | BullMQ (Redis-backed) | MVP: delayed jobs, retries, priorities |
| Event Streaming | Apache Kafka (at scale) | High-throughput event processing |
| Dead Letter Queue | BullMQ DLQ → Kafka DLQ | Failed message isolation |

### 4.5 Infrastructure & DevOps

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Cloud Provider | AWS (Mumbai - ap-south-1) | Low latency for India, data residency |
| Container Runtime | Docker | Consistent environments |
| Orchestration | AWS ECS Fargate (→ EKS at scale) | Serverless containers, no node management |
| CI/CD | GitHub Actions | Free for public, cheap for private |
| IaC | Terraform | Reproducible infrastructure |
| DNS | Cloudflare | DDoS protection, CDN, fast DNS |
| SSL | Let's Encrypt (via Cloudflare) | Free, auto-renewal |
| Secrets | AWS Secrets Manager | Rotate credentials safely |

### 4.6 Monitoring & Observability

| Layer | Technology | Justification |
|-------|-----------|---------------|
| APM | Grafana + Prometheus | Open-source, powerful dashboards |
| Logging | Loki (Grafana stack) | Log aggregation, query with LogQL |
| Tracing | OpenTelemetry + Jaeger | Distributed tracing across services |
| Error Tracking | Sentry | Real-time error alerts, source maps |
| Uptime Monitoring | Better Uptime / UptimeRobot | Public status page, alerts |
| Alerting | Grafana Alerting + PagerDuty (later) | Slack/WhatsApp alerts for on-call |

---

## 5. System Architecture

### 5.1 High-Level Architecture

```
                            ┌─────────────────┐
                            │   Cloudflare    │
                            │   (CDN + WAF)   │
                            └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                 │
                    ▼                ▼                 ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │  Next.js App │  │  API Gateway │  │  Webhook     │
          │  (Frontend)  │  │  (Fastify)   │  │  Receiver    │
          │  Vercel/S3   │  │  ECS Fargate │  │  ECS Fargate │
          └──────────────┘  └──────┬───────┘  └──────┬───────┘
                                   │                  │
                    ┌──────────────┼──────────────────┼──────┐
                    │              │                   │      │
                    ▼              ▼                   ▼      ▼
          ┌──────────────────────────────────────────────────────┐
          │                  SERVICE LAYER                         │
          ├──────────────────────────────────────────────────────┤
          │                                                        │
          │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
          │  │  Auth       │  │  CRM         │  │  Messaging  │ │
          │  │  Service    │  │  Service     │  │  Service    │ │
          │  └─────────────┘  └──────────────┘  └─────────────┘ │
          │                                                        │
          │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
          │  │ Appointment │  │  Campaign    │  │  Analytics  │ │
          │  │  Service    │  │  Service     │  │  Service    │ │
          │  └─────────────┘  └──────────────┘  └─────────────┘ │
          │                                                        │
          │  ┌─────────────┐  ┌──────────────┐                   │
          │  │  Notification│  │  Billing    │                   │
          │  │  Service    │  │  Service     │                   │
          │  └─────────────┘  └──────────────┘                   │
          └──────────────────────────────────────────────────────┘
                    │              │              │
          ┌────────┼──────────────┼──────────────┼────────┐
          │        ▼              ▼              ▼        │
          │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
          │  │PostgreSQL│  │  Redis   │  │  S3      │   │
          │  │ (RDS)    │  │(ElastiC.)│  │ (Media)  │   │
          │  └──────────┘  └──────────┘  └──────────┘   │
          │        │                                      │
          │        ▼                                      │
          │  ┌──────────────┐  ┌──────────────────────┐  │
          │  │ TimescaleDB  │  │  Kafka (MSK)        │  │
          │  │ (Analytics)  │  │  (Event Streaming)  │  │
          │  └──────────────┘  └──────────────────────┘  │
          └───────────────────────────────────────────────┘
                    │
          ┌────────┼──────────────────────────────┐
          │        ▼                               │
          │  ┌──────────────────────────────────┐ │
          │  │       WORKER LAYER               │ │
          │  ├──────────────────────────────────┤ │
          │  │ • Message Sender Worker          │ │
          │  │ • Reminder Scheduler Worker      │ │
          │  │ • Webhook Processor Worker       │ │
          │  │ • Campaign Executor Worker       │ │
          │  │ • Analytics Aggregator Worker    │ │
          │  │ • Dead Letter Processor Worker   │ │
          │  └──────────────────────────────────┘ │
          └────────────────────────────────────────┘
```

### 5.2 Message Flow Architecture

```
OUTBOUND (Sending Message):

Dashboard/API → Validate → Rate Check → BullMQ Queue → Worker picks up
  → Meta Cloud API → Webhook (status: sent) → Update DB → Socket.io to UI

INBOUND (Receiving Message):

Meta Webhook → Webhook Receiver → Verify signature → Deduplicate (Redis)
  → Kafka Topic → Consumer → Process (auto-reply? forward to inbox?)
  → Store in DB → Socket.io to UI (real-time notification)

APPOINTMENT REMINDER:

Scheduler (runs every minute) → Find appointments in next 24h/2h
  → Check if reminder already sent → Queue reminder messages
  → Worker sends via WhatsApp API → Track delivery
```

### 5.3 Request Flow (API Call)

```
Client Request
  → Cloudflare (DDoS protection, WAF rules)
    → ALB (Application Load Balancer)
      → API Container (ECS Fargate)
        → Auth Middleware (verify JWT, extract tenant_id)
          → Rate Limiter (Redis - per tenant, per endpoint)
            → Validation (Zod schema)
              → Business Logic
                → Database Query (Prisma → PostgreSQL)
                  → Response (with cache headers)
```

---

## 6. Database Design

### 6.1 Schema Overview

```sql
-- =============================================
-- TENANT & AUTH
-- =============================================

CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    email           VARCHAR(255),
    business_type   VARCHAR(50) NOT NULL, -- clinic, gym, salon, etc.
    wa_phone_id     VARCHAR(50),          -- WhatsApp Phone Number ID
    wa_business_id  VARCHAR(50),          -- WhatsApp Business Account ID
    wa_access_token TEXT,                 -- Encrypted
    plan            VARCHAR(20) DEFAULT 'trial', -- trial, starter, pro, enterprise
    plan_expires_at TIMESTAMPTZ,
    settings        JSONB DEFAULT '{}',   -- business hours, auto-reply config
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(15) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'staff', -- owner, admin, staff
    avatar_url      VARCHAR(500),
    last_login_at   TIMESTAMPTZ,
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE otp_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(15) NOT NULL,
    code            VARCHAR(6) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    verified        BOOLEAN DEFAULT FALSE,
    attempts        INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CRM - CONTACTS
-- =============================================

CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    phone_e164      VARCHAR(15) NOT NULL,   -- +919876543210
    name            VARCHAR(255),
    email           VARCHAR(255),
    tags            TEXT[] DEFAULT '{}',
    custom_fields   JSONB DEFAULT '{}',
    opt_out         BOOLEAN DEFAULT FALSE,
    opt_out_at      TIMESTAMPTZ,
    engagement_score INT DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    source          VARCHAR(50),            -- import, whatsapp, manual, api
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, phone_e164)
);

CREATE INDEX idx_contacts_tenant_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_tenant_phone ON contacts(tenant_id, phone_e164);

-- =============================================
-- CONVERSATIONS & MESSAGES
-- =============================================

CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    contact_id      UUID NOT NULL REFERENCES contacts(id),
    assigned_to     UUID REFERENCES users(id),
    status          VARCHAR(20) DEFAULT 'open', -- open, pending, resolved, closed
    last_message_at TIMESTAMPTZ,
    last_message_preview VARCHAR(200),
    unread_count    INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, contact_id)
);

CREATE INDEX idx_conversations_tenant_status ON conversations(tenant_id, status, last_message_at DESC);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    tenant_id       UUID NOT NULL,              -- Denormalized for partitioning
    contact_id      UUID NOT NULL,
    direction       VARCHAR(10) NOT NULL,       -- inbound, outbound
    type            VARCHAR(20) NOT NULL,       -- text, image, document, audio, video, template, interactive
    content         JSONB NOT NULL,             -- {text: "...", media_url: "...", template_name: "..."}
    wa_message_id   VARCHAR(100),              -- Meta's message ID
    status          VARCHAR(20) DEFAULT 'queued', -- queued, sent, delivered, read, failed
    status_updated_at TIMESTAMPTZ,
    error_code      VARCHAR(20),
    error_message   TEXT,
    metadata        JSONB DEFAULT '{}',         -- campaign_id, template_id, etc.
    created_at      TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Monthly partitions for messages (high volume table)
CREATE TABLE messages_2026_04 PARTITION OF messages
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE messages_2026_05 PARTITION OF messages
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_wa_id ON messages(wa_message_id) WHERE wa_message_id IS NOT NULL;

-- =============================================
-- APPOINTMENTS
-- =============================================

CREATE TABLE providers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(255) NOT NULL,      -- "Dr. Sharma"
    specialization  VARCHAR(100),
    slot_duration   INT DEFAULT 30,             -- minutes
    working_hours   JSONB NOT NULL,             -- {"mon": {"start": "09:00", "end": "18:00"}, ...}
    break_hours     JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    provider_id     UUID NOT NULL REFERENCES providers(id),
    contact_id      UUID NOT NULL REFERENCES contacts(id),
    starts_at       TIMESTAMPTZ NOT NULL,
    ends_at         TIMESTAMPTZ NOT NULL,
    status          VARCHAR(20) DEFAULT 'confirmed', -- confirmed, completed, no_show, cancelled, rescheduled
    notes           TEXT,
    reminder_24h    BOOLEAN DEFAULT FALSE,
    reminder_2h     BOOLEAN DEFAULT FALSE,
    source          VARCHAR(20) DEFAULT 'whatsapp', -- whatsapp, dashboard, api
    cancelled_at    TIMESTAMPTZ,
    cancel_reason   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent double booking
    EXCLUDE USING gist (
        provider_id WITH =,
        tstzrange(starts_at, ends_at) WITH &&
    ) WHERE (status NOT IN ('cancelled', 'rescheduled'))
);

CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, starts_at);
CREATE INDEX idx_appointments_reminder ON appointments(starts_at, reminder_24h, reminder_2h) 
    WHERE status = 'confirmed';

-- =============================================
-- CAMPAIGNS
-- =============================================

CREATE TABLE templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(100) NOT NULL,
    category        VARCHAR(30) NOT NULL,       -- marketing, utility, authentication
    language        VARCHAR(10) DEFAULT 'en',
    header          JSONB,                      -- {type: "text/image/document", content: "..."}
    body            TEXT NOT NULL,
    footer          TEXT,
    buttons         JSONB DEFAULT '[]',
    variables       TEXT[] DEFAULT '{}',        -- ["name", "date", "amount"]
    meta_template_id VARCHAR(50),
    meta_status     VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    meta_rejection_reason TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(255) NOT NULL,
    template_id     UUID NOT NULL REFERENCES templates(id),
    segment_tags    TEXT[] DEFAULT '{}',        -- Send to contacts with these tags
    segment_query   JSONB,                     -- Advanced: custom filter rules
    total_contacts  INT DEFAULT 0,
    sent_count      INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    read_count      INT DEFAULT 0,
    replied_count   INT DEFAULT 0,
    failed_count    INT DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, sending, completed, paused, cancelled
    scheduled_at    TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES campaigns(id),
    contact_id      UUID NOT NULL REFERENCES contacts(id),
    message_id      UUID REFERENCES messages(id),
    status          VARCHAR(20) DEFAULT 'queued', -- queued, sent, delivered, read, replied, failed
    error_code      VARCHAR(20),
    sent_at         TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    read_at         TIMESTAMPTZ,
    replied_at      TIMESTAMPTZ
);

CREATE INDEX idx_campaign_logs_campaign ON campaign_logs(campaign_id, status);

-- =============================================
-- AUTOMATION RULES
-- =============================================

CREATE TABLE automation_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(255) NOT NULL,
    trigger_type    VARCHAR(50) NOT NULL,       -- keyword, new_contact, appointment_booked, opt_in
    trigger_config  JSONB NOT NULL,             -- {keywords: ["book", "appointment"]}
    action_type     VARCHAR(50) NOT NULL,       -- send_template, assign_agent, add_tag, create_appointment
    action_config   JSONB NOT NULL,             -- {template_id: "...", delay_minutes: 0}
    is_active       BOOLEAN DEFAULT TRUE,
    priority        INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ANALYTICS (TimescaleDB Hypertable)
-- =============================================

CREATE TABLE message_events (
    time            TIMESTAMPTZ NOT NULL,
    tenant_id       UUID NOT NULL,
    event_type      VARCHAR(20) NOT NULL,       -- sent, delivered, read, failed, received
    message_type    VARCHAR(20),
    campaign_id     UUID,
    contact_id      UUID,
    metadata        JSONB DEFAULT '{}'
);

SELECT create_hypertable('message_events', 'time');

-- =============================================
-- AUDIT LOG
-- =============================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID,
    action          VARCHAR(50) NOT NULL,       -- contact.created, message.sent, campaign.started
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID,
    changes         JSONB,                     -- {before: {...}, after: {...}}
    ip_address      INET,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);
```

### 6.2 Data Retention Policy

| Data Type | Hot Storage | Warm Storage | Cold/Archive |
|-----------|-------------|--------------|--------------|
| Messages | 3 months (PostgreSQL) | 12 months (compressed partition) | S3 (Parquet) |
| Media files | 90 days (S3 Standard) | 1 year (S3 IA) | Glacier |
| Analytics events | 30 days (TimescaleDB) | 1 year (compressed chunks) | Drop |
| Audit logs | 6 months | 2 years (S3) | — |
| Contacts | Indefinite | — | — |

---

## 7. Redis Usage

### 7.1 Cache Layer

```
Purpose: Reduce database load for frequently accessed data

Keys:
├── tenant:{id}:settings          → HASH (business hours, auto-reply config)   TTL: 5min
├── tenant:{id}:templates         → LIST (approved templates)                   TTL: 10min
├── tenant:{id}:contact:{phone}   → HASH (contact details)                     TTL: 5min
├── user:{id}:session             → HASH (JWT metadata, permissions)           TTL: 24h
└── tenant:{id}:slots:{date}      → SORTED SET (available appointment slots)   TTL: 1min
```

### 7.2 Rate Limiting

```
Purpose: Per-tenant API rate limiting + WhatsApp API throttling

Keys:
├── ratelimit:api:{tenant_id}:{endpoint}    → Counter (100 req/min per tenant)
├── ratelimit:wa_send:{tenant_id}           → Counter (messages sent today)
├── ratelimit:wa_send:{tenant_id}:per_sec   → Counter (80 msg/sec max to Meta)
└── ratelimit:otp:{phone}                   → Counter (max 5 OTPs per hour)

Implementation: Sliding window algorithm using Redis ZRANGEBYSCORE
```

### 7.3 BullMQ Job Queues

```
Purpose: Reliable async job processing with retries

Queues:
├── queue:message_send              → Priority queue for outbound messages
│   ├── Priority 1: Session replies (within 24h window)
│   ├── Priority 2: Appointment reminders
│   └── Priority 3: Campaign broadcasts
├── queue:webhook_process           → Incoming webhook events from Meta
├── queue:campaign_execute          → Campaign batch processing
├── queue:reminder_check            → Scheduled reminder job (runs every min)
├── queue:analytics_aggregate       → Hourly/daily rollups
└── queue:dead_letter               → Failed jobs for manual review

Configuration:
- message_send: maxRetries=3, backoff=exponential(1s, 2s, 4s)
- webhook_process: maxRetries=5, backoff=exponential(500ms)
- campaign_execute: concurrency=10 per worker
```

### 7.4 Real-time Pub/Sub

```
Purpose: Broadcast events to WebSocket servers

Channels:
├── channel:tenant:{id}:inbox         → New message arrived
├── channel:tenant:{id}:status        → Message status update (delivered/read)
├── channel:tenant:{id}:appointment   → Appointment booked/cancelled
└── channel:tenant:{id}:notification  → System notifications

Flow: Service → Redis PUBLISH → Socket.io Redis Adapter → All connected clients
```

### 7.5 Distributed Locking

```
Purpose: Prevent race conditions in critical operations

Locks:
├── lock:appointment:{provider_id}:{slot}    → 5s TTL (prevent double booking)
├── lock:campaign:{id}:execute               → 5min TTL (prevent duplicate execution)
├── lock:contact:{tenant}:{phone}:process    → 2s TTL (prevent duplicate webhook)
└── lock:tenant:{id}:webhook_verify          → 60s TTL

Implementation: Redlock algorithm for distributed lock safety
```

### 7.6 Session & Temporary Data

```
Keys:
├── session:{token}                → User session data                          TTL: 7d
├── wa_session:{tenant}:{phone}    → 24h window tracker                        TTL: 24h
├── onboarding:{tenant_id}         → Onboarding progress state                 TTL: 7d
├── import:{job_id}:progress       → CSV import progress (row/total)           TTL: 1h
└── otp:{phone}:{code}             → OTP verification                          TTL: 5min
```

### 7.7 Redis Architecture

```
Phase 1 (MVP): Single Redis instance (ElastiCache, r6g.large)
Phase 2 (100+ tenants): Redis Cluster with 3 shards
Phase 3 (1000+ tenants): Separate Redis clusters for:
  - Cache cluster (eviction: allkeys-lru)
  - Queue cluster (no eviction, persistence: AOF)
  - Pub/Sub cluster (no persistence needed)
```

---

## 8. Kafka Usage

### 8.1 When to Introduce Kafka

```
BullMQ (MVP → 500 tenants):
  ✓ Sufficient for <10K messages/hour
  ✓ Simple setup, single Redis dependency
  ✓ Built-in retries, priorities, delayed jobs

Kafka (500+ tenants, >50K messages/hour):
  ✓ 100K+ messages/second throughput
  ✓ Event replay capability
  ✓ Multiple consumers per event
  ✓ Multi-day retention for reprocessing
  ✓ Exactly-once semantics
```

### 8.2 Kafka Topics & Architecture

```
┌────────────────────────────────────────────────────┐
│                  KAFKA CLUSTER (MSK)                 │
├────────────────────────────────────────────────────┤
│                                                      │
│  Topics:                                             │
│  ├── whatsapp.webhook.raw           (Partitions: 12)│
│  │   → Raw webhook events from Meta                  │
│  │   → Partition key: tenant_id                      │
│  │   → Retention: 7 days                            │
│  │                                                   │
│  ├── whatsapp.message.outbound      (Partitions: 12)│
│  │   → Messages to be sent                          │
│  │   → Partition key: tenant_id                      │
│  │   → Ensures ordering per tenant                   │
│  │                                                   │
│  ├── whatsapp.message.status        (Partitions: 6) │
│  │   → Delivery status updates                      │
│  │   → Partition key: message_id                     │
│  │                                                   │
│  ├── crm.contact.events             (Partitions: 6) │
│  │   → Contact created/updated/tagged                │
│  │   → Used by analytics & automation services       │
│  │                                                   │
│  ├── appointment.events             (Partitions: 6) │
│  │   → Booked, confirmed, cancelled, no-show         │
│  │   → Triggers reminders & follow-ups               │
│  │                                                   │
│  ├── campaign.events                (Partitions: 6) │
│  │   → Campaign started, message sent, completed     │
│  │   → Used by analytics for real-time dashboards    │
│  │                                                   │
│  ├── analytics.events               (Partitions: 12)│
│  │   → All events for analytics pipeline             │
│  │   → Consumed by TimescaleDB writer                │
│  │                                                   │
│  └── dlq.failed_messages            (Partitions: 3) │
│      → Dead letter queue for manual inspection       │
│      → Retention: 30 days                            │
│                                                      │
└────────────────────────────────────────────────────┘
```

### 8.3 Consumer Groups

```
Consumer Groups:
├── cg-webhook-processor
│   → Consumes: whatsapp.webhook.raw
│   → Instances: 3-6 (auto-scaled)
│   → Processes: message received, status updates, errors
│
├── cg-message-sender
│   → Consumes: whatsapp.message.outbound
│   → Instances: 3-6
│   → Sends messages to Meta API with rate limiting
│
├── cg-analytics-writer
│   → Consumes: analytics.events
│   → Instances: 2
│   → Writes to TimescaleDB for dashboards
│
├── cg-automation-trigger
│   → Consumes: whatsapp.webhook.raw, crm.contact.events
│   → Instances: 2
│   → Evaluates automation rules, triggers actions
│
├── cg-notification-fanout
│   → Consumes: whatsapp.message.status, appointment.events
│   → Instances: 2
│   → Pushes real-time updates via Socket.io/Redis Pub/Sub
│
└── cg-dlq-monitor
    → Consumes: dlq.failed_messages
    → Instances: 1
    → Alerts on-call, stores for manual retry
```

### 8.4 Event Schema (Avro/JSON Schema)

```json
// whatsapp.webhook.raw
{
  "event_id": "uuid",
  "tenant_id": "uuid",
  "timestamp": "2026-04-20T10:30:00Z",
  "type": "message_received | status_update | error",
  "payload": {
    "from": "+919876543210",
    "wa_message_id": "wamid.xxxx",
    "type": "text | image | document",
    "content": {},
    "context": {}  // reply-to reference
  }
}

// whatsapp.message.outbound
{
  "event_id": "uuid",
  "tenant_id": "uuid",
  "contact_id": "uuid",
  "message_id": "uuid",  // internal ID
  "priority": 1,
  "type": "template | text | media",
  "payload": {
    "to": "+919876543210",
    "template_name": "appointment_reminder",
    "variables": ["Dr. Sharma", "21 April 2026", "10:30 AM"]
  },
  "metadata": {
    "campaign_id": "uuid | null",
    "appointment_id": "uuid | null",
    "retry_count": 0
  }
}
```

### 8.5 Kafka Configuration

```yaml
# Production settings
broker_count: 3
replication_factor: 3
min_insync_replicas: 2
acks: all                          # No message loss
compression: lz4                   # Fast compression
max_message_size: 1MB
retention:
  default: 7 days
  dlq: 30 days
  analytics: 3 days

# Consumer settings
auto_offset_reset: earliest        # Don't miss messages on new consumer
enable_auto_commit: false          # Manual commit after processing
max_poll_records: 100
session_timeout: 30s
```

---

## 9. Scaling Strategy

### 9.1 Scaling Phases

```
Phase 1: MVP (0-100 tenants, <5K messages/day)
├── Single API server (2 vCPU, 4GB)
├── Single PostgreSQL (db.t3.medium)
├── Single Redis (cache.t3.medium)
├── 1 background worker
├── Monthly cost: ₹5,000-8,000
└── Revenue: ₹0-1.5L/month

Phase 2: Growth (100-1000 tenants, <100K messages/day)
├── 2-4 API servers behind ALB (auto-scaling)
├── PostgreSQL RDS (db.r6g.large + 1 read replica)
├── Redis Cluster (3 nodes)
├── 2-4 background workers
├── Introduce Kafka (MSK serverless)
├── Monthly cost: ₹30,000-60,000
└── Revenue: ₹10-15L/month

Phase 3: Scale (1000-10K tenants, <2M messages/day)
├── EKS (Kubernetes) with HPA
├── PostgreSQL: Tenant sharding (by tenant_id hash)
├── Redis: Separate clusters for cache/queue/pubsub
├── Kafka: Dedicated MSK cluster (6 brokers)
├── Elasticsearch for message search
├── CDN for all static + media
├── Multi-AZ deployment
├── Monthly cost: ₹2-5L
└── Revenue: ₹1-1.5Cr/month

Phase 4: Enterprise (10K+ tenants, >10M messages/day)
├── Multi-region (Mumbai + Hyderabad)
├── Global database (Aurora Global)
├── Dedicated tenant infrastructure for large clients
├── Custom SLAs
├── Monthly cost: ₹10-20L
└── Revenue: ₹3-5Cr/month
```

### 9.2 Horizontal Scaling Strategy

| Component | Scaling Trigger | Strategy |
|-----------|----------------|----------|
| API Servers | CPU > 70% or P99 latency > 500ms | Add containers (ECS auto-scaling) |
| Message Workers | Queue depth > 1000 | Add worker instances |
| Campaign Workers | Active campaigns > 10 | Dedicated campaign worker pool |
| PostgreSQL Reads | Read IOPS > 80% | Add read replicas |
| PostgreSQL Writes | Write IOPS > 70% | Vertical scale → then shard |
| Redis | Memory > 80% | Cluster resharding |
| Kafka Consumers | Consumer lag > 10K | Add consumer instances (up to partition count) |
| WebSocket Servers | Connections > 10K per node | Add nodes (sticky sessions via Redis adapter) |

### 9.3 Database Scaling Path

```
Stage 1: Single PostgreSQL
  - Table partitioning for messages (by month)
  - Proper indexes
  - Connection pooling (PgBouncer)
  - Handles: 100 tenants, 1M messages

Stage 2: Read Replicas
  - 1-2 read replicas
  - Route reads (analytics, search) to replica
  - Writes to primary
  - Handles: 500 tenants, 10M messages

Stage 3: Vertical + Partitioning
  - Upgrade to db.r6g.2xlarge
  - TimescaleDB for time-series (messages, events)
  - Archive old partitions to S3
  - Handles: 2000 tenants, 50M messages

Stage 4: Horizontal Sharding
  - Shard by tenant_id (Citus extension or application-level)
  - Each shard handles ~2000 tenants
  - Cross-shard queries via coordinator
  - Handles: 10K+ tenants, 500M+ messages
```

### 9.4 Caching Strategy

```
Level 1: Application Cache (in-memory, per instance)
  - Tenant config (1-min TTL)
  - Template list (5-min TTL)
  - Invalidated via Redis pub/sub

Level 2: Redis Cache
  - Contact lookups
  - Conversation metadata
  - Available slots
  - Session data

Level 3: CDN (Cloudflare)
  - Static assets (JS, CSS, images)
  - Media files (patient images, PDFs)
  - API responses with cache headers (GET /templates)

Cache Invalidation:
  - Write-through: Update cache when DB is updated
  - Event-based: Kafka event triggers cache invalidation
  - TTL-based: Short TTLs for frequently changing data
```

---

## 10. DevOps & CI/CD

### 10.1 Repository Structure

```
whatsapp-crm/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── api/                    # Fastify API server
│   ├── worker/                 # Background workers
│   └── webhook/                # Webhook receiver (separate for scaling)
├── packages/
│   ├── shared/                 # Shared types, utils, constants
│   ├── database/               # Prisma schema, migrations, seed
│   ├── queue/                  # BullMQ job definitions
│   └── whatsapp-sdk/           # Meta API wrapper
├── infrastructure/
│   ├── terraform/              # AWS infrastructure as code
│   │   ├── modules/
│   │   ├── environments/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── main.tf
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.worker
│   │   ├── Dockerfile.web
│   │   └── docker-compose.yml  # Local development
│   └── k8s/                    # Kubernetes manifests (Phase 3)
├── scripts/
│   ├── seed.ts
│   ├── migrate.ts
│   └── create-partitions.ts
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, test, build
│       ├── deploy-staging.yml
│       └── deploy-production.yml
├── turbo.json                  # Turborepo config
├── package.json
└── README.md
```

### 10.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
Trigger: Push to any branch, PR to main

Steps:
1. Checkout code
2. Setup Node.js 20, pnpm
3. Install dependencies (cached)
4. Lint (ESLint + Prettier)
5. Type check (tsc --noEmit)
6. Unit tests (Vitest, coverage > 80%)
7. Integration tests (Testcontainers: PostgreSQL, Redis)
8. Build all apps
9. Security scan (Snyk / npm audit)
10. Docker build (multi-stage, minimal image)
```

```yaml
# .github/workflows/deploy-staging.yml
Trigger: Push to main branch

Steps:
1. Run CI pipeline
2. Build Docker images
3. Push to ECR (tag: commit SHA + "staging")
4. Run database migrations (staging)
5. Deploy to ECS staging (blue/green)
6. Run smoke tests against staging
7. Notify Slack
```

```yaml
# .github/workflows/deploy-production.yml
Trigger: Manual (workflow_dispatch) or tag (v*.*.*)

Steps:
1. Run CI pipeline
2. Build Docker images
3. Push to ECR (tag: semver + "production")
4. Run database migrations (production, with backup)
5. Deploy to ECS production (rolling update, 1 at a time)
6. Health check (5 min window)
7. Auto-rollback if health check fails
8. Invalidate CDN cache
9. Notify Slack + update status page
```

### 10.3 Environment Strategy

| Environment | Purpose | Infra | Data |
|-------------|---------|-------|------|
| Local | Development | Docker Compose | Seed data |
| Staging | Pre-production testing | AWS (smaller instances) | Anonymized prod subset |
| Production | Live users | AWS (full scale) | Real data |

### 10.4 Docker Configuration

```dockerfile
# Dockerfile.api (multi-stage build)
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM base AS runtime
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s CMD wget -q --spider http://localhost:3000/health
CMD ["node", "dist/server.js"]
```

### 10.5 Infrastructure as Code (Terraform)

```hcl
# Key resources managed:
# - VPC (private subnets for DB/Redis, public for ALB)
# - ECS Cluster + Services + Task Definitions
# - RDS PostgreSQL (Multi-AZ)
# - ElastiCache Redis (Cluster mode)
# - S3 buckets (media, backups, static)
# - MSK Kafka cluster (Phase 2)
# - ALB + Target Groups
# - Route53 DNS
# - CloudWatch Log Groups
# - IAM Roles & Policies
# - Secrets Manager entries
# - ECR repositories

# Environments use Terraform workspaces or separate state files
```

### 10.6 Local Development Setup

```yaml
# docker-compose.yml
services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: whatsapp_crm
      POSTGRES_PASSWORD: localdev
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports: ["9092:9092"]
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    ports: ["2181:2181"]

  mailhog:
    image: mailhog/mailhog
    ports: ["8025:8025", "1025:1025"]

  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

volumes:
  pgdata:
```

---

## 11. Monitoring & Observability

### 11.1 Monitoring Stack Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY STACK                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │  Prometheus  │   │    Loki      │   │    Jaeger        │    │
│  │  (Metrics)   │   │  (Logging)   │   │  (Tracing)       │    │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘    │
│         │                   │                     │              │
│         └───────────────────┼─────────────────────┘              │
│                             │                                     │
│                     ┌───────▼────────┐                           │
│                     │    Grafana     │                           │
│                     │  (Dashboards)  │                           │
│                     └───────┬────────┘                           │
│                             │                                     │
│              ┌──────────────┼──────────────┐                    │
│              ▼              ▼              ▼                     │
│     ┌──────────────┐ ┌──────────┐ ┌──────────────┐             │
│     │  Alertmanager│ │  Sentry  │ │ Better Uptime│             │
│     │  (Alerts)    │ │ (Errors) │ │ (Status Page)│             │
│     └──────┬───────┘ └────┬─────┘ └──────┬───────┘             │
│            │               │              │                      │
│            └───────────────┼──────────────┘                      │
│                            ▼                                     │
│              ┌───────────────────────┐                           │
│              │  Notification Channels │                          │
│              │  • Slack #alerts       │                          │
│              │  • PagerDuty (P1/P2)   │                          │
│              │  • WhatsApp (ironic!)   │                          │
│              │  • Email digest         │                          │
│              └───────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Key Metrics (Prometheus)

#### Application Metrics

```
# API Performance
http_request_duration_seconds{method, route, status_code}
http_requests_total{method, route, status_code}
http_request_size_bytes{method, route}

# WhatsApp Messaging
wa_messages_sent_total{tenant_id, type, status}
wa_messages_received_total{tenant_id, type}
wa_message_delivery_duration_seconds{type}
wa_api_errors_total{error_code}
wa_template_approval_status{tenant_id, template_name, status}

# Queue Metrics
bullmq_queue_depth{queue_name}
bullmq_job_duration_seconds{queue_name, status}
bullmq_jobs_completed_total{queue_name}
bullmq_jobs_failed_total{queue_name}
bullmq_dead_letter_count{queue_name}

# Business Metrics
appointments_booked_total{tenant_id}
appointments_noshow_total{tenant_id}
campaigns_sent_total{tenant_id}
contacts_created_total{tenant_id}
active_tenants_gauge
mrr_inr_gauge

# WebSocket
ws_connections_active{tenant_id}
ws_messages_sent_total
```

#### Infrastructure Metrics

```
# Database
pg_connections_active
pg_replication_lag_seconds
pg_deadlocks_total
pg_cache_hit_ratio

# Redis
redis_memory_used_bytes
redis_connected_clients
redis_keyspace_hits_total / redis_keyspace_misses_total
redis_evicted_keys_total

# Kafka (if used)
kafka_consumer_lag{group, topic, partition}
kafka_messages_in_per_sec{topic}
kafka_under_replicated_partitions

# System
container_cpu_usage_percent
container_memory_usage_bytes
container_network_receive_bytes
```

### 11.3 Logging Strategy

```
Log Levels:
├── ERROR  → Unhandled exceptions, data loss scenarios, API failures
├── WARN   → Retries, rate limits hit, template rejections
├── INFO   → Request/response, job start/complete, business events
└── DEBUG  → Detailed flow (disabled in production)

Log Format (Structured JSON):
{
  "timestamp": "2026-04-20T10:30:00.123Z",
  "level": "info",
  "service": "api",
  "trace_id": "abc123",
  "tenant_id": "uuid",
  "user_id": "uuid",
  "message": "Message sent successfully",
  "metadata": {
    "contact_phone": "+91987***3210",  // PII masked
    "wa_message_id": "wamid.xxx",
    "template": "appointment_reminder",
    "duration_ms": 234
  }
}

PII Handling:
- Phone numbers: Last 4 digits only in logs
- Names: Never log
- Message content: Never log
- Tenant IDs: OK to log (not PII)
```

### 11.4 Distributed Tracing (OpenTelemetry)

```
Trace flow example (sending appointment reminder):

[Scheduler Worker] (trace_id: abc123)
  └── span: check_upcoming_appointments (50ms)
      └── span: db_query_appointments (20ms)
  └── span: enqueue_reminders (5ms)
      └── span: redis_lpush (2ms)

[Message Worker] (trace_id: abc123, continues)
  └── span: process_reminder_job (300ms)
      └── span: fetch_contact (10ms)
      └── span: render_template (5ms)
      └── span: send_whatsapp_message (250ms)
          └── span: http_post_meta_api (230ms)
      └── span: update_message_status (10ms)

[Webhook Receiver] (trace_id: abc123, continues)
  └── span: process_status_webhook (50ms)
      └── span: verify_signature (5ms)
      └── span: update_delivery_status (20ms)
      └── span: notify_websocket (10ms)
```

### 11.5 Alerting Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| API P99 > 2s | For 5 minutes | P2 | Slack + investigate |
| API Error Rate > 5% | For 3 minutes | P1 | PagerDuty + scale up |
| API Down | Health check fails 3x | P0 | PagerDuty + auto-restart |
| Queue Depth > 5000 | For 10 minutes | P2 | Slack + scale workers |
| Dead Letter Queue > 100 | Any time | P2 | Slack + manual review |
| DB Connection Pool > 80% | For 5 minutes | P2 | Slack + add connections |
| DB Replication Lag > 10s | For 2 minutes | P1 | PagerDuty |
| Redis Memory > 85% | For 5 minutes | P2 | Slack + eviction check |
| Kafka Consumer Lag > 50K | For 10 minutes | P1 | Slack + add consumers |
| WhatsApp API 4xx Errors Spike | >10 in 1 minute | P2 | Check templates/rate limits |
| WhatsApp API 5xx Errors | Any | P1 | Check Meta status page |
| SSL Certificate Expiry | < 7 days | P2 | Auto-renew should have worked |
| Disk Usage > 80% | Any | P2 | Expand volume |
| NoShow Rate Spike per Tenant | >60% in a day | P3 | Review — might be false bookings |

### 11.6 Dashboards (Grafana)

```
Dashboard 1: System Overview
├── API request rate & latency (P50, P95, P99)
├── Error rate by endpoint
├── Active WebSocket connections
├── Container CPU/Memory
└── Database connections & query time

Dashboard 2: WhatsApp Messaging
├── Messages sent/received per hour
├── Delivery success rate
├── Mean time to delivery
├── Failed messages by error code
├── Rate limit hits
└── Template approval status

Dashboard 3: Business Metrics
├── Active tenants (daily/weekly)
├── Messages by tenant (top 10)
├── Appointments booked today
├── Campaign performance
├── New contacts this week
└── MRR growth

Dashboard 4: Queue & Workers
├── Queue depth over time (per queue)
├── Job processing rate
├── Job failure rate
├── Average job duration
├── Dead letter queue count
└── Worker instance count

Dashboard 5: Kafka (Post Phase 2)
├── Messages in/out per topic
├── Consumer lag per group
├── Partition distribution
├── Broker health
└── Disk usage per broker
```

### 11.7 Health Check Endpoints

```
GET /health          → 200 OK (basic liveness)
GET /health/ready    → 200 OK (readiness: DB + Redis connected)
GET /health/deep     → JSON (all dependency status)

Response:
{
  "status": "healthy",
  "version": "1.2.3",
  "uptime": "3d 4h 12m",
  "dependencies": {
    "postgresql": { "status": "up", "latency_ms": 2 },
    "redis": { "status": "up", "latency_ms": 1 },
    "whatsapp_api": { "status": "up", "latency_ms": 120 },
    "s3": { "status": "up" }
  }
}
```

---

## 12. Security & Compliance

### 12.1 Security Measures

| Layer | Measure | Implementation |
|-------|---------|----------------|
| Network | VPC isolation | Private subnets for DB/Redis, NAT gateway for outbound |
| Network | WAF | Cloudflare WAF rules + rate limiting |
| Network | DDoS | Cloudflare + AWS Shield |
| Transport | TLS 1.3 | All external communication encrypted |
| Auth | OTP-based login | No passwords stored, 5-min OTP expiry |
| Auth | JWT with refresh | 15-min access token, 7-day refresh |
| Auth | API Keys | For system integrations (hashed, rotatable) |
| Data | Encryption at rest | AES-256 (RDS, S3, Redis) |
| Data | PII encryption | Application-level encryption for phone/name |
| Data | Tenant isolation | Row-level security + application enforced |
| API | Input validation | Zod schemas on all endpoints |
| API | SQL injection protection | Prisma parameterized queries |
| API | XSS prevention | Content-Security-Policy headers |
| API | CORS | Whitelist specific origins |
| Webhook | Signature verification | Verify Meta webhook signature (X-Hub-Signature-256) |
| Secrets | No hardcoded secrets | AWS Secrets Manager + env injection |
| Audit | Complete audit trail | All mutations logged with actor |
| Dependencies | Vulnerability scanning | Snyk in CI, Dependabot alerts |

### 12.2 Compliance

| Regulation | Applicability | Actions |
|------------|---------------|---------|
| DPDP Act 2023 (India) | All personal data | Consent collection, data deletion API, breach notification |
| WhatsApp Commerce Policy | All WhatsApp messaging | Opt-in before messaging, honor opt-out, no spam |
| IT Act 2000 (India) | All digital services | Data localization (India servers), reasonable security |
| PCI DSS | If handling payments | Use Razorpay (they handle PCI), never store card data |

### 12.3 Data Residency

```
All data stored in AWS ap-south-1 (Mumbai)
├── PostgreSQL: RDS Mumbai
├── Redis: ElastiCache Mumbai  
├── S3: ap-south-1 bucket
├── Kafka: MSK Mumbai
└── Backups: Same region (cross-AZ)

No data leaves India unless:
- WhatsApp API calls (to Meta's servers)
- Sentry error reports (can self-host if needed)
- Cloudflare CDN (Indian PoPs serve Indian users)
```

---

## 13. Pricing & Billing

### 13.1 Pricing Tiers

| Plan | Price | Contacts | Messages/month | Team Members | Features |
|------|-------|----------|----------------|--------------|----------|
| **Trial** | Free (14 days) | 100 | 500 | 1 | Basic messaging + appointments |
| **Starter** | ₹999/month | 500 | 5,000 | 2 | + Campaigns, Analytics |
| **Professional** | ₹2,499/month | 2,000 | 20,000 | 5 | + Automation, AI replies |
| **Business** | ₹4,999/month | 10,000 | 100,000 | 10 | + API access, Integrations |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited | + White-label, SLA, Dedicated |

### 13.2 Billing Implementation

```
Payment Gateway: Razorpay (Subscriptions API)
├── Auto-charge monthly via UPI Autopay / Card
├── Invoice generation (GST compliant)
├── Failed payment: 3 retry attempts over 7 days
├── Grace period: 7 days after plan expiry
├── Downgrade: Features restricted, data retained 30 days
└── Annual discount: 20% off (2 months free)

Usage-based overage:
├── Extra messages: ₹0.50 per message beyond plan limit  
├── Extra contacts: ₹100 per 500 contacts beyond limit
└── Billed at month end as one-time charge
```

---

## 14. Roadmap

### Phase 1: MVP (Weeks 1-8)
- [ ] Auth (OTP login, multi-tenant)
- [ ] WhatsApp Cloud API integration (send/receive)
- [ ] Contact management (CRUD, import, tags)
- [ ] Conversation inbox (real-time)
- [ ] Appointment booking & reminders
- [ ] Basic broadcast campaigns
- [ ] Dashboard (message stats)
- [ ] Razorpay billing integration
- [ ] Deploy to staging

### Phase 2: Growth (Months 3-6)
- [ ] Mobile app (React Native)
- [ ] Automation rules (keyword triggers)
- [ ] Campaign analytics (delivery, read, reply rates)
- [ ] Custom fields & advanced segmentation
- [ ] Multi-provider appointments
- [ ] Payment links via WhatsApp (Razorpay)
- [ ] CSV/PDF report exports
- [ ] Expand to gyms/salons vertical

### Phase 3: Scale (Months 6-12)
- [ ] AI chatbot builder (visual flow)
- [ ] Kafka migration for event streaming
- [ ] Elasticsearch for message search
- [ ] Google Calendar sync
- [ ] Drip campaigns & sequences
- [ ] Zapier/Make integration
- [ ] White-label option
- [ ] Multi-branch support
- [ ] SOC 2 compliance prep

### Phase 4: Platform (Year 2)
- [ ] Marketplace (third-party integrations)
- [ ] API-first platform (developers can build on top)
- [ ] AI: intent detection, smart replies, sentiment
- [ ] Multi-channel (SMS, Email, Instagram DM)
- [ ] Revenue analytics & attribution
- [ ] Enterprise tier with SLA

---

## Appendix A: Key Decisions & Trade-offs

| Decision | Choice | Alternative | Why |
|----------|--------|-------------|-----|
| Monorepo | Turborepo | Separate repos | Shared types, easier refactoring |
| ORM | Prisma | Drizzle, raw SQL | Type safety, migration tooling, ecosystem |
| Queue (MVP) | BullMQ | Kafka | Simpler, sufficient for MVP scale |
| Queue (Scale) | Kafka | RabbitMQ | Higher throughput, event replay, ecosystem |
| Hosting | AWS | GCP, Azure | Best India region, most services |
| Frontend | Next.js | Vite + React | SSR, API routes, deployment options |
| Mobile (later) | React Native | Flutter | Code sharing with web (React ecosystem) |
| Auth | Custom OTP | Auth0, Clerk | Cheaper at scale, India-specific (no email) |

---

## Appendix B: Cost Estimation (Monthly)

| Component | Phase 1 | Phase 2 | Phase 3 |
|-----------|---------|---------|---------|
| ECS Fargate (API + Workers) | ₹3,000 | ₹15,000 | ₹60,000 |
| RDS PostgreSQL | ₹2,500 | ₹8,000 | ₹30,000 |
| ElastiCache Redis | ₹1,500 | ₹5,000 | ₹15,000 |
| S3 + CloudFront | ₹500 | ₹2,000 | ₹8,000 |
| MSK Kafka | — | ₹10,000 | ₹40,000 |
| Monitoring (Grafana Cloud) | Free tier | ₹3,000 | ₹8,000 |
| Sentry | Free tier | ₹2,000 | ₹5,000 |
| Cloudflare | Free | ₹1,500 | ₹5,000 |
| Domain + SSL | ₹500 | ₹500 | ₹500 |
| WhatsApp API (Meta charges) | Free tier | ₹5,000 | ₹50,000 |
| **Total** | **₹8,000** | **₹52,000** | **₹2,21,500** |
| **Revenue (projected)** | **₹50,000** | **₹12,00,000** | **₹1,00,00,000** |

---

## 15. System Design — How It Applies Here

This section explains how classical system design concepts directly map to this product. Use this as a reference when building each component.

### 15.1 System Design Concepts Mapping

| System Design Concept | Where It Applies | Implementation Detail |
|----------------------|-----------------|----------------------|
| **Load Balancing** | API Gateway layer | ALB with round-robin; sticky sessions for WebSocket |
| **Horizontal Scaling** | API + Worker containers | ECS auto-scaling on CPU/queue-depth |
| **Vertical Scaling** | Database (early stage) | Upgrade RDS instance before sharding |
| **Database Sharding** | Messages table at 500M+ rows | Shard by `tenant_id` hash (Citus or app-level) |
| **Database Partitioning** | Messages table | Range partition by `created_at` (monthly) |
| **Read Replicas** | Analytics queries, search | Route reads to replica, writes to primary |
| **Caching** | Contact lookups, tenant config | Redis L1 cache + CDN L2 for static |
| **Cache Invalidation** | Contact update, template change | Event-driven invalidation via Kafka/Redis pub/sub |
| **Rate Limiting** | API endpoints, WhatsApp sends | Sliding window (Redis ZSET) per tenant per endpoint |
| **Circuit Breaker** | Meta WhatsApp API calls | If 5 failures in 30s → open circuit for 60s → half-open |
| **Retry with Backoff** | Message sending, webhook processing | Exponential backoff: 1s, 2s, 4s, 8s, max 3-5 retries |
| **Idempotency** | Webhook processing, payment callbacks | Deduplicate by `wa_message_id` or `event_id` in Redis SET |
| **Event-Driven Architecture** | All async flows | Kafka topics for decoupled services |
| **CQRS** | Dashboard analytics vs CRM writes | Write to PostgreSQL, read from TimescaleDB/materialized views |
| **Saga Pattern** | Campaign execution (multi-step) | Orchestrator saga: segment → queue → send → track |
| **Pub/Sub** | Real-time inbox updates | Redis pub/sub → Socket.io adapter |
| **Message Queue** | Async job processing | BullMQ (MVP) → Kafka (scale) |
| **Dead Letter Queue** | Failed message handling | Isolate poison messages, alert, manual retry |
| **API Gateway** | Single entry point | Fastify with auth, rate-limit, logging middleware |
| **Service Discovery** | Microservices (Phase 3) | AWS Cloud Map or Kubernetes DNS |
| **Health Checks** | Container orchestration | Liveness + readiness probes |
| **Graceful Shutdown** | Zero-downtime deploys | Drain connections, finish current jobs, then exit |
| **Backpressure** | Campaign sending | If downstream (Meta API) is slow, reduce queue consumption rate |
| **Consistent Hashing** | Kafka partition assignment | Ensures same tenant's messages go to same partition (ordering) |
| **Optimistic Locking** | Concurrent contact edits | Version column, retry on conflict |
| **Pessimistic Locking** | Appointment slot booking | `SELECT FOR UPDATE` or PostgreSQL exclusion constraint |
| **CAP Theorem** | System-wide trade-off | Choose CP for bookings (consistency), AP for analytics (availability) |
| **Eventual Consistency** | Analytics dashboards, read replicas | Dashboards may be 5-30s behind real-time (acceptable) |
| **Strong Consistency** | Appointment booking, billing | Use primary DB, atomic transactions |
| **Fan-out** | Campaign to 10K contacts | Producer creates 10K individual send jobs (fan-out on write) |
| **Fan-in** | Campaign completion tracking | Aggregate individual delivery statuses → campaign summary |
| **Bulkhead Pattern** | Tenant isolation | Separate queue priorities; one tenant can't starve others |
| **Throttling** | WhatsApp API compliance | Token bucket: 80 msg/sec to Meta API |
| **Data Partitioning** | Multi-tenant isolation | Logical: same DB, `tenant_id` in every query. Physical (later): separate schemas |

### 15.2 Detailed System Design for Each Core Flow

#### Flow 1: Sending a WhatsApp Message (Outbound)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        OUTBOUND MESSAGE FLOW                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  Step 1: Request Received                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │ POST /api/v1/messages/send                                           │      │
│  │ Body: { contact_id, template_name, variables[] }                     │      │
│  │                                                                       │      │
│  │ Validations:                                                          │      │
│  │ ├── JWT valid? → 401 if not                                          │      │
│  │ ├── Tenant active & plan not expired? → 403 if not                   │      │
│  │ ├── Contact exists & not opted out? → 400 if not                     │      │
│  │ ├── Template approved by Meta? → 400 if not                          │      │
│  │ ├── Daily message quota not exceeded? → 429 if exceeded              │      │
│  │ ├── Rate limit not hit? → 429 with retry-after header                │      │
│  │ └── Variables match template placeholders? → 400 if mismatch         │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                │
│  Step 2: Persist & Queue                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │ Transaction:                                                          │      │
│  │ ├── INSERT INTO messages (status='queued')                           │      │
│  │ ├── UPDATE conversations SET last_message_at = NOW()                 │      │
│  │ └── COMMIT                                                            │      │
│  │                                                                       │      │
│  │ Then:                                                                 │      │
│  │ ├── Add job to BullMQ queue:message_send (priority based on type)    │      │
│  │ ├── Increment Redis counter: ratelimit:wa_send:{tenant_id}           │      │
│  │ └── Return 202 Accepted { message_id: "uuid" }                       │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                │
│  Step 3: Worker Processes Job                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │ Worker picks job from queue (concurrency: 20)                         │      │
│  │                                                                       │      │
│  │ ├── Check circuit breaker for Meta API → if OPEN, delay & re-queue   │      │
│  │ ├── Check per-second rate limit (80 msg/sec) → if exceeded, delay    │      │
│  │ ├── Build Meta API payload (template + variables)                     │      │
│  │ ├── POST to https://graph.facebook.com/v18.0/{phone_id}/messages     │      │
│  │ │   ├── Success (200): Extract wa_message_id                         │      │
│  │ │   ├── Rate Limited (429): Re-queue with delay                      │      │
│  │ │   ├── Invalid Template (400): Mark failed, notify admin            │      │
│  │ │   └── Server Error (500): Retry with exponential backoff           │      │
│  │ ├── UPDATE messages SET status='sent', wa_message_id=?               │      │
│  │ ├── Publish to Redis: channel:tenant:{id}:status                     │      │
│  │ └── Emit analytics event: wa_messages_sent_total++                   │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                │
│  Step 4: Delivery Confirmation (Async via Webhook)                             │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │ Meta sends webhook: message status = "delivered" / "read"             │      │
│  │                                                                       │      │
│  │ ├── Verify X-Hub-Signature-256                                        │      │
│  │ ├── Deduplicate (check Redis SET for wa_message_id)                  │      │
│  │ ├── UPDATE messages SET status='delivered', status_updated_at=NOW()   │      │
│  │ ├── UPDATE campaign_logs if campaign message                          │      │
│  │ ├── Publish real-time update via Socket.io                           │      │
│  │ └── Write to analytics: message_events                               │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Flow 2: Receiving a WhatsApp Message (Inbound)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        INBOUND MESSAGE FLOW                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  Step 1: Webhook Received from Meta                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │ POST /webhook/whatsapp                                                │      │
│  │                                                                       │      │
│  │ Security:                                                             │      │
│  │ ├── Verify X-Hub-Signature-256 (HMAC SHA256 with app secret)         │      │
│  │ ├── Check source IP (Meta's webhook IPs whitelist)                   │      │
│  │ ├── Reject if signature invalid → 401                                │      │
│  │ └── Return 200 OK immediately (Meta expects <5s response)            │      │
│  │                                                                       │      │
│  │ Then async:                                                           │      │
│  │ ├── Deduplicate by wa_message_id (Redis SETNX, TTL 24h)             │      │
│  │ ├── If duplicate → discard (Meta retries webhooks)                   │      │
│  │ └── Queue for processing: queue:webhook_process                      │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                │
│  Step 2: Process Incoming Message                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │ Worker processes webhook payload:                                     │      │
│  │                                                                       │      │
│  │ ├── Extract: from_phone, message_type, content, timestamp            │      │
│  │ ├── Normalize phone to E.164                                          │      │
│  │ ├── Lookup tenant by wa_phone_id (cached in Redis)                   │      │
│  │ ├── Lookup or create contact (UPSERT on tenant_id + phone_e164)      │      │
│  │ ├── Lookup or create conversation                                     │      │
│  │ ├── Store message in DB                                               │      │
│  │ ├── Update conversation.last_message_at, unread_count++              │      │
│  │ ├── Mark 24h session window as active (Redis key with 24h TTL)       │      │
│  │ └── If media message: download media → upload to S3 → store URL      │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                │
│  Step 3: Automation Engine                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │ After storing message, check automation rules:                         │      │
│  │                                                                       │      │
│  │ ├── Opt-out check: Does message contain "STOP", "UNSUBSCRIBE"?       │      │
│  │ │   └── YES: Flag contact as opted_out, send confirmation            │      │
│  │ │                                                                     │      │
│  │ ├── Keyword match: Does message match any automation trigger?         │      │
│  │ │   ├── "book" / "appointment" → Trigger booking flow                │      │
│  │ │   ├── "hi" / "hello" → Send welcome message                       │      │
│  │ │   └── "hours" / "timing" → Send business hours                    │      │
│  │ │                                                                     │      │
│  │ ├── Business hours check:                                             │      │
│  │ │   └── Outside hours? → Send auto-away message                      │      │
│  │ │                                                                     │      │
│  │ └── No match: Leave in inbox for manual reply                         │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                │
│  Step 4: Real-time Notification                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │ ├── Redis PUBLISH → Socket.io server → Client browser/app            │      │
│  │ ├── Push notification (if mobile app installed)                       │      │
│  │ ├── Browser notification (if tab is background)                      │      │
│  │ └── Badge count update on conversation list                          │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Flow 3: Appointment Booking via WhatsApp

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    APPOINTMENT BOOKING FLOW                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  Patient: "I want to book an appointment"                                      │
│       │                                                                        │
│       ▼                                                                        │
│  System: Detects keyword "book" / "appointment"                                │
│       │                                                                        │
│       ▼                                                                        │
│  System: Sends interactive message with provider options                       │
│  "Choose your doctor:"                                                         │
│  [Dr. Sharma - Dental] [Dr. Patel - Ortho] [Dr. Singh - General]             │
│       │                                                                        │
│       ▼ (Patient selects Dr. Sharma)                                           │
│                                                                                │
│  System: Queries available slots (next 7 days)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │ SELECT available slots WHERE:                                         │      │
│  │ ├── provider_id = Dr. Sharma's ID                                    │      │
│  │ ├── date BETWEEN today AND today + 7 days                            │      │
│  │ ├── NOT EXISTS conflicting appointment (status != cancelled)          │      │
│  │ ├── Within working_hours for that day                                │      │
│  │ └── Not in break_hours                                                │      │
│  │                                                                       │      │
│  │ Cache result in Redis: tenant:{id}:slots:{date} TTL=1min            │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│       │                                                                        │
│       ▼                                                                        │
│  System: Sends list message with available slots                               │
│  "Available slots for Dr. Sharma:"                                             │
│  📅 Mon Apr 21: 10:00 AM | 11:30 AM | 2:00 PM                                │
│  📅 Tue Apr 22: 9:00 AM | 10:30 AM | 4:00 PM                                 │
│  [Select a slot]                                                               │
│       │                                                                        │
│       ▼ (Patient selects "Mon Apr 21, 10:00 AM")                              │
│                                                                                │
│  System: Atomic Booking                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │ BEGIN TRANSACTION:                                                    │      │
│  │ ├── Acquire lock: lock:appointment:{provider}:{slot} (Redis, 5s TTL)│      │
│  │ ├── Re-check slot availability (another patient may have booked)     │      │
│  │ │   ├── Available → INSERT appointment, COMMIT                       │      │
│  │ │   └── Taken → ROLLBACK, offer next available slot                  │      │
│  │ ├── Release lock                                                      │      │
│  │ ├── Invalidate slot cache                                            │      │
│  │ └── Queue reminder jobs:                                              │      │
│  │     ├── 24h before: queue:message_send (delayed job)                 │      │
│  │     └── 2h before: queue:message_send (delayed job)                  │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│       │                                                                        │
│       ▼                                                                        │
│  System: Sends confirmation                                                    │
│  "✅ Appointment confirmed!                                                    │
│   Dr. Sharma - Mon Apr 21, 10:00 AM                                           │
│   Reply CANCEL to cancel or RESCHEDULE to change."                            │
│       │                                                                        │
│       ▼                                                                        │
│  24h before: "Reminder: Your appointment with Dr. Sharma is tomorrow          │
│   at 10:00 AM. Reply CONFIRM to confirm or CANCEL to cancel."                │
│       │                                                                        │
│       ▼                                                                        │
│  2h before: "Your appointment with Dr. Sharma is in 2 hours.                  │
│   📍 Clinic: ABC Dental, MG Road. See you soon!"                             │
│                                                                                │
│  EDGE CASES:                                                                   │
│  ├── Patient doesn't respond within 10 min → Send "Still want to book?"      │
│  ├── Slot taken between display and selection → Offer alternatives            │
│  ├── Patient sends invalid response → Re-send options with hint              │
│  ├── Multiple booking attempts same day → "You already have a booking"       │
│  ├── Patient in different timezone → Use tenant's timezone always             │
│  └── Holiday/clinic closed → "Clinic is closed on [date], next available..." │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Flow 4: Campaign Broadcast (Saga Pattern)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    CAMPAIGN EXECUTION SAGA                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  Step 1: INITIATE                                                              │
│  ├── Validate: template approved, segment has contacts, plan allows            │
│  ├── UPDATE campaign SET status='sending', started_at=NOW()                   │
│  ├── Count eligible contacts: NOT opted_out, phone valid, not bounced         │
│  └── UPDATE campaign SET total_contacts = count                               │
│                                                                                │
│  Step 2: SEGMENT (Fan-out)                                                     │
│  ├── SELECT contacts WHERE tags && campaign.segment_tags                      │
│  ├── Batch contacts in chunks of 100                                          │
│  ├── For each batch:                                                           │
│  │   ├── INSERT INTO campaign_logs (status='queued') for each contact         │
│  │   └── Add batch job to queue:campaign_execute                              │
│  └── Total: 10,000 contacts → 100 batch jobs                                 │
│                                                                                │
│  Step 3: SEND (Per-batch worker)                                               │
│  ├── For each contact in batch:                                                │
│  │   ├── Render template with contact's variables                             │
│  │   ├── Check: opt_out? already sent? daily limit?                           │
│  │   ├── Add to queue:message_send (priority: 3 - lowest)                     │
│  │   └── Rate: 80 msg/sec cap → 100 contacts takes ~1.2 seconds              │
│  └── Track: campaign.sent_count += batch_size                                  │
│                                                                                │
│  Step 4: TRACK (Delivery callbacks)                                            │
│  ├── Webhooks update individual message status                                 │
│  ├── UPDATE campaign_logs SET status, delivered_at, read_at                   │
│  ├── Aggregate counts every 30s:                                               │
│  │   campaign.delivered_count = COUNT(status='delivered')                      │
│  │   campaign.read_count = COUNT(status='read')                               │
│  │   campaign.failed_count = COUNT(status='failed')                           │
│  └── Real-time progress on dashboard via WebSocket                            │
│                                                                                │
│  Step 5: COMPLETE                                                              │
│  ├── When all messages processed (sent + failed = total)                       │
│  ├── UPDATE campaign SET status='completed', completed_at=NOW()               │
│  ├── Generate summary report                                                   │
│  └── Notify campaign creator via in-app + optional WhatsApp                   │
│                                                                                │
│  COMPENSATION (if saga fails mid-way):                                         │
│  ├── If Meta API down → Pause campaign, resume when API up                    │
│  ├── If rate limited → Slow down, extend campaign duration                    │
│  ├── If template rejected mid-campaign → Stop, notify admin                   │
│  └── Manual: Admin can "Pause" or "Cancel" campaign at any step               │
│                                                                                │
│  PERFORMANCE at scale:                                                          │
│  ├── 10K contacts: ~2 minutes (at 80 msg/sec)                                │
│  ├── 50K contacts: ~10 minutes                                                │
│  ├── 100K contacts: ~20 minutes (spread across hours if needed)               │
│  └── Kafka (Phase 3): Parallel consumers → 5x throughput                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Flow 5: Multi-Tenant Data Isolation

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    TENANT ISOLATION MODEL                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  Level 1: Application Layer                                                    │
│  ├── Every authenticated request has tenant_id extracted from JWT              │
│  ├── Middleware injects tenant_id into request context                         │
│  ├── ALL database queries include WHERE tenant_id = ?                          │
│  ├── No endpoint ever exposes data without tenant filter                       │
│  └── Unit tests verify: no query without tenant_id filter                     │
│                                                                                │
│  Level 2: Database Layer                                                       │
│  ├── Row-Level Security (RLS) as defense-in-depth:                            │
│  │   ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;                           │
│  │   CREATE POLICY tenant_isolation ON contacts                                │
│  │     USING (tenant_id = current_setting('app.current_tenant_id')::uuid);    │
│  ├── Composite indexes always start with tenant_id                             │
│  └── Foreign keys scoped within tenant (no cross-tenant references)           │
│                                                                                │
│  Level 3: Storage Layer                                                        │
│  ├── S3: Objects stored under prefix: /{tenant_id}/media/{filename}           │
│  ├── Presigned URLs: Short-lived (1h), tenant-specific                        │
│  └── No shared file access between tenants                                    │
│                                                                                │
│  Level 4: Cache Layer                                                          │
│  ├── All Redis keys prefixed: tenant:{id}:*                                   │
│  ├── No global cache that mixes tenant data                                   │
│  └── Cache eviction per-tenant won't affect others                            │
│                                                                                │
│  Level 5: Queue Layer                                                          │
│  ├── Jobs tagged with tenant_id                                                │
│  ├── Per-tenant rate limiting in queue consumer                                │
│  └── Bulkhead: Max 1000 pending jobs per tenant (prevent queue monopoly)      │
│                                                                                │
│  Scaling tenant isolation:                                                      │
│  ├── Phase 1 (Shared DB): All tenants in same tables, RLS                     │
│  ├── Phase 2 (Schema per tenant): Large tenants get own schema                │
│  └── Phase 3 (DB per tenant): Enterprise gets dedicated database              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 15.3 Capacity Planning & Calculations

```
Assumptions (Phase 2: 500 tenants):
├── Average messages per tenant/day: 200
├── Total messages/day: 100,000
├── Peak hour: 3x average = 12,500 messages/hour
├── Peak second: ~4 messages/second
├── Webhook events/day: ~300,000 (sent + delivered + read per message)
├── API requests/day: ~500,000 (dashboard usage + API)
├── WebSocket connections concurrent: ~200 (not all online)
└── Storage growth: ~2GB/month (messages + media)

Database sizing:
├── Messages table: 100K rows/day × 1KB = 100MB/day → 3GB/month
├── Contacts: 500 tenants × 1000 contacts = 500K rows → 200MB
├── Conversations: 500K rows → 150MB
├── Total active DB: ~15GB (fits in db.r6g.large easily)
└── With 12-month retention: ~40GB

Redis sizing:
├── Cache entries: ~50K keys × avg 500 bytes = 25MB
├── Queue data: ~1000 pending jobs × 2KB = 2MB
├── Rate limit counters: ~5000 keys × 100 bytes = 500KB
├── Pub/sub channels: negligible
├── Total: ~50MB (cache.t3.small is fine)
└── Headroom for spikes: 256MB instance

Kafka sizing (if used):
├── Messages/sec peak: 50/sec (webhooks + outbound)
├── Message size: ~1KB average
├── Retention: 7 days
├── Storage: 50/sec × 1KB × 86400 × 7 = ~30GB
└── Brokers needed: 3 (replication factor 3)
```

### 15.4 Failure Scenarios & Recovery

| Failure Scenario | Impact | Detection | Recovery |
|-----------------|--------|-----------|----------|
| API server crash | Requests fail until restart | Health check fails → ALB removes | ECS auto-replaces container (<30s) |
| Worker crash mid-job | Job partially processed | BullMQ job timeout (5min) | Job returns to queue, retry with stale-lock check |
| PostgreSQL primary down | All writes fail | RDS automated failover alert | Multi-AZ failover (~60s), app reconnects via DNS |
| Redis down | Cache miss, queue stall | ElastiCache failover alert | Replica promoted, app reconnects. Cached data lost (acceptable) |
| Kafka broker down | Consumer lag increases | Under-replicated partitions alert | Kafka rebalances partitions to remaining brokers |
| Meta API outage | No messages sent | Circuit breaker opens, 5xx tracking | Queue messages, retry when API recovers. Status page check |
| Webhook receiver overloaded | Webhooks queue at Meta's side | Webhook response time > 5s | Scale up webhook containers. Meta retries for up to 7 days |
| S3 unavailable | Media upload/download fails | S3 health check | Extremely rare. Queue media jobs for retry |
| Full disk (PostgreSQL) | DB crashes | Disk usage alert at 80% | Expand EBS volume online, archive old partitions |
| Memory leak in API | Gradual degradation | Memory usage trending up | Container killed at memory limit, ECS restarts fresh instance |
| DNS failure | Entire app unreachable | External uptime monitor | Cloudflare has 100% SLA on DNS. Failover: direct IP |
| Certificate expiry | SSL errors for all users | Certificate expiry alert (7-day) | Auto-renewal should handle. Manual renewal as backup |

### 15.5 Consistency & Transaction Boundaries

```
STRONG CONSISTENCY (ACID Transactions):
├── Appointment booking → Slot must not be double-booked
│   Solution: BEGIN → SELECT FOR UPDATE → INSERT → COMMIT
│
├── Contact opt-out → Must immediately stop all messages
│   Solution: Synchronous update → all queues check opt_out before send
│
├── Billing/plan change → Must immediately reflect on features
│   Solution: Update plan → invalidate cache → next request sees new plan
│
└── Campaign cancellation → Must stop sending remaining messages
    Solution: Update campaign status → workers check status before each send

EVENTUAL CONSISTENCY (Acceptable delay):
├── Message delivery status → Dashboard shows "sent" for a few seconds before "delivered"
│   Delay: 1-5 seconds (webhook processing time)
│
├── Analytics counters → Dashboard shows slightly stale numbers
│   Delay: 5-30 seconds (aggregation window)
│
├── Read replica lag → Some reads show slightly old data
│   Delay: <1 second (RDS async replication)
│
├── Campaign progress → "50% sent" might be "52% sent" in reality
│   Delay: up to 30 seconds (batch counter updates)
│
└── Contact engagement score → Recalculated periodically
    Delay: Hourly batch job
```

---

## 16. Feature Detail by Level (What to Build When)

### 16.1 Level 0 — Foundation (Week 1-2)

**Goal:** Basic infrastructure that everything else builds on.

| # | Feature | Acceptance Criteria | Tech Detail |
|---|---------|-------------------|-------------|
| F0.1 | Project scaffolding | Turborepo with all packages compiling | `pnpm create turbo`, shared tsconfig |
| F0.2 | Database setup | Prisma schema, migrations run, seed data | PostgreSQL + TimescaleDB extension |
| F0.3 | Docker Compose | One command starts all services locally | PG, Redis, Kafka, MinIO, MailHog |
| F0.4 | Auth: OTP send | Send 6-digit OTP to any Indian mobile | SMS gateway (MSG91) or WhatsApp OTP |
| F0.5 | Auth: OTP verify | Verify OTP, issue JWT (access + refresh) | 5-min expiry, max 5 attempts, rate limit |
| F0.6 | Auth: Middleware | Extract tenant_id + user_id from JWT | Fastify decorateRequest plugin |
| F0.7 | Tenant creation | New tenant created on first signup | Auto-create tenant + owner user |
| F0.8 | API error handling | Consistent error response format | `{error: {code, message, details}}` |
| F0.9 | Request logging | Every request logged with trace_id | Pino logger, request-id header |
| F0.10 | Health endpoints | /health, /health/ready, /health/deep | Fastify healthcheck plugin |

### 16.2 Level 1 — WhatsApp Integration (Week 2-3)

**Goal:** Can send and receive WhatsApp messages.

| # | Feature | Acceptance Criteria | Tech Detail |
|---|---------|-------------------|-------------|
| F1.1 | WhatsApp Business registration | Guide tenant through WA Business API setup | Store wa_phone_id, wa_business_id, access_token (encrypted) |
| F1.2 | Webhook endpoint | Receive messages from Meta, verify signature | Separate Fastify app (apps/webhook/) |
| F1.3 | Webhook verification | Meta verification challenge (GET with token) | Return hub.challenge when hub.verify_token matches |
| F1.4 | Receive text message | Store inbound text message in DB | Normalize phone, upsert contact, create conversation |
| F1.5 | Receive media | Download media from Meta → S3 → store URL | Use media_id → GET media URL → download → S3 upload |
| F1.6 | Send text message (session) | Reply within 24h window (free) | POST to Messages API with type: "text" |
| F1.7 | Send template message | Send pre-approved template with variables | POST with type: "template", template object |
| F1.8 | Template management CRUD | Create, list, delete templates in our DB | Sync status from Meta via webhook |
| F1.9 | Template submission to Meta | Submit template for Meta approval | POST to WhatsApp Business Management API |
| F1.10 | Message status tracking | Track sent → delivered → read → failed | Process status webhooks, update messages table |
| F1.11 | Phone number normalization | Handle all Indian formats (91, +91, 0, spaces) | Utility function: `normalizeToE164(phone): string` |
| F1.12 | 24h session window tracking | Know if we can send free-form or need template | Redis key: `wa_session:{tenant}:{phone}` TTL=24h |

### 16.3 Level 2 — CRM Core (Week 3-4)

**Goal:** Full contact management with conversation inbox.

| # | Feature | Acceptance Criteria | Tech Detail |
|---|---------|-------------------|-------------|
| F2.1 | Contact CRUD | Create, read, update, delete contacts | Prisma CRUD with tenant isolation |
| F2.2 | Contact list with pagination | Sorted, filtered, paginated contact list | Cursor-based pagination (better than offset for large sets) |
| F2.3 | Contact search | Search by name, phone, tag | PostgreSQL ILIKE + trigram index for fuzzy |
| F2.4 | Tags management | Add/remove tags, create new tags | Array column with GIN index |
| F2.5 | CSV import | Upload CSV → map columns → import contacts | Multer upload → BullMQ job → batch INSERT with ON CONFLICT |
| F2.6 | Duplicate detection | Flag duplicates on import, merge UI | Match on phone_e164 within tenant |
| F2.7 | Contact timeline | All messages per contact in chronological order | Query messages WHERE contact_id = ? ORDER BY created_at |
| F2.8 | Conversation inbox (list) | All conversations sorted by last message | Index on (tenant_id, status, last_message_at DESC) |
| F2.9 | Conversation detail (chat view) | Message bubbles, status indicators, real-time | WebSocket room per conversation, lazy load older messages |
| F2.10 | Reply from inbox | Staff types reply → sent via WhatsApp | Session message if <24h, else prompt template selection |
| F2.11 | Conversation assignment | Assign conversation to team member | UPDATE assigned_to, notify assignee via Socket.io |
| F2.12 | Conversation status | Open → Pending → Resolved flow | Simple state machine with audit |
| F2.13 | Opt-out handling | Detect STOP keyword → flag contact | Regex check on inbound, auto-response confirming opt-out |
| F2.14 | Real-time updates | New messages appear instantly | Socket.io with Redis adapter for multi-instance |
| F2.15 | Unread count badge | Show unread per conversation + total | Increment on receive, reset on conversation open |

### 16.4 Level 3 — Appointments (Week 4-5)

**Goal:** Automated appointment booking with reminders.

| # | Feature | Acceptance Criteria | Tech Detail |
|---|---------|-------------------|-------------|
| F3.1 | Provider management | Add doctors/staff with schedules | CRUD with working_hours JSONB per day |
| F3.2 | Slot configuration | Define slot duration, breaks, holidays | Configurable per provider, support exceptions |
| F3.3 | Available slots calculation | Generate free slots for a date range | Algorithm: expand working_hours → subtract booked + breaks |
| F3.4 | Manual booking (dashboard) | Staff books appointment from UI | Form → POST → atomic insert with lock |
| F3.5 | WhatsApp booking flow | Patient says "book" → guided booking | Multi-step interactive message flow (state machine) |
| F3.6 | Booking state machine | Track conversation state during booking | Redis hash: `booking_state:{tenant}:{contact}` TTL=10min |
| F3.7 | Atomic slot reservation | No double booking guaranteed | PostgreSQL EXCLUSION constraint + Redis distributed lock |
| F3.8 | Appointment confirmation | Send confirmation via WhatsApp | Template message with appointment details |
| F3.9 | Auto-reminder (24h before) | Automated reminder with confirm/cancel | BullMQ delayed job, scheduled at booking time |
| F3.10 | Auto-reminder (2h before) | Final reminder with location info | Same as above, different template |
| F3.11 | Cancellation flow | Patient replies "CANCEL" → cancel + free slot | Update status, release slot, invalidate cache |
| F3.12 | Reschedule flow | Patient replies "RESCHEDULE" → pick new slot | Cancel old → create new (atomic) |
| F3.13 | No-show marking | Auto-mark no-show if not completed | Cron job: appointments past end time + 30min → mark no_show |
| F3.14 | No-show follow-up | Auto-message after no-show | "We missed you today. Want to rebook?" — next day |
| F3.15 | Appointment dashboard | Today's appointments, upcoming, past | Calendar view + list view, filter by provider |
| F3.16 | Appointment analytics | No-show rate, busiest days, avg per day | Aggregate query on appointments table |

### 16.5 Level 4 — Campaigns & Broadcast (Week 5-6)

**Goal:** Send targeted messages to groups of contacts.

| # | Feature | Acceptance Criteria | Tech Detail |
|---|---------|-------------------|-------------|
| F4.1 | Campaign create wizard | Multi-step: name → template → segment → schedule | React multi-step form with state preservation |
| F4.2 | Segment builder | Select contacts by tags, custom filters | Query builder UI → generates Prisma WHERE clause |
| F4.3 | Audience preview | Show count + sample contacts before sending | SELECT COUNT(*) + LIMIT 5 with same filters |
| F4.4 | Variable personalization | Auto-fill ${name}, ${appointment_date} etc. | Map template variables to contact fields |
| F4.5 | Schedule for later | Pick date/time for future send | BullMQ delayed job at scheduled_at time |
| F4.6 | Campaign execution engine | Process all contacts reliably | Saga: segment → batch → queue → send → track |
| F4.7 | Rate-limited sending | Don't exceed Meta API limits | Token bucket: 80/sec limit in worker |
| F4.8 | Campaign progress (live) | Real-time progress bar (sent/total) | WebSocket updates every 5 seconds |
| F4.9 | Campaign analytics | Delivered %, Read %, Reply %, Failed % | Aggregate campaign_logs, update campaign counters |
| F4.10 | Pause/Resume campaign | Admin can pause sending mid-campaign | Set status='paused', workers check status before each send |
| F4.11 | Failed message handling | Separate failed contacts, option to retry | Filter campaign_logs where status='failed', re-queue button |
| F4.12 | Campaign history | Past campaigns with results | List with sorting, filtering by status/date |

### 16.6 Level 5 — Dashboard & Analytics (Week 6-7)

**Goal:** Actionable insights for business owners.

| # | Feature | Acceptance Criteria | Tech Detail |
|---|---------|-------------------|-------------|
| F5.1 | Overview dashboard | Key stats at a glance | Cards: messages today, appointments today, active conversations |
| F5.2 | Messages chart | Messages sent/received over time (7d/30d) | TimescaleDB time_bucket query → Recharts line chart |
| F5.3 | Delivery rate metric | % delivered out of sent | Aggregate messages by status |
| F5.4 | Response time metric | Average time to first reply | Calculate diff between inbound timestamp and first outbound |
| F5.5 | Appointment stats | Booked vs No-show vs Cancelled | Pie chart + trend line |
| F5.6 | Contact growth | New contacts per day/week | COUNT by created_at bucket |
| F5.7 | Top contacts | Most active contacts by message count | Ranked list with engagement score |
| F5.8 | Campaign performance | Compare campaigns side by side | Table with key metrics per campaign |
| F5.9 | Export reports | Download CSV/PDF of any report | Server-side generation → S3 → presigned URL |
| F5.10 | Widget KPIs | "Saved ₹X this month" from avoided no-shows | Calculate: no-show reduction × avg appointment value |

### 16.7 Level 6 — Billing & Settings (Week 7-8)

**Goal:** Self-service billing, team management, customization.

| # | Feature | Acceptance Criteria | Tech Detail |
|---|---------|-------------------|-------------|
| F6.1 | Plan selection | Choose Starter/Pro/Business plan | Display plans with feature comparison |
| F6.2 | Razorpay subscription | Auto-charge monthly via UPI/Card | Razorpay Subscriptions API, store subscription_id |
| F6.3 | Invoice generation | GST-compliant invoice per payment | Auto-generate on payment success, store in S3 |
| F6.4 | Usage tracking | Track messages/contacts against plan limit | Redis counters, daily reset for messages |
| F6.5 | Overage handling | Charge for excess usage | Calculate at month-end, one-time Razorpay charge |
| F6.6 | Plan upgrade/downgrade | Self-service plan change | Pro-rate current period, immediate feature change |
| F6.7 | Trial expiry handling | Restrict features after 14 days | Cron: check expiry, update status, show upgrade prompt |
| F6.8 | Team members CRUD | Add/remove staff, assign roles | Invite via WhatsApp (send OTP link) |
| F6.9 | Role permissions | Owner can do all, Staff limited | RBAC middleware: check user.role against endpoint permission |
| F6.10 | Business hours config | Set working hours per day | UI → JSONB field in tenants.settings |
| F6.11 | Auto-reply config | Custom away message, welcome message | Template selection + on/off toggle |
| F6.12 | Notification preferences | Choose: in-app, WhatsApp, email alerts | User-level preferences JSONB |

### 16.8 Level 7 — Automation & AI (Month 3-6)

| # | Feature | Tech Detail |
|---|---------|-------------|
| F7.1 | Keyword-trigger automation | Pattern matching on inbound → trigger action |
| F7.2 | New contact automation | Auto-tag, auto-assign, welcome sequence |
| F7.3 | Follow-up sequences | Multi-day drip: Day 1, Day 3, Day 7 messages |
| F7.4 | Visual chatbot builder | React Flow-based canvas → JSON flow definition |
| F7.5 | AI intent classification | OpenAI/local model: classify message intent |
| F7.6 | AI smart reply suggestions | Given conversation context → suggest 3 replies |
| F7.7 | AI message summary | Summarize long conversation for quick review |
| F7.8 | Sentiment detection | Flag negative sentiment → auto-assign to manager |
| F7.9 | Language detection | Detect Hindi/English → route to correct template |
| F7.10 | Predictive no-show | ML model: predict no-show probability → extra reminder |

### 16.9 Level 8 — Platform & Integrations (Month 6-12)

| # | Feature | Tech Detail |
|---|---------|-------------|
| F8.1 | REST API for developers | Public API with API key auth, rate limits, docs (OpenAPI) |
| F8.2 | Webhook outgoing | Notify external systems on events (message received, appointment booked) |
| F8.3 | Google Calendar sync | OAuth2 → bi-directional sync with Calendar API |
| F8.4 | Payment links | Razorpay payment link in WhatsApp message → track payment |
| F8.5 | Google Sheets export | Auto-push new contacts/appointments to Sheet |
| F8.6 | Zapier integration | Triggers + Actions on Zapier marketplace |
| F8.7 | Multi-branch | One tenant, multiple locations with separate providers |
| F8.8 | White-label | Custom domain, logo, colors for enterprise |
| F8.9 | SMS fallback | If WhatsApp fails → auto-send SMS |
| F8.10 | Email channel | Add email as secondary communication channel |
| F8.11 | Instagram DM | Meta's Instagram Messaging API (similar to WhatsApp) |
| F8.12 | Marketplace | Third-party app/plugin ecosystem |

---

## 17. Architecture Diagrams (Draw.io XML)

### 17.1 Main Architecture Diagram

Save the following XML as `architecture.drawio` and open in draw.io or VS Code Draw.io extension:

```xml
<mxfile host="app.diagrams.net" modified="2026-04-20T00:00:00.000Z" agent="WhatsApp CRM" version="21.0.0" type="device">
  <diagram id="system-architecture" name="System Architecture">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        
        <!-- Title -->
        <mxCell id="title" value="WhatsApp CRM - System Architecture" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontSize=24;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="500" y="20" width="600" height="40" as="geometry" />
        </mxCell>

        <!-- Client Layer -->
        <mxCell id="client-group" value="CLIENT LAYER" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;fontStyle=1;verticalAlign=top;" vertex="1" parent="1">
          <mxGeometry x="200" y="80" width="1200" height="120" as="geometry" />
        </mxCell>
        <mxCell id="web-app" value="Web Dashboard&#xa;(Next.js 14)&#xa;&#xa;• Inbox&#xa;• Contacts&#xa;• Campaigns&#xa;• Analytics" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="250" y="100" width="160" height="80" as="geometry" />
        </mxCell>
        <mxCell id="mobile-app" value="Mobile App&#xa;(React Native)&#xa;&#xa;Phase 2" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;strokeDasharray=3 3;" vertex="1" parent="1">
          <mxGeometry x="450" y="100" width="160" height="80" as="geometry" />
        </mxCell>
        <mxCell id="whatsapp-users" value="WhatsApp Users&#xa;(End Customers)&#xa;&#xa;Patients/Clients" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="650" y="100" width="160" height="80" as="geometry" />
        </mxCell>
        <mxCell id="external-api" value="External API&#xa;Consumers&#xa;&#xa;Zapier/Make" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;strokeDasharray=3 3;" vertex="1" parent="1">
          <mxGeometry x="850" y="100" width="160" height="80" as="geometry" />
        </mxCell>

        <!-- CDN/WAF Layer -->
        <mxCell id="cdn-layer" value="Cloudflare (CDN + WAF + DDoS Protection)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="200" y="230" width="1200" height="40" as="geometry" />
        </mxCell>

        <!-- API Layer -->
        <mxCell id="api-layer" value="API LAYER" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=12;fontStyle=1;verticalAlign=top;" vertex="1" parent="1">
          <mxGeometry x="200" y="300" width="1200" height="130" as="geometry" />
        </mxCell>
        <mxCell id="api-gw" value="API Server&#xa;(Fastify)&#xa;&#xa;• Auth Middleware&#xa;• Rate Limiting&#xa;• Validation (Zod)&#xa;• REST Endpoints" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;" vertex="1" parent="1">
          <mxGeometry x="250" y="320" width="200" height="100" as="geometry" />
        </mxCell>
        <mxCell id="webhook-server" value="Webhook Receiver&#xa;(Fastify - Separate)&#xa;&#xa;• Signature Verify&#xa;• Deduplication&#xa;• Quick 200 Response&#xa;• Queue to Workers" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;" vertex="1" parent="1">
          <mxGeometry x="500" y="320" width="200" height="100" as="geometry" />
        </mxCell>
        <mxCell id="ws-server" value="WebSocket Server&#xa;(Socket.io)&#xa;&#xa;• Real-time inbox&#xa;• Status updates&#xa;• Notifications&#xa;• Redis Adapter" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;" vertex="1" parent="1">
          <mxGeometry x="750" y="320" width="200" height="100" as="geometry" />
        </mxCell>
        <mxCell id="scheduler" value="Cron Scheduler&#xa;&#xa;• Reminder check (1min)&#xa;• Partition creation&#xa;• Analytics rollup&#xa;• Trial expiry check" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;" vertex="1" parent="1">
          <mxGeometry x="1000" y="320" width="200" height="100" as="geometry" />
        </mxCell>

        <!-- Service Layer -->
        <mxCell id="service-layer" value="SERVICE / BUSINESS LOGIC LAYER" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=12;fontStyle=1;verticalAlign=top;" vertex="1" parent="1">
          <mxGeometry x="200" y="460" width="1200" height="180" as="geometry" />
        </mxCell>
        <mxCell id="auth-svc" value="Auth&#xa;Service&#xa;&#xa;OTP, JWT&#xa;RBAC" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="230" y="490" width="100" height="80" as="geometry" />
        </mxCell>
        <mxCell id="crm-svc" value="CRM&#xa;Service&#xa;&#xa;Contacts&#xa;Tags, Fields" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="350" y="490" width="100" height="80" as="geometry" />
        </mxCell>
        <mxCell id="msg-svc" value="Messaging&#xa;Service&#xa;&#xa;Send/Receive&#xa;Templates" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="470" y="490" width="100" height="80" as="geometry" />
        </mxCell>
        <mxCell id="appt-svc" value="Appointment&#xa;Service&#xa;&#xa;Booking&#xa;Reminders" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="590" y="490" width="100" height="80" as="geometry" />
        </mxCell>
        <mxCell id="campaign-svc" value="Campaign&#xa;Service&#xa;&#xa;Broadcast&#xa;Segments" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="710" y="490" width="100" height="80" as="geometry" />
        </mxCell>
        <mxCell id="analytics-svc" value="Analytics&#xa;Service&#xa;&#xa;Dashboards&#xa;Reports" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="830" y="490" width="100" height="80" as="geometry" />
        </mxCell>
        <mxCell id="automation-svc" value="Automation&#xa;Service&#xa;&#xa;Rules&#xa;Triggers" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="950" y="490" width="100" height="80" as="geometry" />
        </mxCell>
        <mxCell id="billing-svc" value="Billing&#xa;Service&#xa;&#xa;Razorpay&#xa;Plans" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="1070" y="490" width="100" height="80" as="geometry" />
        </mxCell>
        <mxCell id="notification-svc" value="Notification&#xa;Service&#xa;&#xa;Push, In-App&#xa;Alerts" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="1190" y="490" width="100" height="80" as="geometry" />
        </mxCell>

        <!-- Queue Layer -->
        <mxCell id="queue-layer" value="MESSAGE QUEUE / EVENT STREAMING" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=12;fontStyle=1;verticalAlign=top;" vertex="1" parent="1">
          <mxGeometry x="200" y="670" width="1200" height="100" as="geometry" />
        </mxCell>
        <mxCell id="bullmq" value="BullMQ Queues (Redis)&#xa;&#xa;• message_send (priority)&#xa;• webhook_process&#xa;• campaign_execute&#xa;• reminder_check&#xa;• dead_letter" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
          <mxGeometry x="250" y="690" width="350" height="70" as="geometry" />
        </mxCell>
        <mxCell id="kafka" value="Apache Kafka (Phase 2+)&#xa;&#xa;• whatsapp.webhook.raw&#xa;• whatsapp.message.outbound&#xa;• analytics.events&#xa;• crm.contact.events" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;strokeDasharray=3 3;" vertex="1" parent="1">
          <mxGeometry x="650" y="690" width="350" height="70" as="geometry" />
        </mxCell>

        <!-- Worker Layer -->
        <mxCell id="worker-layer" value="BACKGROUND WORKERS" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=12;fontStyle=1;verticalAlign=top;" vertex="1" parent="1">
          <mxGeometry x="200" y="800" width="1200" height="100" as="geometry" />
        </mxCell>
        <mxCell id="msg-worker" value="Message&#xa;Sender" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="230" y="830" width="90" height="50" as="geometry" />
        </mxCell>
        <mxCell id="webhook-worker" value="Webhook&#xa;Processor" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="340" y="830" width="90" height="50" as="geometry" />
        </mxCell>
        <mxCell id="campaign-worker" value="Campaign&#xa;Executor" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="450" y="830" width="90" height="50" as="geometry" />
        </mxCell>
        <mxCell id="reminder-worker" value="Reminder&#xa;Scheduler" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="560" y="830" width="90" height="50" as="geometry" />
        </mxCell>
        <mxCell id="analytics-worker" value="Analytics&#xa;Aggregator" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="670" y="830" width="90" height="50" as="geometry" />
        </mxCell>
        <mxCell id="dlq-worker" value="DLQ&#xa;Monitor" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="780" y="830" width="90" height="50" as="geometry" />
        </mxCell>
        <mxCell id="automation-worker" value="Automation&#xa;Engine" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="890" y="830" width="90" height="50" as="geometry" />
        </mxCell>
        <mxCell id="import-worker" value="CSV Import&#xa;Processor" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="1000" y="830" width="90" height="50" as="geometry" />
        </mxCell>

        <!-- Data Layer -->
        <mxCell id="data-layer" value="DATA LAYER" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;fontStyle=1;verticalAlign=top;" vertex="1" parent="1">
          <mxGeometry x="200" y="930" width="1200" height="130" as="geometry" />
        </mxCell>
        <mxCell id="postgresql" value="PostgreSQL 16&#xa;(RDS Multi-AZ)&#xa;&#xa;• Tenants, Users&#xa;• Contacts, Messages&#xa;• Appointments&#xa;• Campaigns" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="230" y="950" width="180" height="100" as="geometry" />
        </mxCell>
        <mxCell id="redis" value="Redis 7 Cluster&#xa;(ElastiCache)&#xa;&#xa;• Cache&#xa;• BullMQ Queues&#xa;• Rate Limiting&#xa;• Pub/Sub&#xa;• Distributed Locks" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="440" y="950" width="180" height="100" as="geometry" />
        </mxCell>
        <mxCell id="timescale" value="TimescaleDB&#xa;(Analytics)&#xa;&#xa;• message_events&#xa;• Time-series data&#xa;• Continuous aggs" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="650" y="950" width="180" height="100" as="geometry" />
        </mxCell>
        <mxCell id="s3" value="AWS S3 / R2&#xa;(Object Storage)&#xa;&#xa;• Media files&#xa;• CSV imports&#xa;• Invoices&#xa;• Backups" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="860" y="950" width="180" height="100" as="geometry" />
        </mxCell>
        <mxCell id="elasticsearch" value="Elasticsearch&#xa;(Phase 3)&#xa;&#xa;• Message search&#xa;• Contact search&#xa;• Full-text" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;strokeDasharray=3 3;" vertex="1" parent="1">
          <mxGeometry x="1070" y="950" width="180" height="100" as="geometry" />
        </mxCell>

        <!-- External Services -->
        <mxCell id="external-layer" value="EXTERNAL SERVICES" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=12;fontStyle=1;verticalAlign=top;" vertex="1" parent="1">
          <mxGeometry x="200" y="1090" width="1200" height="80" as="geometry" />
        </mxCell>
        <mxCell id="meta-api" value="Meta Cloud API&#xa;(WhatsApp)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="230" y="1110" width="130" height="50" as="geometry" />
        </mxCell>
        <mxCell id="razorpay" value="Razorpay&#xa;(Payments)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="390" y="1110" width="130" height="50" as="geometry" />
        </mxCell>
        <mxCell id="msg91" value="MSG91&#xa;(SMS/OTP)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="550" y="1110" width="130" height="50" as="geometry" />
        </mxCell>
        <mxCell id="google-cal" value="Google Calendar&#xa;(Sync)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;strokeDasharray=3 3;" vertex="1" parent="1">
          <mxGeometry x="710" y="1110" width="130" height="50" as="geometry" />
        </mxCell>
        <mxCell id="openai" value="OpenAI / LLM&#xa;(AI Features)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;strokeDasharray=3 3;" vertex="1" parent="1">
          <mxGeometry x="870" y="1110" width="130" height="50" as="geometry" />
        </mxCell>
        <mxCell id="sentry" value="Sentry&#xa;(Error Tracking)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="1030" y="1110" width="130" height="50" as="geometry" />
        </mxCell>

        <!-- Monitoring Sidebar -->
        <mxCell id="monitoring" value="MONITORING&#xa;&#xa;Prometheus&#xa;Grafana&#xa;Loki (Logs)&#xa;Jaeger (Traces)&#xa;Alertmanager&#xa;Better Uptime" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontSize=10;fontStyle=1;verticalAlign=top;" vertex="1" parent="1">
          <mxGeometry x="1430" y="300" width="120" height="160" as="geometry" />
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 17.2 Data Flow Diagram (Draw.io XML)

Save as `data-flow.drawio`:

```xml
<mxfile host="app.diagrams.net" modified="2026-04-20T00:00:00.000Z" agent="WhatsApp CRM" version="21.0.0" type="device">
  <diagram id="data-flow" name="Data Flow">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1400" pageHeight="900" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        
        <!-- Title -->
        <mxCell id="title" value="WhatsApp CRM - Data Flow Diagram" style="text;html=1;fontSize=20;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="400" y="10" width="400" height="30" as="geometry" />
        </mxCell>

        <!-- Actors -->
        <mxCell id="patient" value="Patient&#xa;(WhatsApp)" style="shape=actor;whiteSpace=wrap;html=1;" vertex="1" parent="1">
          <mxGeometry x="50" y="200" width="60" height="80" as="geometry" />
        </mxCell>
        <mxCell id="staff" value="Business&#xa;Staff" style="shape=actor;whiteSpace=wrap;html=1;" vertex="1" parent="1">
          <mxGeometry x="50" y="500" width="60" height="80" as="geometry" />
        </mxCell>

        <!-- Processes -->
        <mxCell id="p1" value="1.0&#xa;Receive &amp;&#xa;Route&#xa;Message" style="ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="250" y="180" width="120" height="80" as="geometry" />
        </mxCell>
        <mxCell id="p2" value="2.0&#xa;Automation&#xa;Engine" style="ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="450" y="100" width="120" height="80" as="geometry" />
        </mxCell>
        <mxCell id="p3" value="3.0&#xa;Appointment&#xa;Management" style="ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="650" y="100" width="120" height="80" as="geometry" />
        </mxCell>
        <mxCell id="p4" value="4.0&#xa;Send&#xa;Message" style="ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="450" y="300" width="120" height="80" as="geometry" />
        </mxCell>
        <mxCell id="p5" value="5.0&#xa;Campaign&#xa;Manager" style="ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="650" y="300" width="120" height="80" as="geometry" />
        </mxCell>
        <mxCell id="p6" value="6.0&#xa;CRM / Contact&#xa;Management" style="ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="250" y="450" width="120" height="80" as="geometry" />
        </mxCell>
        <mxCell id="p7" value="7.0&#xa;Analytics &amp;&#xa;Reporting" style="ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="450" y="500" width="120" height="80" as="geometry" />
        </mxCell>
        <mxCell id="p8" value="8.0&#xa;Billing &amp;&#xa;Subscription" style="ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="650" y="500" width="120" height="80" as="geometry" />
        </mxCell>

        <!-- Data Stores -->
        <mxCell id="d1" value="D1: Messages DB" style="shape=cylinder3;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;size=10;" vertex="1" parent="1">
          <mxGeometry x="900" y="150" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="d2" value="D2: Contacts DB" style="shape=cylinder3;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;size=10;" vertex="1" parent="1">
          <mxGeometry x="900" y="250" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="d3" value="D3: Appointments DB" style="shape=cylinder3;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;size=10;" vertex="1" parent="1">
          <mxGeometry x="900" y="350" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="d4" value="D4: Analytics Store" style="shape=cylinder3;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;size=10;" vertex="1" parent="1">
          <mxGeometry x="900" y="450" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="d5" value="D5: Media Store (S3)" style="shape=cylinder3;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;size=10;" vertex="1" parent="1">
          <mxGeometry x="900" y="550" width="120" height="60" as="geometry" />
        </mxCell>

        <!-- External Entity -->
        <mxCell id="meta" value="Meta&#xa;WhatsApp&#xa;Cloud API" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
          <mxGeometry x="1100" y="200" width="100" height="60" as="geometry" />
        </mxCell>
        <mxCell id="razorpay-ext" value="Razorpay&#xa;Payments" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
          <mxGeometry x="1100" y="500" width="100" height="60" as="geometry" />
        </mxCell>

        <!-- Flows (arrows) -->
        <mxCell id="f1" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="patient" target="p1" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="f2" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="p1" target="p2" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="f3" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="p2" target="p3" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="f4" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="p2" target="p4" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="f5" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="staff" target="p6" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="f6" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="staff" target="p5" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="f7" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="p4" target="meta" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="f8" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="meta" target="p1" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="f9" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="p8" target="razorpay-ext" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

---

## 18. Context Guide for Future Chat Sessions

> **IMPORTANT:** If you're starting a new chat session with an AI assistant, paste this entire document or the relevant sections. The sections below summarize key context an AI needs to help you effectively.

### 18.1 Project Summary (Copy This First)

```
PROJECT: WhatsApp CRM SaaS for Indian SMBs
TARGET: Healthcare clinics (dental, eye care) initially
TECH: Next.js 14 + Fastify + PostgreSQL + Redis + BullMQ + WhatsApp Cloud API
INFRA: AWS (Mumbai), Docker, ECS Fargate, Terraform
STAGE: [UPDATE THIS: Planning / MVP Building / Phase 2 / etc.]
REPO: [UPDATE: GitHub repo URL when created]
CURRENT FOCUS: [UPDATE: What you're working on right now]
BLOCKERS: [UPDATE: Any current issues]
```

### 18.2 Key Architecture Decisions (Non-Negotiable)

These decisions are FINAL. Do not re-evaluate or suggest alternatives in future sessions:

1. **Multi-tenant, shared DB** — Single PostgreSQL with tenant_id isolation (not DB-per-tenant until enterprise)
2. **WhatsApp Cloud API** — Not on-premise API or third-party wrappers
3. **BullMQ for MVP queues** — Kafka only at 500+ tenants
4. **OTP-only auth** — No passwords, no email login
5. **Monorepo with Turborepo** — Not separate repositories
6. **Prisma ORM** — Not Drizzle, not raw SQL
7. **India-only hosting** — AWS ap-south-1 Mumbai
8. **Fastify over Express** — Performance + schema validation
9. **Monthly partitioning** for messages table
10. **Redis for everything** (cache + queue + pubsub + locks) in MVP

### 18.3 File/Folder Reference (After Setup)

```
When the codebase is created, update this with key file paths:

apps/api/src/server.ts              → API entry point
apps/api/src/routes/                → All API routes
apps/api/src/services/              → Business logic
apps/api/src/middleware/            → Auth, rate-limit, tenant
apps/webhook/src/server.ts          → Webhook receiver entry
apps/web/src/app/                   → Next.js pages
apps/worker/src/workers/            → BullMQ worker definitions
packages/database/prisma/schema.prisma → DB schema
packages/shared/src/types/          → Shared TypeScript types
packages/whatsapp-sdk/src/          → Meta API wrapper
infrastructure/terraform/           → AWS infrastructure
infrastructure/docker/              → Docker configs
```

### 18.4 How to Ask for Help in Future Sessions

Depending on what you need, frame your request like this:

```
For building a feature:
"I'm building [Feature F2.3 from the PRD]. Here's my current code: [paste].
The feature should: [acceptance criteria from section 16].
Tech constraints: [from section 4 / 15]."

For debugging:
"I'm getting [error]. Here's my code: [paste relevant files].
Architecture context: [paste relevant flow from section 15.2].
Expected behavior: [from acceptance criteria]."

For scaling:
"We've hit [X tenants / Y messages/day]. Current setup: [describe].
According to the PRD scaling strategy (section 9), we should now [action].
Help me implement [specific scaling step]."

For DevOps:
"I need to set up [component from section 10].
Current infra: [describe what exists].
Target: [what's needed per the PRD]."
```

### 18.5 Progress Tracker (Update as You Build)

```markdown
## Progress Status

### Level 0 — Foundation
- [ ] F0.1 Project scaffolding
- [ ] F0.2 Database setup
- [ ] F0.3 Docker Compose
- [ ] F0.4 Auth: OTP send
- [ ] F0.5 Auth: OTP verify
- [ ] F0.6 Auth: Middleware
- [ ] F0.7 Tenant creation
- [ ] F0.8 API error handling
- [ ] F0.9 Request logging
- [ ] F0.10 Health endpoints

### Level 1 — WhatsApp Integration
- [ ] F1.1 WA Business registration flow
- [ ] F1.2 Webhook endpoint
- [ ] F1.3 Webhook verification
- [ ] F1.4 Receive text message
- [ ] F1.5 Receive media
- [ ] F1.6 Send text message (session)
- [ ] F1.7 Send template message
- [ ] F1.8 Template CRUD
- [ ] F1.9 Template submission to Meta
- [ ] F1.10 Message status tracking
- [ ] F1.11 Phone normalization
- [ ] F1.12 24h session window

### Level 2 — CRM Core
- [ ] F2.1 through F2.15 (see section 16.3)

### Level 3 — Appointments
- [ ] F3.1 through F3.16 (see section 16.4)

### Level 4 — Campaigns
- [ ] F4.1 through F4.12 (see section 16.5)

### Level 5 — Dashboard & Analytics
- [ ] F5.1 through F5.10 (see section 16.6)

### Level 6 — Billing & Settings
- [ ] F6.1 through F6.12 (see section 16.7)
```

### 18.6 Glossary of Terms

| Term | Meaning in This Project |
|------|------------------------|
| Tenant | A business (clinic/gym/salon) using our platform |
| Contact | End customer of the tenant (patient/member/client) |
| Conversation | A chat thread between tenant and one contact |
| Provider | Service provider within a tenant (e.g., a specific doctor) |
| Template | Pre-approved WhatsApp message format (required for outbound after 24h) |
| Session window | 24-hour period after last inbound message where free-form replies are free |
| Campaign | Bulk message sent to a segment of contacts |
| Segment | A filtered group of contacts (by tags, custom fields) |
| Automation rule | If-then trigger (e.g., if message contains "book" → start booking flow) |
| BullMQ Job | An async task queued for background processing |
| wa_message_id | Meta's unique identifier for a WhatsApp message |
| E.164 | International phone format: +[country code][number] e.g., +919876543210 |
| WABA | WhatsApp Business Account (created in Meta Business Suite) |
| Opt-out | Contact has requested to stop receiving messages |
| DLQ | Dead Letter Queue — where failed jobs go for manual inspection |
| Fan-out | One event creating many downstream tasks (e.g., campaign → 10K messages) |
| Circuit breaker | Pattern to stop calling a failing service temporarily |
| Saga | Multi-step distributed transaction with compensation logic |
| RLS | Row-Level Security — PostgreSQL feature for tenant isolation |
| HPA | Horizontal Pod Autoscaler (Kubernetes auto-scaling) |

---

## 19. Non-Functional Requirements (NFR)

| NFR | Target | Measurement |
|-----|--------|-------------|
| **Availability** | 99.9% uptime (8.7h downtime/year max) | Better Uptime monitoring |
| **Latency (API)** | P95 < 300ms, P99 < 500ms | Prometheus histograms |
| **Latency (Message delivery)** | < 5 seconds from send to delivered | Custom metric: send_time to webhook_delivered_time |
| **Throughput** | 1000 messages/second at Phase 3 | Load testing with k6 |
| **Data durability** | Zero message loss | WAL + replication + S3 backups |
| **Data retention** | Messages: 12 months hot, then archived | Partition dropping + S3 archive |
| **Recovery Time (RTO)** | < 5 minutes | Multi-AZ failover tested quarterly |
| **Recovery Point (RPO)** | < 1 minute of data loss | Synchronous replication within AZ |
| **Concurrent users** | 500 simultaneous dashboard users (Phase 2) | WebSocket connection limit + load test |
| **Max contacts per tenant** | 100K | Index performance tested |
| **Max messages per tenant/day** | 50K (Business plan) | Rate limiting enforced |
| **Page load time** | < 2 seconds (first load), < 500ms (subsequent) | Lighthouse CI |
| **Mobile responsiveness** | Full functionality on 360px+ screens | Tailwind breakpoints |
| **Accessibility** | WCAG 2.1 AA | axe-core in CI |
| **Localization** | English + Hindi (Phase 2) | next-intl framework |
| **Browser support** | Chrome 90+, Firefox 90+, Safari 14+, Edge 90+ | Browserslist + testing |

---

## 20. API Design (Key Endpoints)

### 20.1 API Conventions

```
Base URL: https://api.yourproduct.in/v1
Auth: Bearer token (JWT) in Authorization header
Content-Type: application/json
Rate Limit: 100 requests/minute per tenant (header: X-RateLimit-Remaining)
Pagination: Cursor-based (?cursor=xxx&limit=20)
Errors: { "error": { "code": "CONTACT_NOT_FOUND", "message": "...", "details": {} } }
Dates: ISO 8601 (UTC in API, converted to IST in UI)
IDs: UUID v4
```

### 20.2 Endpoint Map

```
AUTH
├── POST   /v1/auth/otp/send              → Send OTP to phone
├── POST   /v1/auth/otp/verify            → Verify OTP, get tokens
├── POST   /v1/auth/refresh               → Refresh access token
└── POST   /v1/auth/logout                → Invalidate refresh token

CONTACTS
├── GET    /v1/contacts                   → List (paginated, filtered)
├── POST   /v1/contacts                   → Create single contact
├── GET    /v1/contacts/:id               → Get contact details + timeline
├── PATCH  /v1/contacts/:id               → Update contact
├── DELETE /v1/contacts/:id               → Soft delete
├── POST   /v1/contacts/import            → Bulk CSV import (async job)
├── GET    /v1/contacts/import/:jobId     → Import job status
└── POST   /v1/contacts/:id/tags          → Add/remove tags

CONVERSATIONS
├── GET    /v1/conversations              → List (with last message preview)
├── GET    /v1/conversations/:id          → Get with messages (paginated)
├── PATCH  /v1/conversations/:id          → Update status/assignment
└── POST   /v1/conversations/:id/read     → Mark as read

MESSAGES
├── POST   /v1/messages/send              → Send message to contact
├── POST   /v1/messages/send-template     → Send template message
├── GET    /v1/messages/:id               → Get message details + status
└── POST   /v1/messages/:id/retry         → Retry failed message

TEMPLATES
├── GET    /v1/templates                  → List approved templates
├── POST   /v1/templates                  → Create + submit to Meta
├── GET    /v1/templates/:id              → Template details + approval status
├── DELETE /v1/templates/:id              → Delete template
└── POST   /v1/templates/:id/sync        → Re-sync status from Meta

APPOINTMENTS
├── GET    /v1/appointments               → List (date range, provider filter)
├── POST   /v1/appointments               → Book appointment
├── PATCH  /v1/appointments/:id           → Update status (confirm/cancel/no-show)
├── DELETE /v1/appointments/:id           → Cancel appointment
├── GET    /v1/appointments/slots         → Available slots (provider + date range)
└── GET    /v1/appointments/stats         → Booking analytics

PROVIDERS
├── GET    /v1/providers                  → List providers
├── POST   /v1/providers                  → Create provider
├── PATCH  /v1/providers/:id              → Update schedule
└── DELETE /v1/providers/:id              → Remove provider

CAMPAIGNS
├── GET    /v1/campaigns                  → List campaigns
├── POST   /v1/campaigns                  → Create campaign
├── GET    /v1/campaigns/:id              → Campaign details + stats
├── POST   /v1/campaigns/:id/send        → Start sending
├── POST   /v1/campaigns/:id/pause       → Pause campaign
├── POST   /v1/campaigns/:id/resume      → Resume campaign
└── GET    /v1/campaigns/:id/logs        → Per-contact delivery log

AUTOMATION
├── GET    /v1/automations                → List rules
├── POST   /v1/automations                → Create rule
├── PATCH  /v1/automations/:id            → Update rule
├── DELETE /v1/automations/:id            → Delete rule
└── PATCH  /v1/automations/:id/toggle    → Enable/disable

ANALYTICS
├── GET    /v1/analytics/overview         → Dashboard KPIs
├── GET    /v1/analytics/messages         → Message volume over time
├── GET    /v1/analytics/appointments     → Appointment stats
├── GET    /v1/analytics/campaigns        → Campaign comparison
└── GET    /v1/analytics/export           → Export report (async)

SETTINGS
├── GET    /v1/settings                   → Tenant settings
├── PATCH  /v1/settings                   → Update settings
├── GET    /v1/settings/team              → Team members
├── POST   /v1/settings/team              → Invite team member
├── DELETE /v1/settings/team/:id          → Remove team member
└── PATCH  /v1/settings/team/:id/role    → Change role

BILLING
├── GET    /v1/billing/plan               → Current plan + usage
├── POST   /v1/billing/subscribe          → Create subscription
├── POST   /v1/billing/upgrade            → Upgrade plan
├── GET    /v1/billing/invoices           → Invoice history
└── GET    /v1/billing/usage              → Current period usage

WEBHOOK (Internal - receives from Meta)
├── GET    /webhook/whatsapp              → Meta verification challenge
└── POST   /webhook/whatsapp              → Incoming events from Meta
```

### 20.3 Example Request/Response

```json
// POST /v1/messages/send-template
// Request:
{
  "contact_id": "550e8400-e29b-41d4-a716-446655440000",
  "template_name": "appointment_reminder",
  "language": "en",
  "variables": {
    "header": [],
    "body": ["Dr. Sharma", "April 21, 2026", "10:00 AM"],
    "buttons": []
  }
}

// Response (202 Accepted):
{
  "data": {
    "message_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "queued",
    "contact_id": "550e8400-e29b-41d4-a716-446655440000",
    "template": "appointment_reminder",
    "queued_at": "2026-04-20T10:30:00.000Z"
  }
}

// Later (via WebSocket or polling):
{
  "event": "message.status_update",
  "data": {
    "message_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "delivered",
    "timestamp": "2026-04-20T10:30:02.300Z"
  }
}
```

---

## 21. Error Handling Strategy

### 21.1 Error Codes

```typescript
// Application error codes (used in API responses)
enum ErrorCode {
  // Auth (1xxx)
  AUTH_OTP_EXPIRED = 'AUTH_OTP_EXPIRED',           // OTP older than 5 min
  AUTH_OTP_INVALID = 'AUTH_OTP_INVALID',           // Wrong code
  AUTH_OTP_MAX_ATTEMPTS = 'AUTH_OTP_MAX_ATTEMPTS', // 5 attempts exceeded
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',       // JWT expired
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',       // JWT malformed/tampered
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',               // Role doesn't have permission
  
  // Tenant (2xxx)
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
  TENANT_PLAN_EXPIRED = 'TENANT_PLAN_EXPIRED',
  TENANT_QUOTA_EXCEEDED = 'TENANT_QUOTA_EXCEEDED', // Messages/contacts limit
  
  // Contact (3xxx)
  CONTACT_NOT_FOUND = 'CONTACT_NOT_FOUND',
  CONTACT_DUPLICATE = 'CONTACT_DUPLICATE',         // Phone already exists
  CONTACT_OPTED_OUT = 'CONTACT_OPTED_OUT',         // Can't message
  CONTACT_INVALID_PHONE = 'CONTACT_INVALID_PHONE',
  
  // Message (4xxx)
  MESSAGE_TEMPLATE_NOT_APPROVED = 'MESSAGE_TEMPLATE_NOT_APPROVED',
  MESSAGE_SESSION_EXPIRED = 'MESSAGE_SESSION_EXPIRED', // 24h window closed
  MESSAGE_RATE_LIMITED = 'MESSAGE_RATE_LIMITED',
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  MESSAGE_INVALID_MEDIA = 'MESSAGE_INVALID_MEDIA',
  
  // Appointment (5xxx)
  APPOINTMENT_SLOT_UNAVAILABLE = 'APPOINTMENT_SLOT_UNAVAILABLE',
  APPOINTMENT_DOUBLE_BOOKING = 'APPOINTMENT_DOUBLE_BOOKING',
  APPOINTMENT_PAST_DATE = 'APPOINTMENT_PAST_DATE',
  APPOINTMENT_NOT_FOUND = 'APPOINTMENT_NOT_FOUND',
  
  // Campaign (6xxx)
  CAMPAIGN_NO_CONTACTS = 'CAMPAIGN_NO_CONTACTS',
  CAMPAIGN_TEMPLATE_REJECTED = 'CAMPAIGN_TEMPLATE_REJECTED',
  CAMPAIGN_ALREADY_SENT = 'CAMPAIGN_ALREADY_SENT',
  
  // Billing (7xxx)
  BILLING_PAYMENT_FAILED = 'BILLING_PAYMENT_FAILED',
  BILLING_PLAN_DOWNGRADE_BLOCKED = 'BILLING_PLAN_DOWNGRADE_BLOCKED',
  
  // System (9xxx)
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}
```

### 21.2 Retry Policies

| Operation | Max Retries | Backoff | Final Action |
|-----------|-------------|---------|--------------|
| Send WhatsApp message | 3 | Exponential (1s, 2s, 4s) | Mark failed, notify admin |
| Process webhook | 5 | Exponential (500ms, 1s, 2s, 4s, 8s) | Move to DLQ |
| Campaign batch send | 2 | Fixed (30s) | Skip batch, continue others |
| Payment charge | 3 | Fixed (1 day, 3 days, 7 days) | Suspend account |
| Media download from Meta | 3 | Exponential (2s, 4s, 8s) | Store without media, log error |
| Database connection | Infinite | Exponential (100ms, capped at 30s) | Process crashes, orchestrator restarts |
| Redis connection | 10 | Exponential (100ms, capped at 5s) | Fallback: direct DB query |

---

## 22. Testing Strategy

### 22.1 Test Pyramid

```
                    ┌─────────────┐
                    │   E2E Tests │ (10%)
                    │  Playwright  │
                    │  • Critical flows only:
                    │    - Signup → Send message
                    │    - Book appointment
                    │    - Create campaign
                    └──────┬──────┘
                           │
                ┌──────────┴──────────┐
                │  Integration Tests   │ (30%)
                │  Testcontainers      │
                │  • API route tests with real DB
                │  • Webhook processing pipeline
                │  • Queue job execution
                │  • WhatsApp API mock (MSW)
                └──────────┬──────────┘
                           │
          ┌────────────────┴────────────────┐
          │         Unit Tests               │ (60%)
          │         Vitest                   │
          │  • Service layer logic            │
          │  • Utility functions              │
          │  • Phone normalization            │
          │  • Template variable rendering    │
          │  • Slot availability calculation  │
          │  • Rate limiter logic             │
          │  • Permission checks              │
          └──────────────────────────────────┘
```

### 22.2 Key Test Scenarios

```
Must-test scenarios (never ship without):
├── Multi-tenant isolation: Tenant A cannot see Tenant B's data
├── Appointment double-booking prevention under concurrency
├── Opt-out respected: No messages sent to opted-out contacts
├── Rate limiting enforced: 429 returned when limit hit
├── Webhook signature verification: Rejects invalid signatures
├── 24h session window: Template required after window closes
├── Plan limits enforced: Can't exceed contact/message quota
├── Concurrent campaign sending: No duplicate messages
└── Auth: Expired tokens rejected, refresh works
```

---

## Appendix C: Competitor Analysis

| Feature | Our Product | Wati (₹15K/mo) | Interakt (₹10K/mo) | AiSensy (₹999/mo) |
|---------|-------------|-----------------|--------------------|--------------------|
| Price (starter) | ₹999/mo | ₹4,999/mo | ₹2,499/mo | ₹999/mo |
| Appointment booking | ✅ Built-in | ❌ | ❌ | ❌ |
| Clinic-specific features | ✅ | ❌ | ❌ | ❌ |
| No-show reduction | ✅ Automated | ❌ Manual only | ❌ | ❌ |
| WhatsApp chatbot | ✅ (Phase 2) | ✅ | ✅ | ✅ |
| Broadcast | ✅ | ✅ | ✅ | ✅ |
| CRM/Contacts | ✅ | Basic | ✅ | Basic |
| Analytics | ✅ | ✅ | Basic | Basic |
| Hindi support | ✅ (Phase 2) | ❌ | ❌ | ✅ |
| Target audience | SMBs (clinics) | Mid-size | E-commerce | Generic |
| **Unique advantage** | **Vertical-specific + affordable** | Generic + expensive | E-commerce focused | Cheapest but basic |

**Our moat:** We're not competing on WhatsApp messaging (commodity). We compete on **appointment management + no-show reduction** — a vertical solution that generic tools can't match.

---

## Appendix D: Launch Checklist

```
Before going live with first paying customer:

LEGAL
├── [ ] Company registered (LLP or Pvt Ltd)
├── [ ] Terms of Service drafted
├── [ ] Privacy Policy (DPDP Act compliant)
├── [ ] GST registration
├── [ ] Data Processing Agreement template

WHATSAPP
├── [ ] Meta Business verified
├── [ ] WhatsApp Business API approved
├── [ ] At least 5 templates approved
├── [ ] Webhook endpoint receiving correctly
├── [ ] Test: send + receive + status tracking working

INFRASTRUCTURE
├── [ ] Production environment deployed
├── [ ] SSL certificates active
├── [ ] Backups configured and tested (restore drill)
├── [ ] Monitoring alerts active
├── [ ] Error tracking (Sentry) connected
├── [ ] Status page live

PRODUCT
├── [ ] Core features working (messaging, contacts, appointments)
├── [ ] Billing flow tested (signup → pay → use)
├── [ ] Onboarding flow smooth (< 10 minutes to first message)
├── [ ] Settings configurable (hours, auto-reply, templates)
├── [ ] Mobile responsive

SECURITY
├── [ ] Penetration test basic (OWASP Top 10 check)
├── [ ] Rate limiting active
├── [ ] Input validation on all endpoints
├── [ ] Secrets not in code
├── [ ] CORS configured correctly

SUPPORT
├── [ ] Help center / FAQ page
├── [ ] Support WhatsApp number active
├── [ ] Onboarding video recorded
├── [ ] Known issues documented
```

---

*Document Last Updated: April 20, 2026*  
*Next Review: After MVP completion*  
*Total Sections: 22 + 4 Appendices*  
*Estimated Token Count: ~15,000 tokens (paste full doc in new session)*
