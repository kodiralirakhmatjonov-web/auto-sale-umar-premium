import {
  clearSessionCookie,
  json,
  revokePresentedSession,
  type Env,
} from "../_lib/auth";

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    await revokePresentedSession(context.request, context.env);
  } catch (error) {
    console.error("Session revocation failed", error);
  }

  return json(
    { success: true },
    200,
    { "set-cookie": clearSessionCookie(context.request.url) },
  );
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте POST-запрос." }, 405, { allow: "POST" });
}
