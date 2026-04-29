import type { FastifyBaseLogger } from "fastify";
import { MessageStatus, MessageType, prisma } from "@whatsapp-crm/database";
import { markWebhookMessageProcessed, touchWaSessionWindow } from "./redis";

export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };
        contacts?: Array<{
          wa_id?: string;
          profile?: {
            name?: string;
          };
        }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
          image?: { id?: string; mime_type?: string; caption?: string; sha256?: string };
          document?: {
            id?: string;
            filename?: string;
            mime_type?: string;
            sha256?: string;
            caption?: string;
          };
          audio?: { id?: string; mime_type?: string; sha256?: string };
          video?: { id?: string; mime_type?: string; caption?: string; sha256?: string };
          interactive?: unknown;
          button?: unknown;
          context?: {
            id?: string;
            from?: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: "sent" | "delivered" | "read" | "failed";
          timestamp?: string;
          recipient_id?: string;
          conversation?: {
            id?: string;
            origin?: { type?: string };
          };
          errors?: Array<{ code?: number; title?: string; message?: string }>;
        }>;
      };
    }>;
  }>;
}

type WebhookChange = NonNullable<NonNullable<WhatsAppWebhookPayload["entry"]>[number]["changes"]>[number];
type WebhookChangeValue = NonNullable<WebhookChange["value"]>;
type InboundWebhookMessage = NonNullable<WebhookChangeValue["messages"]>[number];
type WebhookStatusEvent = NonNullable<WebhookChangeValue["statuses"]>[number];

export async function processWhatsAppWebhook(
  payload: WhatsAppWebhookPayload,
  logger: FastifyBaseLogger
): Promise<void> {
  if (!payload.entry?.length) {
    return;
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      if (!phoneNumberId) {
        logger.warn({ entryId: entry.id }, "Skipping webhook change without metadata.phone_number_id");
        continue;
      }

      const tenant = await prisma.tenant.findFirst({
        where: { waPhoneId: phoneNumberId },
        select: { id: true },
      });

      if (!tenant) {
        logger.warn({ phoneNumberId }, "No tenant mapped for WhatsApp phone number id");
        continue;
      }

      const contactNameByWaId = new Map<string, string>();
      for (const contact of value?.contacts ?? []) {
        if (contact.wa_id && contact.profile?.name) {
          contactNameByWaId.set(contact.wa_id, contact.profile.name);
        }
      }

      for (const inboundMessage of value?.messages ?? []) {
        await processInboundMessage(tenant.id, inboundMessage, contactNameByWaId, logger);
      }

      for (const statusEvent of value?.statuses ?? []) {
        await processStatusUpdate(tenant.id, statusEvent);
      }
    }
  }
}

async function processInboundMessage(
  tenantId: string,
  inboundMessage: InboundWebhookMessage,
  contactNameByWaId: Map<string, string>,
  logger: FastifyBaseLogger
): Promise<void> {
  const isNewWebhookEvent = await markWebhookMessageProcessed(inboundMessage.id);
  if (!isNewWebhookEvent) {
    return;
  }

  const existing = await prisma.message.findFirst({
    where: {
      tenantId,
      waMessageId: inboundMessage.id,
    },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  const from = normalizeToE164(inboundMessage.from);
  if (!from) {
    logger.warn({ from: inboundMessage.from }, "Skipping inbound message with invalid sender phone");
    return;
  }

  await touchWaSessionWindow(tenantId, from);

  const profileName = contactNameByWaId.get(inboundMessage.from);
  const contact = await prisma.contact.upsert({
    where: {
      tenantId_phoneE164: {
        tenantId,
        phoneE164: from,
      },
    },
    update: profileName ? { name: profileName } : {},
    create: {
      tenantId,
      phoneE164: from,
      name: profileName,
      tags: ["new"],
    },
  });

  const eventTime = parseWhatsAppTimestamp(inboundMessage.timestamp);

  const conversation = await prisma.conversation.upsert({
    where: {
      tenantId_contactId: {
        tenantId,
        contactId: contact.id,
      },
    },
    update: {
      lastMessageAt: eventTime,
      unreadCount: { increment: 1 },
      status: "open",
    },
    create: {
      tenantId,
      contactId: contact.id,
      lastMessageAt: eventTime,
      unreadCount: 1,
      status: "open",
    },
  });

  const interactiveRaw = serializeUnknown(inboundMessage.interactive);
  const buttonRaw = serializeUnknown(inboundMessage.button);

  await prisma.message.create({
    data: {
      tenantId,
      conversationId: conversation.id,
      direction: "inbound",
      type: mapInboundMessageType(inboundMessage.type),
      waMessageId: inboundMessage.id,
      status: MessageStatus.delivered,
      content: {
        text: inboundMessage.text?.body,
        image: inboundMessage.image,
        document: inboundMessage.document,
        audio: inboundMessage.audio,
        video: inboundMessage.video,
        interactiveRaw,
        buttonRaw,
        context: inboundMessage.context,
        rawType: inboundMessage.type,
      },
      createdAt: eventTime,
    },
  });
}

async function processStatusUpdate(
  tenantId: string,
  statusEvent: WebhookStatusEvent
): Promise<void> {
  const status = mapStatus(statusEvent.status);
  if (!status) {
    return;
  }

  const firstErrorCode = statusEvent.errors?.[0]?.code;

  await prisma.message.updateMany({
    where: {
      tenantId,
      waMessageId: statusEvent.id,
    },
    data: {
      status,
      errorCode: firstErrorCode ? String(firstErrorCode) : null,
      updatedAt: parseWhatsAppTimestamp(statusEvent.timestamp),
    },
  });
}

function mapInboundMessageType(type: string | undefined): MessageType {
  switch (type) {
    case "image":
      return MessageType.image;
    case "document":
      return MessageType.document;
    case "audio":
      return MessageType.audio;
    case "video":
      return MessageType.video;
    case "interactive":
      return MessageType.interactive;
    default:
      return MessageType.text;
  }
}

function mapStatus(status: string): MessageStatus | null {
  switch (status) {
    case "sent":
      return MessageStatus.sent;
    case "delivered":
      return MessageStatus.delivered;
    case "read":
      return MessageStatus.read;
    case "failed":
      return MessageStatus.failed;
    default:
      return null;
  }
}

function parseWhatsAppTimestamp(timestamp: string | undefined): Date {
  const parsed = Number(timestamp);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return new Date();
  }

  return new Date(parsed * 1000);
}

function normalizeToE164(rawPhone: string): string | null {
  const cleaned = rawPhone.replace(/[^\d+]/g, "");
  if (!cleaned) {
    return null;
  }

  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    return digits ? `+${digits}` : null;
  }

  const digits = cleaned.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  // Default to India country code for local 10-digit numbers.
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length >= 7 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

function serializeUnknown(value: unknown): string | null {
  if (value === undefined) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}
