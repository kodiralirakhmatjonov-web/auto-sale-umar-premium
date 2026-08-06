import { getAuthenticatedUser, json, type Env } from "../_lib/auth";

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const user = await getAuthenticatedUser(context.request, context.env);
  if (!user) return json({ success: false, error: "Требуется вход в систему." }, 401);

  return json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
    },
  });
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте GET-запрос." }, 405, { allow: "GET" });
}
