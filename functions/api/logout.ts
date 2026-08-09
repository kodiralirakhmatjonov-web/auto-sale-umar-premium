import { clearSessionCookie, json } from "../_lib/auth";

export function onRequestPost(context: { request: Request }): Response {
  return json(
    { success: true },
    200,
    { "set-cookie": clearSessionCookie(context.request.url) },
  );
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте POST-запрос." }, 405, { allow: "POST" });
}
