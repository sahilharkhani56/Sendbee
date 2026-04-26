// WhatsApp Cloud API SDK — typed client for Meta's Cloud API
// Will be fully implemented in Phase 2

const WA_API_BASE = "https://graph.facebook.com/v21.0";

export interface SendTextParams {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  body: string;
}

export interface SendTemplateParams {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode: string;
  components?: unknown[];
}

export async function sendTextMessage(params: SendTextParams): Promise<{ messageId: string }> {
  const { phoneNumberId, accessToken, to, body } = params;

  const res = await fetch(`${WA_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`);
  }

  const data = (await res.json()) as { messages: Array<{ id: string }> };
  return { messageId: data.messages[0].id };
}

export async function sendTemplateMessage(
  params: SendTemplateParams
): Promise<{ messageId: string }> {
  const { phoneNumberId, accessToken, to, templateName, languageCode, components } = params;

  const res = await fetch(`${WA_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components ?? [],
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`);
  }

  const data = (await res.json()) as { messages: Array<{ id: string }> };
  return { messageId: data.messages[0].id };
}
