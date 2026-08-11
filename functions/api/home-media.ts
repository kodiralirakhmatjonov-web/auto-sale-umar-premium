import { getAuthenticatedUser, json, type Env } from "../_lib/auth";

interface R2HttpMetadataLike {
  contentType?: string;
  cacheControl?: string;
}

interface R2ObjectLike {
  key: string;
  size: number;
  uploaded?: Date;
  httpEtag?: string;
  httpMetadata?: R2HttpMetadataLike;
}

interface R2ObjectBodyLike extends R2ObjectLike {
  body: ReadableStream<Uint8Array>;
  range?: { offset?: number; length?: number; suffix?: number };
  writeHttpMetadata?(headers: Headers): void;
}

interface R2ObjectsLike {
  objects: R2ObjectLike[];
  truncated?: boolean;
  cursor?: string;
}

interface R2BucketLike {
  put(
    key: string,
    value: ReadableStream<Uint8Array> | ArrayBuffer | Blob,
    options?: {
      httpMetadata?: R2HttpMetadataLike;
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(
    key: string,
    options?: { range?: { offset?: number; length?: number; suffix?: number } },
  ): Promise<R2ObjectBodyLike | null>;
  head(key: string): Promise<R2ObjectLike | null>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<R2ObjectsLike>;
}

type HomeMediaEnv = Env & { MEDIA: R2BucketLike };

const PREFIX = "homepage/hero/";
const MAX_VIDEO_SIZE = 80 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function cleanKey(value: string): string | null {
  const key = value.trim();
  if (!key || key.length > 700 || key.includes("..") || !key.startsWith(PREFIX)) return null;
  return key;
}

function extensionFor(file: File): string {
  const type = file.type.toLowerCase();
  if (type === "video/mp4") return "mp4";
  if (type === "video/webm") return "webm";
  if (type === "video/quicktime") return "mov";
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension?.slice(0, 8) || "mp4";
}

function publicUrl(key: string): string {
  return `/api/home-media?key=${encodeURIComponent(key)}`;
}

function parseRange(value: string | null, size: number): { offset: number; length: number; end: number } | null {
  if (!value || !value.startsWith("bytes=")) return null;
  const first = value.slice(6).split(",", 1)[0]?.trim();
  if (!first) return null;
  const [startText, endText] = first.split("-", 2);

  if (!startText) {
    const suffix = Number(endText);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    const length = Math.min(suffix, size);
    return { offset: size - length, length, end: size - 1 };
  }

  const start = Number(startText);
  if (!Number.isSafeInteger(start) || start < 0 || start >= size) return null;
  const requestedEnd = endText ? Number(endText) : size - 1;
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) return null;
  const end = Math.min(requestedEnd, size - 1);
  return { offset: start, length: end - start + 1, end };
}

function mediaHeaders(object: R2ObjectLike): Headers {
  const headers = new Headers();
  if (object.httpMetadata?.contentType) headers.set("content-type", object.httpMetadata.contentType);
  headers.set("cache-control", object.httpMetadata?.cacheControl || "public, max-age=86400");
  headers.set("accept-ranges", "bytes");
  headers.set("x-content-type-options", "nosniff");
  if (object.httpEtag) headers.set("etag", object.httpEtag);
  return headers;
}

async function getMediaResponse(request: Request, env: HomeMediaEnv, key: string, headOnly = false): Promise<Response> {
  if (!env.MEDIA) return new Response("Media unavailable", { status: 503 });
  const metadata = await env.MEDIA.head(key);
  if (!metadata) return new Response("Not found", { status: 404 });

  const headers = mediaHeaders(metadata);
  const range = parseRange(request.headers.get("range"), metadata.size);
  if (range) {
    headers.set("content-range", `bytes ${range.offset}-${range.end}/${metadata.size}`);
    headers.set("content-length", String(range.length));
    if (headOnly) return new Response(null, { status: 206, headers });
    const object = await env.MEDIA.get(key, { range: { offset: range.offset, length: range.length } });
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("content-length", String(metadata.size));
  if (headOnly) return new Response(null, { status: 200, headers });
  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  if (typeof object.writeHttpMetadata === "function") object.writeHttpMetadata(headers);
  return new Response(object.body, { status: 200, headers });
}

async function listVideos(env: HomeMediaEnv): Promise<Response> {
  if (!env.MEDIA) return json({ success: false, error: "Видео временно недоступны." }, 503);
  try {
    const result = await env.MEDIA.list({ prefix: PREFIX, limit: 100 });
    const videos = (result.objects ?? [])
      .filter((object) => object.key.startsWith(PREFIX))
      .sort((left, right) => left.key.localeCompare(right.key))
      .map((object) => ({
        key: object.key,
        url: publicUrl(object.key),
        size: object.size,
        uploadedAt: object.uploaded instanceof Date ? object.uploaded.toISOString() : null,
      }));
    return json({ success: true, videos });
  } catch (error) {
    console.error("Homepage media list failed", error);
    return json({ success: false, error: "Не удалось загрузить видео главной страницы." }, 500);
  }
}

export async function onRequestGet(context: { request: Request; env: HomeMediaEnv }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const rawKey = url.searchParams.get("key");
  if (rawKey != null) {
    const key = cleanKey(rawKey);
    if (!key) return new Response("Not found", { status: 404 });
    return getMediaResponse(request, env, key);
  }
  return listVideos(env);
}

export async function onRequestHead(context: { request: Request; env: HomeMediaEnv }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = cleanKey(url.searchParams.get("key") ?? "");
  if (!key) return new Response("Not found", { status: 404 });
  return getMediaResponse(request, env, key, true);
}

export async function onRequestPost(context: { request: Request; env: HomeMediaEnv }): Promise<Response> {
  const { request, env } = context;
  if (!env.DB || !env.AUTH_PEPPER || !env.MEDIA) {
    return json({ success: false, error: "D1 или R2 MEDIA не подключены." }, 500);
  }

  const user = await getAuthenticatedUser(request, env);
  if (!user) return json({ success: false, error: "Требуется вход в систему." }, 401);
  if (user.role !== "super_admin" && user.role !== "admin") {
    return json({ success: false, error: "Только администратор может менять видео главной страницы." }, 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ success: false, error: "Некорректная форма загрузки." }, 400);
  }
  const value = form.get("file");
  if (!(value instanceof File)) return json({ success: false, error: "Выберите видео." }, 400);
  const file = value;
  const fileType = file.type.toLowerCase();
  const supportedExtension = /\.(mp4|webm|mov)$/i.test(file.name);
  if (!ALLOWED_TYPES.has(fileType) && !supportedExtension) {
    return json({ success: false, error: "Разрешены MP4, WebM и MOV. Для сайта рекомендуется MP4." }, 400);
  }
  if (file.size <= 0 || file.size > MAX_VIDEO_SIZE) {
    return json({ success: false, error: "Размер одного видео должен быть до 80 МБ." }, 400);
  }

  const extension = extensionFor(file);
  const key = `${PREFIX}${String(Date.now()).padStart(13, "0")}-${crypto.randomUUID()}.${extension}`;
  try {
    await env.MEDIA.put(key, file.stream() as ReadableStream<Uint8Array>, {
      httpMetadata: {
        contentType: file.type || (extension === "webm" ? "video/webm" : extension === "mov" ? "video/quicktime" : "video/mp4"),
        cacheControl: "public, max-age=86400",
      },
      customMetadata: {
        uploadedBy: String(user.id),
        sourceName: file.name.slice(0, 160),
      },
    });
    return json({ success: true, video: { key, url: publicUrl(key), size: file.size, uploadedAt: new Date().toISOString() } }, 201);
  } catch (error) {
    console.error("Homepage video upload failed", error);
    return json({ success: false, error: "Не удалось сохранить видео в R2." }, 500);
  }
}

export async function onRequestDelete(context: { request: Request; env: HomeMediaEnv }): Promise<Response> {
  const { request, env } = context;
  if (!env.DB || !env.AUTH_PEPPER || !env.MEDIA) {
    return json({ success: false, error: "D1 или R2 MEDIA не подключены." }, 500);
  }
  const user = await getAuthenticatedUser(request, env);
  if (!user) return json({ success: false, error: "Требуется вход в систему." }, 401);
  if (user.role !== "super_admin" && user.role !== "admin") {
    return json({ success: false, error: "Только администратор может менять видео главной страницы." }, 403);
  }

  const url = new URL(request.url);
  const key = cleanKey(url.searchParams.get("key") ?? "");
  if (!key) return json({ success: false, error: "Некорректный ключ видео." }, 400);
  try {
    await env.MEDIA.delete(key);
    return json({ success: true, deletedKey: key });
  } catch (error) {
    console.error("Homepage video delete failed", error);
    return json({ success: false, error: "Не удалось удалить видео из R2." }, 500);
  }
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте GET, HEAD, POST или DELETE." }, 405, { allow: "GET, HEAD, POST, DELETE" });
}
