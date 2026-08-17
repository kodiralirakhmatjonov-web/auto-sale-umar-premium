import { getAuthenticatedUser, json, type Env } from '../_lib/auth';
import { normalizeText } from './cars';
import { loadRamadanGift, saveRamadanGift, type RamadanGiftMutationInput } from '../_lib/ramadan-gift';

function parseOptionalInteger(value: unknown, min: number, max: number): number | null | 'invalid' {
  if (value === '' || value == null) return null;
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN;
  if (!Number.isSafeInteger(number) || number < min || number > max) return 'invalid';
  return number;
}

function nullableText(value: unknown, maxLength = 200): string | null {
  const text = normalizeText(value, maxLength);
  return text || null;
}

function normalizeInstagramUrl(value: unknown): string | null | 'invalid' {
  const raw = normalizeText(value, 500);
  if (!raw) return null;
  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(candidate);
    if (!/(^|\.)instagram\.com$/i.test(url.hostname)) return 'invalid';
    url.protocol = 'https:';
    return url.toString().slice(0, 500);
  } catch {
    return 'invalid';
  }
}

function normalizeInternalHref(value: unknown): string | null | 'invalid' {
  const raw = normalizeText(value, 500);
  if (!raw) return null;
  if (!raw.startsWith('/')) return 'invalid';
  return raw.slice(0, 500);
}

export async function onRequestGet(context: { env: Env }): Promise<Response> {
  const { env } = context;
  if (!env.DB) return json({ success: false, error: 'D1 не подключён.' }, 500);
  try {
    const gift = await loadRamadanGift(env, { includeInactive: true });
    return json({ success: true, gift });
  } catch (error) {
    console.error('Ramadan gift load failed', error);
    return json({ success: false, error: 'Не удалось загрузить Ramadan Gift.' }, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  if (!env.DB || !env.AUTH_PEPPER) return json({ success: false, error: 'Серверная конфигурация не завершена.' }, 500);

  const currentUser = await getAuthenticatedUser(request, env);
  if (!currentUser) return json({ success: false, error: 'Требуется вход в систему.' }, 401);
  if (currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
    return json({ success: false, error: 'Недостаточно прав для управления Ramadan Gift.' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ success: false, error: 'Некорректный формат запроса.' }, 400);
  }

  const titleRu = normalizeText(body.titleRu, 160);
  const titleUz = normalizeText(body.titleUz, 160);
  const subtitleRu = normalizeText(body.subtitleRu, 160);
  const subtitleUz = normalizeText(body.subtitleUz, 160);
  const shortPhraseRu = normalizeText(body.shortPhraseRu, 240);
  const shortPhraseUz = normalizeText(body.shortPhraseUz, 240);
  const descriptionRu = normalizeText(body.descriptionRu, 4000);
  const descriptionUz = normalizeText(body.descriptionUz, 4000);
  const brand = normalizeText(body.brand, 120);
  const model = normalizeText(body.model, 160);
  const year = parseOptionalInteger(body.year, 2000, 2100);
  const minPurchaseAmount = parseOptionalInteger(body.minPurchaseAmount, 1, 1000000000);
  const marketPrice = parseOptionalInteger(body.marketPrice, 1, 1000000000);
  const currencyRaw = normalizeText(body.currency, 3).toUpperCase();
  const instagramUrl = normalizeInstagramUrl(body.instagramUrl);
  const orderHref = normalizeInternalHref(body.orderHref);

  if (!titleRu || !titleUz) return json({ success: false, error: 'Укажите заголовок на двух языках.' }, 400);
  if (!subtitleRu || !subtitleUz) return json({ success: false, error: 'Укажите название автомобиля на двух языках.' }, 400);
  if (!shortPhraseRu || !shortPhraseUz) return json({ success: false, error: 'Укажите короткую фразу на двух языках.' }, 400);
  if (!descriptionRu || !descriptionUz) return json({ success: false, error: 'Укажите подробное описание на двух языках.' }, 400);
  if (!brand || !model) return json({ success: false, error: 'Укажите марку и модель подарочного автомобиля.' }, 400);
  if (year === 'invalid') return json({ success: false, error: 'Проверьте год автомобиля.' }, 400);
  if (minPurchaseAmount === 'invalid' || minPurchaseAmount == null) return json({ success: false, error: 'Проверьте минимальную сумму покупки.' }, 400);
  if (marketPrice === 'invalid') return json({ success: false, error: 'Проверьте рыночную цену.' }, 400);
  if (instagramUrl === 'invalid') return json({ success: false, error: 'Проверьте ссылку Instagram.' }, 400);
  if (orderHref === 'invalid') return json({ success: false, error: 'Проверьте ссылку кнопки заказа.' }, 400);

  const currency = currencyRaw === 'EUR' || currencyRaw === 'UZS' ? currencyRaw : 'USD';
  const input: RamadanGiftMutationInput = {
    isActive: body.isActive === false ? false : true,
    titleRu,
    titleUz,
    subtitleRu,
    subtitleUz,
    shortPhraseRu,
    shortPhraseUz,
    descriptionRu,
    descriptionUz,
    brand,
    model,
    year,
    trim: nullableText(body.trim, 160),
    exteriorColor: nullableText(body.exteriorColor, 120),
    interiorColor: nullableText(body.interiorColor, 120),
    minPurchaseAmount,
    marketPrice,
    currency,
    instagramUrl,
    orderHref: orderHref ?? '/compare/',
  };

  try {
    const gift = await saveRamadanGift(env, input, currentUser);
    return json({ success: true, gift });
  } catch (error) {
    console.error('Ramadan gift save failed', error);
    return json({ success: false, error: 'Не удалось сохранить Ramadan Gift.' }, 500);
  }
}

export function onRequest(): Response {
  return json({ success: false, error: 'Используйте GET или POST.' }, 405, { allow: 'GET, POST' });
}
