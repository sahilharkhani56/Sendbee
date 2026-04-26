// ─── Permission Constants ─────────────────────────────────
// Every action in the system maps to a permission key.
// Roles get a pre-defined set; tenants can override per-user via `permissions` JSONB.

export const PERMISSIONS = {
  // Contacts
  CONTACTS_VIEW: "contacts:view",
  CONTACTS_CREATE: "contacts:create",
  CONTACTS_EDIT: "contacts:edit",
  CONTACTS_DELETE: "contacts:delete",
  CONTACTS_IMPORT: "contacts:import",
  CONTACTS_EXPORT: "contacts:export",

  // Conversations / Chat
  CHAT_VIEW: "chat:view",
  CHAT_SEND: "chat:send",
  CHAT_ASSIGN: "chat:assign",
  CHAT_CLOSE: "chat:close",

  // Bookings
  BOOKINGS_VIEW: "bookings:view",
  BOOKINGS_CREATE: "bookings:create",
  BOOKINGS_EDIT: "bookings:edit",
  BOOKINGS_CANCEL: "bookings:cancel",

  // Providers
  PROVIDERS_VIEW: "providers:view",
  PROVIDERS_MANAGE: "providers:manage",

  // Campaigns
  CAMPAIGNS_VIEW: "campaigns:view",
  CAMPAIGNS_CREATE: "campaigns:create",
  CAMPAIGNS_SEND: "campaigns:send",

  // Templates
  TEMPLATES_VIEW: "templates:view",
  TEMPLATES_MANAGE: "templates:manage",

  // Automation
  AUTOMATION_VIEW: "automation:view",
  AUTOMATION_MANAGE: "automation:manage",

  // Settings & Users
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",
  USERS_VIEW: "users:view",
  USERS_MANAGE: "users:manage",

  // Analytics
  ANALYTICS_VIEW: "analytics:view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Role → Permission Mapping ────────────────────────────

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: Object.values(PERMISSIONS),
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_EDIT,
    PERMISSIONS.CONTACTS_IMPORT,
    PERMISSIONS.CONTACTS_EXPORT,
    PERMISSIONS.CHAT_VIEW,
    PERMISSIONS.CHAT_SEND,
    PERMISSIONS.CHAT_ASSIGN,
    PERMISSIONS.CHAT_CLOSE,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_EDIT,
    PERMISSIONS.BOOKINGS_CANCEL,
    PERMISSIONS.PROVIDERS_VIEW,
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.CAMPAIGNS_CREATE,
    PERMISSIONS.CAMPAIGNS_SEND,
    PERMISSIONS.TEMPLATES_VIEW,
    PERMISSIONS.AUTOMATION_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.USERS_VIEW,
  ],
  staff: [
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_EDIT,
    PERMISSIONS.CHAT_VIEW,
    PERMISSIONS.CHAT_SEND,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_EDIT,
    PERMISSIONS.PROVIDERS_VIEW,
    PERMISSIONS.TEMPLATES_VIEW,
  ],
};

/**
 * Check if a role has a specific permission.
 * Also checks user-level permission overrides (grant/deny).
 */
export function hasPermission(
  role: string,
  permission: Permission,
  userPermissions?: { grant?: string[]; deny?: string[] }
): boolean {
  // Explicit deny always wins
  if (userPermissions?.deny?.includes(permission)) return false;
  // Explicit grant
  if (userPermissions?.grant?.includes(permission)) return true;
  // Role default
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
