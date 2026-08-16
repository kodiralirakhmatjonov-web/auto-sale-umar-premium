import { json, type Env } from "../_lib/auth";
import { resolveBrowserProfile } from "../_lib/browser-profile";

type CompareEnv = Env & { GEMINI_API_KEY?: string };
type CompareAction = "advice" | "deep";

type AdviceCriterion =
  | "budget"
  | "status"
  | "comfort"
  | "performance"
  | "family"
  | "economy"
  | "technology"
  | "ownership"
  | "resale";

interface D1ListResult<T> {
  results?: T[];
}

interface D1ListStatementLike {
  bind(...values: unknown[]): D1ListStatementLike;
  all<T = Record<string, unknown>>(): Promise<D1ListResult<T>>;
}

interface CompareCarRow {
  id: number;
  slug: string;
  brand: string;
  model: string;
  year: number | null;
  trim: string | null;
  vin: string | null;
  stock_number: string | null;
  status: string;
  country_code: string | null;
  arrival_date: string | null;
  price: number | null;
  currency: string | null;
  price_on_request: number;
  mileage_km: number | null;
  engine_text: string | null;
  fuel_type: string | null;
  drive_type: string | null;
  transmission: string | null;
  seats: number | null;
  engine_displacement_l: number | null;
  horsepower_hp: number | null;
  torque_nm: number | null;
  acceleration_0_100_s: number | null;
  top_speed_kmh: number | null;
  fuel_consumption_l_100km: number | null;
  electric_range_km: number | null;
  description_ru: string | null;
}

interface CompareVariantRow {
  car_id: number;
  exterior_color_name: string | null;
  interior_color_name: string | null;
  vin: string | null;
  stock_number: string | null;
  quantity: number | null;
}

interface GeminiAnnotation {
  type?: string;
  url?: string;
  title?: string;
  start_index?: number;
  end_index?: number;
  startIndex?: number;
  endIndex?: number;
}

interface GeminiInteractionResponse {
  output_text?: string;
  steps?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: GeminiAnnotation[];
    }>;
  }>;
  error?: { message?: string };
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
}

interface ProviderResult {
  text: string;
  model: string;
}

interface QuotaRow {
  advice_used: number;
  deep_used: number;
}

const MODEL = "gemini-3.6-flash";
const FALLBACK_MODEL = "gemini-2.5-flash";
const LIMIT_PER_ACTION = 4;
const MAX_NOTE_LENGTH = 700;

const VALID_CRITERIA = new Set<AdviceCriterion>([
  "budget",
  "status",
  "comfort",
  "performance",
  "family",
  "economy",
  "technology",
  "ownership",
  "resale",
]);

const CRITERIA_LABELS: Record<AdviceCriterion, string> = {
  budget: "бюджет и соотношение цены к автомобилю",
  status: "статус, имидж и премиальное восприятие",
  comfort: "комфорт, тишина и качество салона",
  performance: "динамика и характер вождения",
  family: "семейность, пространство и практичность",
  economy: "расход и эффективность",
  technology: "технологии и оснащение",
  ownership: "удобство владения и эксплуатационные риски",
  resale: "ликвидность и потенциальная перепродажа",
};

const resultSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Короткий заголовок результата на языке пользователя." },
    verdict: { type: "string", description: "Главный вывод в 1-3 предложениях." },
    recommendedSlug: {
      type: ["string", "null"],
      description: "Slug рекомендованного автомобиля только из входного списка. Null, если нельзя выбрать одного победителя.",
    },
    summary: { type: "string", description: "Полезное объяснение результата без маркетинговых выдумок." },
    reasons: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
      description: "Конкретные причины и различия между автомобилями.",
    },
    cautions: {
      type: "array",
      maxItems: 6,
      items: { type: "string" },
      description: "Ограничения, неопределённости и важные оговорки.",
    },
    bestFor: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          slug: { type: "string" },
          scenario: { type: "string" },
        },
        required: ["slug", "scenario"],
      },
      description: "Для какого сценария лучше подходит каждый автомобиль.",
    },
    expandedRows: {
      type: "array",
      maxItems: 14,
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          values: {
            type: "array",
            minItems: 2,
            maxItems: 3,
            items: {
              type: "object",
              properties: {
                slug: { type: "string" },
                value: { type: "string" },
              },
              required: ["slug", "value"],
            },
          },
          insight: { type: "string" },
        },
        required: ["label", "values", "insight"],
      },
      description: "Дополнительные параметры, найденные при углублённом сравнении. Для advice может быть пустым массивом.",
    },
    verificationNote: {
      type: "string",
      description: "Что удалось или не удалось подтвердить по VIN/официальным источникам.",
    },
  },
  required: [
    "title",
    "verdict",
    "recommendedSlug",
    "summary",
    "reasons",
    "cautions",
    "bestFor",
    "expandedRows",
    "verificationNote",
  ],
} as const;

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isSameOriginBrowserRequest(request: Request): boolean {
  const source = request.headers.get("origin") || request.headers.get("referer");
  if (!source) return false;
  try {
    const sourceUrl = new URL(source);
    const requestUrl = new URL(request.url);
    return sourceUrl.hostname.toLowerCase() === requestUrl.hostname.toLowerCase();
  } catch {
    return false;
  }
}

function normalizeSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const slug = item.trim();
    if (!slug || slug.length > 140 || !/^[a-z0-9-]+$/i.test(slug) || result.includes(slug)) continue;
    result.push(slug);
    if (result.length === 3) break;
  }
  return result;
}

function normalizeCriteria(value: unknown): AdviceCriterion[] {
  if (!Array.isArray(value)) return [];
  const result: AdviceCriterion[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !VALID_CRITERIA.has(item as AdviceCriterion)) continue;
    const criterion = item as AdviceCriterion;
    if (!result.includes(criterion)) result.push(criterion);
  }
  return result.slice(0, 9);
}

function quotaPayload(row: QuotaRow | null) {
  const adviceUsed = Math.max(0, row?.advice_used ?? 0);
  const deepUsed = Math.max(0, row?.deep_used ?? 0);
  return {
    limit: LIMIT_PER_ACTION,
    adviceUsed,
    adviceRemaining: Math.max(0, LIMIT_PER_ACTION - adviceUsed),
    deepUsed,
    deepRemaining: Math.max(0, LIMIT_PER_ACTION - deepUsed),
  };
}

async function ensureTables(env: CompareEnv): Promise<void> {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS browser_profiles (
      browser_key TEXT PRIMARY KEY,
      advice_used INTEGER NOT NULL DEFAULT 0 CHECK (advice_used >= 0),
      deep_used INTEGER NOT NULL DEFAULT 0 CHECK (deep_used >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS compare_ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      browser_key TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('advice', 'deep')),
      car_slugs_json TEXT NOT NULL,
      model TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (browser_key) REFERENCES browser_profiles(browser_key) ON DELETE CASCADE
    )
  `).run();

  await env.DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_compare_ai_usage_browser_created
      ON compare_ai_usage(browser_key, created_at DESC)
  `).run();
}

async function ensureProfile(env: CompareEnv, browserKey: string): Promise<QuotaRow> {
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO browser_profiles (browser_key, advice_used, deep_used, created_at, updated_at, last_seen_at)
    VALUES (?1, 0, 0, ?2, ?2, ?2)
    ON CONFLICT(browser_key) DO UPDATE SET last_seen_at = excluded.last_seen_at
  `).bind(browserKey, now).run();

  return (await env.DB.prepare(`
    SELECT advice_used, deep_used
    FROM browser_profiles
    WHERE browser_key = ?1
    LIMIT 1
  `).bind(browserKey).first<QuotaRow>()) ?? { advice_used: 0, deep_used: 0 };
}

async function reserveQuota(env: CompareEnv, browserKey: string, action: CompareAction): Promise<QuotaRow | null> {
  const column = action === "advice" ? "advice_used" : "deep_used";
  const now = new Date().toISOString();
  return env.DB.prepare(`
    UPDATE browser_profiles
    SET ${column} = ${column} + 1,
        updated_at = ?2,
        last_seen_at = ?2
    WHERE browser_key = ?1
      AND ${column} < ${LIMIT_PER_ACTION}
    RETURNING advice_used, deep_used
  `).bind(browserKey, now).first<QuotaRow>();
}

async function refundQuota(env: CompareEnv, browserKey: string, action: CompareAction): Promise<void> {
  const column = action === "advice" ? "advice_used" : "deep_used";
  await env.DB.prepare(`
    UPDATE browser_profiles
    SET ${column} = CASE WHEN ${column} > 0 THEN ${column} - 1 ELSE 0 END,
        updated_at = ?2
    WHERE browser_key = ?1
  `).bind(browserKey, new Date().toISOString()).run();
}

async function logUsage(
  env: CompareEnv,
  browserKey: string,
  action: CompareAction,
  slugs: string[],
  success: boolean,
): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO compare_ai_usage (browser_key, action, car_slugs_json, model, success, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
    `).bind(browserKey, action, JSON.stringify(slugs), MODEL, success ? 1 : 0, new Date().toISOString()).run();
  } catch (error) {
    console.error("Compare AI usage log failed", error);
  }
}

async function loadCars(env: CompareEnv, slugs: string[]) {
  const placeholders = slugs.map((_, index) => `?${index + 1}`).join(", ");
  const carStatement = (env.DB.prepare(`
    SELECT
      c.id,
      c.slug,
      b.name AS brand,
      c.model,
      c.model_year AS year,
      c.trim,
      c.vin,
      c.stock_number,
      c.status,
      c.source_country AS country_code,
      c.arrival_date,
      c.price_amount AS price,
      c.price_currency AS currency,
      c.price_on_request,
      c.mileage_km,
      s.engine_name AS engine_text,
      s.fuel_type_ru AS fuel_type,
      s.drivetrain_ru AS drive_type,
      s.transmission_ru AS transmission,
      s.seats,
      p.engine_displacement_l,
      p.horsepower_hp,
      p.torque_nm,
      p.acceleration_0_100_s,
      p.top_speed_kmh,
      p.fuel_consumption_l_100km,
      p.electric_range_km,
      c.description_ru
    FROM cars c
    INNER JOIN brands b ON b.id = c.brand_id
    LEFT JOIN car_specs s ON s.car_id = c.id
    LEFT JOIN car_performance p ON p.car_id = c.id
    WHERE c.slug IN (${placeholders})
      AND c.is_published = 1
      AND c.status <> 'hidden'
  `) as unknown as D1ListStatementLike).bind(...slugs);

  const carResult = await carStatement.all<CompareCarRow>();
  const rows = Array.isArray(carResult.results) ? carResult.results : [];
  if (rows.length !== slugs.length) return null;

  const ids = rows.map((row) => row.id);
  const variantPlaceholders = ids.map((_, index) => `?${index + 1}`).join(", ");
  const variantStatement = (env.DB.prepare(`
    SELECT
      v.car_id,
      v.color_name_ru AS exterior_color_name,
      v.interior_color_ru AS interior_color_name,
      inv.vin,
      inv.stock_number,
      COALESCE(inv.quantity, v.quantity, 1) AS quantity
    FROM car_variants v
    LEFT JOIN car_variant_inventory inv ON inv.variant_id = v.id
    WHERE v.car_id IN (${variantPlaceholders})
    ORDER BY v.car_id ASC, v.is_default DESC, v.sort_order ASC, v.id ASC
  `) as unknown as D1ListStatementLike).bind(...ids);
  const variantResult = await variantStatement.all<CompareVariantRow>();
  const variants = Array.isArray(variantResult.results) ? variantResult.results : [];

  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  return slugs.map((slug) => {
    const row = bySlug.get(slug)!;
    const carVariants = variants.filter((variant) => variant.car_id === row.id);
    const vins = Array.from(new Set([
      row.vin,
      ...carVariants.map((variant) => variant.vin),
    ].filter((value): value is string => Boolean(value && value.trim()))));

    return {
      slug: row.slug,
      brand: row.brand,
      model: row.model,
      year: row.year,
      trim: row.trim,
      status: row.status,
      countryCode: row.country_code,
      arrivalDate: row.arrival_date,
      price: row.price,
      currency: row.currency,
      priceOnRequest: row.price_on_request === 1,
      mileageKm: row.mileage_km,
      engineText: row.engine_text,
      fuelType: row.fuel_type,
      driveType: row.drive_type,
      transmission: row.transmission,
      seats: row.seats,
      engineDisplacementL: row.engine_displacement_l,
      horsepowerHp: row.horsepower_hp,
      torqueNm: row.torque_nm,
      acceleration0100: row.acceleration_0_100_s,
      topSpeedKmh: row.top_speed_kmh,
      fuelConsumptionL100: row.fuel_consumption_l_100km,
      electricRangeKm: row.electric_range_km,
      descriptionRu: cleanText(row.description_ru, 1800),
      vins,
      stockNumbers: Array.from(new Set([
        row.stock_number,
        ...carVariants.map((variant) => variant.stock_number),
      ].filter((value): value is string => Boolean(value && value.trim())))),
      variants: carVariants.slice(0, 12).map((variant) => ({
        exteriorColor: variant.exterior_color_name,
        interiorColor: variant.interior_color_name,
        quantity: variant.quantity,
      })),
    };
  });
}

function extractModelText(payload: GeminiInteractionResponse | null): string | null {
  if (!payload) return null;
  if (typeof payload.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
  const chunks: string[] = [];
  for (const step of payload.steps ?? []) {
    if (step.type !== "model_output") continue;
    for (const content of step.content ?? []) {
      if (content.type === "text" && typeof content.text === "string" && content.text.trim()) chunks.push(content.text.trim());
    }
  }
  return chunks.length ? chunks.join("\n") : null;
}

function extractSources(payload: GeminiInteractionResponse | null, privateIdentifiers: string[]) {
  const seen = new Set<string>();
  const result: Array<{ title: string; url: string }> = [];
  for (const step of payload?.steps ?? []) {
    if (step.type !== "model_output") continue;
    for (const content of step.content ?? []) {
      for (const annotation of content.annotations ?? []) {
        if (annotation.type !== "url_citation" || typeof annotation.url !== "string") continue;
        try {
          const url = new URL(annotation.url);
          if (url.protocol !== "https:" || seen.has(url.href)) continue;
          const lowerHref = url.href.toLowerCase();
          if (privateIdentifiers.some((identifier) => lowerHref.includes(identifier.toLowerCase()))) continue;
          seen.add(url.href);
          result.push({
            title: cleanText(annotation.title, 140) || url.hostname.replace(/^www\./, ""),
            url: url.href,
          });
          if (result.length === 10) return result;
        } catch {}
      }
    }
  }
  return result;
}


function extractGenerateContentText(payload: GeminiGenerateContentResponse | null): string | null {
  const chunks: string[] = [];
  for (const candidate of payload?.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (typeof part.text === "string" && part.text.trim()) chunks.push(part.text.trim());
    }
  }
  return chunks.length ? chunks.join("\n") : null;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init: RequestInit, label: string): Promise<Response> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.status !== 429 && response.status < 500) return response;
      lastError = new Error(`${label} HTTP ${response.status}`);
      if (attempt === 2) return response;
    } catch (error) {
      lastError = error;
      if (attempt === 2) throw error;
    }
    await sleep(350 * (attempt + 1));
  }
  throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
}

function buildResearchPrompt(
  action: CompareAction,
  cars: Awaited<ReturnType<typeof loadCars>> extends infer T ? Exclude<T, null> : never,
  criteria: AdviceCriterion[],
  note: string,
  budget: number | null,
  budgetCurrency: "USD" | "UZS" | "EUR",
  language: "ru" | "uz",
): string {
  const targetLanguage = language === "uz" ? "узбекском (латиница)" : "русском";
  const criteriaText = criteria.length
    ? criteria.map((criterion) => `- ${CRITERIA_LABELS[criterion]}`).join("\n")
    : "- общий сбалансированный выбор";

  return `
Проведи серверное исследование для Auto Sale Umar перед сравнением конкретных автомобилей.
Язык заметок: ${targetLanguage}.

Приоритет источников: официальный сайт производителя, официальный конфигуратор, официальный национальный дистрибьютор, официальный дилерский материал. Используй Google Search.
VIN разрешено использовать ТОЛЬКО как поисковый ключ. Если публичной официальной build-sheet по VIN нет, так и укажи. Не придумывай VIN-specific опции.
Не заменяй дилерскую цену Auto Sale Umar MSRP или сторонней ценой.

Цель: ${action === "deep" ? "найти дополнительные технические и комплектационные различия" : "проверить факты, которые реально влияют на выбор покупателя"}.
Критерии пользователя:\n${criteriaText}
${budget != null ? `Максимальный бюджет: ${budget} ${budgetCurrency}.` : ""}
${note ? `Комментарий: ${note}` : ""}

Автомобили из D1:\n${JSON.stringify(cars, null, 2)}

Верни краткие фактические исследовательские заметки. Финальный пользовательский ответ будет сформирован отдельным шагом.
`;
}

async function runResearch(
  env: CompareEnv,
  action: CompareAction,
  cars: Awaited<ReturnType<typeof loadCars>> extends infer T ? Exclude<T, null> : never,
  criteria: AdviceCriterion[],
  note: string,
  budget: number | null,
  budgetCurrency: "USD" | "UZS" | "EUR",
  language: "ru" | "uz",
): Promise<{ text: string; sources: ReturnType<typeof extractSources> } | null> {
  const body = JSON.stringify({
    model: MODEL,
    store: false,
    input: buildResearchPrompt(action, cars, criteria, note, budget, budgetCurrency, language),
    system_instruction: "Ты серверный автомобильный исследователь Auto Sale Umar. Ищи официальные подтверждения, отделяй факты от предположений и никогда не выдумывай комплектацию по VIN.",
    tools: [{ type: "google_search" }],
    generation_config: {
      thinking_level: "medium",
    },
  });

  try {
    const response = await fetchWithRetry("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY!,
        "Api-Revision": "2026-05-20",
      },
      body,
    }, "Gemini research");
    const payload = await response.json().catch(() => null) as GeminiInteractionResponse | null;
    if (!response.ok) {
      console.error("Compare consultant research failed", response.status, payload?.error?.message || payload);
      return null;
    }
    const text = extractModelText(payload);
    if (!text) {
      console.error("Compare consultant research returned no model text", payload);
      return null;
    }
    const privateIdentifiers = Array.from(new Set(cars.flatMap((car) => [...car.vins, ...car.stockNumbers]))).filter((identifier) => identifier.trim().length >= 6);
    return { text, sources: extractSources(payload, privateIdentifiers) };
  } catch (error) {
    console.error("Compare consultant research request failed", error);
    return null;
  }
}

function buildFinalPrompt(
  action: CompareAction,
  cars: Awaited<ReturnType<typeof loadCars>> extends infer T ? Exclude<T, null> : never,
  criteria: AdviceCriterion[],
  note: string,
  budget: number | null,
  budgetCurrency: "USD" | "UZS" | "EUR",
  language: "ru" | "uz",
  researchText: string | null,
): string {
  const base = buildPrompt(action, cars, criteria, note, budget, budgetCurrency, language)
    .replace("2. Используй Google Search для уточнения технических характеристик, комплектаций и официальных данных по конкретному модельному году.", "2. Внешняя проверка выполнялась отдельным серверным этапом. Используй исследовательские заметки ниже только как дополнительный источник, а D1 — как первичный источник цены, статуса и конкретного автомобиля.");
  return `${base}\n\nИССЛЕДОВАТЕЛЬСКИЕ ЗАМЕТКИ ИЗ ОФИЦИАЛЬНОГО WEB-ПОИСКА:\n${researchText || "Внешний поиск в этой попытке не завершился. Сформируй полезный ответ по D1 и явно укажи, что внешняя проверка временно недоступна."}`;
}

async function runStructuredInteraction(env: CompareEnv, prompt: string, action: CompareAction): Promise<ProviderResult | null> {
  const response = await fetchWithRetry("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY!,
      "Api-Revision": "2026-05-20",
    },
    body: JSON.stringify({
      model: MODEL,
      store: false,
      input: prompt,
      system_instruction: "Ты автомобильный аналитик Auto Sale Umar. Сравнивай конкретные дилерские автомобили строго по фактам, отделяй данные D1 от внешней проверки и не выдумывай комплектации по VIN.",
      generation_config: {
        thinking_level: "medium",
      },
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: resultSchema,
      },
    }),
  }, "Gemini structured interaction");

  const payload = await response.json().catch(() => null) as GeminiInteractionResponse | null;
  if (!response.ok) {
    console.error("Compare consultant structured interaction failed", response.status, payload?.error?.message || payload);
    return null;
  }
  const text = extractModelText(payload);
  if (!text) {
    console.error("Compare consultant structured interaction returned no text", payload);
    return null;
  }
  return { text, model: MODEL };
}

async function runStructuredGenerateContent(env: CompareEnv, prompt: string, model: string): Promise<ProviderResult | null> {
  const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY!,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: "Ты автомобильный аналитик Auto Sale Umar. Сравнивай конкретные дилерские автомобили строго по фактам. Верни только JSON по заданной схеме." }],
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: resultSchema,
      },
    }),
  }, `Gemini generateContent ${model}`);

  const payload = await response.json().catch(() => null) as GeminiGenerateContentResponse | null;
  if (!response.ok) {
    console.error("Compare consultant generateContent failed", model, response.status, payload?.error?.message || payload);
    return null;
  }
  const text = extractGenerateContentText(payload);
  if (!text) {
    console.error("Compare consultant generateContent returned no text", model, payload);
    return null;
  }
  return { text, model };
}

async function runFinalProvider(env: CompareEnv, prompt: string, action: CompareAction): Promise<ProviderResult> {
  const interaction = await runStructuredInteraction(env, prompt, action).catch((error) => {
    console.error("Structured interaction transport failed", error);
    return null;
  });
  if (interaction) return interaction;

  const generate36 = await runStructuredGenerateContent(env, prompt, MODEL).catch((error) => {
    console.error("GenerateContent 3.6 transport failed", error);
    return null;
  });
  if (generate36) return generate36;

  const fallback = await runStructuredGenerateContent(env, prompt, FALLBACK_MODEL).catch((error) => {
    console.error("GenerateContent fallback transport failed", error);
    return null;
  });
  if (fallback) return fallback;

  throw new Error("All consultant provider paths failed");
}

function sanitizeResult(raw: Record<string, unknown>, slugs: string[]) {
  const recommendedRaw = cleanText(raw.recommendedSlug, 140);
  const recommendedSlug = slugs.includes(recommendedRaw) ? recommendedRaw : null;

  const cleanStringArray = (value: unknown, maxItems: number) => Array.isArray(value)
    ? value.map((item) => cleanText(item, 700)).filter(Boolean).slice(0, maxItems)
    : [];

  const bestFor = Array.isArray(raw.bestFor)
    ? raw.bestFor
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)))
      .map((item) => ({ slug: cleanText(item.slug, 140), scenario: cleanText(item.scenario, 700) }))
      .filter((item) => slugs.includes(item.slug) && item.scenario)
      .slice(0, 6)
    : [];

  const expandedRows = Array.isArray(raw.expandedRows)
    ? raw.expandedRows
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)))
      .map((item) => {
        const values = Array.isArray(item.values)
          ? item.values
            .filter((value): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value)))
            .map((value) => ({ slug: cleanText(value.slug, 140), value: cleanText(value.value, 500) }))
            .filter((value) => slugs.includes(value.slug) && value.value)
            .slice(0, 3)
          : [];
        return {
          label: cleanText(item.label, 180),
          values,
          insight: cleanText(item.insight, 700),
        };
      })
      .filter((item) => item.label && item.values.length >= 2)
      .slice(0, 14)
    : [];

  return {
    title: cleanText(raw.title, 220),
    verdict: cleanText(raw.verdict, 1200),
    recommendedSlug,
    summary: cleanText(raw.summary, 2500),
    reasons: cleanStringArray(raw.reasons, 8),
    cautions: cleanStringArray(raw.cautions, 6),
    bestFor,
    expandedRows,
    verificationNote: cleanText(raw.verificationNote, 1000),
  };
}

function redactPrivateIdentifiers<T>(value: T, identifiers: string[]): T {
  if (identifiers.length === 0) return value;
  let serialized = JSON.stringify(value);
  for (const identifier of identifiers) {
    if (!identifier) continue;
    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    serialized = serialized.replace(new RegExp(escaped, "gi"), "VIN ••••");
  }
  return JSON.parse(serialized) as T;
}

function buildPrompt(
  action: CompareAction,
  cars: Awaited<ReturnType<typeof loadCars>> extends infer T ? Exclude<T, null> : never,
  criteria: AdviceCriterion[],
  note: string,
  budget: number | null,
  budgetCurrency: "USD" | "UZS" | "EUR",
  language: "ru" | "uz",
): string {
  const targetLanguage = language === "uz" ? "узбекском (латиница)" : "русском";
  const criteriaText = criteria.length
    ? criteria.map((criterion) => `- ${CRITERIA_LABELS[criterion]}`).join("\n")
    : "- общий сбалансированный выбор";

  return `
Задача: ${action === "advice" ? "дать персональный совет по выбору" : "сделать углублённое сравнение"} между конкретными автомобилями Auto Sale Umar.
Ответ дай на ${targetLanguage} языке.

ВАЖНЫЕ ПРАВИЛА:
1. Данные AUTO SALE UMAR ниже — первичный источник по цене, статусу, пробегу, конкретному автомобилю и его VIN.
2. Используй Google Search для уточнения технических характеристик, комплектаций и официальных данных по конкретному модельному году.
3. Для внешних фактов отдавай приоритет официальным сайтам производителя, официальным национальным дистрибьюторам и официальным дилерским материалам.
4. VIN используй как ключ поиска и проверки. Если по VIN нет публичной официальной build-sheet/страницы, НЕ выдумывай VIN-specific оснащение. Прямо напиши, что конкретное оснащение по VIN публично не подтверждено.
5. Не заменяй цену Auto Sale Umar MSRP или сторонней рыночной ценой.
6. Не выдавай предположение за факт. Если рынки/комплектации отличаются, укажи это.
7. recommendedSlug может быть только одним из slug ниже или null.
8. expandedRows добавляй прежде всего для действия deep. Не повторяй без необходимости уже очевидные строки базы.
9. Совет должен помогать реальному покупателю, а не объявлять абстрактного "победителя".
10. Никогда не выводи полный VIN или внутренний stock number в пользовательский ответ. Они даны только для серверной проверки.

КРИТЕРИИ ПОЛЬЗОВАТЕЛЯ:
${criteriaText}
${budget != null ? `\nМаксимальный бюджет пользователя: ${budget} ${budgetCurrency}` : ""}
${note ? `\nДополнительный комментарий пользователя: ${note}` : ""}

КОНКРЕТНЫЕ АВТОМОБИЛИ ИЗ D1:
${JSON.stringify(cars, null, 2)}
`;
}

export async function onRequestGet(): Promise<Response> {
  return json({ success: true, available: false, reason: "HIGH_DEMAND" });
}

export async function onRequestPost(context: { request: Request; env: CompareEnv }): Promise<Response> {
  const { request } = context;
  if (!isSameOriginBrowserRequest(request)) return json({ success: false, error: "Запрос отклонён." }, 403);
  return json({
    success: false,
    error: "Консультант временно недоступен из-за высокого спроса.",
    code: "HIGH_DEMAND_PAUSE",
  }, 503);
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте GET или POST." }, 405, { allow: "GET, POST" });
}
