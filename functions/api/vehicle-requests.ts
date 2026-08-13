import { getAuthenticatedUser, json, type Env } from "../_lib/auth";

type RequestStatus = "new" | "contacted" | "sourcing" | "offered" | "completed" | "cancelled";
type ContactChannel = "whatsapp" | "telegram" | "phone";
type PurchaseTiming = "7_days" | "30_days" | "90_days" | "flexible";
type Currency = "USD" | "UZS" | "EUR";

interface RequestRow {
  id: number;
  public_code: string;
  customer_name: string;
  phone: string;
  contact_channel: ContactChannel;
  brand: string;
  model: string;
  trim: string | null;
  desired_year: number | null;
  exterior_color: string | null;
  interior_color: string | null;
  important_options: string | null;
  max_budget: number | null;
  currency: Currency;
  purchase_timing: PurchaseTiming;
  accept_in_transit: number;
  source_url: string | null;
  note: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  managed_by: number | null;
}

interface D1Result<T> { results?: T[] }
interface D1StatementListLike {
  bind(...values: unknown[]): D1StatementListLike;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

const ALLOWED_STATUS = new Set<RequestStatus>(["new", "contacted", "sourcing", "offered", "completed", "cancelled"]);
const ALLOWED_CHANNEL = new Set<ContactChannel>(["whatsapp", "telegram", "phone"]);
const ALLOWED_TIMING = new Set<PurchaseTiming>(["7_days", "30_days", "90_days", "flexible"]);
const ALLOWED_CURRENCY = new Set<Currency>(["USD", "UZS", "EUR"]);

function cleanText(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanPhone(value: unknown): string {
  const raw = cleanText(value, 40);
  return raw.replace(/[^+\d\s()\-]/g, "").slice(0, 32);
}

function cleanUrl(value: unknown): string | null {
  const raw = cleanText(value, 800);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().slice(0, 800);
  } catch {
    return null;
  }
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  let code = "FIND-";
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return code;
}

function publicRequest(row: RequestRow) {
  return {
    id: row.id,
    code: row.public_code,
    customerName: row.customer_name,
    phone: row.phone,
    contactChannel: row.contact_channel,
    brand: row.brand,
    model: row.model,
    trim: row.trim,
    desiredYear: row.desired_year,
    exteriorColor: row.exterior_color,
    interiorColor: row.interior_color,
    importantOptions: row.important_options,
    maxBudget: row.max_budget,
    currency: row.currency,
    purchaseTiming: row.purchase_timing,
    acceptInTransit: Boolean(row.accept_in_transit),
    sourceUrl: row.source_url,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    managedBy: row.managed_by,
  };
}

async function ensureTable(env: Env): Promise<void> {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS vehicle_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_code TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      contact_channel TEXT NOT NULL DEFAULT 'whatsapp'
        CHECK (contact_channel IN ('whatsapp', 'telegram', 'phone')),
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      trim TEXT,
      desired_year INTEGER,
      exterior_color TEXT,
      interior_color TEXT,
      important_options TEXT,
      max_budget REAL,
      currency TEXT NOT NULL DEFAULT 'USD'
        CHECK (currency IN ('USD', 'UZS', 'EUR')),
      purchase_timing TEXT NOT NULL DEFAULT 'flexible'
        CHECK (purchase_timing IN ('7_days', '30_days', '90_days', 'flexible')),
      accept_in_transit INTEGER NOT NULL DEFAULT 1 CHECK (accept_in_transit IN (0, 1)),
      source_url TEXT,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'contacted', 'sourcing', 'offered', 'completed', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      managed_by INTEGER,
      FOREIGN KEY (managed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_vehicle_requests_status ON vehicle_requests(status, created_at DESC)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_vehicle_requests_demand ON vehicle_requests(brand, model, status, created_at DESC)").run();
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
  if (!env.DB) return json({ success: false, error: "Подбор автомобиля временно недоступен." }, 503);

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ success: false, error: "Некорректные данные запроса." }, 400); }

  const customerName = cleanText(body.customerName, 120);
  const phone = cleanPhone(body.phone);
  const brand = cleanText(body.brand, 80);
  const model = cleanText(body.model, 100);
  const trim = cleanText(body.trim, 140) || null;
  const exteriorColor = cleanText(body.exteriorColor, 100) || null;
  const interiorColor = cleanText(body.interiorColor, 100) || null;
  const importantOptions = cleanText(body.importantOptions, 700) || null;
  const note = cleanText(body.note, 1200) || null;
  const rawSource = cleanText(body.sourceUrl, 800);
  const sourceUrl = cleanUrl(rawSource);
  const contactChannel = ALLOWED_CHANNEL.has(body.contactChannel as ContactChannel)
    ? body.contactChannel as ContactChannel
    : "whatsapp";
  const purchaseTiming = ALLOWED_TIMING.has(body.purchaseTiming as PurchaseTiming)
    ? body.purchaseTiming as PurchaseTiming
    : "flexible";
  const currency = ALLOWED_CURRENCY.has(body.currency as Currency) ? body.currency as Currency : "USD";
  const acceptInTransit = body.acceptInTransit === false ? 0 : 1;

  const desiredYearRaw = Number(body.desiredYear);
  const currentYear = new Date().getUTCFullYear();
  const desiredYear = Number.isInteger(desiredYearRaw) && desiredYearRaw >= 1990 && desiredYearRaw <= currentYear + 3
    ? desiredYearRaw
    : null;

  const maxBudgetRaw = Number(body.maxBudget);
  const maxBudget = Number.isFinite(maxBudgetRaw) && maxBudgetRaw > 0 && maxBudgetRaw < 1_000_000_000_000
    ? Math.round(maxBudgetRaw * 100) / 100
    : null;

  if (customerName.length < 2) return json({ success: false, error: "Укажите ваше имя." }, 400);
  if (phone.replace(/\D/g, "").length < 7) return json({ success: false, error: "Укажите корректный номер телефона." }, 400);
  if (brand.length < 2) return json({ success: false, error: "Укажите марку автомобиля." }, 400);
  if (model.length < 1) return json({ success: false, error: "Укажите модель автомобиля." }, 400);
  if (rawSource && !sourceUrl) return json({ success: false, error: "Ссылка должна начинаться с http:// или https://." }, 400);

  try {
    await ensureTable(env);
    const code = makeCode();
    const inserted = await env.DB.prepare(`
      INSERT INTO vehicle_requests (
        public_code, customer_name, phone, contact_channel,
        brand, model, trim, desired_year, exterior_color, interior_color,
        important_options, max_budget, currency, purchase_timing, accept_in_transit,
        source_url, note, status, created_at, updated_at
      ) VALUES (
        ?1, ?2, ?3, ?4,
        ?5, ?6, ?7, ?8, ?9, ?10,
        ?11, ?12, ?13, ?14, ?15,
        ?16, ?17, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING id, public_code, customer_name, phone, contact_channel, brand, model, trim,
        desired_year, exterior_color, interior_color, important_options, max_budget, currency,
        purchase_timing, accept_in_transit, source_url, note, status, created_at, updated_at, managed_by
    `)
      .bind(
        code, customerName, phone, contactChannel,
        brand, model, trim, desiredYear, exteriorColor, interiorColor,
        importantOptions, maxBudget, currency, purchaseTiming, acceptInTransit,
        sourceUrl, note,
      )
      .first<RequestRow>();

    if (!inserted) return json({ success: false, error: "Не удалось создать запрос." }, 500);
    return json({ success: true, request: publicRequest(inserted) }, 201);
  } catch (error) {
    console.error("Vehicle request create failed", error);
    return json({ success: false, error: "Не удалось сохранить запрос автомобиля." }, 500);
  }
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const auth = await requireStaff(request, env);
  if ("response" in auth && auth.response) return auth.response;

  try {
    await ensureTable(env);
    const statement = env.DB.prepare(`
      SELECT id, public_code, customer_name, phone, contact_channel, brand, model, trim,
        desired_year, exterior_color, interior_color, important_options, max_budget, currency,
        purchase_timing, accept_in_transit, source_url, note, status, created_at, updated_at, managed_by
      FROM vehicle_requests
      ORDER BY
        CASE status
          WHEN 'new' THEN 0
          WHEN 'contacted' THEN 1
          WHEN 'sourcing' THEN 2
          WHEN 'offered' THEN 3
          WHEN 'completed' THEN 4
          ELSE 5
        END,
        id DESC
      LIMIT 500
    `) as unknown as D1StatementListLike;
    const result = await statement.all<RequestRow>();
    return json({ success: true, requests: (result.results ?? []).map(publicRequest), viewer: { id: auth.user.id, role: auth.user.role } });
  } catch (error) {
    console.error("Vehicle request list failed", error);
    return json({ success: false, error: "Не удалось загрузить запросы." }, 500);
  }
}

export async function onRequestPatch(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const auth = await requireStaff(request, env);
  if ("response" in auth && auth.response) return auth.response;

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ success: false, error: "Некорректные данные." }, 400); }

  const id = Number(body.id);
  const status = cleanText(body.status, 24) as RequestStatus;
  if (!Number.isSafeInteger(id) || id <= 0) return json({ success: false, error: "Некорректный ID запроса." }, 400);
  if (!ALLOWED_STATUS.has(status)) return json({ success: false, error: "Некорректный статус." }, 400);

  try {
    await ensureTable(env);
    const updated = await env.DB.prepare(`
      UPDATE vehicle_requests
      SET status = ?1, managed_by = ?2, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?3
      RETURNING id, public_code, customer_name, phone, contact_channel, brand, model, trim,
        desired_year, exterior_color, interior_color, important_options, max_budget, currency,
        purchase_timing, accept_in_transit, source_url, note, status, created_at, updated_at, managed_by
    `)
      .bind(status, auth.user.id, id)
      .first<RequestRow>();

    if (!updated) return json({ success: false, error: "Запрос не найден." }, 404);
    return json({ success: true, request: publicRequest(updated) });
  } catch (error) {
    console.error("Vehicle request update failed", error);
    return json({ success: false, error: "Не удалось обновить запрос." }, 500);
  }
}
