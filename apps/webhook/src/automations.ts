// Automation rule execution engine
// Called after inbound messages are stored to check for keyword triggers

import { prisma } from "@whatsapp-crm/database";
import type { FastifyBaseLogger } from "fastify";

interface AutomationTrigger {
  type: "keyword" | "first_message" | "opt_in" | "off_hours";
  keywords?: string[];
  matchType?: "exact" | "contains" | "starts_with";
}

interface AutomationAction {
  type: "reply_text" | "reply_template" | "assign_to" | "add_tag" | "remove_tag";
  text?: string;
  templateName?: string;
  userId?: string;
  tag?: string;
}

interface AutomationContext {
  tenantId: string;
  contactId: string;
  conversationId: string;
  messageText: string | null;
  isFirstMessage: boolean;
  waAccessToken: string | null;
  waPhoneId: string | null;
  contactPhone: string;
  logger: FastifyBaseLogger;
}

/**
 * Evaluate and execute automation rules for an inbound message.
 * Rules are evaluated in priority order; first match wins.
 */
export async function executeAutomations(ctx: AutomationContext): Promise<void> {
  const rules = await prisma.automationRule.findMany({
    where: { tenantId: ctx.tenantId, isActive: true },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });

  if (rules.length === 0) return;

  for (const rule of rules) {
    const trigger = rule.trigger as unknown as AutomationTrigger;
    const actions = rule.actions as unknown as AutomationAction[];

    if (matchesTrigger(trigger, ctx)) {
      await executeActions(actions, ctx);
      break; // First match wins
    }
  }
}

function matchesTrigger(trigger: AutomationTrigger, ctx: AutomationContext): boolean {
  switch (trigger.type) {
    case "keyword": {
      if (!ctx.messageText || !trigger.keywords?.length) return false;
      const text = ctx.messageText.toLowerCase().trim();
      const matchType = trigger.matchType || "contains";

      return trigger.keywords.some((keyword) => {
        const kw = keyword.toLowerCase();
        switch (matchType) {
          case "exact":
            return text === kw;
          case "starts_with":
            return text.startsWith(kw);
          case "contains":
          default:
            return text.includes(kw);
        }
      });
    }

    case "first_message":
      return ctx.isFirstMessage;

    default:
      return false;
  }
}

async function executeActions(actions: AutomationAction[], ctx: AutomationContext): Promise<void> {
  for (const action of actions) {
    try {
      switch (action.type) {
        case "reply_text": {
          if (!action.text || !ctx.waAccessToken || !ctx.waPhoneId) break;
          const { WhatsAppClient } = await import("@whatsapp-crm/whatsapp-sdk");
          const wa = new WhatsAppClient({
            phoneNumberId: ctx.waPhoneId,
            accessToken: ctx.waAccessToken,
          });
          const result = await wa.sendText({ to: ctx.contactPhone, text: action.text });
          // Store outbound message
          await prisma.message.create({
            data: {
              tenantId: ctx.tenantId,
              conversationId: ctx.conversationId,
              direction: "outbound",
              type: "text",
              content: { text: action.text },
              status: result.messageId ? "sent" : "failed",
              waMessageId: result.messageId || null,
            },
          });
          break;
        }

        case "reply_template": {
          if (!action.templateName || !ctx.waAccessToken || !ctx.waPhoneId) break;
          const { WhatsAppClient } = await import("@whatsapp-crm/whatsapp-sdk");
          const wa = new WhatsAppClient({
            phoneNumberId: ctx.waPhoneId,
            accessToken: ctx.waAccessToken,
          });
          const result = await wa.sendTemplate({
            to: ctx.contactPhone,
            templateName: action.templateName,
            languageCode: "en",
            parameters: [],
          });
          await prisma.message.create({
            data: {
              tenantId: ctx.tenantId,
              conversationId: ctx.conversationId,
              direction: "outbound",
              type: "template",
              content: { templateName: action.templateName },
              status: result.messageId ? "sent" : "failed",
              waMessageId: result.messageId || null,
            },
          });
          break;
        }

        case "assign_to": {
          if (!action.userId) break;
          await prisma.conversation.update({
            where: { id: ctx.conversationId },
            data: { assignedTo: action.userId },
          });
          break;
        }

        case "add_tag": {
          if (!action.tag) break;
          const contact = await prisma.contact.findUnique({
            where: { id: ctx.contactId },
            select: { tags: true },
          });
          if (contact && !contact.tags.includes(action.tag)) {
            await prisma.contact.update({
              where: { id: ctx.contactId },
              data: { tags: [...contact.tags, action.tag] },
            });
          }
          break;
        }

        case "remove_tag": {
          if (!action.tag) break;
          const contactForRemove = await prisma.contact.findUnique({
            where: { id: ctx.contactId },
            select: { tags: true },
          });
          if (contactForRemove) {
            await prisma.contact.update({
              where: { id: ctx.contactId },
              data: { tags: contactForRemove.tags.filter((t) => t !== action.tag) },
            });
          }
          break;
        }
      }
    } catch (err) {
      ctx.logger.error({ err, action: action.type }, "Automation action failed");
    }
  }
}
