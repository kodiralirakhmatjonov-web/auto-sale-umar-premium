import { getAuthenticatedUser, json, type Env } from "../_lib/auth";

type AiEnv = Env & { GEMINI_API_KEY?: string };

interface GeminiInteractionResponse {
  output_text?: string;
  error?: { message?: string };
}

const MAX_SOURCE_LENGTH = 180_000;
const MODEL = "gemini-3.6-flash";

const nullableString = (description: string) => ({
  type: ["string", "null"],
  description,
});

const nullableNumber = (description: string) => ({
  type: ["number", "null"],
  description,
});

const nullableInteger = (description: string) => ({
  type: ["integer", "null"],
  description,
});

const nullableBoolean = (description: string) => ({
  type: ["boolean", "null"],
  description,
});

const responseSchema = {
  type: "object",
  properties: {
    brand: nullableString("Exact vehicle brand. Prefer one of: Mercedes-Benz, Range Rover, Rolls-Royce, Cadillac, Lexus, Toyota, Genesis, BMW, Lamborghini."),
    model: nullableString("Vehicle model only, without trim. Use uppercase-friendly canonical model name."),
    year: nullableInteger("Model year."),
    trim: nullableString("Trim / grade / package name."),
    status: nullableString("Only when explicitly present. Allowed internal values: in_stock, in_showroom, in_transit, made_to_order, reserved."),
    countryCode: nullableString("Source/import country only if explicit. Use KR, US, CA, or AE."),
    arrivalDate: nullableString("Expected arrival date as YYYY-MM-DD only when explicit."),
    isNew: nullableBoolean("Whether the vehicle is new. Null if unclear."),
    mileageKm: nullableInteger("Mileage in kilometers, converting miles to km only when source clearly uses miles."),

    engineText: nullableString("Concise engine / powertrain text, e.g. 2.4L Turbo Hybrid MAX."),
    engineDisplacementL: nullableNumber("Engine displacement in liters."),
    fuelType: nullableString("Allowed internal values: gasoline, diesel, hybrid, phev, electric."),
    driveType: nullableString("Drivetrain such as AWD, 4WD, RWD, FWD."),
    transmission: nullableString("Allowed internal values: automatic, robot, cvt, manual."),
    seats: nullableInteger("Number of seats."),
    horsepowerHp: nullableInteger("Horsepower in hp/PS when clearly stated."),
    torqueNm: nullableInteger("Torque in Nm. Convert lb-ft to Nm if needed."),
    acceleration0100: nullableNumber("0-100 km/h acceleration in seconds. Convert from 0-60 mph only when clearly stated and add a warning that it is converted."),
    topSpeedKmh: nullableInteger("Top speed in km/h. Convert mph if needed."),
    fuelConsumptionL100: nullableNumber("Combined fuel consumption in L/100 km when available. Convert mpg only when the source is clear and add a warning."),
    electricRangeKm: nullableInteger("EV-only or plug-in electric range in km. Do not invent for normal hybrids."),

    price: nullableInteger("Actual sale price only if explicitly stated for this exact vehicle. Do not use MSRP/reference pricing unless it is clearly the dealer sale price."),
    currency: nullableString("USD, UZS, or EUR only when price is present."),
    priceOnRequest: nullableBoolean("True only if the text explicitly says price on request / contact for price."),
    instagramUrl: nullableString("Instagram post/reel URL if present."),

    shortDescriptionRu: nullableString("A concise Russian card description, max about 220 characters, using only facts supported by the source."),
    shortDescriptionUz: nullableString("A concise Uzbek card description, max about 220 characters, using only facts supported by the source."),
    descriptionRu: nullableString("A useful Russian sales description using only supported facts; no invented equipment."),
    descriptionUz: nullableString("A useful Uzbek sales description using only supported facts; no invented equipment."),

    variants: {
      type: "array",
      description: "Color/inventory variants explicitly described in the source. If no colors are stated, return an empty array.",
      items: {
        type: "object",
        properties: {
          exteriorColorName: nullableString("Official exterior color name."),
          exteriorSwatch: nullableString("Best approximate CSS hex color such as #111214. Null if color is unknown."),
          interiorColorName: nullableString("Official interior color/material name."),
          interiorSwatch: nullableString("Best approximate CSS hex color. Null if unknown."),
          vin: nullableString("VIN only when explicitly present. Never invent."),
          stockNumber: nullableString("Dealer/internal stock number only when explicitly present."),
          quantity: nullableInteger("Quantity only if explicit; otherwise null."),
        },
        required: [
          "exteriorColorName",
          "exteriorSwatch",
          "interiorColorName",
          "interiorSwatch",
          "vin",
          "stockNumber",
          "quantity"
        ],
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Short warnings for converted, ambiguous, conflicting, or missing information that an administrator should verify.",
    },
  },
  required: [
    "brand", "model", "year", "trim", "status", "countryCode", "arrivalDate", "isNew", "mileageKm",
    "engineText", "engineDisplacementL", "fuelType", "driveType", "transmission", "seats", "horsepowerHp",
    "torqueNm", "acceleration0100", "topSpeedKmh", "fuelConsumptionL100", "electricRangeKm", "price", "currency",
    "priceOnRequest", "instagramUrl", "shortDescriptionRu", "shortDescriptionUz", "descriptionRu", "descriptionUz",
    "variants", "warnings"
  ],
} as const;

function cleanText(value: unknown, max = 10_000): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, max) : null;
}

function cleanNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function cleanInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}

function cleanBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function validHex(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : null;
}

function sanitizeAiResult(raw: Record<string, unknown>) {
  const allowedBrands = new Map([
    ["mercedes-benz", "Mercedes-Benz"],
    ["mercedes benz", "Mercedes-Benz"],
    ["mercedes", "Mercedes-Benz"],
    ["range rover", "Range Rover"],
    ["land rover", "Range Rover"],
    ["rolls-royce", "Rolls-Royce"],
    ["rolls royce", "Rolls-Royce"],
    ["cadillac", "Cadillac"],
    ["lexus", "Lexus"],
    ["toyota", "Toyota"],
    ["genesis", "Genesis"],
    ["bmw", "BMW"],
    ["lamborghini", "Lamborghini"],
  ]);

  const brandRaw = cleanText(raw.brand, 80);
  const brand = brandRaw ? (allowedBrands.get(brandRaw.toLowerCase()) ?? brandRaw) : null;

  const statusRaw = cleanText(raw.status, 30);
  const status = statusRaw && ["in_stock", "in_showroom", "in_transit", "made_to_order", "reserved"].includes(statusRaw)
    ? statusRaw
    : null;

  const countryRaw = cleanText(raw.countryCode, 10)?.toUpperCase() ?? null;
  const countryCode = countryRaw && ["KR", "US", "CA", "AE"].includes(countryRaw) ? countryRaw : null;

  const fuelRaw = cleanText(raw.fuelType, 30);
  const fuelType = fuelRaw && ["gasoline", "diesel", "hybrid", "phev", "electric"].includes(fuelRaw)
    ? fuelRaw
    : null;

  const transmissionRaw = cleanText(raw.transmission, 30);
  const transmission = transmissionRaw && ["automatic", "robot", "cvt", "manual"].includes(transmissionRaw)
    ? transmissionRaw
    : null;

  const currencyRaw = cleanText(raw.currency, 10)?.toUpperCase() ?? null;
  const currency = currencyRaw && ["USD", "UZS", "EUR"].includes(currencyRaw) ? currencyRaw : null;

  const variantsRaw = Array.isArray(raw.variants) ? raw.variants.slice(0, 12) : [];
  const variants = variantsRaw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)))
    .map((item) => ({
      exteriorColorName: cleanText(item.exteriorColorName, 120),
      exteriorSwatch: validHex(item.exteriorSwatch),
      interiorColorName: cleanText(item.interiorColorName, 120),
      interiorSwatch: validHex(item.interiorSwatch),
      vin: cleanText(item.vin, 32)?.toUpperCase() ?? null,
      stockNumber: cleanText(item.stockNumber, 80),
      quantity: cleanInteger(item.quantity),
    }));

  const warnings = Array.isArray(raw.warnings)
    ? raw.warnings.map((item) => cleanText(item, 400)).filter((item): item is string => Boolean(item)).slice(0, 20)
    : [];

  return {
    brand,
    model: cleanText(raw.model, 100),
    year: cleanInteger(raw.year),
    trim: cleanText(raw.trim, 120),
    status,
    countryCode,
    arrivalDate: cleanText(raw.arrivalDate, 10),
    isNew: cleanBoolean(raw.isNew),
    mileageKm: cleanInteger(raw.mileageKm),
    engineText: cleanText(raw.engineText, 180),
    engineDisplacementL: cleanNumber(raw.engineDisplacementL),
    fuelType,
    driveType: cleanText(raw.driveType, 80),
    transmission,
    seats: cleanInteger(raw.seats),
    horsepowerHp: cleanInteger(raw.horsepowerHp),
    torqueNm: cleanInteger(raw.torqueNm),
    acceleration0100: cleanNumber(raw.acceleration0100),
    topSpeedKmh: cleanInteger(raw.topSpeedKmh),
    fuelConsumptionL100: cleanNumber(raw.fuelConsumptionL100),
    electricRangeKm: cleanInteger(raw.electricRangeKm),
    price: cleanInteger(raw.price),
    currency,
    priceOnRequest: cleanBoolean(raw.priceOnRequest),
    instagramUrl: cleanText(raw.instagramUrl, 500),
    shortDescriptionRu: cleanText(raw.shortDescriptionRu, 220),
    shortDescriptionUz: cleanText(raw.shortDescriptionUz, 220),
    descriptionRu: cleanText(raw.descriptionRu, 10_000),
    descriptionUz: cleanText(raw.descriptionUz, 10_000),
    variants,
    warnings,
  };
}

export async function onRequestPost(context: {
  request: Request;
  env: AiEnv;
}): Promise<Response> {
  const { request, env } = context;

  if (!env.DB || !env.AUTH_PEPPER) {
    return json({ success: false, error: "Серверная конфигурация не завершена." }, 500);
  }

  const currentUser = await getAuthenticatedUser(request, env);
  if (!currentUser) return json({ success: false, error: "Требуется вход в систему." }, 401);
  if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
    return json({ success: false, error: "Недостаточно прав для AI-автозаполнения." }, 403);
  }

  if (!env.GEMINI_API_KEY) {
    return json({
      success: false,
      error: "Gemini не подключён. Добавьте секрет GEMINI_API_KEY в Cloudflare Variables and Secrets.",
      code: "GEMINI_NOT_CONFIGURED",
    }, 503);
  }

  let body: { text?: unknown };
  try {
    body = await request.json() as { text?: unknown };
  } catch {
    return json({ success: false, error: "Некорректный JSON-запрос." }, 400);
  }

  const source = typeof body.text === "string" ? body.text.trim() : "";
  if (source.length < 20) {
    return json({ success: false, error: "Вставьте текст с данными автомобиля." }, 400);
  }
  if (source.length > MAX_SOURCE_LENGTH) {
    return json({ success: false, error: `Текст слишком большой. Максимум ${MAX_SOURCE_LENGTH.toLocaleString("ru-RU")} символов за один анализ.` }, 413);
  }

  const prompt = `
Ты — точный extractor данных для административной системы премиального автосалона Auto Sale Umar.
Ниже дан неструктурированный текст: это может быть копия страницы производителя, дилерский лист, спецификация, invoice, описание комплектации или несколько страниц текста.

Задача: извлечь данные ОДНОГО автомобиля и вернуть только структуру по заданной JSON Schema.

КРИТИЧЕСКИЕ ПРАВИЛА:
1. НЕ придумывай характеристики, VIN, комплектацию, цену, цвета или опции.
2. Если значение отсутствует, противоречиво или относится не к конкретной машине — верни null.
3. Не подменяй официальный факт типичным значением модели.
4. Можно переводить единицы: lb-ft → Nm, mph → km/h, miles → km, mpg → L/100km. Любую такую конверсию перечисли в warnings.
5. 0–60 mph можно приблизительно перевести в 0–100 km/h только если исходное 0–60 явно указано; обязательно добавь warning.
6. Для обычного hybrid без plug-in НЕ указывай electricRangeKm.
7. price — только реальная цена продажи именно этой машины. MSRP/base price/reference price не переносить в price, если из текста не ясно, что это цена продажи.
8. isPublic/isFeatured не определяй — этих полей в ответе нет; публикацию всегда решает администратор.
9. Если в тексте есть несколько цветов одной и той же комплектации, верни их в variants. VIN никогда не генерируй.
10. Русское и узбекское описание можно составить только на основе достоверно найденных фактов, без маркетинговых выдумок.

ИСХОДНЫЙ ТЕКСТ:
---
${source}
---`;

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        model: MODEL,
        input: prompt,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: responseSchema,
        },
      }),
    });

    const gemini = await response.json().catch(() => null) as GeminiInteractionResponse | null;
    if (!response.ok) {
      console.error("Gemini autofill failed", response.status, gemini);
      return json({
        success: false,
        error: gemini?.error?.message || "Gemini не смог обработать текст. Повторите попытку.",
      }, 502);
    }

    if (!gemini?.output_text) {
      console.error("Gemini returned no output_text", gemini);
      return json({ success: false, error: "Gemini вернул пустой результат." }, 502);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(gemini.output_text) as Record<string, unknown>;
    } catch (error) {
      console.error("Gemini output JSON parse failed", error, gemini.output_text.slice(0, 1000));
      return json({ success: false, error: "Gemini вернул некорректный структурированный ответ." }, 502);
    }

    const car = sanitizeAiResult(parsed);
    return json({ success: true, model: MODEL, car });
  } catch (error) {
    console.error("AI autofill request failed", error);
    return json({ success: false, error: "Не удалось связаться с Gemini API." }, 502);
  }
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте POST-запрос." }, 405, { allow: "POST" });
}
