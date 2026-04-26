# Development Guide & Testing Playbook
## WhatsApp CRM Platform — From Zero to Production

<table>
<tr><td><b>Document ID</b></td><td>DEV-2026-001</td></tr>
<tr><td><b>Version</b></td><td>2.0</td></tr>
<tr><td><b>Author</b></td><td>Sahil Harkhani</td></tr>
<tr><td><b>Date</b></td><td>April 25, 2026</td></tr>
<tr><td><b>Reference</b></td><td>Technical_Design_Document.md, Phase_Wise_Feature_Blueprint.md</td></tr>
<tr><td><b>Major Change</b></td><td>v2.0: Multi-vertical platform + 3-tier user hierarchy (Super Admin → Tenant Admin → Tenant User)</td></tr>
</table>

---

## Table of Contents

### Part Zero — Architecture Decisions
0. [Multi-Vertical Platform Design](#0-multi-vertical-platform-design)
   - Why NOT clinic-only
   - Supported business verticals
   - Three-tier user hierarchy (Super Admin → Tenant Admin → Tenant User)
   - Vertical-agnostic core vs vertical-specific config

### Part A — Prerequisites & Learning Path
1. [Skill Assessment](#1-skill-assessment)
2. [Learning Path by Domain](#2-learning-path-by-domain)
3. [Environment Setup](#3-environment-setup)

### Part B — Development Steps
4. [Development Phases Overview](#4-development-phases-overview)
5. [Step 0: Project Scaffolding](#step-0-project-scaffolding)
6. [Step 1: Database Schema & ORM](#step-1-database-schema--orm)
7. [Step 2: Authentication & 3-Tier Authorization](#step-2-authentication--3-tier-authorization)
8. [Step 3: WhatsApp API Integration](#step-3-whatsapp-api-integration)
9. [Step 4: Contact Management (CRM)](#step-4-contact-management-crm)
10. [Step 5: Conversation Inbox](#step-5-conversation-inbox-real-time)
11. [Step 6: Booking System (Multi-Vertical)](#step-6-booking-system-multi-vertical)
12. [Step 7: Campaign & Broadcast](#step-7-campaign--broadcast-engine)
13. [Step 8: Tenant Dashboard & Analytics](#step-8-tenant-dashboard--analytics)
14. [Step 9: Billing & Subscription](#step-9-billing--subscription)
15. [Step 10: Settings & Team Management](#step-10-settings--team-management)
16. [Step 11: Super Admin Panel](#step-11-super-admin-panel)
17. [Step 12: Production Deployment](#step-12-production-deployment)

### Part C — Testing Playbook
18. [Testing Philosophy](#18-testing-philosophy)
19. [Test Infrastructure Setup](#19-test-infrastructure-setup)
20. [Test Plan Per Step](#20-test-plan-per-step)
21. [Performance & Load Testing](#21-performance--load-testing)
22. [Security Testing](#22-security-testing)
23. [Pre-Launch Verification](#23-pre-launch-verification)

---

# PART ZERO — ARCHITECTURE DECISIONS

---

## 0. Multi-Vertical Platform Design

### 0.1 Why NOT Clinic-Only?

```
The original plan used healthcare clinics as the "beachhead" market.
But the CORE VALUE of our platform is generic:

  ✔ WhatsApp messaging          → Every business needs this
  ✔ Contact management (CRM)    → Every business needs this
  ✔ Booking / appointments      → 50%+ service businesses need this
  ✔ Campaign broadcasts         → Every business needs this
  ✔ Team inbox                  → Every business needs this

Hardcoding for clinics LIMITS our TAM from ~60K clinics to MILLIONS of SMBs.
Instead: Build a vertical-AGNOSTIC core, and add vertical-SPECIFIC presets.
```

### 0.2 Supported Business Verticals (Day 1 Presets)

| Vertical | "Provider" Label | "Booking" Label | Example Custom Fields | Template Pack |
|----------|------------------|-----------------|----------------------|---------------|
| **Healthcare / Clinics** | Doctor | Appointment | Blood group, Allergies, DOB | Reminders, Follow-up, Lab reports |
| **Salon / Spa** | Stylist | Appointment | Hair type, Preferred stylist | Booking confirm, Feedback, Offers |
| **Fitness / Gym** | Trainer | Session | Membership ID, Goal, BMI | Class schedule, Renewal, Tips |
| **Education / Coaching** | Tutor / Faculty | Class | Student ID, Grade, Subject | Fee reminder, Attendance, Results |
| **Real Estate** | Agent | Site Visit | Budget, Preferred area | Property alert, Visit confirm |
| **Restaurant / Cafe** | Table / Chef | Reservation | Veg/Non-veg, Allergies | Booking, Order status, Offers |
| **Legal / CA / Consultant** | Consultant | Consultation | Case ID, Service type | Document request, Meeting link |
| **Repair / Service Center** | Technician | Service Ticket | Device, Warranty, Issue type | Status update, Pickup/delivery |
| **Events / Wedding** | Vendor | Booking | Event date, Venue, Budget | Payment reminder, Timeline |
| **Generic (Custom)** | Staff Member | Booking | (User-defined) | (User creates own) |

```
HOW IT WORKS:

1. During onboarding, tenant selects their business type
2. System auto-configures:
   ├── Provider label ("Doctor" vs "Stylist" vs "Trainer")
   ├── Booking label ("Appointment" vs "Session" vs "Reservation")
   ├── Pre-built custom fields relevant to that vertical
   ├── Template pack (WhatsApp templates tailored to that business)
   └── Chatbot templates for common flows

3. Tenant can ALWAYS customize everything after setup
4. Core code is 100% vertical-agnostic — no "if (businessType === 'clinic')" anywhere!
```

### 0.3 Three-Tier User Hierarchy

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TIER 1: SUPER ADMIN (Platform Owner = You, Sahil)              │
│                                                                          │
│  WHO: Platform engineers / operations team (starts as just you)          │
│                                                                          │
│  ACCESS:                                                                 │
│  ├─ Dedicated admin panel: admin.yourcrm.in (separate Next.js app)        │
│  ├─ View ALL tenants (list, search, filter by plan/status/vertical)      │
│  ├─ Tenant details: usage, billing, contacts count, message volume       │
│  ├─ Suspend / Activate / Delete tenants                                  │
│  ├─ Manage plans & pricing (create/edit plans, change limits)             │
│  ├─ Platform-wide analytics: total tenants, MRR, churn, growth           │
│  ├─ System health: API latency, queue depth, error rates                 │
│  ├─ Impersonate tenant (login-as for support — audit-logged)             │
│  ├─ Manage vertical presets (add new business types, templates)           │
│  ├─ Feature flags (enable/disable features per tenant or globally)        │
│  ├─ Broadcast platform announcements to all tenants                       │
│  ├─ View audit logs across all tenants                                   │
│  ├─ View ANY tenant's messages, contacts, bookings (full data access)    │
│  └─ Export tenant data for support / compliance / debugging              │
│                                                                          │
│  ALL DATA ACCESS IS AUDIT-LOGGED (who viewed what, when)                  │
└──────────────────────────────────────────────────────────────────────────┘
           │
           │ manages many
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  TIER 2: TENANT ADMIN (Business Owner)                                   │
│                                                                          │
│  WHO: Clinic owner, Salon owner, Gym owner, etc.                         │
│                                                                          │
│  ACCESS:                                                                 │
│  ├─ Full access to THEIR tenant only (app.yourcrm.in)                    │
│  ├─ Dashboard, Inbox, Contacts, Bookings, Campaigns                      │
│  ├─ Manage team: invite/remove staff, assign roles                       │
│  ├─ Billing: view invoices, change plan, manage subscription              │
│  ├─ Settings: business hours, WhatsApp linking, auto-replies              │
│  ├─ Analytics: all tenant-level reports and exports                       │
│  ├─ Automation rules + chatbot configuration                              │
│  ├─ Provider management (add/edit/remove)                                 │
│  ├─ Template management (create, submit for approval)                     │
│  └─ Custom fields: add/edit/delete custom contact fields                  │
│                                                                          │
│  ROLES within Tenant Admin:                                               │
│  ├─ Owner   → Everything (billing + danger zone: delete tenant data)      │
│  └─ Admin   → Everything EXCEPT billing + tenant deletion                 │
└──────────────────────────────────────────────────────────────────────────┘
           │
           │ manages many
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  TIER 3: TENANT USER (Staff Member)                                      │
│                                                                          │
│  WHO: Receptionist, nurse, stylist, trainer, sales rep, etc.             │
│                                                                          │
│  ACCESS (configurable per role):                                         │
│  ├─ Inbox: Only conversations assigned to them (or all, per config)      │
│  ├─ Contacts: View + edit (no delete, per config)                        │
│  ├─ Bookings: Create + view (for their provider, or all)                 │
│  ├─ Reply to messages                                                    │
│  ├─ View own performance metrics                                         │
│                                                                          │
│  CANNOT:                                                                 │
│  ├─ Access billing / subscription                                        │
│  ├─ Delete contacts or conversations                                     │
│  ├─ Manage team members                                                  │
│  ├─ Change settings / integrations                                       │
│  ├─ Create/manage automation rules                                       │
│  └─ Self-elevate their role                                               │
│                                                                          │
│  ROLES within Tenant User:                                                │
│  ├─ Manager → View all conversations + full contact access + reports     │
│  └─ Staff   → Only assigned conversations + limited contact fields       │
└──────────────────────────────────────────────────────────────────────────┘
```

### 0.4 Database Model for 3-Tier Hierarchy

```
TABLE: super_admins
├─ id (UUID, PK)
├─ email (unique)
├─ password_hash (bcrypt — NOT OTP, this is a secure admin panel)
├─ name
├─ role: 'super_admin' | 'support' | 'viewer'
├─ is_active
├─ last_login_at
└─ created_at

NOTE: Super Admins are NOT stored in the tenants/users tables.
      They are a SEPARATE table with separate auth (email+password, not OTP).
      This prevents any tenant from accidentally or maliciously gaining
      platform-level access.

TABLE: tenants
├─ id (UUID, PK)
├─ name
├─ slug (unique)
├─ business_type: 'clinic' | 'salon' | 'gym' | 'education' | 'restaurant' | ...
├─ vertical_config (JSONB) → { providerLabel, bookingLabel, customFields, ... }
├─ plan, plan_expires_at
├─ status: 'active' | 'suspended' | 'trial' | 'churned'
├─ suspended_by (FK → super_admins.id, nullable)
├─ suspended_reason
└─ ... (same as before)

TABLE: users (tenant-scoped)
├─ id (UUID, PK)
├─ tenant_id (FK → tenants.id)
├─ phone (E.164)
├─ name
├─ role: 'owner' | 'admin' | 'manager' | 'staff'
├─ permissions (JSONB) → { canDeleteContacts, canViewAllConversations, canManageTeam, ... }
├─ is_active
└─ ... (same as before)

TABLE: platform_audit_log
├─ id (UUID)
├─ actor_type: 'super_admin' | 'tenant_user'
├─ actor_id (UUID)
├─ action: 'tenant.suspend' | 'tenant.activate' | 'tenant.impersonate' | ...
├─ target_type: 'tenant' | 'user' | 'plan'
├─ target_id (UUID)
├─ metadata (JSONB)
└─ created_at
```

### 0.5 Apps Architecture (Updated)

```
whatsapp-crm/
├── apps/
│   ├── web/            → Tenant-facing app (app.yourcrm.in)
│   │                      Login: OTP-based
│   │                      Users: Tenant Owner, Admin, Manager, Staff
│   │
│   ├── admin/          → Super Admin panel (admin.yourcrm.in)   ← NEW
│   │                      Login: Email + Password (+ optional 2FA)
│   │                      Users: Super Admin, Support, Viewer
│   │
│   ├── api/            → Backend API (serves both web + admin)
│   ├── webhook/        → WhatsApp webhook receiver
│   └── worker/         → Background job processors
│
├── packages/
│   ├── database/       → Prisma schema (now includes super_admins table)
│   ├── shared/         → Types, utils, constants, permission helpers
│   ├── queue/          → BullMQ queue definitions
│   └── whatsapp-sdk/   → Meta Cloud API client
```

### 0.6 Permission System Design

```typescript
// packages/shared/src/permissions.ts

// All possible permissions in the system
export const PERMISSIONS = {
  // Inbox
  INBOX_VIEW_ALL: 'inbox.view_all',           // View all conversations
  INBOX_VIEW_ASSIGNED: 'inbox.view_assigned', // View only assigned conversations
  INBOX_REPLY: 'inbox.reply',
  INBOX_ASSIGN: 'inbox.assign',
  INBOX_RESOLVE: 'inbox.resolve',

  // Contacts
  CONTACTS_VIEW: 'contacts.view',
  CONTACTS_CREATE: 'contacts.create',
  CONTACTS_EDIT: 'contacts.edit',
  CONTACTS_DELETE: 'contacts.delete',
  CONTACTS_IMPORT: 'contacts.import',
  CONTACTS_EXPORT: 'contacts.export',

  // Bookings
  BOOKINGS_VIEW_ALL: 'bookings.view_all',
  BOOKINGS_VIEW_OWN: 'bookings.view_own',     // Only bookings for their provider
  BOOKINGS_CREATE: 'bookings.create',
  BOOKINGS_CANCEL: 'bookings.cancel',

  // Campaigns
  CAMPAIGNS_VIEW: 'campaigns.view',
  CAMPAIGNS_CREATE: 'campaigns.create',
  CAMPAIGNS_SEND: 'campaigns.send',

  // Providers
  PROVIDERS_MANAGE: 'providers.manage',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',

  // Team
  TEAM_MANAGE: 'team.manage',

  // Billing
  BILLING_VIEW: 'billing.view',
  BILLING_MANAGE: 'billing.manage',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  // Automation
  AUTOMATION_MANAGE: 'automation.manage',
} as const;

// Role → Permission mapping (defaults, tenant admin can customize)
export const ROLE_PERMISSIONS = {
  owner: Object.values(PERMISSIONS),  // ALL permissions
  admin: Object.values(PERMISSIONS).filter(p => 
    !p.startsWith('billing.manage')
  ),
  manager: [
    PERMISSIONS.INBOX_VIEW_ALL,
    PERMISSIONS.INBOX_REPLY,
    PERMISSIONS.INBOX_ASSIGN,
    PERMISSIONS.INBOX_RESOLVE,
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_EDIT,
    PERMISSIONS.CONTACTS_EXPORT,
    PERMISSIONS.BOOKINGS_VIEW_ALL,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_CANCEL,
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  staff: [
    PERMISSIONS.INBOX_VIEW_ASSIGNED,
    PERMISSIONS.INBOX_REPLY,
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.BOOKINGS_VIEW_OWN,
    PERMISSIONS.BOOKINGS_CREATE,
  ],
};

// Middleware helper
export function requirePermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userPerms = request.userPermissions; // Set by auth middleware
    if (!userPerms.includes(permission)) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }
  };
}
```

### 0.7 Vertical Configuration Pattern

```typescript
// packages/shared/src/verticals.ts

export const VERTICAL_PRESETS = {
  clinic: {
    providerLabel: 'Doctor',
    providerLabelPlural: 'Doctors',
    bookingLabel: 'Appointment',
    bookingLabelPlural: 'Appointments',
    customerLabel: 'Patient',
    customerLabelPlural: 'Patients',
    defaultSlotDuration: 30, // minutes
    defaultCustomFields: [
      { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
      { key: 'blood_group', label: 'Blood Group', type: 'select',
        options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
      { key: 'allergies', label: 'Allergies', type: 'text' },
    ],
    templatePack: 'healthcare',
  },
  salon: {
    providerLabel: 'Stylist',
    providerLabelPlural: 'Stylists',
    bookingLabel: 'Appointment',
    bookingLabelPlural: 'Appointments',
    customerLabel: 'Client',
    customerLabelPlural: 'Clients',
    defaultSlotDuration: 45,
    defaultCustomFields: [
      { key: 'hair_type', label: 'Hair Type', type: 'select',
        options: ['Straight', 'Wavy', 'Curly', 'Coily'] },
      { key: 'preferred_stylist', label: 'Preferred Stylist', type: 'text' },
    ],
    templatePack: 'beauty',
  },
  gym: {
    providerLabel: 'Trainer',
    providerLabelPlural: 'Trainers',
    bookingLabel: 'Session',
    bookingLabelPlural: 'Sessions',
    customerLabel: 'Member',
    customerLabelPlural: 'Members',
    defaultSlotDuration: 60,
    defaultCustomFields: [
      { key: 'membership_id', label: 'Membership ID', type: 'text' },
      { key: 'fitness_goal', label: 'Fitness Goal', type: 'select',
        options: ['Weight Loss', 'Muscle Gain', 'Flexibility', 'General Fitness'] },
    ],
    templatePack: 'fitness',
  },
  education: {
    providerLabel: 'Faculty',
    providerLabelPlural: 'Faculty',
    bookingLabel: 'Class',
    bookingLabelPlural: 'Classes',
    customerLabel: 'Student',
    customerLabelPlural: 'Students',
    defaultSlotDuration: 60,
    defaultCustomFields: [
      { key: 'student_id', label: 'Student ID', type: 'text' },
      { key: 'grade', label: 'Grade/Level', type: 'text' },
      { key: 'subject', label: 'Subject', type: 'text' },
    ],
    templatePack: 'education',
  },
  restaurant: {
    providerLabel: 'Table',
    providerLabelPlural: 'Tables',
    bookingLabel: 'Reservation',
    bookingLabelPlural: 'Reservations',
    customerLabel: 'Guest',
    customerLabelPlural: 'Guests',
    defaultSlotDuration: 90,
    defaultCustomFields: [
      { key: 'dietary', label: 'Dietary Preference', type: 'select',
        options: ['Veg', 'Non-Veg', 'Vegan', 'Jain'] },
      { key: 'party_size', label: 'Party Size', type: 'number' },
    ],
    templatePack: 'restaurant',
  },
  generic: {
    providerLabel: 'Staff Member',
    providerLabelPlural: 'Staff Members',
    bookingLabel: 'Booking',
    bookingLabelPlural: 'Bookings',
    customerLabel: 'Customer',
    customerLabelPlural: 'Customers',
    defaultSlotDuration: 30,
    defaultCustomFields: [],
    templatePack: 'generic',
  },
} as const;

export type BusinessVertical = keyof typeof VERTICAL_PRESETS;
```

### 0.8 Key Design Rules

```
RULE 1: ZERO VERTICAL-SPECIFIC CODE IN CORE
  ✘ WRONG:  if (tenant.businessType === 'clinic') { showBloodGroup(); }
  ✔ RIGHT:  tenant.verticalConfig.customFields.map(f => renderField(f))

RULE 2: LABELS ARE CONFIG, NOT CODE
  ✘ WRONG:  <h1>Doctors</h1>
  ✔ RIGHT:  <h1>{tenant.verticalConfig.providerLabelPlural}</h1>

RULE 3: SUPER ADMIN IS A SEPARATE APP
  ✘ WRONG:  Same Next.js app with role-based routes
  ✔ RIGHT:  apps/admin/ is a separate Next.js app at admin.yourcrm.in

RULE 4: SUPER ADMIN AUTH IS SEPARATE
  ✘ WRONG:  Same JWT with role='super_admin' in tenant users table
  ✔ RIGHT:  Separate super_admins table, email+password auth, separate JWT issuer

RULE 5: SUPER ADMIN HAS FULL DATA ACCESS (AUDIT-LOGGED)
  Super admin can see ALL tenant data: messages, contacts, bookings, settings
  Every data access is audit-logged: who accessed what tenant's data, when
  Direct access via admin panel (no impersonation needed for viewing)
  Impersonate mode: For taking actions AS the tenant (e.g., debugging a workflow)
  Legal: Terms of Service must disclose platform admin access for support/compliance

RULE 6: PERMISSIONS ARE GRANULAR + CUSTOMIZABLE
  Default role→permission mapping provided per role
  Tenant admin can customize: give staff extra permissions or restrict them further
```

---

# PART A — PREREQUISITES & LEARNING PATH

---

## 1. Skill Assessment

Before starting, honestly rate yourself (1–5) on each skill. Anything below 3 needs focused learning before you touch that area in the codebase.

### 1.1 Self-Assessment Matrix

| # | Skill | Required Level | What "Level 3" Means | Your Rating |
|---|-------|---------------|----------------------|-------------|
| 1 | **TypeScript** | 4 (Advanced) | Generics, utility types, discriminated unions, module resolution | ☐ |
| 2 | **Node.js** | 4 (Advanced) | Event loop, streams, clustering, async/await patterns, error handling | ☐ |
| 3 | **React** | 4 (Advanced) | Hooks deeply, context, memo, suspense, error boundaries | ☐ |
| 4 | **Next.js** | 3 (Intermediate) | App Router, server components, API routes, middleware, layouts | ☐ |
| 5 | **SQL / PostgreSQL** | 3 (Intermediate) | JOINs, indexes, transactions, EXPLAIN ANALYZE, JSONB | ☐ |
| 6 | **Redis** | 2 (Basic+) | Data structures (string, hash, set, sorted set, list), TTL, pub/sub | ☐ |
| 7 | **REST API Design** | 3 (Intermediate) | Status codes, pagination, error handling, versioning | ☐ |
| 8 | **Docker** | 2 (Basic+) | Dockerfile, docker-compose, volumes, networking | ☐ |
| 9 | **Git** | 3 (Intermediate) | Branching, rebasing, PRs, merge conflicts, conventional commits | ☐ |
| 10 | **Testing** | 2 (Basic+) | Unit tests, mocking, assertion libraries | ☐ |
| 11 | **WebSocket** | 2 (Basic) | Concept of persistent connections, rooms, events | ☐ |
| 12 | **Queue Systems** | 1 (Awareness) | Why async processing, job lifecycle, retry semantics | ☐ |
| 13 | **AWS Basics** | 1 (Awareness) | EC2, S3, RDS concepts; console navigation | ☐ |
| 14 | **Terraform** | 0-1 | Not needed for MVP — learn during Step 11 | ☐ |
| 15 | **Kafka** | 0 | Not needed until Phase 2 (6+ months out) | ☐ |

### 1.2 Priority Learning Order

Based on what you'll need FIRST when coding starts:

```
Week -2 to -1 (Before coding):
████████████████████████████████ TypeScript (if below 4)
████████████████████████████     Fastify framework
████████████████████████         Prisma ORM
████████████████████             PostgreSQL (beyond basics)

During Step 0-2:
████████████████████████████     Docker Compose
████████████████████████         Redis fundamentals
████████████████████             BullMQ patterns

During Step 3:
████████████████████████████████ WhatsApp Cloud API docs
████████████████████████         Webhook architecture

During Step 5:
████████████████████████         Socket.io (WebSocket)

During Step 11:
████████████████████████         AWS services
████████████████████             Terraform basics
```

---

## 2. Learning Path by Domain

### 2.1 TypeScript (Deep Dive Before Starting)

**Why critical:** Every file in this project is TypeScript. Bugs from bad typing cost more than time spent learning.

**What to learn (in order):**

```
Level 1 (you probably know this):
├── Basic types: string, number, boolean, arrays, objects
├── Interfaces vs types
├── Functions with typed params + returns
├── Enums
└── Type assertions

Level 2 (need for this project):
├── Generics: function identity<T>(arg: T): T
├── Utility types: Partial<T>, Pick<T>, Omit<T>, Record<K,V>
├── Union types & discriminated unions (for message types)
│   type Message = TextMessage | ImageMessage | TemplateMessage
├── Type narrowing & guards
├── Async/await with proper error typing
└── Module resolution (paths, barrel exports)

Level 3 (needed for shared packages):
├── Declaration merging (extending Fastify request with tenant_id)
├── Conditional types: T extends string ? X : Y
├── Template literal types: `tenant:${string}:config`
├── Zod schema inference: z.infer<typeof schema>
└── Prisma generated types (auto-complete from schema)
```

**Resources (fast path — 3-4 days):**
1. [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) — Read "Everyday Types" through "Generics"
2. [Total TypeScript (free)](https://www.totaltypescript.com/tutorials) — "Beginners" + "Generics" workshops
3. Practice: Rewrite any old JS project in strict TypeScript

**Verification:** You're ready when you can write this without looking anything up:
```typescript
// Can you write this from memory?
type ApiResponse<T> = {
  data: T;
  meta: { cursor: string | null; total: number };
};

type MessageType = 'text' | 'image' | 'template';

interface BaseMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  createdAt: Date;
}

interface TextMessage extends BaseMessage {
  type: 'text';
  content: { text: string };
}

interface TemplateMessage extends BaseMessage {
  type: 'template';
  content: { templateName: string; variables: string[] };
}

type Message = TextMessage | TemplateMessage;

function getMessagePreview(msg: Message): string {
  switch (msg.type) {
    case 'text': return msg.content.text.slice(0, 50);
    case 'template': return `Template: ${msg.content.templateName}`;
  }
}
```

### 2.2 Fastify (Backend Framework)

**Why Fastify over Express:** 2× faster, built-in JSON schema validation, better TypeScript support, lifecycle hooks.

**What to learn:**

```
Core concepts (2 days):
├── Creating a Fastify instance with TypeScript
├── Route declaration (GET, POST, PATCH, DELETE)
├── Request/Reply lifecycle
├── Schema validation (using Zod with fastify-type-provider-zod)
├── Plugins (registeraton, encapsulation, decorators)
├── Hooks: onRequest, preHandler, onSend, onError
├── Error handling (setErrorHandler)
└── Logging (built-in Pino integration)

Project-specific patterns:
├── Decorating Request with tenantId, userId
│   fastify.decorateRequest('tenantId', '')
├── Authentication plugin (preHandler hook)
├── Rate limiting plugin (@fastify/rate-limit)
├── CORS plugin (@fastify/cors)
├── WebSocket integration (@fastify/websocket or separate Socket.io)
└── Health check endpoint pattern
```

**Resources:**
1. [Fastify Official Docs](https://fastify.dev/docs/latest/) — Getting Started + Plugins (2-3 hours)
2. Build a mini CRUD API: users with Fastify + Prisma + Zod (1 day exercise)

**Verification project:** Build a mini REST API with:
- 3 routes (GET list, POST create, GET by id)
- Zod schema validation
- A custom auth plugin (fake JWT check)
- Error handler that returns `{ error: { code, message } }`
- Pino structured logging

### 2.3 Prisma ORM (Database Layer)

**What to learn:**

```
Core (1-2 days):
├── schema.prisma syntax (models, relations, enums)
├── prisma migrate dev (create migration)
├── prisma generate (generate client)
├── CRUD operations: findMany, findUnique, create, update, delete
├── Filtering: where, contains, in, gt/lt
├── Relations: include, select (eager loading)
├── Pagination: take, skip (offset) → cursor-based later
├── Transactions: prisma.$transaction([...])
├── Raw queries: prisma.$queryRaw (for complex SQL)
└── Seeding: prisma/seed.ts

Project-specific:
├── Multi-tenant: EVERY query includes where: { tenantId }
├── JSONB fields: Prisma Json type (settings, content)
├── UUID primary keys: @id @default(uuid())
├── Composite unique: @@unique([tenantId, phoneE164])
├── Soft deletes: status field, not actual DELETE
└── Indexing: @@index([tenantId, createdAt])
```

**Hands-on exercise:** Model a simple multi-tenant todo app:
1. Write `schema.prisma` with `Tenant`, `User`, `Todo` models
2. Run migration
3. Seed with 2 tenants, 5 users, 20 todos
4. Write queries: "get all todos for tenant A" / "create todo" / "update status"
5. Verify tenant isolation: Tenant A cannot see Tenant B's data

### 2.4 PostgreSQL (Beyond Basics)

**What to learn:**

```
Must-know for this project:
├── EXPLAIN ANALYZE — read query plans, spot sequential scans
├── Index types: B-tree (default), GIN (arrays/JSONB), GiST (ranges)
├── Composite indexes: CREATE INDEX ON contacts (tenant_id, phone_e164)
│   └── Column order matters! Most-filtered first
├── JSONB operators: ->, ->>, @>, ?
├── Transactions: BEGIN / COMMIT / ROLLBACK
├── Locking: SELECT ... FOR UPDATE (pessimistic)
├── EXCLUSION constraints (appointment double-booking)
│   EXCLUDE USING gist (provider_id WITH =, tstzrange(...) WITH &&)
├── Table partitioning: PARTITION BY RANGE (created_at)
├── Row-Level Security (RLS): CREATE POLICY ... USING (tenant_id = ...)
├── Connection pooling: Why PgBouncer matters
└── Common N+1 query problems and how to avoid
```

**Hands-on exercise:**
```sql
-- Create a partitioned table, insert 1M rows, compare query speed
-- with and without proper indexes. Use EXPLAIN ANALYZE.
```

### 2.5 Redis (Cache + Queue + Pub/Sub)

**What to learn:**

```
Data structures (1 day):
├── STRING: SET, GET, INCR, EXPIRE (cache, counters)
├── HASH: HSET, HGET, HGETALL (object storage, sessions)
├── SET: SADD, SISMEMBER (deduplication)
├── SORTED SET: ZADD, ZRANGEBYSCORE (rate limiting, leaderboards)
├── LIST: LPUSH, RPOP (simple queues)
└── TTL: EXPIRE, PERSIST, TTL (cache expiry)

Patterns for this project:
├── Cache-aside: Check Redis → miss → query DB → store in Redis → return
├── Pub/Sub: PUBLISH channel msg / SUBSCRIBE channel (real-time events)
├── Distributed lock: SET key NX EX 5 (acquire) / DEL key (release)
├── Rate limiting: ZADD (sliding window on sorted set)
└── Session store: Store JWT metadata, invalidate on logout
```

**Hands-on:**
```bash
# Install Redis locally, open redis-cli, try:
SET user:1:name "Sahil"
EXPIRE user:1:name 60
TTL user:1:name
HSET tenant:abc config '{"hours":"9-5"}'
ZADD ratelimit:api:tenant1 1682000001 "req1"
ZADD ratelimit:api:tenant1 1682000002 "req2"
ZRANGEBYSCORE ratelimit:api:tenant1 1682000000 1682000060
# ^ Count requests in last 60 seconds = sliding window rate limit
```

### 2.6 BullMQ (Job Queue)

**What to learn:**

```
Core concepts (half day):
├── Queue: Named job container, backed by Redis
├── Job: Unit of work with data payload, options (delay, priority, retries)
├── Worker: Processes jobs from queue (concurrency configurable)
├── Job lifecycle: waiting → active → completed/failed
├── Delayed jobs: Process after X milliseconds (perfect for reminders)
├── Repeatable jobs: Cron-like (every 60s check for reminders)
├── Priority: Lower number = higher priority (1 before 5)
├── Retry: Automatic with backoff (exponential)
├── Dead Letter Queue: Failed jobs after max retries
└── Events: completed, failed, progress (for real-time status)
```

**Hands-on exercise:**
```typescript
// Build a mini job system:
// 1. Queue called "email_send"
// 2. Producer: add 10 jobs with { to, subject, body }
// 3. Worker: process each job (console.log), 2 concurrency
// 4. Make job #5 fail → observe retry → observe DLQ
// 5. Add a delayed job (5s delay) → observe it waiting → processing
```

### 2.7 WhatsApp Cloud API (Business-Specific)

**What to learn:**

```
Before coding Step 3 (1-2 days):
├── Read Meta's official docs: https://developers.facebook.com/docs/whatsapp/cloud-api
├── Understand: Business Account → Phone Number → Cloud API
├── Message types: text, template, image, document, interactive (buttons/lists)
├── Template messages: creation, variables, approval process
├── Webhook events: messages, statuses (sent/delivered/read/failed)
├── 24-hour session window rule:
│   └── After customer's last message: 24h free-form reply window
│   └── Outside window: MUST use approved template (costs per conversation)
├── Rate limits: Tier 1 (1K/day) → Tier 2 (10K) → Tier 3 (100K) → Unlimited
├── Pricing: Utility conversations, marketing conversations, service conversations
└── Webhook signature verification: X-Hub-Signature-256 (HMAC SHA256)

Setup:
├── Create Meta Developer account
├── Create a test Business app
├── Get temporary access token (for development)
├── Add test phone number
├── Set up webhook URL (use ngrok for local development)
└── Send your first "hello_world" template message
```

**Critical exercise:** Before writing any code, successfully:
1. Send a template message from Postman/curl
2. Receive a webhook on a local ngrok URL
3. Verify the webhook signature manually
4. Send a reply within 24h window (free-form text)

### 2.8 Socket.io (Real-Time)

**What to learn:**

```
Core concepts (half day):
├── Connection: Client connects, server acknowledges
├── Events: emit('event_name', data) / on('event_name', callback)
├── Rooms: socket.join('tenant:abc') — isolate broadcasts
├── Namespaces: /inbox, /notifications — logical separation
├── Auth: Verify JWT on connection (middleware)
├── Adapter: Redis adapter for multi-server broadcasting
└── Reconnection: Built-in auto-reconnect with backoff
```

### 2.9 Docker (Local Dev Environment)

**What to learn:**

```
Essentials (half day):
├── Dockerfile: FROM, COPY, RUN, CMD, EXPOSE
├── Multi-stage builds: Build stage → Runtime stage (smaller image)
├── docker-compose.yml: Define multi-service environment
├── Volumes: Persist database data across restarts
├── Networking: Service-to-service communication by name
├── .dockerignore: Exclude node_modules, .git
└── Commands: docker compose up -d, docker compose logs -f, docker compose down
```

---

## 3. Environment Setup

### 3.1 Required Software

```bash
# Install in this order:

# 1. Node.js 20 LTS (use nvm for version management)
nvm install 20
nvm use 20

# 2. pnpm (faster than npm, workspace support)
npm install -g pnpm

# 3. Docker Desktop (for local PostgreSQL, Redis, etc.)
# Download from: https://www.docker.com/products/docker-desktop

# 4. Git (with conventional commits)
# You probably have this already

# 5. VS Code Extensions (recommended)
# - Prisma (syntax highlighting for .prisma files)
# - ESLint + Prettier
# - Thunder Client or REST Client (API testing)
# - Docker Extension
# - GitLens
# - Tailwind CSS IntelliSense

# 6. CLI Tools
npm install -g turbo        # Turborepo CLI
npm install -g prisma        # Prisma CLI

# 7. Meta Developer Setup
# - Create account at developers.facebook.com
# - Create a Business app
# - Enable WhatsApp product
# - Get test phone number + temporary token

# 8. Razorpay Test Account
# - Sign up at dashboard.razorpay.com
# - Use Test Mode keys (no real money)

# 9. ngrok (for webhook testing locally)
# Download from: https://ngrok.com/download
# ngrok http 3001  → gives you a public URL for webhooks
```

### 3.2 Accounts Needed

| Service | URL | Purpose | Free Tier |
|---------|-----|---------|-----------|
| GitHub | github.com | Code hosting, CI/CD | Unlimited private repos |
| Meta Developer | developers.facebook.com | WhatsApp API | 1000 free conversations/month |
| Razorpay | dashboard.razorpay.com | Payments | Test mode unlimited |
| AWS | aws.amazon.com | Production hosting | 12-month free tier |
| Cloudflare | cloudflare.com | CDN, DNS, WAF | Generous free plan |
| Sentry | sentry.io | Error tracking | 5K errors/month free |
| Grafana Cloud | grafana.com | Monitoring | 10K metrics free |
| MSG91 | msg91.com | SMS OTP | Some free credits |

---

# PART B — DEVELOPMENT STEPS

---

## 4. Development Phases Overview

```
TOTAL TIMELINE: 8 weeks to MVP (working 4-6 hours/day alongside job)

Step 0: Project Scaffolding .............. Day 1-2    (Foundation)
Step 1: Database Schema & ORM ........... Day 3-4    (Data layer)
Step 2: Authentication System ........... Day 5-8    (Auth + Tenant)
Step 3: WhatsApp API Integration ........ Day 9-14   (Core messaging)
Step 4: Contact Management (CRM) ........ Day 15-18  (CRM features)
Step 5: Conversation Inbox .............. Day 19-24  (Real-time inbox)
Step 6: Appointment System .............. Day 25-32  (Booking engine)
Step 7: Campaign & Broadcast ............ Day 33-38  (Marketing)
Step 8: Dashboard & Analytics ........... Day 39-42  (Insights)
Step 9: Billing & Subscription .......... Day 43-47  (Revenue)
Step 10: Settings & Team ................ Day 48-50  (Configuration)
Step 11: Production Deployment .......... Day 51-56  (Go live)

Each step includes:
├── WHAT to build (features)
├── HOW to build (implementation guide)
├── WHAT to test (test cases)
└── DEFINITION OF DONE (checklist)
```

---

## Step 0: Project Scaffolding

### What to Build
- Turborepo monorepo with pnpm workspaces
- All 4 apps: `web`, `api`, `webhook`, `worker`
- All 4 packages: `database`, `shared`, `queue`, `whatsapp-sdk`
- Docker Compose for local services (PostgreSQL, Redis, MinIO)
- ESLint + Prettier + Husky (code quality from Day 1)
- Basic CI pipeline (GitHub Actions: lint + type-check + build)

### How to Build

```bash
# 1. Create the monorepo
pnpm dlx create-turbo@latest whatsapp-crm
cd whatsapp-crm

# 2. Clean up default template, restructure to our needs:
# apps/web       → Next.js 14 (Tenant App)
# apps/admin     → Next.js 14 (Super Admin Panel)   ← NEW
# apps/api       → Fastify (serves both web + admin)
# apps/webhook   → Fastify (lightweight)
# apps/worker    → BullMQ processors
# packages/database    → Prisma
# packages/shared      → Types, utils, constants
# packages/queue       → BullMQ queue definitions
# packages/whatsapp-sdk → Meta API client

# 3. Configure TypeScript (strict mode)
# tsconfig.base.json at root with:
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ESNext",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true
  }
}

# 4. Create docker-compose.yml for local services
# 5. Setup ESLint + Prettier + Husky pre-commit
# 6. Create .env.example with all required variables
# 7. Setup turbo.json pipeline
# 8. Create basic GitHub Actions CI workflow
```

### Key Files to Create

```
whatsapp-crm/
├── docker-compose.yml           ← PostgreSQL + Redis + MinIO
├── .env.example                 ← All env vars documented
├── turbo.json                   ← Build pipeline
├── pnpm-workspace.yaml          ← Package workspace config
├── tsconfig.base.json           ← Shared TypeScript config
├── .eslintrc.js                 ← Shared lint rules
├── .prettierrc                  ← Code formatting
├── .husky/pre-commit            ← Lint on commit
├── .github/workflows/ci.yml    ← CI pipeline
└── apps/api/src/server.ts       ← "Hello World" Fastify server
```

### Testing for Step 0

```
□ pnpm install completes without errors
□ pnpm turbo build compiles all packages
□ pnpm turbo lint passes with zero warnings
□ docker compose up starts PG + Redis + MinIO
□ apps/api starts and returns { status: "ok" } on GET /health
□ apps/web starts on localhost:3000 (Next.js default page)
□ GitHub Actions CI runs and passes on push
□ TypeScript strict mode catches type errors (test with intentional bad type)
□ Husky blocks commit if lint fails (test with bad formatting)
```

### Definition of Done
- [x] All apps compile independently
- [x] Docker services start with one command
- [x] CI passes on GitHub
- [x] Team member can clone, run `pnpm install && docker compose up && pnpm dev`, and everything works

---

## Step 1: Database Schema & ORM

### What to Build
- Complete Prisma schema (all tables from TDD Section 8)
- Initial migration
- Seed script with realistic sample data
- Database client export (configured for multi-tenant)

### How to Build

```
packages/database/
├── prisma/
│   ├── schema.prisma        ← All models
│   ├── migrations/           ← Auto-generated
│   └── seed.ts              ← Dev seed data
└── src/
    └── client.ts            ← Prisma client singleton
```

**Key implementation details:**

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────────

enum BusinessVertical {
  clinic
  salon
  gym
  education
  restaurant
  realestate
  legal
  repair
  events
  generic

  @@map("business_vertical")
}

enum TenantStatus {
  active
  suspended
  trial
  churned

  @@map("tenant_status")
}

enum UserRole {
  owner
  admin
  manager
  staff

  @@map("user_role")
}

enum SuperAdminRole {
  super_admin
  support
  viewer

  @@map("super_admin_role")
}

// ─── TIER 1: Super Admin (Platform Level) ────────────────────
//     Separate table, separate auth — NOT stored with tenants

model SuperAdmin {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String         @map("password_hash")
  name          String
  role          SuperAdminRole @default(super_admin)
  isActive      Boolean        @default(true) @map("is_active")
  lastLoginAt   DateTime?      @map("last_login_at")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  // Audit: which tenants did this admin suspend/impersonate?
  auditLogs     PlatformAuditLog[] @relation("super_admin_actions")

  @@map("super_admins")
}

// ─── TIER 2 & 3: Tenant + Users (Business Level) ────────────

model Tenant {
  id              String           @id @default(uuid())
  name            String
  slug            String           @unique
  phone           String
  email           String?
  businessVertical BusinessVertical @default(generic) @map("business_vertical")
  verticalConfig  Json             @default("{}") @map("vertical_config")
  //               ^ JSONB: { providerLabel, bookingLabel, customerLabel,
  //                          defaultSlotDuration, customFields, templatePack }
  waPhoneId       String?          @map("wa_phone_id")
  waBusinessId    String?          @map("wa_business_id")
  waAccessToken   String?          @map("wa_access_token")  // encrypted at app layer
  plan            String           @default("trial")
  planExpiresAt   DateTime?        @map("plan_expires_at")
  settings        Json             @default("{}")
  status          TenantStatus     @default(trial)
  suspendedBy     String?          @map("suspended_by")
  suspendedReason String?          @map("suspended_reason")
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  users           User[]
  contacts        Contact[]
  conversations   Conversation[]
  providers       Provider[]
  campaigns       Campaign[]
  templates       Template[]
  automationRules AutomationRule[]
  bookings        Booking[]

  @@map("tenants")
}

// Users: Tier 2 (owner/admin) and Tier 3 (manager/staff) in one table
model User {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  phone         String    // E.164 format
  name          String
  role          UserRole  @default(staff)
  permissions   Json      @default("{}") @map("permissions")
  //             ^ JSONB: Overrides default role permissions
  //             e.g. { "contacts.delete": true, "inbox.view_all": false }
  isActive      Boolean   @default(true) @map("is_active")
  invitedBy     String?   @map("invited_by") // userId of who invited them
  lastLoginAt   DateTime? @map("last_login_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  tenant        Tenant    @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, phone])
  @@index([tenantId])
  @@map("users")
}

// ─── Platform Audit Log ─────────────────────────────────────

model PlatformAuditLog {
  id          String   @id @default(uuid())
  actorType   String   @map("actor_type")  // 'super_admin' | 'system'
  actorId     String   @map("actor_id")
  action      String   // 'tenant.suspend' | 'tenant.activate' | 'tenant.impersonate' | ...
  targetType  String   @map("target_type") // 'tenant' | 'user' | 'plan'
  targetId    String   @map("target_id")
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")

  superAdmin  SuperAdmin? @relation("super_admin_actions", fields: [actorId], references: [id])

  @@index([actorId])
  @@index([targetType, targetId])
  @@index([createdAt])
  @@map("platform_audit_log")
}

// ─── Booking (was: Appointment — now multi-vertical) ────────

model Booking {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")
  providerId  String   @map("provider_id")
  contactId   String   @map("contact_id")
  startsAt    DateTime @map("starts_at")
  endsAt      DateTime @map("ends_at")
  status      String   @default("confirmed")  // confirmed | completed | cancelled | no_show
  notes       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  // PostgreSQL EXCLUSION constraint (added via raw SQL migration):
  // EXCLUDE USING gist (tenant_id WITH =, provider_id WITH =,
  //   tsrange(starts_at, ends_at) WITH &&)
  //   WHERE (status = 'confirmed')

  @@index([tenantId, providerId, startsAt])
  @@map("bookings")
}

// ... (Contact, Conversation, Message, Provider, Campaign, Template,
//      AutomationRule models — same as TDD but with tenant_id isolation)
```

**Seed script approach:**
```typescript
// seed.ts — Create realistic test data

// 1 super admin (platform owner — you)
// 2 tenants:
//   Tenant A: "Glow Salon" (vertical: salon)
//   Tenant B: "City Care Clinic" (vertical: clinic)
// 3 users per tenant:
//   Owner (role: owner) — full access
//   Admin (role: admin) — everything except billing
//   Staff (role: staff) — inbox + contacts only
// 50 contacts per tenant (with varied tags)
// 2 providers per tenant:
//   Salon: "Priya (Stylist)", "Rahul (Colorist)"
//   Clinic: "Dr. Sharma", "Dr. Patel"
// 10 bookings (mix of confirmed, completed, no-show)
// 100 messages (inbound + outbound)
// 2 templates per tenant (booking_reminder, welcome)
// 1 campaign per tenant
// verticalConfig auto-populated from VERTICAL_PRESETS
```

### Testing for Step 1

```
□ prisma migrate dev creates all tables without errors
□ prisma db seed inserts all sample data
□ super_admins table: Platform admin created (email + password_hash)
□ tenants table: 2 tenants with different business_vertical values
□ users table: 3 users per tenant with correct roles (owner, admin, staff)
□ verticalConfig: Salon tenant has providerLabel='Stylist', Clinic has 'Doctor'
□ Query: SELECT * FROM contacts WHERE tenant_id = 'A' returns only Tenant A's data
□ Query: INSERT duplicate phone for same tenant → unique constraint error
□ Query: INSERT booking overlapping time for same provider → exclusion constraint error
□ Prisma client generates TypeScript types for all models (incl. SuperAdmin, Booking)
□ Raw SQL: EXPLAIN ANALYZE on common queries shows index usage (not seq scan)
□ Verify: prisma migrate reset drops and recreates everything cleanly
□ platform_audit_log table exists with correct indexes
```

**SQL tests to run manually:**
```sql
-- Test 1: Tenant isolation
SELECT * FROM contacts WHERE tenant_id = 'tenant-a-id';
-- Should only return Tenant A contacts

-- Test 2: Unique phone per tenant
INSERT INTO contacts (id, tenant_id, phone_e164, name) 
VALUES (gen_random_uuid(), 'tenant-a', '+919876543210', 'Duplicate');
-- Should fail if +919876543210 already exists for tenant-a

-- Test 3: Booking exclusion constraint (was: appointments)
INSERT INTO bookings (id, tenant_id, provider_id, contact_id, starts_at, ends_at, status)
VALUES (gen_random_uuid(), 'tenant-a', 'provider-1', 'contact-1', 
        '2026-04-22 10:00', '2026-04-22 10:30', 'confirmed');
-- Should fail if provider already has 10:00-10:30 confirmed

-- Test 4: Index performance
EXPLAIN ANALYZE 
SELECT * FROM contacts WHERE tenant_id = 'abc' AND 'vip' = ANY(tags);
-- Should show: Index Scan (not Seq Scan)

-- Test 5: Super admin exists
SELECT email, role FROM super_admins;
-- Should return at least 1 row with role = 'super_admin'

-- Test 6: Vertical config populated
SELECT slug, business_vertical, vertical_config->>'providerLabel' as provider_label
FROM tenants;
-- salon tenant: 'Stylist', clinic tenant: 'Doctor'
```

### Definition of Done
- [ ] All tables created (incl. super_admins, bookings, platform_audit_log)
- [ ] Seed data creates realistic multi-vertical test scenarios
- [ ] Unique constraints prevent duplicate contacts per tenant
- [ ] Exclusion constraint prevents double-booking
- [ ] Vertical config auto-populated from VERTICAL_PRESETS
- [ ] Super admin seeded with email + bcrypt password
- [ ] Prisma client typed correctly, queries compile

---

## Step 2: Authentication & 3-Tier Authorization

### What to Build
- **Super Admin auth**: Email + password login (separate from tenant auth)
- **Tenant OTP auth**: OTP send & verify (for both Tenant Admin & Tenant Users)
- JWT issuance (access + refresh) with `userType` claim
- Tenant auto-provisioning (first-time signup creates tenant with vertical config)
- Team invite flow (Tenant Admin invites staff → staff verifies OTP → joins tenant)
- Auth middleware (3-tier aware: Super Admin routes vs Tenant routes)
- Permission middleware (checks granular permissions per endpoint)
- Token refresh + logout
- Rate limiting on all auth endpoints

### How to Build

**3-Tier Auth Architecture:**
```
┌───────────────────────────────────────────────────────────────┐
│ FLOW A: Super Admin Login (admin.yourcrm.in)            │
│                                                         │
│  POST /admin/auth/login { email, password }              │
│    → Verify bcrypt hash against super_admins table        │
│    → Issue JWT: { adminId, role, type: 'super_admin' }    │
│    → Separate JWT secret (JWT_ADMIN_SECRET)               │
│    → Access token: 30 min, Refresh: 24h                   │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ FLOW B: Tenant Admin Signup (app.yourcrm.in)             │
│                                                         │
│  POST /v1/auth/otp/send { phone: "+919876543210" }      │
│    → Store in Redis: otp:{phone} = {code, attempts} 5min │
│                                                         │
│  POST /v1/auth/otp/verify { phone, code }               │
│    → Phone NOT in any tenant's users table               │
│    → Create new Tenant + User (role: 'owner')            │
│    → Prompt: "What type of business?" (select vertical)  │
│    → Auto-apply VERTICAL_PRESETS[selectedVertical]        │
│    → Issue JWT: { userId, tenantId, role, type: 'tenant' }│
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ FLOW C: Tenant User Join (invited by Tenant Admin)       │
│                                                         │
│  Tenant Admin: POST /v1/team/invite { phone, role }     │
│    → Create User record: { tenantId, phone, role,        │
│         isActive: false, invitedBy: adminUserId }        │
│    → Send WhatsApp invite: "You've been invited to join..."│
│                                                         │
│  Staff: POST /v1/auth/otp/send { phone }                │
│  Staff: POST /v1/auth/otp/verify { phone, code }        │
│    → Phone found in users table (isActive: false)        │
│    → Activate user, set name                             │
│    → Issue JWT: { userId, tenantId, role, type: 'tenant' }│
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ FLOW D: Returning Tenant User Login                      │
│                                                         │
│  POST /v1/auth/otp/send { phone }                       │
│  POST /v1/auth/otp/verify { phone, code }               │
│    → Phone found in users table (isActive: true)         │
│    → Update lastLoginAt                                  │
│    → Issue JWT: { userId, tenantId, role, type: 'tenant' }│
└───────────────────────────────────────────────────────────────┘
```

**Key implementation patterns:**

```typescript
// middleware/auth.ts — Tenant auth middleware
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { ROLE_PERMISSIONS } from '@whatsapp-crm/shared';

export async function tenantAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return reply.status(401).send({
      error: { code: 'AUTH_TOKEN_MISSING', message: 'No token provided' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      tenantId: string;
      role: string;
      type: 'tenant';
    };
    
    if (decoded.type !== 'tenant') {
      return reply.status(403).send({
        error: { code: 'AUTH_WRONG_CONTEXT', message: 'Use admin panel for super admin access' }
      });
    }

    request.tenantId = decoded.tenantId;
    request.userId = decoded.userId;
    request.role = decoded.role;
    
    // Load user permissions (default role + any overrides from DB)
    const defaultPerms = ROLE_PERMISSIONS[decoded.role] || [];
    // Optionally fetch custom overrides from Redis cache
    request.userPermissions = defaultPerms;
  } catch (err) {
    return reply.status(401).send({
      error: { code: 'AUTH_TOKEN_INVALID', message: 'Invalid or expired token' }
    });
  }
}

// middleware/admin-auth.ts — Super Admin auth middleware (SEPARATE)
export async function superAdminAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return reply.status(401).send({
      error: { code: 'AUTH_TOKEN_MISSING' }
    });
  }

  try {
    // DIFFERENT secret than tenant JWT!
    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET!) as {
      adminId: string;
      role: string;
      type: 'super_admin';
    };
    
    if (decoded.type !== 'super_admin') {
      return reply.status(403).send({
        error: { code: 'AUTH_NOT_ADMIN' }
      });
    }

    request.adminId = decoded.adminId;
    request.adminRole = decoded.role;
  } catch (err) {
    return reply.status(401).send({
      error: { code: 'AUTH_TOKEN_INVALID' }
    });
  }
}
```

```typescript
// Route registration pattern

// Tenant routes (OTP auth, permission checks)
app.register(async (tenantRoutes) => {
  tenantRoutes.addHook('preHandler', tenantAuthMiddleware);
  
  tenantRoutes.get('/v1/contacts', {
    preHandler: [requirePermission('contacts.view')],
    handler: getContacts,
  });
  
  tenantRoutes.delete('/v1/contacts/:id', {
    preHandler: [requirePermission('contacts.delete')],
    handler: deleteContact,
  });
  
  tenantRoutes.post('/v1/team/invite', {
    preHandler: [requirePermission('team.manage')],
    handler: inviteTeamMember,
  });
});

// Super Admin routes (email/password auth, separate prefix)
app.register(async (adminRoutes) => {
  adminRoutes.addHook('preHandler', superAdminAuthMiddleware);
  
  adminRoutes.get('/admin/tenants', listAllTenants);
  adminRoutes.post('/admin/tenants/:id/suspend', suspendTenant);
  adminRoutes.post('/admin/tenants/:id/impersonate', impersonateTenant);
  adminRoutes.get('/admin/analytics/platform', getPlatformAnalytics);
});
```

### Testing for Step 2

**Unit Tests:**
```
□ OTP generation: Always 6 digits, numeric only
□ OTP expiry: Code stored with 5-min TTL in Redis
□ OTP verification: Correct code → success
□ OTP verification: Wrong code → increments attempt counter
□ OTP verification: 5 wrong attempts → locked out (returns 429)
□ OTP verification: Expired code → returns AUTH_OTP_EXPIRED
□ JWT generation (tenant): Contains userId, tenantId, role, type='tenant'
□ JWT generation (admin): Contains adminId, role, type='super_admin'
□ JWT generation: Tenant access token expires in 15 minutes
□ JWT generation: Admin access token expires in 30 minutes
□ JWT verification: Valid tenant token → decoded correctly
□ JWT verification: Valid admin token → decoded correctly
□ JWT verification: Tenant token on admin route → AUTH_WRONG_CONTEXT (403)
□ JWT verification: Admin token on tenant route → AUTH_TOKEN_INVALID (401)
□ JWT verification: Expired token → AUTH_TOKEN_EXPIRED
□ JWT verification: Tampered token → AUTH_TOKEN_INVALID
□ JWT verification: Missing token → AUTH_TOKEN_MISSING
□ Permission check: Staff accessing contacts.delete → 403 FORBIDDEN
□ Permission check: Owner accessing contacts.delete → 200 allowed
□ Permission check: Manager accessing team.manage → 403 FORBIDDEN
```

**Integration Tests:**
```
□ FLOW A: Super Admin login with correct email+password → JWT issued
□ FLOW A: Super Admin login with wrong password → 401
□ FLOW A: Super Admin login with non-existent email → 401 (same error, no enumeration)
□ FLOW B: New user OTP verify → Tenant + User created in DB (role: owner)
□ FLOW B: New user prompted for business vertical → verticalConfig populated
□ FLOW C: Tenant Admin invites staff → User record created (isActive: false)
□ FLOW C: Invited staff verifies OTP → User activated, joins correct tenant
□ FLOW C: Uninvited phone verifies OTP → Treated as new signup (Flow B)
□ FLOW D: Returning user OTP verify → Same tenant returned, lastLoginAt updated
□ Token refresh: Use refresh token → Get new access token
□ Logout: Refresh token invalidated (can't be used again)
□ Rate limiting: 6th OTP request in 1 hour → blocked (429)
□ Multi-tenant: User A's token cannot access Tenant B's data
□ Super Admin: Can call /admin/tenants → returns all tenants
□ Tenant User: Cannot call /admin/tenants → 401
```

**Security Tests:**
```
□ OTP brute force: After 5 attempts, account locked for 1 hour
□ OTP not logged: Check logs — OTP code never appears
□ JWT secret rotation: Old tokens rejected after secret change
□ SQL injection: Phone field with SQL injection → rejected by validation
□ Missing auth header: Returns 401, not 500
□ Super Admin password: Stored as bcrypt hash (cost factor ≥12)
□ Separate JWT secrets: JWT_SECRET ≠ JWT_ADMIN_SECRET
□ Role escalation: Staff cannot change own role via API
□ Invite abuse: Cannot invite with role='owner' (only admin/manager/staff)
```

### Definition of Done
- [ ] Super Admin login works (email + password → JWT)
- [ ] Tenant OTP send/verify works end-to-end
- [ ] JWT issued with correct `type` claim (tenant vs super_admin)
- [ ] First-time user gets tenant auto-created with vertical config
- [ ] Team invite flow: Admin invites → Staff verifies → joins tenant
- [ ] Tenant auth middleware protects all /v1/* routes
- [ ] Super Admin auth middleware protects all /admin/* routes
- [ ] Permission middleware enforces granular access per role
- [ ] Rate limiting prevents brute force
- [ ] Cross-context auth rejected (tenant token on admin routes, vice versa)
- [ ] All tests pass (unit + integration)

---

## Step 3: WhatsApp API Integration

### What to Build
- WhatsApp SDK package (packages/whatsapp-sdk)
- Send text message (within 24h window)
- Send template message (outside 24h window)
- Webhook receiver (apps/webhook)
- Webhook signature verification
- Incoming message processing
- Message status tracking (sent → delivered → read)
- Phone number normalization utility

### How to Build

**WhatsApp SDK structure:**
```typescript
// packages/whatsapp-sdk/src/client.ts

export class WhatsAppClient {
  private baseUrl = 'https://graph.facebook.com/v18.0';
  private phoneNumberId: string;
  private accessToken: string;

  // Send a text message (only within 24h session window)
  async sendText(to: string, text: string): Promise<SendResult>

  // Send a template message (anytime, requires pre-approved template)
  async sendTemplate(to: string, templateName: string, 
    languageCode: string, variables: TemplateVariable[]): Promise<SendResult>

  // Send interactive message (buttons or list)
  async sendInteractive(to: string, interactive: InteractiveMessage): Promise<SendResult>

  // Send media message (image, document, audio)
  async sendMedia(to: string, type: MediaType, mediaUrl: string, 
    caption?: string): Promise<SendResult>

  // Get media URL from media_id (for downloading received media)
  async getMediaUrl(mediaId: string): Promise<string>
}

// packages/whatsapp-sdk/src/webhooks.ts

export class WebhookHandler {
  // Verify Meta's challenge (GET request during setup)
  verifyChallenge(query: VerifyChallengeQuery): string | null

  // Verify webhook signature (HMAC SHA256)
  verifySignature(payload: string, signature: string, appSecret: string): boolean

  // Parse webhook payload into typed events
  parsePayload(body: WebhookBody): WebhookEvent[]
}
```

**Webhook receiver flow:**
```
POST /webhook/whatsapp
  1. Verify X-Hub-Signature-256 header → reject if invalid (401)
  2. Return 200 OK immediately (Meta expects < 5 seconds)
  3. Parse payload → extract events (message_received, status_update, error)
  4. For each event:
     a. Deduplicate: Redis SETNX wa_dedup:{wa_message_id} TTL:24h
        → If already exists, skip (Meta sends duplicates)
     b. Add to BullMQ queue: webhook_process
  5. Worker processes:
     → message_received: Upsert contact, create/update conversation, store message,
       notify inbox via Socket.io
     → status_update: Update message status (sent/delivered/read/failed),
       publish real-time update
     → error: Log, alert if critical
```

**Phone normalization utility:**
```typescript
// packages/shared/src/utils/phone.ts

/**
 * Normalize Indian phone number to E.164 format
 * 
 * Handles:
 *   "9876543210"     → "+919876543210"
 *   "09876543210"    → "+919876543210"  
 *   "919876543210"   → "+919876543210"
 *   "+919876543210"  → "+919876543210"
 *   "91 98765 43210" → "+919876543210"
 *   "+91-9876-543210"→ "+919876543210"
 * 
 * Returns null if invalid
 */
export function normalizeToE164(phone: string): string | null
```

### Testing for Step 3

**Unit Tests:**
```
□ Phone normalization: All 6 formats above → "+919876543210"
□ Phone normalization: Invalid (5 digits) → null
□ Phone normalization: Non-Indian (US number) → "+1XXXXXXXXXX"
□ Webhook signature verification: Valid signature → true
□ Webhook signature verification: Tampered payload → false
□ Webhook signature verification: Missing signature → false
□ Webhook payload parsing: Text message → typed TextMessageEvent
□ Webhook payload parsing: Image message → typed MediaMessageEvent
□ Webhook payload parsing: Status update → typed StatusUpdateEvent
□ Webhook payload parsing: Malformed JSON → graceful error, not crash
□ Template variable rendering: Correctly maps variables to placeholders
□ WhatsApp client: Builds correct API payload for text message
□ WhatsApp client: Builds correct API payload for template message
```

**Integration Tests (with mocked Meta API):**
```
□ Send text message → DB has message with status 'sent'
□ Send template → Correct Meta API payload constructed
□ Receive text webhook → Contact created + Message stored + Conversation created
□ Receive image webhook → Media downloaded to S3 + URL stored
□ Status webhook (delivered) → Message status updated in DB
□ Status webhook (read) → Message status updated + read_at timestamp set
□ Duplicate webhook → Second event ignored (dedup working)
□ Invalid webhook signature → Rejected with 401
□ Webhook server down briefly → Meta retries successfully
□ 24h session detection: Message from contact → Redis key set with 24h TTL
```

**Manual Verification (with real WhatsApp):**
```
□ Send a real template message to your own phone
□ Reply to it → webhook fires → message appears in DB
□ Check: wa_message_id populated in messages table
□ Wait for delivered status → status column updates
□ Open/read message → status becomes 'read'
```

### Definition of Done
- [ ] Can send text and template messages via API endpoint
- [ ] Webhook receives and processes all Meta events
- [ ] Messages stored with correct status tracking
- [ ] Phone normalization handles all Indian formats
- [ ] Deduplication prevents processing same event twice
- [ ] SDK has full TypeScript types for all Meta API payloads

---

## Step 4: Contact Management (CRM)

### What to Build
- CRUD API for contacts
- CSV import (async, with progress tracking)
- Tag management (add/remove, search by tag)
- Contact search (name, phone, tag)
- Duplicate detection on import
- Contact timeline (all messages for a contact)
- Opt-out flag management

### How to Build

**API Endpoints:**
```
GET    /v1/contacts?cursor=X&limit=20&tag=vip&search=sharma
POST   /v1/contacts             { phone, name, email?, tags? }
GET    /v1/contacts/:id         → includes message timeline
PATCH  /v1/contacts/:id         { name?, tags?, customFields? }
DELETE /v1/contacts/:id         → soft delete (status = 'deleted')
POST   /v1/contacts/import      → multipart form upload (CSV)
GET    /v1/contacts/import/:id  → import job progress
POST   /v1/contacts/:id/tags    { add: ["vip"], remove: ["new"] }
```

**CSV Import flow (async):**
```
1. Upload CSV file
   → Validate: file size < 10MB, correct MIME type
   → Store file temporarily in S3 (or local tmp)
   → Create BullMQ job: { jobId, tenantId, filePath }
   → Return 202 { jobId }

2. Worker processes CSV:
   → Read CSV with streaming parser (not load 50MB into memory)
   → For each row:
     a. Normalize phone → E.164
     b. Check duplicate (phone exists for this tenant?)
        → Exists: Update name/tags if newer data, skip if same
        → New: INSERT
     c. Track progress: Redis SET import:{jobId}:progress {current, total}
   → After all rows: Update job status = 'completed'

3. Client polls GET /v1/contacts/import/:jobId
   → Returns { status, totalRows, imported, skipped, failed, errors }
```

### Testing for Step 4

**Unit Tests:**
```
□ Contact validation: Missing phone → validation error
□ Contact validation: Phone normalization applied before save
□ Tag operations: Add tag → tags array updated
□ Tag operations: Remove tag → tag removed, others preserved
□ Tag operations: Add duplicate tag → no duplicate in array
□ Search: Name "sharma" matches "Dr. Sharma" (case-insensitive)
□ Search: Phone search "9876" matches "+919876543210" (partial)
□ Cursor pagination: Returns correct next cursor
□ Cursor pagination: Last page has null cursor
```

**Integration Tests:**
```
□ Create contact → exists in DB with correct tenant_id
□ Create duplicate phone → 409 Conflict with CONTACT_DUPLICATE code
□ Get contact list → returns only current tenant's contacts (CRITICAL!)
□ Get contact with timeline → includes all messages sorted by date
□ Update contact → only updated fields change, others preserved
□ Delete contact → status = 'deleted', not physically removed
□ CSV import (100 rows) → 100 contacts created, job status = 'completed'
□ CSV import with duplicates → existing updated, new created, count accurate
□ CSV import with invalid phones → logged as errors, valid rows still imported
□ CSV import progress → polling returns real-time progress
□ Opt-out flag → contact with opt_out=true is excluded from campaigns
□ TENANT ISOLATION: Tenant A cannot GET /v1/contacts/:tenant-b-contact-id (403 or 404)
```

### Definition of Done
- [ ] Full CRUD for contacts working
- [ ] CSV import handles 10K rows in <30 seconds
- [ ] Search by name/phone/tag returns results in <200ms
- [ ] Duplicate detection prevents same phone twice per tenant
- [ ] Opt-out flag respected (tested in campaign step later)
- [ ] Tenant isolation verified (A can't see B's contacts)

---

## Step 5: Conversation Inbox (Real-Time)

### What to Build
- Conversation list API (sorted by last message)
- Message thread API (paginated, cursor-based)
- Reply from inbox (send message as staff)
- Real-time updates via WebSocket (Socket.io)
- Conversation assignment (to team member)
- Conversation status management (open → resolved)
- Unread count tracking
- Frontend: Next.js inbox page with chat-like UI

### How to Build

**WebSocket architecture:**
```
Client connects:
  → Socket.io handshake with JWT (auth middleware)
  → Server verifies JWT, extracts tenantId
  → Client auto-joins room: `tenant:${tenantId}`
  → Client joins personal room: `user:${userId}`

Server emits events:
  → room `tenant:${tenantId}`:
    ├── 'new_message' → when inbound message received
    ├── 'message_status' → when delivery status changes
    ├── 'conversation_updated' → when assignment/status changes
    └── 'new_contact' → when new contact auto-created

Published from:
  → Webhook processor (incoming message) → Redis PUBLISH → Socket.io adapter → Client
  → Message sender worker (status update) → Redis PUBLISH → Socket.io adapter → Client
```

**Frontend inbox layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Navigation Bar                                    [User Menu] │
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                              │
│  Conversations   │         Chat Thread                          │
│  ──────────────  │                                              │
│  🔵 Priya M.    │  ┌─────────────────────────────────┐        │
│  "Want to book"  │  │  Priya: Hi, I want to book an   │◀ Inbnd│
│  2 min ago       │  │  appointment with Dr. Sharma     │        │
│                  │  └─────────────────────────────────┘        │
│  ○ Rajesh K.    │  ┌─────────────────────────────────┐        │
│  "Thanks!"       │  │  You: Sure! Here are available   │▶ Outbd│
│  1 hr ago        │  │  slots for Dr. Sharma...         │        │
│                  │  └─────────────────────────────────┘        │
│  ○ Meera S.     │                                              │
│  Resolved        │  ┌──────────────────────────────────────┐   │
│  Yesterday       │  │  Type a reply...          [Send] 📎  │   │
│                  │  └──────────────────────────────────────┘   │
│                  │                                              │
│  [Search... 🔍]  │  Assigned to: You  Status: [Open ▾]        │
├──────────────────┼──────────────────────────────────────────────┤
│                  │  Contact: Priya Mehta | +91 98765 43210     │
│  Filters:        │  Tags: regular, dental                      │
│  ○ All           │  Last visit: Mar 15, 2026                   │
│  ○ Open (3)      │                                              │
│  ○ Mine (1)      │                                              │
│  ○ Unassigned(2) │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

### Testing for Step 5

**Unit Tests:**
```
□ Conversation list sorted by last_message_at descending
□ Unread count increments on inbound message
□ Unread count resets to 0 when conversation opened (POST /:id/read)
□ Message pagination: First page has latest messages
□ Message pagination: cursor navigates to older messages
□ Reply: Within 24h window → sends as text (free)
□ Reply: Outside 24h window → prompts template selection
```

**Integration Tests:**
```
□ Inbound message → conversation created/updated → last_message_preview correct
□ Inbound message → unread_count incremented by 1
□ Staff replies → message stored with direction='outbound'
□ Staff assigns conversation → assigned_to updated, event emitted
□ Staff resolves conversation → status='resolved', filters work
□ Two staff viewing same conversation → both see real-time updates
□ Conversation filters: status=open returns only open conversations
□ TENANT ISOLATION: Cannot access other tenant's conversations
```

**WebSocket Tests:**
```
□ Connect with valid JWT → connection accepted, joined tenant room
□ Connect with invalid JWT → connection rejected
□ Inbound message → 'new_message' event received by all connected clients of tenant
□ Status update → 'message_status' event received in real-time
□ Client disconnects → reconnects → received missed events? (No, but state is fresh from API)
□ Two tenants connected → Tenant A events NOT seen by Tenant B
□ Server restart → clients auto-reconnect (Socket.io built-in)
```

**Frontend Tests:**
```
□ Inbox loads conversations on page load
□ Click conversation → messages load in chat thread
□ New incoming message → appears in chat without page refresh
□ Message status (single tick → double tick → blue tick) updates in real-time
□ Reply input → send button fires API call → message appears in thread
□ Typing indicator shows (optional: nice to have)
□ Mobile responsive: inbox usable on 360px screen
```

### Definition of Done
- [ ] Conversation list + chat thread working end-to-end
- [ ] Real-time: new messages appear instantly (WebSocket)
- [ ] Reply sends via WhatsApp, appears in thread
- [ ] Assignment and status management functional
- [ ] Unread badges accurate
- [ ] Mobile responsive

---

## Step 6: Booking System (Multi-Vertical)

### What to Build
- Provider management (add providers with vertical-appropriate labels, set schedules)
- Slot availability calculation (configurable slot duration per vertical)
- Manual booking from dashboard
- WhatsApp booking flow (customer-initiated, uses tenant's vertical labels)
- Auto-reminders (24h + 2h before)
- Cancellation & rescheduling
- No-show tracking
- Booking dashboard (today's view + calendar)

> **Multi-Vertical Note:** The code uses generic terms (`provider`, `booking`, `customer`).
> The UI displays tenant-specific labels from `verticalConfig`:
> - Clinic: "Doctor", "Appointment", "Patient"
> - Salon: "Stylist", "Appointment", "Client"
> - Gym: "Trainer", "Session", "Member"
> - Restaurant: "Table", "Reservation", "Guest"

### How to Build

**Slot calculation algorithm:**
```typescript
// services/booking.service.ts

function getAvailableSlots(
  providerId: string,
  startDate: Date,
  endDate: Date,
  tenantId: string
): Slot[] {
  // 1. Get provider's working hours (from DB, cached in Redis)
  const provider = await getProvider(providerId);
  
  // 2. Get tenant's vertical config for slot duration
  const tenant = await getTenant(tenantId);
  const slotDuration = tenant.verticalConfig.defaultSlotDuration || 30;
  
  // 3. For each day in range:
  for (const day of eachDayInRange(startDate, endDate)) {
    const dayOfWeek = getDayOfWeek(day); // 'mon', 'tue', etc.
    const hours = provider.workingHours[dayOfWeek]; // { start: "09:00", end: "18:00" }
    
    if (!hours) continue; // Business closed this day
    
    // 4. Generate all possible slots (using tenant's configured slot duration)
    const allSlots = generateSlots(day, hours.start, hours.end, slotDuration);
    // e.g., 30-min: [09:00, 09:30, 10:00, ..., 17:30]
    // e.g., 60-min: [09:00, 10:00, 11:00, ..., 17:00]
    
    // 5. Remove break hours
    const afterBreaks = removeBreakSlots(allSlots, provider.breakHours);
    
    // 6. Remove already-booked slots
    const booked = await getBookedSlots(providerId, day, tenantId);
    const available = afterBreaks.filter(slot => !isOverlapping(slot, booked));
    
    slots.push(...available);
  }
  
  return slots;
}
```

**Booking state machine (WhatsApp flow):**
```typescript
// Redis key: booking_state:{tenantId}:{contactPhone}
// TTL: 10 minutes (auto-expire stale sessions)

interface BookingState {
  step: 'select_provider' | 'select_slot' | 'confirming';
  providerId?: string;
  selectedSlot?: string;
  expiresAt: number;
}

// Automation rule detects booking keyword ("book", "reserve", "schedule")
// → Gets tenant's vertical labels
// → Sets state: { step: 'select_provider' }
// → Sends provider list (uses verticalConfig.providerLabel)
//   e.g. "Choose a Stylist:" or "Choose a Trainer:"

// Customer selects provider
// → Sets state: { step: 'select_slot', providerId: '...' }
// → Queries available slots
// → Sends slot list (interactive message)

// Customer selects slot
// → ATOMIC BOOKING (lock + check + insert + release)
// → Sets state: null (conversation complete)
// → Sends confirmation (uses verticalConfig.bookingLabel)
//   e.g. "Your Appointment is confirmed" or "Your Session is booked"
// → Schedules reminders
```

### Testing for Step 6

**Unit Tests:**
```
□ Slot generation: 9:00-18:00, 30-min slots (clinic) → 18 slots (correct)
□ Slot generation: 9:00-18:00, 60-min slots (gym) → 9 slots (correct)
□ Slot generation: 9:00-18:00, 45-min slots (salon) → 12 slots (correct)
□ Slot generation: With 1-hour lunch break → correct reduction
□ Slot generation: Weekend (if closed) → 0 slots
□ Slot overlap detection: 10:00-10:30 booked, query 10:00 → unavailable
□ Slot overlap detection: 10:00-10:30 booked, query 10:30 → available
□ Booking state machine: Correct transitions
□ Booking state machine: Expired state (>10 min) → reset
□ Reminder scheduling: 24h before booking → correct delay calculated
□ Reminder scheduling: Booking in <24h → only schedule 2h reminder
□ Reminder scheduling: Booking in <2h → no reminders
□ Vertical labels: Salon shows "Choose a Stylist" not "Choose a Doctor"
□ Vertical labels: Gym confirmation says "Session booked" not "Appointment confirmed"
```

**Integration Tests:**
```
□ Create provider with schedule → working_hours stored correctly
□ Get available slots → returns correct free slots (mock clock)
□ Book slot → slot marked as taken, not available in next query
□ Book already-taken slot → 409 Conflict (BOOKING_SLOT_UNAVAILABLE)
□ CONCURRENT BOOKING TEST: Two users book same slot simultaneously
  → One succeeds (201), one fails (409) ← This is CRITICAL to test
□ Cancel booking → slot becomes available again
□ Reschedule → old cancelled + new created (atomic transaction)
□ Reminder fires at T-24h → template message sent to customer
□ Reminder fires at T-2h → template message sent to customer
□ No-show detection: Booking past end time + 30min, not marked completed
  → Cron marks as no_show, sends follow-up next day
□ WhatsApp booking flow: keyword → provider list → select → slot list → select → confirmed
□ WhatsApp booking flow: Uses correct vertical labels throughout
□ WhatsApp booking flow: Timeout after 10 min → clean reset
□ TENANT ISOLATION: Cannot book with another tenant's provider
□ PERMISSION: Staff with bookings.view_own only sees their provider's bookings
□ PERMISSION: Manager with bookings.view_all sees all bookings
```

**Concurrency stress test:**
```typescript
// This test is CRITICAL for data integrity
test('concurrent booking prevents double-booking', async () => {
  const slot = '2026-04-23T10:00:00Z';
  
  // Simulate 10 concurrent booking requests for the same slot
  const results = await Promise.all(
    Array.from({ length: 10 }, () =>
      api.post('/v1/bookings', {
        providerId: 'provider-1',  // generic, not 'dr-sharma'
        contactId: randomContact(),
        startsAt: slot,
        endsAt: addMinutes(slot, 30),
      })
    )
  );
  
  const successes = results.filter(r => r.status === 201);
  const conflicts = results.filter(r => r.status === 409);
  
  expect(successes).toHaveLength(1);  // EXACTLY one success
  expect(conflicts).toHaveLength(9);   // All others rejected
});
```

### Definition of Done
- [ ] Provider schedule management working (with vertical-appropriate labels)
- [ ] Slot calculation accurate (handles configurable duration, breaks, holidays)
- [ ] Manual booking from dashboard working
- [ ] WhatsApp booking flow end-to-end (uses verticalConfig labels)
- [ ] Double-booking provably impossible (concurrency test passes)
- [ ] Auto-reminders fire at correct times
- [ ] Cancel/reschedule works, frees up slots
- [ ] No-show auto-detection working
- [ ] Permission checks: staff sees own bookings, manager sees all

---

## Step 7: Campaign & Broadcast Engine

### What to Build
- Campaign creation wizard (name → template → segment → schedule)
- Segment builder (filter contacts by tags)
- Campaign execution engine (batched, rate-limited)
- Real-time progress tracking
- Campaign analytics (sent, delivered, read, failed)
- Pause/Resume/Cancel functionality

### Testing for Step 7

```
□ Create campaign with segment → correct contact count shown
□ Segment by tag → only tagged contacts included
□ Segment excludes opted-out contacts automatically
□ Schedule campaign for future → status='scheduled', sends at correct time
□ Start campaign → messages queued in batches of 100
□ Rate limiting → max 80 messages/second to Meta API
□ Campaign progress → real-time count updates (via WebSocket)
□ Pause campaign → stops sending, remaining contacts not processed
□ Resume campaign → continues from where it paused
□ Cancel campaign → status='cancelled', unsent messages discarded
□ Campaign analytics: sent/delivered/read/failed counts accurate
□ Failed messages → visible in campaign logs with error reason
□ Campaign to 1000 contacts → completes in <15 seconds (at 80msg/sec)
□ Large campaign (10K) → completes without memory issues (streaming, not load-all)
□ Duplicate prevention: Same contact not messaged twice in one campaign
□ QUOTA CHECK: Campaign blocked if tenant's daily limit exceeded
□ TENANT ISOLATION: Cannot use another tenant's template or contacts
```

---

## Step 8: Tenant Dashboard & Analytics

### What to Build
- Overview dashboard (today's KPIs)
- Message volume chart (7d/30d)
- Booking statistics (booked, no-show rate)
- Campaign performance summary
- Contact growth trend
- Role-based visibility (staff sees own metrics, manager/owner sees all)

### Testing for Step 8

```
□ Dashboard loads in <2 seconds (performance budget)
□ KPI cards show correct numbers (verified against raw DB query)
□ Message chart: Data points match actual message counts per day
□ No-show rate calculation: Correct formula (no_shows / total booked)
□ Analytics are tenant-scoped (CRITICAL: no cross-tenant data leakage)
□ Date range filter works (7d, 30d, custom)
□ Dashboard with zero data → shows empty state, not errors
□ Dashboard caching: Same request within 30s → served from cache (Redis)
□ CSV export → Downloaded file matches on-screen data
□ PERMISSION: Staff without analytics.view → 403
□ PERMISSION: Staff with analytics.view → only sees own metrics
□ PERMISSION: Manager/Owner → sees all tenant metrics
```

---

## Step 9: Billing & Subscription

### What to Build
- Plan selection page
- Razorpay subscription integration
- Webhook for payment events
- Invoice generation (GST compliant)
- Usage tracking (messages, contacts against plan limits)
- Trial expiry handling
- Upgrade/downgrade flow

### Testing for Step 9

```
□ Razorpay (TEST MODE): Subscription created → subscription_id stored
□ Payment success webhook → plan updated, plan_expires_at set
□ Payment failed webhook → grace period starts (7 days)
□ Payment failed after grace → account suspended (features restricted)
□ Trial expiry: After 14 days → prompt to subscribe, features limited
□ Plan limits enforced: Starter plan (5000 msgs) → 5001st message blocked
□ Contact limits enforced: Starter (500 contacts) → 501st shows upgrade prompt
□ Invoice generated → Has correct GST details, downloadable PDF
□ Upgrade: Plan change takes effect immediately, prorated
□ Downgrade: Takes effect at period end, features available until then
□ Razorpay webhook signature → Verified (reject tampered callbacks)
□ CRITICAL: Billing state change is transactional (no partial updates)
```

---

## Step 10: Settings & Team Management

### What to Build
- Business hours configuration
- Auto-reply message configuration
- WhatsApp Business account linking
- Team member invite/remove (with granular role selection)
- Permission management (Owner can customize staff permissions)
- Vertical config editor (change provider/booking/customer labels)
- Notification preferences

### Testing for Step 10

```
□ Set business hours → Auto-reply sends outside these hours
□ Auto-reply message customization → Correct template sent
□ WhatsApp account linking → wa_phone_id and token stored (encrypted)
□ Invite team member → WhatsApp invite sent, User record created (isActive: false)
□ Invited staff verifies OTP → User activated, joins tenant with assigned role
□ Remove team member → User deactivated (isActive: false), tokens revoked, can't log in
□ Role assignment: Can invite as admin, manager, or staff (NOT owner)
□ Role permissions: Staff can't access billing page (requires billing.view)
□ Role permissions: Staff can't delete contacts (requires contacts.delete)
□ Role permissions: Admin can do everything except billing.manage
□ Role permissions: Owner has full access
□ Permission override: Owner grants contacts.delete to specific staff → staff can now delete
□ Permission override: Owner revokes inbox.view_all from manager → manager sees only assigned
□ Vertical config: Change providerLabel from 'Doctor' to 'Consultant' → UI updates everywhere
□ Vertical config: Change bookingLabel from 'Appointment' to 'Session' → UI + WhatsApp updates
□ SECURITY: Staff cannot elevate own role via API manipulation
□ SECURITY: Only users with team.manage permission can invite/remove
□ SECURITY: Cannot invite a user who belongs to ANOTHER tenant
```

---

## Step 11: Super Admin Panel

### What to Build
- Separate Next.js app (`apps/admin`) at `admin.yourcrm.in`
- Email + password authentication (separate from tenant OTP auth)
- Platform dashboard (total tenants, MRR, active users, message volume)
- Tenant management (list, search, filter, view details)
- Tenant actions (suspend, activate, delete — with audit logging)
- Impersonate tenant (login as tenant admin for support — audit-logged, time-limited)
- Plan & pricing management (create/edit plans, change limits)
- Business vertical management (add/edit vertical presets)
- System health monitoring (API latency, queue depth, error rates)
- Feature flags (enable/disable features per tenant or globally)
- Platform announcements (broadcast to all tenants)
- Audit log viewer (all platform-level actions)

### How to Build

**App structure:**
```
apps/admin/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx        ← Email + password login
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx              ← Platform overview dashboard
│   │   │   ├── tenants/
│   │   │   │   ├── page.tsx          ← Tenant list (search, filter, sort)
│   │   │   │   └── [id]/page.tsx     ← Tenant detail (usage, billing, actions)
│   │   │   ├── plans/page.tsx        ← Plan management
│   │   │   ├── verticals/page.tsx    ← Business vertical presets
│   │   │   ├── health/page.tsx       ← System health dashboard
│   │   │   ├── audit-log/page.tsx    ← Platform audit log
│   │   │   └── announcements/page.tsx ← Broadcast announcements
│   │   └── layout.tsx
│   └── lib/
│       ├── admin-api.ts              ← API client for /admin/* routes
│       └── auth.ts                   ← Admin auth helpers
```

**Key implementation patterns:**

```typescript
// Tenant list with search, filter, and sort
// GET /admin/tenants?search=glow&vertical=salon&status=active&sort=createdAt&page=1

// Tenant detail view
// GET /admin/tenants/:id
// Returns: tenant info + usage stats (contacts, messages, bookings)
//          + billing info (plan, expiry, revenue)
//          + user count + last active
// Does NOT return: message content, contact details, booking specifics

// Suspend tenant (with audit)
// POST /admin/tenants/:id/suspend { reason: "Payment overdue" }
// → Sets tenant.status = 'suspended'
// → Sets tenant.suspendedBy = adminId
// → Logs to platform_audit_log
// → Sends notification to tenant owner
// → All tenant users see "Account suspended" banner

// View tenant data directly (no impersonation needed)
// GET /admin/tenants/:id/messages      → All conversations + messages
// GET /admin/tenants/:id/contacts       → All contacts with full details
// GET /admin/tenants/:id/bookings       → All bookings
// GET /admin/tenants/:id/export         → Full data export (CSV/JSON)
// → Every access logged to platform_audit_log

// Impersonate tenant (for taking actions AS the tenant)
// POST /admin/tenants/:id/impersonate
// → Creates time-limited tenant JWT (30-min max)
// → Logs to platform_audit_log with action='tenant.impersonate'
// → Admin sees tenant's dashboard with "Impersonation Mode" banner
// → CAN: view + send messages, manage contacts, create bookings, change settings
// → CANNOT: delete tenant, change billing/plan (use admin panel for that)
// → All actions taken during impersonation are audit-logged
```

### Testing for Step 11

**Unit Tests:**
```
□ Admin auth: Valid email+password → JWT with type='super_admin'
□ Admin auth: Wrong password → 401 (generic "Invalid credentials")
□ Admin auth: Nonexistent email → 401 (same error, prevents enumeration)
□ Admin JWT: Contains adminId, role, type='super_admin'
□ Admin JWT: Uses separate secret (JWT_ADMIN_SECRET)
```

**Integration Tests:**
```
□ GET /admin/tenants → Returns all tenants with usage stats
□ GET /admin/tenants?search=glow → Filters by tenant name
□ GET /admin/tenants?vertical=salon → Filters by business type
□ GET /admin/tenants/:id → Returns full tenant details (usage, billing, config)
□ GET /admin/tenants/:id/messages → Returns all conversations + messages
□ GET /admin/tenants/:id/contacts → Returns all contacts with full details
□ GET /admin/tenants/:id/bookings → Returns all bookings
□ GET /admin/tenants/:id/export → Full data export (CSV/JSON)
□ All data access → logged to platform_audit_log
□ POST /admin/tenants/:id/suspend → Status changed, audit log created
□ POST /admin/tenants/:id/activate → Status changed back to active
□ POST /admin/tenants/:id/impersonate → Time-limited tenant JWT issued
□ Impersonation: Can view + send messages, manage contacts, change settings
□ Impersonation: CANNOT delete tenant or change billing (use admin panel)
□ Impersonation: All actions audit-logged with admin identity
□ Impersonation: JWT expires after 30 minutes
□ Audit log: All admin actions logged (suspend, activate, impersonate)
□ Platform dashboard: Total tenants, MRR, active users → correct numbers
□ Plan management: Create new plan → available for tenants
□ Plan management: Edit plan limits → existing tenants grandfathered
□ Feature flags: Disable feature for tenant → tenant can't access it
□ Announcements: Broadcast → appears for all active tenants
```

**Security Tests:**
```
□ Tenant JWT cannot access /admin/* routes → 401
□ Admin JWT cannot access /v1/* tenant routes → 403
□ Support-role admin cannot suspend tenants (only super_admin can)
□ Viewer-role admin can only read, not modify
□ Admin password stored as bcrypt (not plaintext)
□ Failed admin login attempts rate-limited (5 per 15 min)
□ Impersonation: Audit log shows WHO impersonated, WHEN, WHAT they accessed
□ Impersonation: Cannot impersonate from non-super_admin role
□ AUDIT: Every tenant data access (messages, contacts, bookings) is logged
□ AUDIT: Export actions logged with admin identity + timestamp
□ ROLE: Support-role admin can VIEW data but cannot export or impersonate
□ ROLE: Viewer-role admin can only see aggregate dashboard, not raw tenant data
```

### Definition of Done
- [ ] Admin panel is a separate Next.js app (apps/admin)
- [ ] Email + password login working (separate from tenant OTP)
- [ ] Platform dashboard shows correct metrics
- [ ] Tenant list with search, filter, sort, pagination
- [ ] Suspend / Activate with audit logging
- [ ] Direct tenant data access working (messages, contacts, bookings, export)
- [ ] All data access audit-logged
- [ ] Impersonate mode working (full access, time-limited, audit-logged)
- [ ] Plan management CRUD
- [ ] Feature flags working per-tenant
- [ ] Audit log records all admin actions
- [ ] Security: Cross-context auth impossible (tenant ↔ admin)

---

## Step 12: Production Deployment

### What to Build
- Terraform infrastructure (VPC, ECS, RDS, Redis, S3, ALB)
- Production Docker images (multi-stage, minimal)
- GitHub Actions CD pipeline
- SSL setup (Cloudflare)
- Monitoring stack (Grafana, alerts)
- Backup configuration
- Migration strategy

### Testing for Step 12

```
□ Terraform plan → No errors, expected resources created
□ Docker images build → Under 200MB each
□ Health check endpoints respond correctly
□ SSL certificate valid (https://yourdomain.in)
□ Database migration runs on production DB
□ Seed data NOT deployed to production (verify empty)
□ Environment variables set (not defaults or test values)
□ Monitoring: Grafana dashboard shows metrics
□ Alerting: Test alert fires → Slack notification received
□ Backup: RDS automated backup configured (7-day retention)
□ Backup VERIFIED: Restore from backup to staging → data intact
□ Load test: 100 concurrent users → P99 < 500ms
□ Deployment: Push new version → zero downtime (rolling update)
□ Rollback: Bad deployment → previous version restored in <2min
□ Meta webhook → Points to production URL, receiving events
□ Razorpay → Production keys configured (not test mode!)
□ Sentry → Errors appearing in dashboard
```

---

# PART C — TESTING PLAYBOOK

---

## 18. Testing Philosophy

### 18.1 Guiding Principles

```
1. TEST WHAT MATTERS, NOT EVERYTHING
   ├── Business logic (appointment booking, campaign sends) → Test heavily
   ├── Data integrity (tenant isolation, no double-booking) → Test exhaustively
   ├── External integrations (Meta API) → Mock & test contract
   └── UI layout/styling → Test minimally (visual review)

2. TEST PYRAMID (Ratio Target)
   ┌──────────────────┐
   │   E2E     (10%)  │  5-10 critical user journeys
   ├──────────────────┤
   │ Integration(30%) │  API routes, DB operations, queue jobs
   ├──────────────────┤
   │  Unit      (60%) │  Services, utilities, pure functions
   └──────────────────┘

3. EVERY BUG GETS A TEST
   When you find a bug → write a failing test FIRST → then fix

4. CRITICAL PATHS MUST HAVE INTEGRATION TESTS
   ├── Auth flow
   ├── Send/receive message
   ├── Book slot (concurrent) — any vertical
   ├── Campaign execution
   └── Billing state transitions

5. TENANT ISOLATION IS A FIRST-CLASS TEST CONCERN
   Every data-fetching function needs a test that verifies
   Tenant A cannot see Tenant B's data.
```

### 18.2 What We Do NOT Test

```
× Don't test Prisma's query builder (it's tested by Prisma)
× Don't test Fastify's routing (it's tested by Fastify)
× Don't test React rendering of standard HTML (React's job)
× Don't test third-party library internals
× Don't write UI snapshot tests (fragile, low value)
× Don't test private functions directly (test through public API)
```

---

## 19. Test Infrastructure Setup

### 19.1 Tools

| Tool | Purpose | Install |
|------|---------|---------|
| **Vitest** | Unit + integration test runner | `pnpm add -D vitest` |
| **Testcontainers** | Spin up real PostgreSQL + Redis for integration tests | `pnpm add -D testcontainers @testcontainers/postgresql @testcontainers/redis` |
| **MSW (Mock Service Worker)** | Mock Meta API, Razorpay API in tests | `pnpm add -D msw` |
| **Supertest** | HTTP assertion for Fastify routes | `pnpm add -D supertest` |
| **Faker** | Generate realistic test data | `pnpm add -D @faker-js/faker` |
| **Playwright** | E2E browser tests | `pnpm add -D @playwright/test` |
| **k6** | Load/performance testing | Install binary from k6.io |

### 19.2 Test Configuration

```typescript
// vitest.config.ts (root)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      exclude: [
        'node_modules',
        '**/*.config.*',
        '**/seed.ts',
        '**/*.d.ts',
      ],
    },
    // Separate unit and integration tests
    include: ['**/*.test.ts', '**/*.spec.ts'],
  },
});
```

### 19.3 Test Database Setup (Testcontainers)

```typescript
// test/setup.ts — Shared setup for integration tests

import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

let pgContainer: StartedPostgreSqlContainer;
let redisContainer: StartedRedisContainer;
let prisma: PrismaClient;

beforeAll(async () => {
  // Start real PostgreSQL in Docker (isolated per test suite)
  pgContainer = await new PostgreSqlContainer('timescale/timescaledb:latest-pg16')
    .withDatabase('test_db')
    .start();

  // Start real Redis in Docker
  redisContainer = await new RedisContainer().start();

  // Set env vars for Prisma
  process.env.DATABASE_URL = pgContainer.getConnectionUri();
  process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getPort()}`;

  // Run migrations against test DB
  execSync('pnpm prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: pgContainer.getConnectionUri() },
  });

  // Create Prisma client
  prisma = new PrismaClient({ datasources: { db: { url: pgContainer.getConnectionUri() } } });
}, 60000); // 60s timeout for container start

afterAll(async () => {
  await prisma.$disconnect();
  await pgContainer.stop();
  await redisContainer.stop();
});

// Export for use in test files
export { prisma, pgContainer, redisContainer };
```

### 19.4 Mock Setup (Meta API)

```typescript
// test/mocks/meta-api.ts — Mock WhatsApp Cloud API responses

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const metaApiMocks = [
  // Mock: Send message success
  http.post('https://graph.facebook.com/v18.0/:phoneId/messages', () => {
    return HttpResponse.json({
      messaging_product: 'whatsapp',
      contacts: [{ input: '+919876543210', wa_id: '919876543210' }],
      messages: [{ id: 'wamid.test123' }],
    });
  }),

  // Mock: Get media URL
  http.get('https://graph.facebook.com/v18.0/:mediaId', () => {
    return HttpResponse.json({
      url: 'https://lookaside.fbsbx.com/whatsapp_business/test-media',
      mime_type: 'image/jpeg',
      sha256: 'abc123',
      file_size: 12345,
    });
  }),
];

export const mockMetaApi = setupServer(...metaApiMocks);
```

### 19.5 Test File Naming Convention

```
src/
├── services/
│   ├── contact.service.ts           ← Source code
│   ├── contact.service.test.ts      ← Unit tests (mocked dependencies)
│   └── contact.service.spec.ts      ← Integration tests (real DB)
├── routes/
│   ├── contacts.routes.ts
│   └── contacts.routes.spec.ts      ← Route integration tests
└── utils/
    ├── phone.ts
    └── phone.test.ts                ← Pure unit tests
```

---

## 20. Test Plan Per Step

### 20.1 Master Test Checklist

This is the complete test checklist across all steps. Print this, check items as you pass them.

```
STEP 0: PROJECT SCAFFOLDING
├── □ All apps compile (pnpm turbo build)
├── □ Lint passes (pnpm turbo lint)
├── □ Docker services start (docker compose up)
├── □ CI pipeline green on GitHub
└── □ Health endpoint returns 200

STEP 1: DATABASE
├── □ Migrations run cleanly
├── □ Seed data inserted (super admin + 2 multi-vertical tenants)
├── □ super_admins table created with seeded admin
├── □ Unique constraints enforced (duplicate phone rejected)
├── □ Exclusion constraint works (overlapping booking rejected)
├── □ Indexes used for common queries (EXPLAIN ANALYZE)
├── □ verticalConfig populated from VERTICAL_PRESETS
└── □ Prisma types compile correctly (incl. SuperAdmin, Booking)

STEP 2: AUTH (3-Tier)
├── □ Super Admin: Email+password login → JWT with type='super_admin'
├── □ OTP send: Code generated and stored in Redis
├── □ OTP verify: Correct code → JWT issued with type='tenant'
├── □ OTP verify: Wrong code → attempt incremented
├── □ OTP verify: Expired → AUTH_OTP_EXPIRED
├── □ OTP verify: 5 failures → locked out (429)
├── □ JWT: Contains correct claims (userId, tenantId, role, type)
├── □ JWT: Expired → AUTH_TOKEN_EXPIRED (401)
├── □ JWT: Tampered → AUTH_TOKEN_INVALID (401)
├── □ JWT: Missing → AUTH_TOKEN_MISSING (401)
├── □ JWT: Tenant token on admin route → 403
├── □ JWT: Admin token on tenant route → 403
├── □ Refresh: New access token issued
├── □ Logout: Refresh token invalidated
├── □ New user: Tenant + User created with vertical config
├── □ Team invite: Staff joins correct tenant on OTP verify
├── □ Permission: Staff blocked from admin-only endpoints
├── □ Rate limit: 6th OTP in 1 hour → blocked
└── □ SECURITY: OTP never appears in logs

STEP 3: WHATSAPP API
├── □ Phone normalization: 6 formats → E.164
├── □ Phone normalization: Invalid → null
├── □ Webhook signature: Valid → passes
├── □ Webhook signature: Invalid → rejected 401
├── □ Send text: Message stored, status=sent
├── □ Send template: Correct API payload
├── □ Receive text: Contact + Conversation + Message created
├── □ Receive image: Media downloaded to S3
├── □ Status webhook: delivered, read, failed updates
├── □ Deduplication: Same webhook processed once only
├── □ 24h window: Detected and tracked in Redis
└── □ Manual test: Real message sent/received on WhatsApp

STEP 4: CONTACTS
├── □ CRUD: Create, Read, Update, Delete (soft)
├── □ Duplicate phone → 409 CONTACT_DUPLICATE
├── □ CSV import 100 rows → All imported
├── □ CSV import with duplicates → Handled correctly
├── □ CSV import progress → Accurate real-time updates
├── □ Search by name → Case-insensitive match
├── □ Search by phone → Partial match
├── □ Filter by tag → Correct results
├── □ Pagination → Cursor-based, correct order
├── □ Opt-out flag → Excluded from sends
└── □ ISOLATION: Tenant A cannot see Tenant B contacts

STEP 5: INBOX
├── □ Conversation list: Sorted by last message
├── □ Chat thread: Paginated, newest first
├── □ Reply: Message sent via WhatsApp
├── □ Real-time: New message appears instantly (WebSocket)
├── □ Status update: Ticks update in real-time
├── □ Unread count: Correct increment/reset
├── □ Assignment: Conversation assigned to staff
├── □ Status: Open → Resolved workflow
├── □ WS auth: Invalid token → connection rejected
├── □ WS isolation: Tenant A events NOT seen by Tenant B
└── □ Mobile: Inbox usable on 360px screen

STEP 6: BOOKINGS (Multi-Vertical)
├── □ Provider CRUD: Working hours saved correctly
├── □ Slot generation: Correct available slots (configurable duration)
├── □ Slot generation: Respects breaks & holidays
├── □ Manual booking: Creates booking
├── □ WhatsApp booking: Full interactive flow works
├── □ WhatsApp booking: Uses vertical-specific labels
├── □ Double-booking: IMPOSSIBLE (concurrency test!)
├── □ Reminder 24h: Fires at correct time
├── □ Reminder 2h: Fires at correct time
├── □ Cancel: Slot freed, available again
├── □ Reschedule: Old cancelled, new created
├── □ No-show: Auto-detected, follow-up sent
├── □ PERMISSION: Staff sees own bookings, Manager sees all
└── □ ISOLATION: Cannot book with other tenant's provider

STEP 7: CAMPAIGNS
├── □ Create campaign: Template + segment selected
├── □ Contact count accurate (excludes opted-out)
├── □ Execution: Messages queued in batches
├── □ Rate limiting: Max 80/sec
├── □ Progress: Real-time tracking
├── □ Pause: Stops sending
├── □ Resume: Continues from pause point
├── □ Cancel: Remaining discarded
├── □ Analytics: Sent/delivered/read/failed counts
├── □ Failed retry: Button to retry failed messages
├── □ 10K campaign: Completes without timeout/OOM
└── □ ISOLATION: Cannot use other tenant's templates

STEP 8: DASHBOARD
├── □ KPIs: Correct numbers
├── □ Charts: Data matches DB
├── □ Performance: Loads in <2s
├── □ Empty state: No crash with zero data
├── □ Caching: Subsequent load <200ms
└── □ ISOLATION: Only current tenant's analytics

STEP 9: BILLING
├── □ Subscription: Created via Razorpay
├── □ Payment success: Plan activated
├── □ Payment failure: Grace period
├── □ Trial expiry: Features limited
├── □ Plan limits: Enforced (messages + contacts)
├── □ Invoice: GST correct, downloadable
├── □ Upgrade: Immediate effect
└── □ Webhook: Razorpay signature verified

STEP 10: SETTINGS
├── □ Business hours: Configurable
├── □ Auto-reply: Works outside hours
├── □ Team invite: WhatsApp invite → OTP verify → user activated
├── □ Team remove: Login blocked, tokens revoked
├── □ RBAC: Staff restricted, Owner full access
├── □ Permission overrides: Owner can grant/revoke per user
├── □ Vertical config: Labels editable, UI updates
└── □ SECURITY: Cannot self-elevate role

STEP 11: SUPER ADMIN PANEL
├── □ Admin login: Email + password → JWT
├── □ Platform dashboard: Correct metrics
├── □ Tenant list: Search, filter, sort working
├── □ Tenant detail: Full data access (messages, contacts, bookings)
├── □ Data access: Every view/export audit-logged
├── □ Suspend/Activate: Works, audit-logged
├── □ Impersonate: Full access, time-limited, audit-logged
├── □ Plan management: Create/edit plans
├── □ Feature flags: Per-tenant toggles
├── □ SECURITY: Tenant token → 401 on admin routes
└── □ SECURITY: Admin roles enforced (viewer can't modify)

STEP 12: PRODUCTION
├── □ Infrastructure: All resources created
├── □ SSL: Valid certificate
├── □ Health checks: All passing
├── □ Monitoring: Metrics visible
├── □ Alerting: Test alert works
├── □ Backup: Restore verified
├── □ Load test: 100 users, P99 <500ms
├── □ Deployment: Zero downtime
├── □ Rollback: Works in <2min
└── □ Meta webhook: Connected to production
```

---

## 21. Performance & Load Testing

### 21.1 k6 Load Test Scripts

```javascript
// tests/load/api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },    // Ramp up
    { duration: '3m', target: 50 },    // Steady state
    { duration: '1m', target: 100 },   // Peak
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<500'],  // ms
    http_req_failed: ['rate<0.01'],                   // <1% errors
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const TOKEN = __ENV.API_TOKEN;

export default function () {
  const headers = { Authorization: `Bearer ${TOKEN}` };

  // Simulate real user pattern
  const r1 = http.get(`${BASE_URL}/v1/conversations`, { headers });
  check(r1, { 'conversations 200': (r) => r.status === 200 });

  sleep(1);

  const r2 = http.get(`${BASE_URL}/v1/contacts?limit=20`, { headers });
  check(r2, { 'contacts 200': (r) => r.status === 200 });

  sleep(0.5);

  const r3 = http.get(`${BASE_URL}/v1/bookings/slots?date=2026-04-22`, { headers });
  check(r3, { 'booking slots 200': (r) => r.status === 200 });

  sleep(2);
}
```

### 20.2 Performance Benchmarks to Hit

| Endpoint | Target P95 | Target P99 | Concurrent Users |
|----------|-----------|-----------|-----------------|
| GET /v1/conversations | 150ms | 300ms | 100 |
| GET /v1/contacts (list) | 200ms | 400ms | 100 |
| POST /v1/messages/send | 100ms | 200ms | 50 |
| GET /v1/appointments/slots | 200ms | 350ms | 50 |
| GET /v1/analytics/overview | 300ms | 500ms | 50 |
| WebSocket connect | 500ms | 1000ms | 200 |

---

## 22. Security Testing

### 22.1 OWASP Top 10 Checklist (Manual)

```
□ A01 Broken Access Control
  ├── Test: Change tenant_id in URL → should get 403/404
  ├── Test: Staff access admin-only endpoint → 403
  ├── Test: Modify JWT claims (tamper tenantId) → rejected
  ├── Test: Tenant JWT on /admin/* routes → 401
  ├── Test: Admin JWT on /v1/* tenant routes → 403
  ├── Test: Staff without contacts.delete permission → 403
  ├── Test: Impersonate mode → all actions audit-logged with admin identity
  ├── Test: Support-role admin → can view but not export or impersonate
  └── Test: Access resource by guessing UUID → not found (not forbidden, to prevent enumeration)

□ A02 Cryptographic Failures
  ├── Verify: WhatsApp access tokens encrypted in DB (not plaintext)
  ├── Verify: JWT secret is strong (>256 bits) and from Secrets Manager
  ├── Verify: No sensitive data in logs (grep logs for phone numbers, tokens)
  └── Verify: HTTPS enforced (HTTP redirects to HTTPS)

□ A03 Injection
  ├── Test: SQL injection in search params → rejected by Prisma parameterization
  ├── Test: NoSQL injection in JSONB field → handled safely
  ├── Test: XSS in contact name → escaped in UI (React does this automatically)
  └── Test: eval() not used anywhere in codebase (grep for it)

□ A04 Insecure Design
  ├── Verify: OTP brute-force protection (max attempts + cooldown)
  ├── Verify: Appointment booking has race condition protection
  └── Verify: Campaign sending respects rate limits

□ A05 Security Misconfiguration
  ├── Verify: CORS allows only specific origins (not *)
  ├── Verify: Stack traces not returned in production error responses
  ├── Verify: Debug mode off in production
  └── Verify: Docker containers run as non-root user

□ A07 Identification & Authentication Failures
  ├── Verify: JWT has reasonable expiry (15 min tenant access, 30 min admin access)
  ├── Verify: Separate JWT secrets for tenant vs admin (JWT_SECRET ≠ JWT_ADMIN_SECRET)
  ├── Verify: Refresh token rotated on use
  ├── Verify: Logout actually invalidates tokens
  ├── Verify: Super Admin passwords bcrypt (cost ≥12)
  └── Verify: No default credentials in production

□ A08 Software & Data Integrity
  ├── Verify: Webhook signature verification (Meta + Razorpay)
  ├── Verify: npm audit has no high/critical vulnerabilities
  └── Verify: Only signed Docker images deployed

□ A09 Security Logging & Monitoring
  ├── Verify: Failed auth attempts are logged
  ├── Verify: Suspicious patterns trigger alerts (many 401s)
  └── Verify: Logs cannot be tampered with (write-only to Loki)

□ A10 Server-Side Request Forgery (SSRF)
  ├── Verify: Media download URL validated (only Meta's CDN domains)
  └── Verify: No user-controlled URLs passed to server-side HTTP client
```

---

## 23. Pre-Launch Verification

### 23.1 Final Checklist (48 Hours Before First Customer)

```
INFRASTRUCTURE
├── □ Production DB running (Multi-AZ)
├── □ Redis cluster healthy
├── □ All ECS services running + healthy
├── □ SSL certificate valid (check expiry date)
├── □ DNS resolving correctly
├── □ Cloudflare WAF rules active
├── □ No test/default credentials in production env

DATA
├── □ Production DB is EMPTY (no seed data!)
├── □ Migrations are up to date
├── □ Backup configured and tested (restore drill complete)

WHATSAPP
├── □ Meta Business verified (green badge)
├── □ Production phone number linked
├── □ At least 5 templates approved
├── □ Webhook URL pointing to production
├── □ Test: Send + receive working on production

BILLING
├── □ Razorpay in LIVE mode (not test)
├── □ Plans configured at correct prices
├── □ GST details in invoice template correct

MONITORING
├── □ All Grafana dashboards loading data
├── □ Alert channels (Slack) connected
├── □ Sentry receiving errors (trigger intentional test error)
├── □ Uptime monitor configured (Better Uptime)
├── □ Status page live (status.yourdomain.in)

SECURITY
├── □ OWASP checklist complete (Section 21)
├── □ Rate limiting active
├── □ CORS allowlisted correctly
├── □ Secrets in AWS Secrets Manager (not .env file)

PRODUCT
├── □ Signup flow: new user → tenant created → dashboard accessible
├── □ Send first message in <10 minutes of signup
├── □ Book first slot via WhatsApp (any vertical)
├── □ Mobile responsive (test on actual phone)
├── □ Super Admin panel accessible at admin.yourcrm.in

LEGAL
├── □ Terms of Service accessible from signup page
├── □ Privacy Policy accessible
├── □ Cookie consent (if applicable — minimal for our case)

SUPPORT
├── □ Help center live (even if 5 articles)
├── □ Support WhatsApp number working
├── □ Onboarding video recorded (2-3 minutes)

GO-TO-MARKET
├── □ Landing page live
├── □ 5 beta businesses identified (mix of verticals) and scheduled for onboarding
├── □ Pitch deck ready (use TDD document)
```

### 23.2 Smoke Test Script (Run After Every Deployment)

```
This automated script runs after every production deployment:

1. GET /health → expect 200 { status: "healthy" }
2. GET /health/ready → expect 200 (DB + Redis connected)
3. POST /v1/auth/otp/send (test phone) → expect 200
4. POST /v1/auth/otp/verify (test code) → expect 200 + tokens
5. GET /v1/conversations (with token) → expect 200 + array
6. GET /v1/contacts (with token) → expect 200 + array
7. GET /v1/analytics/overview → expect 200 + KPI data

If any step fails → auto-rollback to previous version + alert team
Total execution: <30 seconds
```

---

## Appendix: Daily Development Workflow

```
1. START OF DAY
   ├── Pull latest from main
   ├── docker compose up -d (ensure services running)
   ├── pnpm dev (start all apps in dev mode)
   └── Open: Browser (localhost:3000) + API client + DB viewer

2. BEFORE CODING
   ├── Read this guide's section for the current Step
   ├── Review acceptance criteria / tests for the feature
   └── Create a Git branch: feat/step-2-auth or fix/otp-rate-limit

3. WHILE CODING
   ├── Write test FIRST (or at least alongside code)
   ├── Run tests frequently: pnpm test --watch
   ├── Commit often: conventional commits (feat:, fix:, test:)
   └── Log decisions: "Why did I choose X over Y?" in code comments

4. BEFORE COMMITTING
   ├── pnpm turbo lint (auto-fixed by Husky, but verify)
   ├── pnpm turbo test (all tests pass)
   ├── Manual test: Does it work in browser/Postman?
   └── git push → CI pipeline should pass

5. END OF DAY
   ├── Push your branch
   ├── Note where you stopped (in a TODO comment or doc)
   ├── Update the progress tracker in this document
   └── docker compose stop (save resources)
```

---

## Appendix: Progress Tracker

Update as you complete each step:

```
Step 0:  Project Scaffolding       [  ] Not Started  [  ] In Progress  [  ] Complete
Step 1:  Database Schema           [  ] Not Started  [  ] In Progress  [  ] Complete
Step 2:  Authentication            [  ] Not Started  [  ] In Progress  [  ] Complete
Step 3:  WhatsApp Integration      [  ] Not Started  [  ] In Progress  [  ] Complete
Step 4:  Contact Management        [  ] Not Started  [  ] In Progress  [  ] Complete
Step 5:  Conversation Inbox        [  ] Not Started  [  ] In Progress  [  ] Complete
Step 6:  Appointment System        [  ] Not Started  [  ] In Progress  [  ] Complete
Step 7:  Campaign Engine           [  ] Not Started  [  ] In Progress  [  ] Complete
Step 8:  Dashboard & Analytics     [  ] Not Started  [  ] In Progress  [  ] Complete
Step 9:  Billing                   [  ] Not Started  [  ] In Progress  [  ] Complete
Step 10: Settings & Team           [  ] Not Started  [  ] In Progress  [  ] Complete
Step 11: Production Deployment     [  ] Not Started  [  ] In Progress  [  ] Complete
```

---

*Document Last Updated: April 22, 2026*
*Reference: Technical_Design_Document.md (TDD-2026-001 v2.0)*
