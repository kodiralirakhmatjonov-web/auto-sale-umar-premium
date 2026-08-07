import { getAuthenticatedUser, json, type Env } from "../../_lib/auth";

type StaffRole = "super_admin" | "admin" | "sales_manager";
type StaffStatus = "active" | "blocked";
type EditableRole = "admin" | "sales_manager";

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

interface UpdateStaffBody {
  role?: unknown;
  status?: unknown;
}

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

function parseId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return null;

  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isEditableRole(value: unknown): value is EditableRole {
  return value === "admin" || value === "sales_manager";
}

function isEditableStatus(value: unknown): value is StaffStatus {
  return value === "active" || value === "blocked";
}

export async function onRequestPatch(context: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
}): Promise<Response> {
  const { request, env, params } = context;

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

  const targetId = parseId(params.id);
  if (!targetId) {
    return json({ success: false, error: "Некорректный идентификатор сотрудника." }, 400);
  }

  let body: UpdateStaffBody;
  try {
    body = (await request.json()) as UpdateStaffBody;
  } catch {
    return json({ success: false, error: "Некорректный JSON-запрос." }, 400);
  }

  const wantsRole = body.role !== undefined;
  const wantsStatus = body.status !== undefined;

  if (!wantsRole && !wantsStatus) {
    return json({ success: false, error: "Не указаны изменения." }, 400);
  }

  if (wantsRole && !isEditableRole(body.role)) {
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

    // Корневой супер-администратор не должен быть изменяемым через обычную staff-панель.
    if (target.role === "super_admin") {
      return json({ success: false, error: "Профиль супер-администратора защищён от изменений." }, 403);
    }

    // Обычный администратор может управлять только менеджерами и не может повышать их до admin.
    if (currentUser.role === "admin") {
      if (target.role !== "sales_manager") {
        return json({ success: false, error: "Администратор может управлять только менеджерами." }, 403);
      }

      if (wantsRole && body.role !== "sales_manager") {
        return json({ success: false, error: "Только супер-администратор может назначать администраторов." }, 403);
      }
    }

    const nextRole: EditableRole = wantsRole ? (body.role as EditableRole) : (target.role as EditableRole);
    const nextStatus: StaffStatus = wantsStatus ? (body.status as StaffStatus) : (target.status as StaffStatus);
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
