import { clearSessionCookie, json } from "../_lib/auth";

export function onRequestPost(): Response {
  return json(
    { success: true },
    200,
    { "set-cookie": clearSessionCookie() },
  );
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте POST-запрос." }, 405, { allow: "POST" });
}
