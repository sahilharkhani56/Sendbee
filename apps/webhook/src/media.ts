// Media download from Meta CDN + S3/MinIO upload
// Called after inbound media messages are stored

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT || undefined, // MinIO endpoint for local dev
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET = process.env.S3_BUCKET || "whatsapp-crm-media";

export interface MediaUploadResult {
  key: string;
  url: string;
  mimeType: string;
  fileSize: number;
}

/**
 * Download media from Meta's CDN and upload to S3/MinIO.
 * Returns the S3 key and a presigned-style URL path.
 */
export async function downloadAndUploadMedia(
  mediaId: string,
  tenantId: string,
  waAccessToken: string,
  phoneNumberId: string,
): Promise<MediaUploadResult | null> {
  try {
    // 1. Get the download URL from Meta
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${waAccessToken}` },
    });

    if (!metaRes.ok) {
      console.error(`[Media] Failed to get media URL for ${mediaId}: ${metaRes.status}`);
      return null;
    }

    const metaData = (await metaRes.json()) as { url: string; mime_type: string; file_size: number };

    // 2. Download the binary from Meta's CDN
    const downloadRes = await fetch(metaData.url, {
      headers: { Authorization: `Bearer ${waAccessToken}` },
    });

    if (!downloadRes.ok) {
      console.error(`[Media] Failed to download media ${mediaId}: ${downloadRes.status}`);
      return null;
    }

    const buffer = Buffer.from(await downloadRes.arrayBuffer());

    // 3. Generate S3 key
    const ext = mimeToExtension(metaData.mime_type);
    const hash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 12);
    const key = `${tenantId}/media/${mediaId}_${hash}${ext}`;

    // 4. Upload to S3/MinIO
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: metaData.mime_type,
        ContentLength: buffer.length,
      }),
    );

    return {
      key,
      url: `/${BUCKET}/${key}`,
      mimeType: metaData.mime_type,
      fileSize: metaData.file_size,
    };
  } catch (err) {
    console.error(`[Media] Error processing media ${mediaId}:`, err);
    return null;
  }
}

function mimeToExtension(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "audio/ogg": ".ogg",
    "audio/mpeg": ".mp3",
    "audio/aac": ".aac",
    "video/mp4": ".mp4",
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  };
  return map[mime] || "";
}
