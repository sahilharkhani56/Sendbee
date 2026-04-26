// ─── Vertical Presets ─────────────────────────────────────
// Each business vertical gets a default configuration.
// Tenant.verticalConfig JSONB stores the actual config (can be customized per tenant).

export interface VerticalPreset {
  label: string;
  description: string;
  features: string[];
  defaultSlotDuration: number;
  bookingEnabled: boolean;
  fields: {
    contact: string[];
    booking: string[];
  };
}

export const VERTICAL_PRESETS: Record<string, VerticalPreset> = {
  clinic: {
    label: "Clinic / Hospital",
    description: "Medical clinics, hospitals, diagnostic centres",
    features: ["appointments", "prescriptions", "patient-records", "reminders"],
    defaultSlotDuration: 20,
    bookingEnabled: true,
    fields: {
      contact: ["blood_group", "allergies", "insurance_id"],
      booking: ["department", "doctor", "symptoms"],
    },
  },
  salon: {
    label: "Salon & Spa",
    description: "Hair salons, beauty parlours, spas",
    features: ["appointments", "service-menu", "stylist-selection", "reminders"],
    defaultSlotDuration: 30,
    bookingEnabled: true,
    fields: {
      contact: ["preferred_stylist", "hair_type"],
      booking: ["services", "stylist"],
    },
  },
  gym: {
    label: "Gym / Fitness",
    description: "Gyms, yoga studios, fitness centres",
    features: ["membership", "class-booking", "trainer-assignment", "reminders"],
    defaultSlotDuration: 60,
    bookingEnabled: true,
    fields: {
      contact: ["membership_type", "trainer", "goals"],
      booking: ["class_name", "trainer"],
    },
  },
  education: {
    label: "Education / Coaching",
    description: "Coaching centres, tutoring, online classes",
    features: ["class-scheduling", "attendance", "fee-reminders", "broadcasts"],
    defaultSlotDuration: 45,
    bookingEnabled: true,
    fields: {
      contact: ["grade", "subjects", "parent_phone"],
      booking: ["subject", "batch"],
    },
  },
  restaurant: {
    label: "Restaurant / Café",
    description: "Restaurants, cafés, cloud kitchens",
    features: ["reservations", "menu-sharing", "order-updates", "feedback"],
    defaultSlotDuration: 60,
    bookingEnabled: true,
    fields: {
      contact: ["dietary_preferences", "vip_tier"],
      booking: ["party_size", "special_requests"],
    },
  },
  realestate: {
    label: "Real Estate",
    description: "Brokers, builders, property managers",
    features: ["site-visits", "lead-tracking", "follow-ups", "document-sharing"],
    defaultSlotDuration: 30,
    bookingEnabled: true,
    fields: {
      contact: ["budget_range", "preferred_location", "property_type"],
      booking: ["property_id", "visit_type"],
    },
  },
  legal: {
    label: "Legal / CA",
    description: "Law firms, chartered accountants, consultants",
    features: ["consultations", "document-collection", "case-tracking", "reminders"],
    defaultSlotDuration: 30,
    bookingEnabled: true,
    fields: {
      contact: ["case_type", "priority"],
      booking: ["case_ref", "consultation_type"],
    },
  },
  repair: {
    label: "Repair / Service",
    description: "Mobile repair, appliance service, auto workshops",
    features: ["job-tracking", "status-updates", "pickup-scheduling", "invoicing"],
    defaultSlotDuration: 30,
    bookingEnabled: true,
    fields: {
      contact: ["device_type", "warranty_status"],
      booking: ["device_model", "issue_description"],
    },
  },
  events: {
    label: "Events / Wedding",
    description: "Event planners, wedding coordinators, photographers",
    features: ["event-scheduling", "vendor-coordination", "guest-management", "updates"],
    defaultSlotDuration: 60,
    bookingEnabled: true,
    fields: {
      contact: ["event_type", "budget_range"],
      booking: ["event_date", "venue", "guest_count"],
    },
  },
  generic: {
    label: "Generic Business",
    description: "Any business not covered above",
    features: ["chat", "contacts", "broadcasts", "reminders"],
    defaultSlotDuration: 30,
    bookingEnabled: false,
    fields: {
      contact: [],
      booking: [],
    },
  },
};
