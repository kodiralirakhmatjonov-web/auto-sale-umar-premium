import { readCookie, type Env } from "./auth";

const BROWSER_COOKIE = "asu_browser";
const BROWSER_HEADER = "x-asu-browser-id";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2;
const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
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

async function hmac(value: string, secret: string, namespace: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${namespace}\u0000${value}`));
  return bytesToBase64Url(new Uint8Array(signature));
}

function validBrowserId(value: string | null): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{16,96}$/.test(value));
}

function cookieDomain(requestUrl: string): string {
  try {
    const hostname = new URL(requestUrl).hostname.toLowerCase();
    if (hostname === "autosaleumar.com" || hostname.endsWith(".autosaleumar.com")) {
      return "; Domain=autosaleumar.com";
    }
  } catch {}
  return "";
}

async function verifySignedBrowserCookie(token: string | null, pepper: string): Promise<string | null> {
  if (!token || !pepper) return null;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const browserId = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!validBrowserId(browserId) || !signature) return null;

  try {
    const key = await importHmacKey(pepper);
    const normalized = signature.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      bytes,
      encoder.encode(`browser-cookie\u0000${browserId}`),
    );
    return valid ? browserId : null;
  } catch {
    return null;
  }
}

export interface BrowserProfileIdentity {
  browserId: string;
  browserKey: string;
  setCookie: string;
}

export async function resolveBrowserProfile(request: Request, env: Env): Promise<BrowserProfileIdentity> {
  const cookieId = await verifySignedBrowserCookie(readCookie(request, BROWSER_COOKIE), env.AUTH_PEPPER);
  const headerId = request.headers.get(BROWSER_HEADER)?.trim() ?? null;
  const browserId = cookieId ?? (validBrowserId(headerId) ? headerId : crypto.randomUUID().replaceAll("-", ""));
  const browserKey = await hmac(browserId, env.AUTH_PEPPER, "public-browser-profile");
  const signature = await hmac(browserId, env.AUTH_PEPPER, "browser-cookie");
  const expires = new Date(Date.now() + COOKIE_MAX_AGE_SECONDS * 1000);
  const setCookie = `${BROWSER_COOKIE}=${encodeURIComponent(`${browserId}.${signature}`)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Expires=${expires.toUTCString()}${cookieDomain(request.url)}`;
  return { browserId, browserKey, setCookie };
}
