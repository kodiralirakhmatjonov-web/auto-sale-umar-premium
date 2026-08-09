import {
  createDatabaseSession,
  isValidEmail,
  json,
  normalizeEmail,
  sessionCookie,
  verifyPassword,
  type Env,
  type SessionPayload,
} from "../_lib/auth";

interface LoginBody {
  email?: string;
  password?: string;
  client?: "web" | "mobile";
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  if (!env.DB || !env.AUTH_PEPPER) {
    return json({ success: false, error: "Серверная конфигурация не завершена." }, 500);
  }

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return json({ success: false, error: "Некорректный формат запроса." }, 400);
  }

  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";

  if (!isValidEmail(email) || !password) {
    return json({ success: false, error: "Введите почту и пароль." }, 400);
  }

  const user = await env.DB.prepare(
    `SELECT id, email, password_hash, full_name, role, status
     FROM users
     WHERE email = ?1
     LIMIT 1`,
  )
    .bind(email)
    .first<{
      id: number;
      email: string;
      password_hash: string;
      full_name: string;
      role: SessionPayload["role"];
      status: string;
    }>();

  const passwordMatches = user
    ? await verifyPassword(password, user.password_hash, env.AUTH_PEPPER)
    : false;

  if (!user || !passwordMatches || user.status !== "active") {
    return json({ success: false, error: "Неверная почта или пароль." }, 401);
  }

  const allowedRoles: SessionPayload["role"][] = ["super_admin", "admin", "sales_manager"];
  if (!allowedRoles.includes(user.role)) {
    return json({ success: false, error: "Для этой учётной записи не назначена допустимая роль." }, 403);
  }

  const client = body.client === "mobile" ? "mobile" : "web";
  const now = new Date().toISOString();
  let session;

  try {
    await env.DB.prepare(
      "UPDATE users SET last_login_at = ?1, updated_at = ?1 WHERE id = ?2",
    )
      .bind(now, user.id)
      .run();

    session = await createDatabaseSession(request, env, user.id);
  } catch (error) {
    console.error("Session creation failed", error);
    return json({ success: false, error: "Не удалось создать защищённую сессию." }, 500);
  }

  return json(
    {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      ...(client === "mobile"
        ? {
            session: {
              token: session.token,
              tokenType: "Bearer",
              expiresAt: session.expiresAt,
            },
          }
        : {}),
    },
    200,
    client === "web"
      ? { "set-cookie": sessionCookie(session.token, request.url, session.expiresAt) }
      : undefined,
  );
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте POST-запрос." }, 405, { allow: "POST" });
}
