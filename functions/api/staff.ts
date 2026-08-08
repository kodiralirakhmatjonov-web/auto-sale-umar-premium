import {
  getAuthenticatedUser,
  hashPassword,
  isValidEmail,
  json,
  normalizeEmail,
  type Env,
} from "../_lib/auth";

type StaffRole = "super_admin" | "admin" | "sales_manager";
type StaffStatus = "active" | "blocked";
type CreatableStaffRole = "admin" | "sales_manager";

interface StaffRow {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: StaffRole;
  status: StaffStatus | string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

interface StaffPostBody {
  action?: unknown;
  id?: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  role?: unknown;
  status?: unknown;
}

interface D1ListResult<T> {
  results?: T[];
  success?: boolean;
}

interface D1ListStatementLike {
  bind(...values: unknown[]): D1ListStatementLike;
  all<T = Record<string, unknown>>(): Promise<D1ListResult<T>>;
}

const TEMP_PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function toPublicStaff(row: StaffRow, currentUserId: number) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
    isCurrentUser: row.id === currentUserId,
  };
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;

  const phone = value.trim();
  return phone ? phone : null;
}

function generateTemporaryPassword(): string {
  const random = crypto.getRandomValues(new Uint8Array(16));
  let suffix = "";

  for (const byte of random) {
    suffix += TEMP_PASSWORD_ALPHABET[byte % TEMP_PASSWORD_ALPHABET.length];
  }

  return `Asu7-${suffix}`;
}

function isCreatableRole(value: string): value is CreatableStaffRole {
  return value === "admin" || value === "sales_manager";
}

function isEditableStatus(value: unknown): value is StaffStatus {
  return value === "active" || value === "blocked";
}

function parsePositiveId(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) return null;
  return value;
}

function isUniqueConstraintError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /unique|constraint/i.test(message);
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  if (!env.DB || !env.AUTH_PEPPER) {
    return json({ success: false, error: "Серверная конфигурация не завершена." }, 500);
  }

  const currentUser = await getAuthenticatedUser(request, env);
  if (!currentUser) {
    return json({ success: false, error: "Требуется вход в систему." }, 401);
  }

  if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
    return json({ success: false, error: "Недостаточно прав для просмотра сотрудников." }, 403);
  }

  const isSuperAdmin = currentUser.role === "super_admin";

  const query = isSuperAdmin
    ? `SELECT id, email, full_name, phone, role, status, created_by, created_at, updated_at, last_login_at
       FROM users
       ORDER BY
         CASE role
           WHEN 'super_admin' THEN 0
           WHEN 'admin' THEN 1
           WHEN 'sales_manager' THEN 2
           ELSE 3
         END,
         full_name COLLATE NOCASE ASC,
         id ASC`
    : `SELECT id, email, full_name, phone, role, status, created_by, created_at, updated_at, last_login_at
       FROM users
       WHERE role = 'sales_manager'
       ORDER BY full_name COLLATE NOCASE ASC, id ASC`;

  try {
    const statement = env.DB.prepare(query) as unknown as D1ListStatementLike;
    const result = await statement.all<StaffRow>();
    const rows = Array.isArray(result.results) ? result.results : [];

    const staff = rows.map((row) => toPublicStaff(row, currentUser.id));

    const summary = {
      total: staff.length,
      active: staff.filter((item) => item.status === "active").length,
      blocked: staff.filter((item) => item.status === "blocked").length,
      admins: staff.filter((item) => item.role === "admin").length,
      managers: staff.filter((item) => item.role === "sales_manager").length,
    };

    return json({
      success: true,
      viewer: {
        id: currentUser.id,
        role: currentUser.role,
      },
      scope: isSuperAdmin ? "all_staff" : "sales_managers",
      summary,
      staff,
    });
  } catch (error) {
    console.error("Staff list failed", error);
    return json({ success: false, error: "Не удалось загрузить список сотрудников." }, 500);
  }
}

async function updateStaffMember(
  body: StaffPostBody,
  currentUser: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>,
  env: Env,
): Promise<Response> {
  const targetId = parsePositiveId(body.id);
  if (!targetId) {
    return json({ success: false, error: "Некорректный идентификатор сотрудника." }, 400);
  }

  const wantsRole = body.role !== undefined;
  const wantsStatus = body.status !== undefined;

  if (!wantsRole && !wantsStatus) {
    return json({ success: false, error: "Не указаны изменения." }, 400);
  }

  const requestedRole = wantsRole ? normalizeText(body.role) : null;
  if (wantsRole && !isCreatableRole(requestedRole ?? "")) {
    return json({ success: false, error: "Недопустимая роль сотрудника." }, 400);
  }

  if (wantsStatus && !isEditableStatus(body.status)) {
    return json({ success: false, error: "Недопустимый статус сотрудника." }, 400);
  }

  try {
    const target = await env.DB.prepare(
      `SELECT id, email, full_name, phone, role, status, created_by, created_at, updated_at, last_login_at
       FROM users
       WHERE id = ?1
       LIMIT 1`,
    )
      .bind(targetId)
      .first<StaffRow>();

    if (!target) {
      return json({ success: false, error: "Сотрудник не найден." }, 404);
    }

    if (target.role === "super_admin") {
      return json({ success: false, error: "Профиль супер-администратора защищён от изменений." }, 403);
    }

    if (currentUser.role === "admin") {
      if (target.role !== "sales_manager") {
        return json({ success: false, error: "Администратор может управлять только менеджерами." }, 403);
      }

      if (wantsRole && requestedRole !== "sales_manager") {
        return json({ success: false, error: "Только супер-администратор может назначать администраторов." }, 403);
      }
    }

    const nextRole: CreatableStaffRole = wantsRole
      ? (requestedRole as CreatableStaffRole)
      : (target.role as CreatableStaffRole);
    const currentStatus: StaffStatus = target.status === "blocked" ? "blocked" : "active";
    const nextStatus: StaffStatus = wantsStatus ? (body.status as StaffStatus) : currentStatus;
    const now = new Date().toISOString();

    const updated = await env.DB.prepare(
      `UPDATE users
       SET role = ?1,
           status = ?2,
           updated_at = ?3
       WHERE id = ?4
       RETURNING id, email, full_name, phone, role, status, created_by, created_at, updated_at, last_login_at`,
    )
      .bind(nextRole, nextStatus, now, targetId)
      .first<StaffRow>();

    if (!updated) {
      throw new Error("D1 did not return the updated staff row.");
    }

    return json({
      success: true,
      message: "Профиль сотрудника обновлён.",
      staff: toPublicStaff(updated, currentUser.id),
    });
  } catch (error) {
    console.error("Staff update failed", error);
    return json({ success: false, error: "Не удалось обновить профиль сотрудника." }, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  if (!env.DB || !env.AUTH_PEPPER) {
    return json({ success: false, error: "Серверная конфигурация не завершена." }, 500);
  }

  const currentUser = await getAuthenticatedUser(request, env);
  if (!currentUser) {
    return json({ success: false, error: "Требуется вход в систему." }, 401);
  }

  if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
    return json({ success: false, error: "Недостаточно прав для управления сотрудниками." }, 403);
  }

  let body: StaffPostBody;
  try {
    body = (await request.json()) as StaffPostBody;
  } catch {
    return json({ success: false, error: "Некорректный JSON-запрос." }, 400);
  }

  if (body.action !== undefined) {
    if (body.action !== "update") {
      return json({ success: false, error: "Неизвестное действие." }, 400);
    }

    return updateStaffMember(body, currentUser, env);
  }

  const fullName = normalizeText(body.fullName);
  const rawEmail = normalizeText(body.email);
  const email = normalizeEmail(rawEmail);
  const phone = normalizePhone(body.phone);
  const role = normalizeText(body.role);

  if (fullName.length < 2 || fullName.length > 100) {
    return json({ success: false, error: "Имя должно содержать от 2 до 100 символов." }, 400);
  }

  if (!email || !isValidEmail(email) || email.length > 254) {
    return json({ success: false, error: "Укажите корректную электронную почту." }, 400);
  }

  if (phone && phone.length > 40) {
    return json({ success: false, error: "Номер телефона слишком длинный." }, 400);
  }

  if (!isCreatableRole(role)) {
    return json({ success: false, error: "Можно создать только администратора или менеджера." }, 400);
  }

  if (currentUser.role === "admin" && role !== "sales_manager") {
    return json({ success: false, error: "Администратор может создавать только менеджеров." }, 403);
  }

  try {
    const existing = await env.DB.prepare(
      `SELECT id
       FROM users
       WHERE email = ?1
       LIMIT 1`,
    )
      .bind(email)
      .first<{ id: number }>();

    if (existing) {
      return json({ success: false, error: "Сотрудник с такой электронной почтой уже существует." }, 409);
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword, env.AUTH_PEPPER);
    const now = new Date().toISOString();

    const created = await env.DB.prepare(
      `INSERT INTO users (
         email,
         password_hash,
         full_name,
         phone,
         role,
         status,
         created_by,
         created_at,
         updated_at
       )
       VALUES (?1, ?2, ?3, ?4, ?5, 'active', ?6, ?7, ?7)
       RETURNING
         id,
         email,
         full_name,
         phone,
         role,
         status,
         created_by,
         created_at,
         updated_at,
         last_login_at`,
    )
      .bind(email, passwordHash, fullName, phone, role, currentUser.id, now)
      .first<StaffRow>();

    if (!created) {
      throw new Error("D1 did not return the created staff row.");
    }

    return json(
      {
        success: true,
        message: "Сотрудник создан.",
        staff: toPublicStaff(created, currentUser.id),
        temporaryPassword,
        passwordMustBeChanged: true,
      },
      201,
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return json({ success: false, error: "Сотрудник с такой электронной почтой уже существует." }, 409);
    }

    console.error("Staff creation failed", error);
    return json({ success: false, error: "Не удалось создать сотрудника." }, 500);
  }
}
