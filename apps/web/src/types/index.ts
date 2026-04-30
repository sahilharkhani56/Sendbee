export { PERMISSIONS, ROLE_PERMISSIONS, hasPermission, VERTICAL_PRESETS } from "@whatsapp-crm/shared";
export type { Permission, VerticalPreset } from "@whatsapp-crm/shared";

// ─── Frontend-only types ──────────────────────────────────

export class ApiError extends Error {
  code: string;

  constructor({ code, message }: { code: string; message: string }) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  total: number;
}

export interface VerticalConfig {
  providerLabel: string;
  bookingLabel: string;
  customerLabel: string;
  features: string[];
  defaultSlotDuration: number;
}

export type UserRole = "owner" | "admin" | "manager" | "staff";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface AuthTenant {
  id: string;
  name: string;
  vertical: string;
  verticalConfig: VerticalConfig;
  plan: string;
}
