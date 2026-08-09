import { json, type Env } from "../_lib/auth";
import {
  CAR_SELECT,
  isCarStatus,
  normalizeText,
  toPublicCatalogCar,
  validCountryCode,
  type CarListRow,
} from "./cars";

interface D1ListResult<T> {
  results?: T[];
}

interface D1ListStatementLike {
  bind(...values: unknown[]): D1ListStatementLike;
  all<T = Record<string, unknown>>(): Promise<D1ListResult<T>>;
}

function positiveInteger(value: string | null, fallback: number, maximum: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

async function publicCarBySlug(env: Env, slug: string): Promise<Response> {
  if (!slug || slug.length > 140) {
    return json({ success: false, error: "Некорректный адрес автомобиля." }, 400);
  }

  try {
    const car = await env.DB.prepare(
      `${CAR_SELECT}
       WHERE c.slug = ?1
         AND c.is_published = 1
         AND c.status <> 'hidden'
       LIMIT 1`,
    )
      .bind(slug)
      .first<CarListRow>();

    if (!car) {
      return json({ success: false, error: "Автомобиль не найден." }, 404);
    }

    return json({ success: true, car: toPublicCatalogCar(car) });
  } catch (error) {
    console.error("Public car detail failed", error);
    return json({ success: false, error: "Не удалось загрузить автомобиль." }, 500);
  }
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (!env.DB) {
    return json({ success: false, error: "Каталог временно недоступен." }, 500);
  }

  const url = new URL(request.url);
  const slug = normalizeText(url.searchParams.get("slug"), 140);
  if (slug) return publicCarBySlug(env, slug);

  const q = normalizeText(url.searchParams.get("q"), 120);
  const rawStatus = normalizeText(url.searchParams.get("status"), 30);
  const rawCountry = normalizeText(url.searchParams.get("country"), 10).toUpperCase();
  const page = positiveInteger(url.searchParams.get("page"), 1, 10_000);
  const pageSize = positiveInteger(url.searchParams.get("pageSize"), 24, 100);
  const offset = (page - 1) * pageSize;

  const where = ["c.is_published = 1", "c.status <> 'hidden'"];
  const bindings: unknown[] = [];

  if (rawStatus && rawStatus !== "all") {
    if (!isCarStatus(rawStatus) || rawStatus === "hidden") {
      return json({ success: false, error: "Некорректный статус автомобиля." }, 400);
    }
    bindings.push(rawStatus);
    where.push(`c.status = ?${bindings.length}`);
  }

  if (rawCountry && rawCountry !== "ALL") {
    if (!validCountryCode(rawCountry)) {
      return json({ success: false, error: "Некорректный код страны." }, 400);
    }
    bindings.push(rawCountry);
    where.push(`c.source_country = ?${bindings.length}`);
  }

  if (q) {
    bindings.push(`%${q}%`);
    const position = bindings.length;
    where.push(
      `(b.name LIKE ?${position} COLLATE NOCASE
        OR c.model LIKE ?${position} COLLATE NOCASE
        OR c.trim LIKE ?${position} COLLATE NOCASE)`,
    );
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;
  const limitPosition = bindings.length + 1;
  const offsetPosition = bindings.length + 2;
  const listBindings = [...bindings, pageSize, offset];

  const listSql = `
    ${CAR_SELECT}
    ${whereSql}
    ORDER BY
      c.is_featured DESC,
      CASE WHEN datetime(c.created_at) >= datetime('now', '-30 days') THEN 1 ELSE 0 END DESC,
      CASE c.status
        WHEN 'in_stock' THEN 0
        WHEN 'in_showroom' THEN 1
        WHEN 'in_transit' THEN 2
        WHEN 'made_to_order' THEN 3
        WHEN 'reserved' THEN 4
        WHEN 'sold' THEN 5
        ELSE 6
      END,
      c.updated_at DESC,
      c.id DESC
    LIMIT ?${limitPosition}
    OFFSET ?${offsetPosition}
  `;

  const countSql = `
    SELECT COUNT(*) AS count
    FROM cars c
    INNER JOIN brands b ON b.id = c.brand_id
    ${whereSql}
  `;

  try {
    const prepared = env.DB.prepare(listSql) as unknown as D1ListStatementLike;
    const result = await prepared.bind(...listBindings).all<CarListRow>();
    const rows = Array.isArray(result.results) ? result.results : [];

    const countPrepared = env.DB.prepare(countSql);
    const countRow = bindings.length > 0
      ? await countPrepared.bind(...bindings).first<{ count: number }>()
      : await countPrepared.first<{ count: number }>();
    const total = countRow?.count ?? rows.length;

    return json({
      success: true,
      page,
      pageSize,
      total,
      hasMore: offset + rows.length < total,
      cars: rows.map(toPublicCatalogCar),
    });
  } catch (error) {
    console.error("Public cars list failed", error);
    return json({ success: false, error: "Не удалось загрузить каталог автомобилей." }, 500);
  }
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте GET-запрос." }, 405, { allow: "GET" });
}
