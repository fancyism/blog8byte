import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "~/env";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface RecentUploadItem {
  key: string;
  url: string;
  alt: string;
  markdown: string;
  uploadedAt: string | null;
}

function getRequiredConfig() {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_BASE_URL,
  } = env;

  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET_NAME ||
    !R2_PUBLIC_BASE_URL
  ) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_BASE_URL.",
    );
  }

  return {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucketName: R2_BUCKET_NAME,
    publicBaseUrl: R2_PUBLIC_BASE_URL.replace(/\/$/, ""),
    prefix: (env.R2_UPLOAD_PREFIX ?? "blogs").replace(/^\/+|\/+$/g, ""),
  };
}

function createR2Client() {
  const config = getRequiredConfig();

  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function sanitizeBaseName(fileName: string) {
  return (
    fileName
      .replace(/\.[^/.]+$/, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0E00-\u0E7F-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "image"
  );
}

function extensionFromFile(file: File) {
  const explicitExtension = file.name.match(/\.[^/.]+$/)?.[0]?.toLowerCase();
  if (explicitExtension) return explicitExtension;

  if (file.type === "image/png") return ".png";
  if (file.type === "image/jpeg") return ".jpg";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";

  return "";
}

function altFromKey(key: string) {
  const fileName = key.split("/").pop() ?? "image";
  return (
    fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/^\d+-[0-9a-f-]+-/, "")
      .replace(/-/g, " ")
      .trim() || "blog image"
  );
}

function itemFromKey(
  key: string,
  publicBaseUrl: string,
  uploadedAt?: Date,
): RecentUploadItem {
  const url = `${publicBaseUrl}/${key}`;
  const alt = altFromKey(key);

  return {
    key,
    url,
    alt,
    markdown: `![${alt}](${url})`,
    uploadedAt: uploadedAt?.toISOString() ?? null,
  };
}

export function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are allowed");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must be 5MB or smaller");
  }

  const extension = extensionFromFile(file);
  if (!extension) {
    throw new Error("Unsupported image format");
  }

  return extension;
}

export async function uploadImageToR2(file: File) {
  const extension = validateImageFile(file);
  const client = createR2Client();
  const config = getRequiredConfig();
  const safeName = sanitizeBaseName(file.name);
  const key = `${config.prefix}/${Date.now()}-${crypto.randomUUID()}-${safeName}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return itemFromKey(key, config.publicBaseUrl, new Date());
}

export async function listRecentUploads(limit = 12) {
  const client = createR2Client();
  const config = getRequiredConfig();

  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: `${config.prefix}/`,
      MaxKeys: Math.max(limit * 3, 24),
    }),
  );

  const items = (response.Contents ?? [])
    .filter((item): item is NonNullable<typeof item> => Boolean(item.Key))
    .sort((a, b) => {
      const aTime = a.LastModified?.getTime() ?? 0;
      const bTime = b.LastModified?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, limit)
    .map((item) =>
      itemFromKey(item.Key!, config.publicBaseUrl, item.LastModified),
    );

  return items;
}
