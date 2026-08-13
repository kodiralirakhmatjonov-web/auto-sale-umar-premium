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
    value: ReadableStream<Uint8Array> | ArrayBuffer | Blob,
    options?: {
      httpMetadata?: R2HttpMetadataLike;
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBodyLike | null>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<R2ObjectsLike>;
}

type BrandMediaEnv = Env & { MEDIA: R2BucketLike };

const PREFIX = "brand-covers/";
const MAX_COVERS = 3;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function cleanText(value: unknown, max = 120): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function brandSlug(value: string): string | null {
  const clean = value.trim();
  if (!clean || clean.length > 100) return null;
  const slug = clean
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || null;
}

function prefixForBrand(brand: string): string | null {
  const slug = brandSlug(brand);
  return slug ? `${PREFIX}${slug}/` : null;
}

function cleanKey(value: string): string | null {
  const key = value.trim();
  if (!key || key.length > 700 || key.includes("..") || !key.startsWith(PREFIX)) return null;
  if (!/\.(?:jpe?g|png|webp|avif)$/i.test(key)) return null;
  return key;
}

function extensionFor(file: File): string {
  const type = file.type.toLowerCase();
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/avif") return "avif";
  return "jpg";
}

function publicUrl(key: string): string {
  return `/api/brand-media?key=${encodeURIComponent(key)}`;
}

async function requireContentAdmin(request: Request, env: BrandMediaEnv) {
  if (!env.DB || !env.AUTH_PEPPER || !env.MEDIA) {
    return { response: json({ success: false, error: "D1 или R2 MEDIA не подключены." }, 500) };
  }
  const user = await getAuthenticatedUser(request, env);
  if (!user) return { response: json({ success: false, error: "Требуется вход в систему." }, 401) };
  if (user.role !== "super_admin" && user.role !== "admin") {
    return { response: json({ success: false, error: "Только администратор может менять обложки марок." }, 403) };
  }
  return { user };
}

async function listBrandCovers(env: BrandMediaEnv, brand: string): Promise<Response> {
  const prefix = prefixForBrand(brand);
  if (!prefix) return json({ success: false, error: "Укажите корректную марку." }, 400);
  if (!env.MEDIA) return json({ success: false, error: "Обложки временно недоступны." }, 503);

  try {
    const result = await env.MEDIA.list({ prefix, limit: 12 });
    const images = (result.objects ?? [])
      .filter((object) => cleanKey(object.key))
      .sort((left, right) => left.key.localeCompare(right.key))
      .slice(0, MAX_COVERS)
      .map((object) => ({
        key: object.key,
        url: publicUrl(object.key),
        size: object.size,
        uploadedAt: object.uploaded instanceof Date ? object.uploaded.toISOString() : null,
      }));

    return json({ success: true, brand, maxCovers: MAX_COVERS, images });
  } catch (error) {
    console.error("Brand cover list failed", error);
    return json({ success: false, error: "Не удалось загрузить обложки марки." }, 500);
  }
}

export async function onRequestGet(context: { request: Request; env: BrandMediaEnv }): Promise<Response> {
  const { request, env } = context;
  if (!env.MEDIA) return new Response("Media unavailable", { status: 503 });

  const url = new URL(request.url);
  const rawKey = url.searchParams.get("key");
  if (rawKey != null) {
    const key = cleanKey(rawKey);
    if (!key) return new Response("Not found", { status: 404 });
    try {
      const object = await env.MEDIA.get(key);
      if (!object) return new Response("Not found", { status: 404 });
      const headers = new Headers();
      if (typeof object.writeHttpMetadata === "function") object.writeHttpMetadata(headers);
      if (!headers.has("content-type") && object.httpMetadata?.contentType) headers.set("content-type", object.httpMetadata.contentType);
      headers.set("cache-control", object.httpMetadata?.cacheControl || "public, max-age=31536000, immutable");
      headers.set("x-content-type-options", "nosniff");
      if (object.httpEtag) headers.set("etag", object.httpEtag);
      return new Response(object.body, { headers });
    } catch (error) {
      console.error("Brand cover read failed", error);
      return new Response("Media temporarily unavailable", { status: 503, headers: { "cache-control": "no-store" } });
    }
  }

  return listBrandCovers(env, cleanText(url.searchParams.get("brand"), 100));
}

export async function onRequestPost(context: { request: Request; env: BrandMediaEnv }): Promise<Response> {
  const { request, env } = context;
  const auth = await requireContentAdmin(request, env);
  if ("response" in auth && auth.response) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ success: false, error: "Некорректная форма загрузки." }, 400);
  }

  const brand = cleanText(form.get("brand"), 100);
  const prefix = prefixForBrand(brand);
  const value = form.get("file");
  if (!prefix || !(value instanceof File)) return json({ success: false, error: "Выберите марку и изображение." }, 400);

  const file = value;
  if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
    return json({ success: false, error: "Разрешены JPG, PNG, WebP и AVIF." }, 400);
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return json({ success: false, error: "Размер одной обложки должен быть до 20 МБ." }, 400);
  }

  try {
    const existing = await env.MEDIA.list({ prefix, limit: MAX_COVERS + 1 });
    const count = (existing.objects ?? []).filter((object) => cleanKey(object.key)).length;
    if (count >= MAX_COVERS) {
      return json({ success: false, error: `Для одной марки можно сохранить максимум ${MAX_COVERS} обложки.` }, 409);
    }

    const extension = extensionFor(file);
    const objectKey = `${prefix}${String(Date.now()).padStart(13, "0")}-${crypto.randomUUID()}.${extension}`;
    await env.MEDIA.put(objectKey, file.stream() as ReadableStream<Uint8Array>, {
      httpMetadata: {
        contentType: file.type || "image/jpeg",
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        brand: brand.slice(0, 100),
        uploadedBy: String(auth.user.id),
        sourceName: file.name.slice(0, 160),
      },
    });

    return json({
      success: true,
      image: {
        key: objectKey,
        url: publicUrl(objectKey),
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
    }, 201);
  } catch (error) {
    console.error("Brand cover upload failed", error);
    return json({ success: false, error: "Не удалось сохранить обложку в R2." }, 500);
  }
}

export async function onRequestDelete(context: { request: Request; env: BrandMediaEnv }): Promise<Response> {
  const { request, env } = context;
  const auth = await requireContentAdmin(request, env);
  if ("response" in auth && auth.response) return auth.response;

  const url = new URL(request.url);
  const key = cleanKey(url.searchParams.get("key") ?? "");
  if (!key) return json({ success: false, error: "Некорректная обложка." }, 400);

  try {
    await env.MEDIA.delete(key);
    return json({ success: true, deletedKey: key });
  } catch (error) {
    console.error("Brand cover delete failed", error);
    return json({ success: false, error: "Не удалось удалить обложку." }, 500);
  }
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте GET, POST или DELETE." }, 405, { allow: "GET, POST, DELETE" });
}
