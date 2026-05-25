import { createHash, createHmac, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { HttpError } from "../../utils/http-error.js";
import { getApiIntegrationSettings, type ApiIntegrationSettingsResponse } from "../admin/admin-settings.service.js";

export const uploadsRoot = path.resolve(process.cwd(), "uploads");

const mediaDirectory = path.join(uploadsRoot, "media");

const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime"
]);

const extensionByContentType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov"
};

export const uploadMediaSchema = z.object({
  fileName: z.string().trim().min(1).max(240),
  contentType: z.string().trim().min(3).max(120),
  dataBase64: z.string().min(1)
});

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;

const sanitizeStoragePrefix = (value: string) =>
  value
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const createPublicMediaUrl = (settings: ApiIntegrationSettingsResponse, storageKey: string) => {
  if (settings.awsS3PublicBaseUrl) {
    return `${trimTrailingSlash(settings.awsS3PublicBaseUrl)}/${storageKey}`;
  }

  if (settings.awsS3EndpointUrl) {
    const endpoint = trimTrailingSlash(settings.awsS3EndpointUrl);
    return settings.awsS3ForcePathStyle
      ? `${endpoint}/${settings.awsS3Bucket}/${storageKey}`
      : `${new URL(endpoint).protocol}//${settings.awsS3Bucket}.${new URL(endpoint).host}/${storageKey}`;
  }

  return `https://${settings.awsS3Bucket}.s3.${settings.awsS3Region}.amazonaws.com/${storageKey}`;
};

const sha256Hex = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");

const hmac = (key: Buffer | string, value: string) =>
  createHmac("sha256", key).update(value).digest();

const hmacHex = (key: Buffer, value: string) => createHmac("sha256", key).update(value).digest("hex");

const toAmzDate = (date: Date) =>
  date.toISOString().replace(/[:-]|\.\d{3}/g, "");

const toDateStamp = (date: Date) => toAmzDate(date).slice(0, 8);

const encodeS3Path = (key: string) => key.split("/").map(encodeURIComponent).join("/");

const appendPath = (basePath: string, ...segments: string[]) =>
  [basePath.replace(/\/+$/, ""), ...segments].filter(Boolean).join("/").replace(/^([^/])/, "/$1");

const createS3UploadTarget = (settings: ApiIntegrationSettingsResponse, storageKey: string) => {
  const encodedKey = encodeS3Path(storageKey);

  if (settings.awsS3EndpointUrl) {
    const endpoint = new URL(settings.awsS3EndpointUrl);
    if (settings.awsS3ForcePathStyle) {
      const pathname = appendPath(endpoint.pathname, settings.awsS3Bucket, encodedKey);
      return {
        host: endpoint.host,
        pathname,
        url: `${endpoint.protocol}//${endpoint.host}${pathname}`
      };
    }

    const pathname = appendPath(endpoint.pathname, encodedKey);
    const host = `${settings.awsS3Bucket}.${endpoint.host}`;
    return {
      host,
      pathname,
      url: `${endpoint.protocol}//${host}${pathname}`
    };
  }

  if (settings.awsS3ForcePathStyle) {
    const host = `s3.${settings.awsS3Region}.amazonaws.com`;
    const pathname = `/${settings.awsS3Bucket}/${encodedKey}`;
    return {
      host,
      pathname,
      url: `https://${host}${pathname}`
    };
  }

  const host = `${settings.awsS3Bucket}.s3.${settings.awsS3Region}.amazonaws.com`;
  const pathname = `/${encodedKey}`;
  return {
    host,
    pathname,
    url: `https://${host}${pathname}`
  };
};

const createS3AuthorizationHeader = ({
  settings,
  payload,
  contentType,
  host,
  pathname,
  now
}: {
  settings: ApiIntegrationSettingsResponse;
  payload: Buffer;
  contentType: string;
  host: string;
  pathname: string;
  now: Date;
}) => {
  const method = "PUT";
  const amzDate = toAmzDate(now);
  const dateStamp = toDateStamp(now);
  const payloadHash = sha256Hex(payload);
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`
  ].join("\n");
  const canonicalRequest = [
    method,
    pathname,
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash
  ].join("\n");
  const credentialScope = `${dateStamp}/${settings.awsS3Region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join("\n");
  const dateKey = hmac(`AWS4${settings.awsS3SecretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, settings.awsS3Region);
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = hmacHex(signingKey, stringToSign);

  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${settings.awsS3AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    payloadHash,
    amzDate
  };
};

const saveUploadedMediaToS3 = async ({
  input,
  buffer,
  storageKey,
  settings
}: {
  input: UploadMediaInput;
  buffer: Buffer;
  storageKey: string;
  settings: ApiIntegrationSettingsResponse;
}) => {
  const target = createS3UploadTarget(settings, storageKey);
  const signed = createS3AuthorizationHeader({
    settings,
    payload: buffer,
    contentType: input.contentType,
    host: target.host,
    pathname: target.pathname,
    now: new Date()
  });

  const response = await fetch(target.url, {
    method: "PUT",
    headers: {
      authorization: signed.authorization,
      "content-type": input.contentType,
      "x-amz-content-sha256": signed.payloadHash,
      "x-amz-date": signed.amzDate
    },
    body: buffer
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new HttpError(
      502,
      `Could not upload media to AWS S3. ${detail || response.statusText}`,
      "S3_UPLOAD_FAILED"
    );
  }

  return {
    storageKey,
    url: createPublicMediaUrl(settings, storageKey),
    contentType: input.contentType,
    sizeBytes: buffer.length
  };
};

export const saveUploadedMedia = async (input: UploadMediaInput, publicBaseUrl: string) => {
  if (!allowedContentTypes.has(input.contentType)) {
    throw new HttpError(400, "Unsupported media type.", "UNSUPPORTED_MEDIA_TYPE");
  }

  const buffer = Buffer.from(input.dataBase64, "base64");
  const maxBytes = input.contentType.startsWith("video/") ? 30 * 1024 * 1024 : 8 * 1024 * 1024;
  if (buffer.length === 0 || buffer.length > maxBytes) {
    throw new HttpError(400, "Media file is too large.", "MEDIA_TOO_LARGE");
  }

  const extension = extensionByContentType[input.contentType];
  const settings = await getApiIntegrationSettings();
  const hasAnyS3Setting = Boolean(
    settings.awsS3Bucket ||
      settings.awsS3Region ||
      settings.awsS3AccessKeyId ||
      settings.awsS3SecretAccessKey ||
      settings.awsS3EndpointUrl ||
      settings.awsS3PublicBaseUrl
  );
  if (hasAnyS3Setting && !settings.awsS3Configured) {
    throw new HttpError(
      500,
      "AWS S3 storage is incomplete. Configure bucket, region, access key ID, and secret access key.",
      "S3_CONFIG_INCOMPLETE"
    );
  }

  const prefix = sanitizeStoragePrefix(settings.awsS3KeyPrefix || "media");
  const storageKey = `${prefix ? `${prefix}/` : ""}${randomUUID()}.${extension}`;

  if (settings.awsS3Configured) {
    return saveUploadedMediaToS3({
      input,
      buffer,
      storageKey,
      settings
    });
  }

  await mkdir(mediaDirectory, { recursive: true });
  const filePath = path.join(uploadsRoot, storageKey);
  await writeFile(filePath, buffer);

  return {
    storageKey,
    url: `${publicBaseUrl}/uploads/${storageKey}`,
    contentType: input.contentType,
    sizeBytes: buffer.length
  };
};
