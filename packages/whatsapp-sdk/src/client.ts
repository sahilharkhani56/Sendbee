import axios, { AxiosInstance } from "axios";

const DEFAULT_API_BASE = "https://graph.facebook.com/v21.0";

export interface WhatsAppClientConfig {
  phoneNumberId: string;
  accessToken: string;
  apiBase?: string;
}

export interface SendTextParams {
  to: string;
  body: string;
  previewUrl?: boolean;
}

export interface SendTemplateParams {
  to: string;
  templateName: string;
  languageCode: string;
  parameters?: Array<{ type: "text"; text: string }>;
}

export interface SendInteractiveParams {
  to: string;
  type: "button" | "list" | "product" | "product_list";
  header?: { type: "text" | "image" | "video" | "document"; text?: string };
  body: { text: string };
  footer?: { text: string };
  action: {
    buttons?: Array<{ type: string; reply: { id: string; title: string } }>;
    button?: string;
    sections?: Array<{
      title?: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  };
}

export interface SendMediaParams {
  to: string;
  type: "image" | "video" | "audio" | "document";
  mediaId?: string;
  mediaLink?: string;
  caption?: string;
  filename?: string;
}

export interface SendMessageResult {
  messageId: string;
}

export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;
  private apiBase: string;
  private ax: AxiosInstance;

  constructor(config: WhatsAppClientConfig) {
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.apiBase = config.apiBase || DEFAULT_API_BASE;

    this.ax = axios.create({
      baseURL: this.apiBase,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  async sendText(params: SendTextParams): Promise<SendMessageResult> {
    try {
      const response = await this.ax.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: params.to,
          type: "text",
          text: {
            preview_url: params.previewUrl ?? false,
            body: params.body,
          },
        }
      );

      return {
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendTemplate(params: SendTemplateParams): Promise<SendMessageResult> {
    try {
      const response = await this.ax.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: params.to,
          type: "template",
          template: {
            name: params.templateName,
            language: {
              code: params.languageCode,
            },
            components: params.parameters
              ? [
                  {
                    type: "body",
                    parameters: params.parameters,
                  },
                ]
              : undefined,
          },
        }
      );

      return {
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendInteractive(
    params: SendInteractiveParams
  ): Promise<SendMessageResult> {
    try {
      const response = await this.ax.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: params.to,
          type: "interactive",
          interactive: {
            type: params.type,
            header: params.header,
            body: params.body,
            footer: params.footer,
            action: params.action,
          },
        }
      );

      return {
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendMedia(params: SendMediaParams): Promise<SendMessageResult> {
    try {
      const mediaPayload: Record<string, unknown> = {};

      if (params.mediaId) {
        mediaPayload.id = params.mediaId;
      } else if (params.mediaLink) {
        mediaPayload.link = params.mediaLink;
      } else {
        throw new Error("Either mediaId or mediaLink must be provided");
      }

      if (params.caption && (params.type === "image" || params.type === "video")) {
        mediaPayload.caption = params.caption;
      }

      if (params.filename && params.type === "document") {
        mediaPayload.filename = params.filename;
      }

      const response = await this.ax.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: params.to,
          type: params.type,
          [params.type]: mediaPayload,
        }
      );

  /**
   * Get the download URL for a media file from Meta's servers.
   * Returns the URL and mime type. The URL is temporary (expires in ~5 min).
   */
  async getMediaUrl(mediaId: string): Promise<{ url: string; mimeType: string; fileSize: number }> {
    try {
      const response = await this.ax.get(`/${mediaId}`);
      return {
        url: response.data.url,
        mimeType: response.data.mime_type,
        fileSize: response.data.file_size,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Download media binary from Meta's CDN URL (requires auth header).
   */
  async downloadMedia(url: string): Promise<Buffer> {
    try {
      const response = await this.ax.get(url, { responseType: "arraybuffer" });
      return Buffer.from(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data as any;
      const errorMsg =
        errorData?.error?.message || error.message || "Unknown error";
      const errorCode =
        errorData?.error?.code || errorData?.error?.type || "UNKNOWN";

      const err = new Error(`WhatsApp API Error [${errorCode}]: ${errorMsg}`);
      (err as any).code = errorCode;
      (err as any).status = status;
      (err as any).details = errorData;
      return err;
    }

    return error instanceof Error ? error : new Error(String(error));
  }
}

export default WhatsAppClient;
