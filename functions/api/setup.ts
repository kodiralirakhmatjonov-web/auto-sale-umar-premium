import {
  hashPassword,
  isValidEmail,
  isValidSetupKey,
  json,
  normalizeEmail,
  validatePassword,
  type Env,
} from "../_lib/auth";

interface SetupBody {
  setupKey?: string;
  email?: string;
  password?: string;
  fullName?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  if (!env.DB || !env.AUTH_PEPPER || !env.SETUP_KEY) {
    return json({ success: false, error: "Серверная конфигурация не завершена." }, 500);
  }

  let body: SetupBody;
  try {
    body = (await request.json()) as SetupBody;
  } catch {
    return json({ success: false, error: "Некорректный формат запроса." }, 400);
  }

  const setupKey = body.setupKey?.trim() ?? "";
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const fullName = body.fullName?.trim() ?? "";

  if (!isValidSetupKey(setupKey, env.SETUP_KEY)) {
    return json({ success: false, error: "Неверный одноразовый ключ SETUP_KEY." }, 403);
  }

  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    return json({ success: false, error: "Укажите корректное имя администратора." }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ success: false, error: "Укажите корректную электронную почту." }, 400);
  }

  const passwordError = validatePassword(password);
  if (passwordError) return json({ success: false, error: passwordError }, 400);

  const existing = await env.DB.prepare("SELECT COUNT(*) AS count FROM users")
    .first<{ count: number }>();

  if ((existing?.count ?? 0) > 0) {
    return json(
      { success: false, error: "Первичная регистрация уже закрыта: пользователь уже существует." },
      409,
    );
  }

  const passwordHash = await hashPassword(password, env.AUTH_PEPPER);
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO users (
        email,
        password_hash,
        full_name,
        phone,
        role,
        status,
        created_by,
        created_at,
        updated_at,
        last_login_at
      ) VALUES (?1, ?2, ?3, NULL, 'super_admin', 'active', NULL, ?4, ?4, NULL)`,
    )
      .bind(email, passwordHash, fullName, now)
      .run();
  } catch (error) {
    console.error("Super-admin setup failed", error);
    return json({ success: false, error: "Не удалось создать супер-администратора." }, 500);
  }

  return json(
    {
      success: true,
      message: "Супер-администратор создан. Теперь войдите в систему.",
      user: { email, fullName, role: "super_admin" },
    },
    201,
  );
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте POST-запрос." }, 405, { allow: "POST" });
}
