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
  role: StaffRole;
  exp: number;
}

export type StaffRole = "super_admin" | "admin" | "sales_manager";

export interface AuthenticatedUser {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: StaffRole;
  status: string;
  sessionId: number | null;
  sessionKind: "database" | "legacy";
}

export interface CreatedSession {
  token: string;
  expiresAt: string;
}

const encoder = new TextEncoder();
const SESSION_COOKIE = "asu_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_TOKEN_BYTES = 32;
const PASSWORD_ITERATIONS = 100_000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
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

async function hmacText(value: string, secret: string, namespace: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${namespace}\u0000${value}`),
  );
  return bytesToBase64Url(new Uint8Array(signature));
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
  if (!Number.isInteger(iterations) || iterations < 50_000 || iterations > 100_000) return false;

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

export function readSessionToken(request: Request): string | null {
  const authorization = request.headers.get("authorization") ?? "";
  const bearerMatch = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (bearerMatch?.[1]) return bearerMatch[1];
  return readCookie(request);
}

export async function createDatabaseSession(
  request: Request,
  env: Env,
  userId: number,
): Promise<CreatedSession> {
  const random = crypto.getRandomValues(new Uint8Array(SESSION_TOKEN_BYTES));
  const token = `asu_${bytesToBase64Url(random)}`;
  const tokenHash = await hmacText(token, env.AUTH_PEPPER, "session-token");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 500) || null;
  const rawIp = request.headers.get("cf-connecting-ip")?.trim() ?? "";
  const ipHash = rawIp
    ? await hmacText(rawIp, env.AUTH_PEPPER, "session-ip")
    : null;

  try {
    await env.DB.prepare(
      `DELETE FROM sessions
       WHERE user_id = ?1
         AND (expires_at <= ?2 OR revoked_at IS NOT NULL)`,
    )
      .bind(userId, now.toISOString())
      .run();
  } catch (cleanupError) {
    console.error("Expired session cleanup failed", cleanupError);
  }

  await env.DB.prepare(
    `INSERT INTO sessions (
       user_id,
       token_hash,
       expires_at,
       created_at,
       revoked_at,
       user_agent,
       ip_hash
     ) VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?6)`,
  )
    .bind(userId, tokenHash, expiresAt, now.toISOString(), userAgent, ipHash)
    .run();

  return { token, expiresAt };
}

export async function revokePresentedSession(request: Request, env: Env): Promise<void> {
  const token = readSessionToken(request);
  if (!token || token.includes(".")) return;

  const tokenHash = await hmacText(token, env.AUTH_PEPPER, "session-token");
  await env.DB.prepare(
    `UPDATE sessions
     SET revoked_at = ?1
     WHERE token_hash = ?2
       AND revoked_at IS NULL`,
  )
    .bind(new Date().toISOString(), tokenHash)
    .run();
}

function sessionCookieDomain(requestUrl?: string): string {
  if (!requestUrl) return "";

  try {
    const hostname = new URL(requestUrl).hostname.toLowerCase();
    if (hostname === "autosaleumar.com" || hostname.endsWith(".autosaleumar.com")) {
      return "; Domain=autosaleumar.com";
    }
  } catch {
    // Preview/local environments keep a host-only cookie.
  }

  return "";
}

export function sessionCookie(token: string, requestUrl?: string, expiresAt?: string): string {
  const requestedExpiry = expiresAt ? new Date(expiresAt) : null;
  const expiry = requestedExpiry && !Number.isNaN(requestedExpiry.getTime())
    ? requestedExpiry
    : new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const maxAge = Math.max(0, Math.floor((expiry.getTime() - Date.now()) / 1000));
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Expires=${expiry.toUTCString()}${sessionCookieDomain(requestUrl)}`;
}

export function clearSessionCookie(requestUrl?: string): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${sessionCookieDomain(requestUrl)}`;
}

export async function getAuthenticatedUser(
  request: Request,
  env: Env,
): Promise<AuthenticatedUser | null> {
  const token = readSessionToken(request);
  if (!token || !env.AUTH_PEPPER) return null;

  if (!token.includes(".")) {
    const tokenHash = await hmacText(token, env.AUTH_PEPPER, "session-token");
    const now = new Date().toISOString();
    const user = await env.DB.prepare(
      `SELECT
         u.id,
         u.email,
         u.full_name,
         u.phone,
         u.role,
         u.status,
         s.id AS session_id
       FROM sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?1
         AND s.revoked_at IS NULL
         AND s.expires_at > ?2
       LIMIT 1`,
    )
      .bind(tokenHash, now)
      .first<{
        id: number;
        email: string;
        full_name: string;
        phone: string | null;
        role: StaffRole;
        status: string;
        session_id: number;
      }>();

    if (!user || user.status !== "active") return null;
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      sessionId: user.session_id,
      sessionKind: "database",
    };
  }

  // Transitional support: cookies issued by the previous release remain valid
  // until their original seven-day expiry. Every new login uses D1 sessions.
  const payload = await verifySessionToken(token, env.AUTH_PEPPER);
  if (!payload) return null;

  const legacyUser = await env.DB.prepare(
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
      role: StaffRole;
      status: string;
    }>();

  if (!legacyUser || legacyUser.status !== "active") return null;
  return {
    ...legacyUser,
    sessionId: null,
    sessionKind: "legacy",
  };
}
