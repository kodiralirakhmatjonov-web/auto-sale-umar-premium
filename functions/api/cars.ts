import {
  getAuthenticatedUser,
  json,
  type Env,
} from "../_lib/auth";

export type CarStatus =
  | "in_stock"
  | "in_showroom"
  | "in_transit"
  | "made_to_order"
  | "reserved"
  | "sold"
  | "hidden";

export type Currency = "USD" | "UZS" | "EUR";

interface CreateCarBody {
  brand?: unknown;
  model?: unknown;
  year?: unknown;
  trim?: unknown;
  vin?: unknown;
  stockNumber?: unknown;
  status?: unknown;
  countryCode?: unknown;
  arrivalDate?: unknown;

  price?: unknown;
  currency?: unknown;
  priceOnRequest?: unknown;

  mileageKm?: unknown;
  fuelType?: unknown;
  driveType?: unknown;
  transmission?: unknown;
  engineText?: unknown;
  seats?: unknown;

  exteriorColor?: unknown;
  exteriorColorRu?: unknown;
  exteriorColorUz?: unknown;
  interiorColor?: unknown;
  interiorColorRu?: unknown;
  interiorColorUz?: unknown;

  shortDescriptionRu?: unknown;
  shortDescriptionUz?: unknown;
  descriptionRu?: unknown;
  descriptionUz?: unknown;

  isNew?: unknown;
  isNewArrival?: unknown;
  isPublic?: unknown;
  isFeatured?: unknown;
}

interface D1ListResult<T> {
  results?: T[];
}

interface D1ListStatementLike {
  bind(...values: unknown[]): D1ListStatementLike;
  all<T = Record<string, unknown>>(): Promise<D1ListResult<T>>;
}

export interface CarListRow {
  id: number;
  slug: string;
  brand: string;
  model: string;
  year: number | null;
  trim: string | null;
  vin: string | null;
  stock_number: string | null;
  status: CarStatus;
  country_code: string | null;
  arrival_date: string | null;
  price: number | null;
  currency: Currency;
  price_on_request: number;
  mileage_km: number;
  engine_text: string | null;
  fuel_type: string | null;
  drive_type: string | null;
  transmission: string | null;
  seats: number | null;
  exterior_color: string | null;
  interior_color: string | null;
  short_description_ru: string;
  short_description_uz: string;
  description_ru: string;
  description_uz: string;
  is_new: number;
  is_new_arrival: number;
  is_public: number;
  is_featured: number;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  cover_url: string | null;
}

interface BrandRow {
  id: number;
  name: string;
}

export function normalizeText(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function nullableText(value: unknown, maxLength = 500): string | null {
  const text = normalizeText(value, maxLength);
  return text || null;
}

function parseOptionalInteger(
  value: unknown,
  min: number,
  max: number,
): number | null | "invalid" {
  if (value === "" || value == null) return null;

  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isSafeInteger(number) || number < min || number > max) {
    return "invalid";
  }

  return number;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function isCarStatus(value: string): value is CarStatus {
  return [
    "in_stock",
    "in_showroom",
    "in_transit",
    "made_to_order",
    "reserved",
    "sold",
    "hidden",
  ].includes(value);
}

function isCurrency(value: string): value is Currency {
  return value === "USD" || value === "UZS" || value === "EUR";
}

export function validCountryCode(value: string): boolean {
  return value === "" || /^[A-Z]{2}$/.test(value);
}

function validIsoDate(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isUniqueConstraintError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /unique|constraint/i.test(message);
}

function slugify(value: string): string {
  const result = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return result || "car";
}

function shortText(value: string, fallback: string): string {
  const clean = value.trim() || fallback.trim();
  return clean.slice(0, 220);
}

function fuelLabels(value: string | null): { ru: string | null; uz: string | null } {
  if (!value) return { ru: null, uz: null };

  const labels: Record<string, { ru: string; uz: string }> = {
    gasoline: { ru: "Бензин", uz: "Benzin" },
    diesel: { ru: "Дизель", uz: "Dizel" },
    hybrid: { ru: "Гибрид", uz: "Gibrid" },
    phev: { ru: "Подключаемый гибрид", uz: "Plug-in gibrid" },
    electric: { ru: "Электро", uz: "Elektr" },
  };

  return labels[value] ?? { ru: value, uz: value };
}

function transmissionLabels(value: string | null): { ru: string | null; uz: string | null } {
  if (!value) return { ru: null, uz: null };

  const labels: Record<string, { ru: string; uz: string }> = {
    automatic: { ru: "Автомат", uz: "Avtomat" },
    robot: { ru: "Робот", uz: "Robot" },
    cvt: { ru: "Вариатор", uz: "Variator" },
    manual: { ru: "Механика", uz: "Mexanika" },
  };

  return labels[value] ?? { ru: value, uz: value };
}

function drivetrainLabels(value: string | null): { ru: string | null; uz: string | null } {
  if (!value) return { ru: null, uz: null };
  return { ru: value, uz: value };
}

export function toStaffCar(row: CarListRow) {
  return {
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    year: row.year,
    trim: row.trim,
    vin: row.vin,
    stockNumber: row.stock_number,
    status: row.status,
    countryCode: row.country_code,
    arrivalDate: row.arrival_date,
    price: row.price,
    currency: row.currency,
    priceOnRequest: row.price_on_request === 1,
    mileageKm: row.mileage_km,
    bodyType: null,
    fuelType: row.fuel_type,
    driveType: row.drive_type,
    transmission: row.transmission,
    engineText: row.engine_text,
    seats: row.seats,
    exteriorColor: row.exterior_color,
    interiorColor: row.interior_color,
    shortDescriptionRu: row.short_description_ru,
    shortDescriptionUz: row.short_description_uz,
    descriptionRu: row.description_ru,
    descriptionUz: row.description_uz,
    isNew: row.is_new === 1,
    isNewArrival: row.is_new_arrival === 1,
    isPublic: row.is_public === 1,
    isFeatured: row.is_featured === 1,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    coverUrl: row.cover_url,
  };
}

export function toPublicCatalogCar(row: CarListRow) {
  return {
    id: row.id,
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
    fuelType: row.fuel_type,
    driveType: row.drive_type,
    transmission: row.transmission,
    engineText: row.engine_text,
    seats: row.seats,
    exteriorColor: row.exterior_color,
    interiorColor: row.interior_color,
    shortDescriptionRu: row.short_description_ru,
    shortDescriptionUz: row.short_description_uz,
    descriptionRu: row.description_ru,
    descriptionUz: row.description_uz,
    isNew: row.is_new === 1,
    isNewArrival: row.is_new_arrival === 1,
    isFeatured: row.is_featured === 1,
    updatedAt: row.updated_at,
    coverUrl: row.cover_url,
  };
}

export const CAR_SELECT = `
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
    v.color_name_ru AS exterior_color,
    v.interior_color_ru AS interior_color,
    c.short_description_ru,
    c.short_description_uz,
    c.description_ru,
    c.description_uz,
    c.is_new,
    c.is_new_arrival,
    c.is_published AS is_public,
    c.is_featured,
    c.created_by,
    c.updated_by,
    c.created_at,
    c.updated_at,
    (
      SELECT cm.public_url
      FROM car_media cm
      WHERE cm.car_id = c.id
        AND cm.media_type = 'image'
      ORDER BY cm.is_cover DESC, cm.sort_order ASC, cm.id ASC
      LIMIT 1
    ) AS cover_url
  FROM cars c
  INNER JOIN brands b ON b.id = c.brand_id
  LEFT JOIN car_specs s ON s.car_id = c.id
  LEFT JOIN car_variants v ON v.id = (
    SELECT cv.id
    FROM car_variants cv
    WHERE cv.car_id = c.id
    ORDER BY cv.is_default DESC, cv.sort_order ASC, cv.id ASC
    LIMIT 1
  )
`;

async function ensureBrand(env: Env, brandName: string): Promise<BrandRow> {
  const existing = await env.DB.prepare(
    `SELECT id, name
     FROM brands
     WHERE lower(name) = lower(?1)
     LIMIT 1`,
  )
    .bind(brandName)
    .first<BrandRow>();

  if (existing) return existing;

  const baseSlug = slugify(brandName);

  try {
    const created = await env.DB.prepare(
      `INSERT INTO brands (slug, name, is_active)
       VALUES (?1, ?2, 1)
       RETURNING id, name`,
    )
      .bind(baseSlug, brandName)
      .first<BrandRow>();

    if (created) return created;
  } catch (error) {
    const raced = await env.DB.prepare(
      `SELECT id, name
       FROM brands
       WHERE lower(name) = lower(?1)
       LIMIT 1`,
    )
      .bind(brandName)
      .first<BrandRow>();

    if (raced) return raced;

    if (!isUniqueConstraintError(error)) throw error;
  }

  const createdWithSuffix = await env.DB.prepare(
    `INSERT INTO brands (slug, name, is_active)
     VALUES (?1, ?2, 1)
     RETURNING id, name`,
  )
    .bind(`${baseSlug}-${crypto.randomUUID().slice(0, 6)}`, brandName)
    .first<BrandRow>();

  if (!createdWithSuffix) {
    throw new Error("D1 did not return the created brand row.");
  }

  return createdWithSuffix;
}

async function getCarById(env: Env, id: number): Promise<CarListRow | null> {
  return env.DB.prepare(`${CAR_SELECT} WHERE c.id = ?1 LIMIT 1`)
    .bind(id)
    .first<CarListRow>();
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (!env.DB || !env.AUTH_PEPPER) {
    return json({ success: false, error: "Серверная конфигурация не завершена." }, 500);
  }

  const currentUser = await getAuthenticatedUser(request, env);
  if (!currentUser) {
    return json({ success: false, error: "Требуется вход в систему." }, 401);
  }

  if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
    return json({ success: false, error: "Недостаточно прав для управления автомобилями." }, 403);
  }

  const url = new URL(request.url);
  const q = normalizeText(url.searchParams.get("q"), 120);
  const rawStatus = normalizeText(url.searchParams.get("status"), 30);
  const rawCountry = normalizeText(url.searchParams.get("country"), 10).toUpperCase();

  const where: string[] = [];
  const bindings: unknown[] = [];

  if (rawStatus && rawStatus !== "all") {
    if (!isCarStatus(rawStatus)) {
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
        OR c.trim LIKE ?${position} COLLATE NOCASE
        OR c.vin LIKE ?${position} COLLATE NOCASE
        OR c.stock_number LIKE ?${position} COLLATE NOCASE)`,
    );
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const listSql = `
    ${CAR_SELECT}
    ${whereSql}
    ORDER BY
      CASE c.status
        WHEN 'in_stock' THEN 0
        WHEN 'in_showroom' THEN 1
        WHEN 'in_transit' THEN 2
        WHEN 'made_to_order' THEN 3
        WHEN 'reserved' THEN 4
        WHEN 'sold' THEN 5
        WHEN 'hidden' THEN 6
        ELSE 7
      END,
      c.is_featured DESC,
      c.updated_at DESC,
      c.id DESC
    LIMIT 100
  `;

  const countSql = `
    SELECT COUNT(*) AS count
    FROM cars c
    INNER JOIN brands b ON b.id = c.brand_id
    ${whereSql}
  `;

  try {
    const listPrepared = env.DB.prepare(listSql) as unknown as D1ListStatementLike;
    const listStatement = bindings.length > 0
      ? listPrepared.bind(...bindings)
      : listPrepared;
    const listResult = await listStatement.all<CarListRow>();
    const rows = Array.isArray(listResult.results) ? listResult.results : [];

    const countPrepared = env.DB.prepare(countSql);
    const countRow = bindings.length > 0
      ? await countPrepared.bind(...bindings).first<{ count: number }>()
      : await countPrepared.first<{ count: number }>();

    return json({
      success: true,
      viewer: {
        id: currentUser.id,
        role: currentUser.role,
      },
      total: countRow?.count ?? rows.length,
      cars: rows.map(toStaffCar),
    });
  } catch (error) {
    console.error("Cars list failed", error);
    return json(
      {
        success: false,
        error: "Не удалось загрузить автомобили из D1.",
      },
      500,
    );
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (!env.DB || !env.AUTH_PEPPER) {
    return json({ success: false, error: "Серверная конфигурация не завершена." }, 500);
  }

  const currentUser = await getAuthenticatedUser(request, env);
  if (!currentUser) {
    return json({ success: false, error: "Требуется вход в систему." }, 401);
  }

  if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
    return json({ success: false, error: "Недостаточно прав для управления автомобилями." }, 403);
  }

  let body: CreateCarBody;
  try {
    body = (await request.json()) as CreateCarBody;
  } catch {
    return json({ success: false, error: "Некорректный JSON-запрос." }, 400);
  }

  const brandName = normalizeText(body.brand, 80);
  const model = normalizeText(body.model, 100);
  const trim = nullableText(body.trim, 120);
  const vin = nullableText(body.vin, 32)?.toUpperCase() ?? null;
  const stockNumber = nullableText(body.stockNumber, 80);
  const status = normalizeText(body.status, 30);
  const countryCode = normalizeText(body.countryCode, 10).toUpperCase();
  const arrivalDate = normalizeText(body.arrivalDate, 10);
  const currencyText = normalizeText(body.currency, 10).toUpperCase() || "USD";

  if (!brandName) {
    return json({ success: false, error: "Укажите марку автомобиля." }, 400);
  }

  if (!model) {
    return json({ success: false, error: "Укажите модель автомобиля." }, 400);
  }

  if (!isCarStatus(status)) {
    return json({ success: false, error: "Выберите корректный статус автомобиля." }, 400);
  }

  if (!validCountryCode(countryCode)) {
    return json({ success: false, error: "Выберите корректную страну." }, 400);
  }

  if (!validIsoDate(arrivalDate)) {
    return json({ success: false, error: "Проверьте дату прибытия." }, 400);
  }

  if (!isCurrency(currencyText)) {
    return json(
      {
        success: false,
        error: "D1 сейчас поддерживает только USD, UZS и EUR.",
      },
      400,
    );
  }

  if (vin && !/^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin)) {
    return json(
      {
        success: false,
        error: "VIN должен содержать 11–17 допустимых латинских символов и цифр.",
      },
      400,
    );
  }

  const year = parseOptionalInteger(body.year, 1900, 2100);
  const price = parseOptionalInteger(body.price, 0, 9_000_000_000_000);
  const mileageKm = parseOptionalInteger(body.mileageKm, 0, 20_000_000);
  const seats = parseOptionalInteger(body.seats, 1, 99);

  if (year === "invalid") {
    return json({ success: false, error: "Некорректный год автомобиля." }, 400);
  }

  if (price === "invalid") {
    return json({ success: false, error: "Некорректная цена автомобиля." }, 400);
  }

  if (mileageKm === "invalid") {
    return json({ success: false, error: "Некорректный пробег автомобиля." }, 400);
  }

  if (seats === "invalid") {
    return json({ success: false, error: "Некорректное количество мест." }, 400);
  }

  const engineText = nullableText(body.engineText, 180);
  const fuelType = nullableText(body.fuelType, 80);
  const driveType = nullableText(body.driveType, 80);
  const transmission = nullableText(body.transmission, 80);

  const exteriorColorRu =
    nullableText(body.exteriorColorRu, 100) ?? nullableText(body.exteriorColor, 100);
  const exteriorColorUz = nullableText(body.exteriorColorUz, 100) ?? exteriorColorRu;
  const interiorColorRu =
    nullableText(body.interiorColorRu, 100) ?? nullableText(body.interiorColor, 100);
  const interiorColorUz = nullableText(body.interiorColorUz, 100) ?? interiorColorRu;

  const descriptionRuInput = nullableText(body.descriptionRu, 10_000);
  const descriptionUzInput = nullableText(body.descriptionUz, 10_000);
  const shortDescriptionRuInput = nullableText(body.shortDescriptionRu, 220);
  const shortDescriptionUzInput = nullableText(body.shortDescriptionUz, 220);

  const priceOnRequestInput = parseBoolean(body.priceOnRequest, price == null);
  const priceOnRequest = priceOnRequestInput || price == null;
  const finalPrice = priceOnRequest ? null : price;

  const isNew = parseBoolean(body.isNew, (mileageKm ?? 0) === 0);
  const isNewArrival = parseBoolean(body.isNewArrival, false);
  const isPublished = parseBoolean(body.isPublic, false);
  const isFeatured = parseBoolean(body.isFeatured, false);

  const fallbackDescription = [brandName, model, year, trim]
    .filter((value) => value !== null && value !== "")
    .join(" ");

  const descriptionRu = descriptionRuInput ?? fallbackDescription;
  const descriptionUz = descriptionUzInput ?? fallbackDescription;
  const shortDescriptionRu =
    shortDescriptionRuInput ?? shortText(descriptionRu, fallbackDescription);
  const shortDescriptionUz =
    shortDescriptionUzInput ?? shortText(descriptionUz, fallbackDescription);
  const carSlug = `${slugify([brandName, model, year, trim].filter(Boolean).join("-"))}-${crypto
    .randomUUID()
    .slice(0, 8)}`;

  const fuel = fuelLabels(fuelType);
  const transmissionLabelsValue = transmissionLabels(transmission);
  const drivetrain = drivetrainLabels(driveType);

  try {
    if (vin) {
      const existingVin = await env.DB.prepare(
        `SELECT id FROM cars WHERE vin = ?1 COLLATE NOCASE LIMIT 1`,
      )
        .bind(vin)
        .first<{ id: number }>();

      if (existingVin) {
        return json({ success: false, error: "Автомобиль с таким VIN уже существует." }, 409);
      }
    }

    if (stockNumber) {
      const existingStock = await env.DB.prepare(
        `SELECT id FROM cars WHERE stock_number = ?1 LIMIT 1`,
      )
        .bind(stockNumber)
        .first<{ id: number }>();

      if (existingStock) {
        return json({ success: false, error: "Такой внутренний номер уже используется." }, 409);
      }
    }
  } catch (error) {
    console.error("Car duplicate check failed", error);
    return json({ success: false, error: "Не удалось проверить данные автомобиля." }, 500);
  }

  let createdCarId: number | null = null;

  try {
    const brand = await ensureBrand(env, brandName);

    const created = await env.DB.prepare(
      `INSERT INTO cars (
        brand_id,
        model,
        trim,
        model_year,
        vin,
        stock_number,
        short_description_ru,
        short_description_uz,
        description_ru,
        description_uz,
        price_amount,
        price_currency,
        price_on_request,
        status,
        source_country,
        arrival_date,
        mileage_km,
        is_new,
        is_featured,
        is_new_arrival,
        is_published,
        slug,
        created_by,
        updated_by
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6,
        ?7, ?8, ?9, ?10,
        ?11, ?12, ?13, ?14, ?15, ?16,
        ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?23
      )
      RETURNING id`,
    )
      .bind(
        brand.id,
        model,
        trim,
        year,
        vin,
        stockNumber,
        shortDescriptionRu,
        shortDescriptionUz,
        descriptionRu,
        descriptionUz,
        finalPrice,
        currencyText,
        priceOnRequest ? 1 : 0,
        status,
        countryCode || null,
        arrivalDate || null,
        mileageKm ?? 0,
        isNew ? 1 : 0,
        isFeatured ? 1 : 0,
        isNewArrival ? 1 : 0,
        isPublished ? 1 : 0,
        carSlug,
        currentUser.id,
      )
      .first<{ id: number }>();

    if (!created?.id) {
      throw new Error("D1 did not return the created car id.");
    }

    const confirmedCarId = created.id;
    createdCarId = confirmedCarId;

    const hasSpecs = Boolean(
      engineText || fuel.ru || transmissionLabelsValue.ru || drivetrain.ru || seats,
    );

    if (hasSpecs) {
      await env.DB.prepare(
        `INSERT INTO car_specs (
          car_id,
          engine_name,
          fuel_type_ru,
          fuel_type_uz,
          transmission_ru,
          transmission_uz,
          drivetrain_ru,
          drivetrain_uz,
          seats
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
      )
        .bind(
          confirmedCarId,
          engineText,
          fuel.ru,
          fuel.uz,
          transmissionLabelsValue.ru,
          transmissionLabelsValue.uz,
          drivetrain.ru,
          drivetrain.uz,
          seats,
        )
        .run();
    }

    if (exteriorColorRu || exteriorColorUz || interiorColorRu || interiorColorUz) {
      const colorNameRu = exteriorColorRu ?? "Не указан";
      const colorNameUz = exteriorColorUz ?? "Ko‘rsatilmagan";

      await env.DB.prepare(
        `INSERT INTO car_variants (
          car_id,
          color_name_ru,
          color_name_uz,
          interior_color_ru,
          interior_color_uz,
          quantity,
          is_default,
          sort_order
        ) VALUES (?1, ?2, ?3, ?4, ?5, 1, 1, 0)`,
      )
        .bind(
          confirmedCarId,
          colorNameRu,
          colorNameUz,
          interiorColorRu,
          interiorColorUz,
        )
        .run();
    }

    const car = await getCarById(env, confirmedCarId);
    if (!car) {
      throw new Error("Created car could not be loaded.");
    }

    return json(
      {
        success: true,
        message: "Автомобиль добавлен.",
        car: toStaffCar(car),
        writeVerified: true,
      },
      201,
    );
  } catch (error) {
    if (createdCarId) {
      try {
        await env.DB.prepare(`DELETE FROM cars WHERE id = ?1`).bind(createdCarId).run();
      } catch (cleanupError) {
        console.error("Car cleanup failed", cleanupError);
      }
    }

    if (isUniqueConstraintError(error)) {
      return json(
        {
          success: false,
          error: "VIN, внутренний номер или служебный идентификатор уже используется.",
        },
        409,
      );
    }

    console.error("Car creation failed", error);
    return json({ success: false, error: "Не удалось добавить автомобиль." }, 500);
  }
}

export function onRequest(): Response {
  return json(
    { success: false, error: "Используйте GET- или POST-запрос." },
    405,
    { allow: "GET, POST" },
  );
}
