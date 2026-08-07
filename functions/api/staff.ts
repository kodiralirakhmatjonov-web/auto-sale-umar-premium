import { getAuthenticatedUser, json, type Env } from "../_lib/auth";

type StaffRole = "super_admin" | "admin" | "sales_manager";
type StaffStatus = "active" | "blocked";

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

interface D1ListResult<T> {
  results?: T[];
  success?: boolean;
}

interface D1ListStatementLike {
  bind(...values: unknown[]): D1ListStatementLike;
  all<T = Record<string, unknown>>(): Promise<D1ListResult<T>>;
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

export function onRequest(): Response {
  return json({ success: false, error: "Используйте GET-запрос." }, 405, { allow: "GET" });
}
