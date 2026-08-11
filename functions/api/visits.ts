import { getAuthenticatedUser, json, type Env } from "../_lib/auth";

type VisitStatus = "new" | "confirmed" | "completed" | "cancelled";

interface VisitRow {
  id: number;
  public_code: string;
  customer_name: string;
  phone: string;
  visit_date: string;
  time_slot: string;
  brand: string | null;
  car_id: number | null;
  car_label: string | null;
  note: string | null;
  status: VisitStatus;
  created_at: string;
  updated_at: string;
  managed_by: number | null;
}

interface D1Result<T> { results?: T[] }
interface D1StatementListLike {
  bind(...values: unknown[]): D1StatementListLike;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

const ALLOWED_STATUS = new Set<VisitStatus>(["new", "confirmed", "completed", "cancelled"]);
const ALLOWED_SLOTS = new Set(["09:00–11:00", "11:00–13:00", "14:00–16:00", "16:00–18:00", "18:00–20:00"]);

function cleanText(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanPhone(value: unknown): string {
  const raw = cleanText(value, 40);
  return raw.replace(/[^+\d\s()\-]/g, "").slice(0, 32);
}

function isoDateInTashkent(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  let code = "ASU-";
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return code;
}

function publicVisit(row: VisitRow) {
  return {
    id: row.id,
    code: row.public_code,
    customerName: row.customer_name,
    phone: row.phone,
    visitDate: row.visit_date,
    timeSlot: row.time_slot,
    brand: row.brand,
    carId: row.car_id,
    carLabel: row.car_label,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function requireStaff(request: Request, env: Env) {
  if (!env.DB || !env.AUTH_PEPPER) return { response: json({ success: false, error: "D1 не подключена." }, 500) };
  const user = await getAuthenticatedUser(request, env);
  if (!user) return { response: json({ success: false, error: "Требуется вход в систему." }, 401) };
  if (!["super_admin", "admin", "sales_manager"].includes(user.role)) {
    return { response: json({ success: false, error: "Недостаточно прав." }, 403) };
  }
  return { user };
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  if (!env.DB) return json({ success: false, error: "Бронирование временно недоступно." }, 503);

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ success: false, error: "Некорректные данные бронирования." }, 400); }

  const customerName = cleanText(body.customerName, 120);
  const phone = cleanPhone(body.phone);
  const visitDate = cleanText(body.visitDate, 10);
  const timeSlot = cleanText(body.timeSlot, 40);
  const brand = cleanText(body.brand, 80) || null;
  const carLabel = cleanText(body.carLabel, 180) || null;
  const note = cleanText(body.note, 800) || null;
  const carIdRaw = Number(body.carId);
  const carId = Number.isSafeInteger(carIdRaw) && carIdRaw > 0 ? carIdRaw : null;

  if (customerName.length < 2) return json({ success: false, error: "Укажите ваше имя." }, 400);
  if (phone.replace(/\D/g, "").length < 7) return json({ success: false, error: "Укажите корректный номер телефона." }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) return json({ success: false, error: "Выберите дату визита." }, 400);
  if (!ALLOWED_SLOTS.has(timeSlot)) return json({ success: false, error: "Выберите время визита." }, 400);

  const today = isoDateInTashkent();
  const maxDate = addDays(today, 60);
  if (visitDate < today || visitDate > maxDate) {
    return json({ success: false, error: "Выберите дату в пределах ближайших 60 дней." }, 400);
  }

  try {
    const code = makeCode();
    const inserted = await env.DB.prepare(`
      INSERT INTO showroom_visits (
        public_code, customer_name, phone, visit_date, time_slot,
        brand, car_id, car_label, note, status, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, public_code, customer_name, phone, visit_date, time_slot, brand, car_id, car_label, note, status, created_at, updated_at, managed_by
    `)
      .bind(code, customerName, phone, visitDate, timeSlot, brand, carId, carLabel, note)
      .first<VisitRow>();

    if (!inserted) return json({ success: false, error: "Не удалось создать бронирование." }, 500);
    return json({ success: true, visit: publicVisit(inserted) }, 201);
  } catch (error) {
    console.error("Visit create failed", error);
    const message = error instanceof Error && /no such table/i.test(error.message)
      ? "Таблица бронирований ещё не создана в D1."
      : "Не удалось сохранить бронирование.";
    return json({ success: false, error: message }, 500);
  }
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const auth = await requireStaff(request, env);
  if ("response" in auth && auth.response) return auth.response;

  const url = new URL(request.url);
  const rawStatus = cleanText(url.searchParams.get("status"), 20) as VisitStatus | "all";
  const status = rawStatus && rawStatus !== "all" && ALLOWED_STATUS.has(rawStatus as VisitStatus) ? rawStatus as VisitStatus : null;

  try {
    const sql = `
      SELECT id, public_code, customer_name, phone, visit_date, time_slot, brand, car_id, car_label, note, status, created_at, updated_at, managed_by
      FROM showroom_visits
      ${status ? "WHERE status = ?1" : ""}
      ORDER BY
        CASE status WHEN 'new' THEN 0 WHEN 'confirmed' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END,
        visit_date ASC,
        time_slot ASC,
        id DESC
      LIMIT 300
    `;
    const statement = env.DB.prepare(sql) as unknown as D1StatementListLike;
    const result = status ? await statement.bind(status).all<VisitRow>() : await statement.all<VisitRow>();
    const visits = (Array.isArray(result.results) ? result.results : []).map(publicVisit);
    return json({ success: true, visits, viewer: { id: auth.user!.id, role: auth.user!.role } });
  } catch (error) {
    console.error("Visit list failed", error);
    const message = error instanceof Error && /no such table/i.test(error.message)
      ? "Таблица бронирований ещё не создана в D1."
      : "Не удалось загрузить бронирования.";
    return json({ success: false, error: message }, 500);
  }
}

export async function onRequestPatch(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const auth = await requireStaff(request, env);
  if ("response" in auth && auth.response) return auth.response;

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ success: false, error: "Некорректный запрос." }, 400); }

  const id = Number(body.id);
  const status = cleanText(body.status, 20) as VisitStatus;
  if (!Number.isSafeInteger(id) || id < 1) return json({ success: false, error: "Некорректный визит." }, 400);
  if (!ALLOWED_STATUS.has(status)) return json({ success: false, error: "Некорректный статус." }, 400);

  try {
    const updated = await env.DB.prepare(`
      UPDATE showroom_visits
      SET status = ?1, managed_by = ?2, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?3
      RETURNING id, public_code, customer_name, phone, visit_date, time_slot, brand, car_id, car_label, note, status, created_at, updated_at, managed_by
    `)
      .bind(status, auth.user!.id, id)
      .first<VisitRow>();
    if (!updated) return json({ success: false, error: "Бронирование не найдено." }, 404);
    return json({ success: true, visit: publicVisit(updated) });
  } catch (error) {
    console.error("Visit update failed", error);
    return json({ success: false, error: "Не удалось обновить бронирование." }, 500);
  }
}
