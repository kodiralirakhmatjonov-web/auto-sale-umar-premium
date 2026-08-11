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
    value: ReadableStream<Uint8Array> | ArrayBuffer | Blob | string,
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

type HeroStatus = "in_stock" | "in_showroom" | "in_transit" | "made_to_order" | "reserved";
type HeroCurrency = "USD" | "UZS" | "EUR";

interface HeroMeta {
  brand: string;
  model: string;
  price: number | null;
  currency: HeroCurrency;
  priceOnRequest: boolean;
  status: HeroStatus;
}

type HeroManifest = Record<string, HeroMeta>;

const PREFIX = "homepage/hero/";
const MANIFEST_KEY = "homepage/hero-manifest.json";
const MAX_VIDEO_SIZE = 80 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const VIDEO_EXTENSION = /\.(mp4|webm|mov)$/i;
const ALLOWED_STATUS = new Set<HeroStatus>(["in_stock", "in_showroom", "in_transit", "made_to_order", "reserved"]);
const ALLOWED_CURRENCY = new Set<HeroCurrency>(["USD", "UZS", "EUR"]);

function cleanKey(value: string): string | null {
  const key = value.trim();
  if (!key || key.length > 700 || key.includes("..") || !key.startsWith(PREFIX) || !VIDEO_EXTENSION.test(key)) return null;
  return key;
}

function cleanText(value: unknown, max = 120): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeMeta(value: unknown): HeroMeta {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const priceRaw = source.price;
  const price = typeof priceRaw === "number" && Number.isFinite(priceRaw) && priceRaw >= 0
    ? Math.round(priceRaw)
    : typeof priceRaw === "string" && priceRaw.trim() && Number.isFinite(Number(priceRaw)) && Number(priceRaw) >= 0
      ? Math.round(Number(priceRaw))
      : null;
  const currencyRaw = cleanText(source.currency, 8).toUpperCase() as HeroCurrency;
  const statusRaw = cleanText(source.status, 30) as HeroStatus;
  return {
    brand: cleanText(source.brand, 80),
    model: cleanText(source.model, 120),
    price,
    currency: ALLOWED_CURRENCY.has(currencyRaw) ? currencyRaw : "USD",
    priceOnRequest: source.priceOnRequest === true,
    status: ALLOWED_STATUS.has(statusRaw) ? statusRaw : "in_showroom",
  };
}

async function readManifest(env: HomeMediaEnv): Promise<HeroManifest> {
  try {
    const object = await env.MEDIA.get(MANIFEST_KEY);
    if (!object) return {};
    const text = await new Response(object.body).text();
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const manifest: HeroManifest = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const clean = cleanKey(key);
      if (clean) manifest[clean] = normalizeMeta(value);
    }
    return manifest;
  } catch (error) {
    console.error("Homepage hero manifest read failed", error);
    return {};
  }
}

async function writeManifest(env: HomeMediaEnv, manifest: HeroManifest): Promise<void> {
  const body = JSON.stringify(manifest);
  await env.MEDIA.put(MANIFEST_KEY, body, {
    httpMetadata: { contentType: "application/json; charset=utf-8", cacheControl: "no-store" },
  });
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
  try {
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
  } catch (error) {
    console.error("Homepage media read failed", error);
    return new Response("Media temporarily unavailable", { status: 503, headers: { "cache-control": "no-store" } });
  }
}

async function listVideos(env: HomeMediaEnv): Promise<Response> {
  if (!env.MEDIA) return json({ success: false, error: "Видео временно недоступны." }, 503);
  try {
    const [result, manifest] = await Promise.all([
      env.MEDIA.list({ prefix: PREFIX, limit: 100 }),
      readManifest(env),
    ]);
    const videos = (result.objects ?? [])
      .filter((object) => object.key.startsWith(PREFIX) && VIDEO_EXTENSION.test(object.key))
      .sort((left, right) => left.key.localeCompare(right.key))
      .map((object) => ({
        key: object.key,
        url: publicUrl(object.key),
        size: object.size,
        uploadedAt: object.uploaded instanceof Date ? object.uploaded.toISOString() : null,
        ...normalizeMeta(manifest[object.key]),
      }));
    return json({ success: true, videos });
  } catch (error) {
    console.error("Homepage media list failed", error);
    return json({ success: false, error: "Не удалось загрузить видео главной страницы." }, 500);
  }
}

async function requireAdmin(request: Request, env: HomeMediaEnv) {
  if (!env.DB || !env.AUTH_PEPPER || !env.MEDIA) return { response: json({ success: false, error: "D1 или R2 MEDIA не подключены." }, 500) };
  const user = await getAuthenticatedUser(request, env);
  if (!user) return { response: json({ success: false, error: "Требуется вход в систему." }, 401) };
  if (user.role !== "super_admin" && user.role !== "admin") {
    return { response: json({ success: false, error: "Только администратор может менять видео главной страницы." }, 403) };
  }
  return { user };
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
  const auth = await requireAdmin(request, env);
  if ("response" in auth && auth.response) return auth.response;

  let form: FormData;
  try { form = await request.formData(); }
  catch { return json({ success: false, error: "Некорректная форма загрузки." }, 400); }

  const value = form.get("file");
  if (!(value instanceof File)) return json({ success: false, error: "Выберите видео." }, 400);
  const file = value;
  const fileType = file.type.toLowerCase();
  if (!ALLOWED_TYPES.has(fileType) && !VIDEO_EXTENSION.test(file.name)) {
    return json({ success: false, error: "Разрешены MP4, WebM и MOV. Для сайта рекомендуется MP4." }, 400);
  }
  if (file.size <= 0 || file.size > MAX_VIDEO_SIZE) {
    return json({ success: false, error: "Размер одного видео должен быть до 80 МБ." }, 400);
  }

  const extension = extensionFor(file);
  const key = `${PREFIX}${String(Date.now()).padStart(13, "0")}-${crypto.randomUUID()}.${extension}`;
  const meta = normalizeMeta({
    brand: form.get("brand"),
    model: form.get("model"),
    price: form.get("price"),
    currency: form.get("currency"),
    priceOnRequest: form.get("priceOnRequest") === "1",
    status: form.get("status"),
  });

  try {
    await env.MEDIA.put(key, file.stream() as ReadableStream<Uint8Array>, {
      httpMetadata: {
        contentType: file.type || (extension === "webm" ? "video/webm" : extension === "mov" ? "video/quicktime" : "video/mp4"),
        cacheControl: "public, max-age=86400",
      },
      customMetadata: { uploadedBy: String(auth.user.id), sourceName: file.name.slice(0, 160) },
    });
    const manifest = await readManifest(env);
    manifest[key] = meta;
    await writeManifest(env, manifest);
    return json({ success: true, video: { key, url: publicUrl(key), size: file.size, uploadedAt: new Date().toISOString(), ...meta } }, 201);
  } catch (error) {
    console.error("Homepage video upload failed", error);
    try { await env.MEDIA.delete(key); } catch {}
    return json({ success: false, error: "Не удалось сохранить видео в R2." }, 500);
  }
}

export async function onRequestPatch(context: { request: Request; env: HomeMediaEnv }): Promise<Response> {
  const { request, env } = context;
  const auth = await requireAdmin(request, env);
  if ("response" in auth && auth.response) return auth.response;

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ success: false, error: "Некорректный JSON-запрос." }, 400); }

  const key = cleanKey(cleanText(body.key, 700));
  if (!key) return json({ success: false, error: "Некорректный ключ видео." }, 400);
  const exists = await env.MEDIA.head(key);
  if (!exists) return json({ success: false, error: "Видео не найдено." }, 404);

  try {
    const manifest = await readManifest(env);
    const meta = normalizeMeta(body);
    manifest[key] = meta;
    await writeManifest(env, manifest);
    return json({ success: true, video: { key, url: publicUrl(key), size: exists.size, uploadedAt: exists.uploaded instanceof Date ? exists.uploaded.toISOString() : null, ...meta } });
  } catch (error) {
    console.error("Homepage video metadata update failed", error);
    return json({ success: false, error: "Не удалось сохранить данные видео." }, 500);
  }
}

export async function onRequestDelete(context: { request: Request; env: HomeMediaEnv }): Promise<Response> {
  const { request, env } = context;
  const auth = await requireAdmin(request, env);
  if ("response" in auth && auth.response) return auth.response;
  const url = new URL(request.url);
  const key = cleanKey(url.searchParams.get("key") ?? "");
  if (!key) return json({ success: false, error: "Некорректный ключ видео." }, 400);
  try {
    await env.MEDIA.delete(key);
    const manifest = await readManifest(env);
    if (manifest[key]) {
      delete manifest[key];
      await writeManifest(env, manifest);
    }
    return json({ success: true, deletedKey: key });
  } catch (error) {
    console.error("Homepage video delete failed", error);
    return json({ success: false, error: "Не удалось удалить видео из R2." }, 500);
  }
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте GET, HEAD, POST, PATCH или DELETE." }, 405, { allow: "GET, HEAD, POST, PATCH, DELETE" });
}
