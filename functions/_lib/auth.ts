export interface Env {
  DB: D1DatabaseLike;
  AUTH_PEPPER: string;
  SETUP_KEY: string;
}

interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

export interface SessionPayload {
  userId: number;
  email: string;
  role: "super_admin" | "admin" | "sales_manager";
  exp: number;
}

const encoder = new TextEncoder();
const SESSION_COOKIE = "asu_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const PASSWORD_ITERATIONS = 150_000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function textToBase64Url(value: string): string {
  return bytesToBase64Url(encoder.encode(value));
}

function base64UrlToText(value: string): string {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): string | null {
  if (password.length < 10) return "Пароль должен содержать минимум 10 символов.";
  if (!/[A-ZА-ЯЁ]/u.test(password)) return "Добавьте хотя бы одну заглавную букву.";
  if (!/[a-zа-яё]/u.test(password)) return "Добавьте хотя бы одну строчную букву.";
  if (!/\d/u.test(password)) return "Добавьте хотя бы одну цифру.";
  return null;
}

export function isValidSetupKey(candidate: string, expected: string): boolean {
  return Boolean(candidate && expected && constantTimeEqual(candidate, expected));
}

export async function hashPassword(password: string, pepper: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordMaterial = encoder.encode(`${password}\u0000${pepper}`);
  const key = await crypto.subtle.importKey("raw", passwordMaterial, "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PASSWORD_ITERATIONS,
    },
    key,
    256,
  );

  return [
    "pbkdf2_sha256",
    String(PASSWORD_ITERATIONS),
    bytesToBase64Url(salt),
    bytesToBase64Url(new Uint8Array(derived)),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  pepper: string,
): Promise<boolean> {
  const [algorithm, iterationsText, saltText, expectedText] = storedHash.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterationsText || !saltText || !expectedText) return false;

  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 50_000 || iterations > 1_000_000) return false;

  try {
    const passwordMaterial = encoder.encode(`${password}\u0000${pepper}`);
    const key = await crypto.subtle.importKey("raw", passwordMaterial, "PBKDF2", false, ["deriveBits"]);
    const derived = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: base64UrlToBytes(saltText),
        iterations,
      },
      key,
      256,
    );

    return constantTimeEqual(bytesToBase64Url(new Uint8Array(derived)), expectedText);
  } catch {
    return false;
  }
}

export async function createSessionToken(
  payload: Omit<SessionPayload, "exp">,
  pepper: string,
): Promise<string> {
  const completePayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = textToBase64Url(JSON.stringify(completePayload));
  const key = await importHmacKey(pepper);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return `${body}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string | null,
  pepper: string,
): Promise<SessionPayload | null> {
  if (!token || !pepper) return null;
  const [body, signatureText, extra] = token.split(".");
  if (!body || !signatureText || extra) return null;

  try {
    const key = await importHmacKey(pepper);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signatureText),
      encoder.encode(body),
    );
    if (!valid) return null;

    const payload = JSON.parse(base64UrlToText(body)) as SessionPayload;
    if (
      !Number.isInteger(payload.userId) ||
      typeof payload.email !== "string" ||
      !["super_admin", "admin", "sales_manager"].includes(payload.role) ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name = SESSION_COOKIE): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) return decodeURIComponent(rawValue.join("="));
  }
  return null;
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function getAuthenticatedUser(request: Request, env: Env) {
  const payload = await verifySessionToken(readCookie(request), env.AUTH_PEPPER);
  if (!payload) return null;

  const user = await env.DB.prepare(
    `SELECT id, email, full_name, phone, role, status
     FROM users
     WHERE id = ?1
     LIMIT 1`,
  )
    .bind(payload.userId)
    .first<{
      id: number;
      email: string;
      full_name: string;
      phone: string | null;
      role: SessionPayload["role"];
      status: string;
    }>();

  if (!user || user.status !== "active") return null;
  return user;
}
