// Queue package — BullMQ queue definitions
// Will be implemented in Phase 2 when Redis workers are needed

export const QUEUE_NAMES = {
  WHATSAPP_OUTBOUND: "whatsapp:outbound",
  WHATSAPP_INBOUND: "whatsapp:inbound",
  CAMPAIGN_SEND: "campaign:send",
  NOTIFICATION: "notification",
  BOOKING_REMINDER: "booking:reminder",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
