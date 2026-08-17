import type { AuthenticatedUser, Env } from './auth';

interface D1Result<T> {
  results?: T[];
}

interface D1StatementLike {
  bind(...values: unknown[]): D1StatementLike;
  run(): Promise<unknown>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

function statement(env: Env, query: string): D1StatementLike {
  return env.DB.prepare(query) as unknown as D1StatementLike;
}

export interface RamadanGiftMediaItem {
  id: number;
  publicUrl: string;
  photoGroup: 'exterior' | 'interior';
  sortOrder: number;
  isCover: boolean;
}

export interface RamadanGiftPayload {
  id: number | null;
  slug: string;
  isActive: boolean;
  titleRu: string;
  titleUz: string;
  subtitleRu: string;
  subtitleUz: string;
  shortPhraseRu: string;
  shortPhraseUz: string;
  descriptionRu: string;
  descriptionUz: string;
  brand: string;
  model: string;
  year: number | null;
  trim: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  minPurchaseAmount: number;
  marketPrice: number | null;
  currency: 'USD' | 'UZS' | 'EUR';
  instagramUrl: string | null;
  orderHref: string | null;
  media: RamadanGiftMediaItem[];
  updatedAt: string | null;
  updatedByName: string | null;
  isFallback?: boolean;
}

interface RamadanGiftRow {
  id: number;
  slug: string;
  is_active: number;
  title_ru: string;
  title_uz: string;
  subtitle_ru: string;
  subtitle_uz: string;
  short_phrase_ru: string;
  short_phrase_uz: string;
  description_ru: string;
  description_uz: string;
  brand: string;
  model: string;
  year: number | null;
  trim: string | null;
  exterior_color: string | null;
  interior_color: string | null;
  min_purchase_amount: number | string | null;
  market_price: number | string | null;
  currency: 'USD' | 'UZS' | 'EUR' | null;
  instagram_url: string | null;
  order_href: string | null;
  updated_at: string | null;
  updated_by_name: string | null;
}

interface RamadanGiftMediaRow {
  id: number;
  public_url: string;
  photo_group: 'exterior' | 'interior';
  sort_order: number;
  is_cover: number;
}

const DEFAULT_DESCRIPTION_RU = 'Особая благодарность тем, кто выбирает Auto Sale Umar. Каждый клиент, купивший у нас автомобиль в течение года на сумму от 88 000 USD, автоматически становится участником ежегодной программы благодарности клиентам. В Рамадан один из клиентов станет обладателем Mercedes-Benz E-Class.';
const DEFAULT_DESCRIPTION_UZ = 'Auto Sale Umar’ni tanlagan mijozlarimizga alohida minnatdorchilik. Bir yil davomida bizdan 88 000 USD dan boshlab avtomobil xarid qilgan har bir mijoz avtomatik ravishda yillik mijozlarga minnatdorchilik dasturining ishtirokchisiga aylanadi. Ramazon oyida mijozlardan biri Mercedes-Benz E-Class egasiga aylanadi.';

export function getFallbackRamadanGift(): RamadanGiftPayload {
  return {
    id: null,
    slug: 'ramadan-gift',
    isActive: true,
    titleRu: 'AUTO SALE UMAR — RAMADAN GIFT',
    titleUz: 'AUTO SALE UMAR — RAMADAN GIFT',
    subtitleRu: 'Mercedes-Benz E-Class',
    subtitleUz: 'Mercedes-Benz E-Class',
    shortPhraseRu: 'Один автомобиль. Один клиент. Наша благодарность за доверие.',
    shortPhraseUz: 'Bitta avtomobil. Bitta mijoz. Ishonchingiz uchun minnatdorchiligimiz.',
    descriptionRu: DEFAULT_DESCRIPTION_RU,
    descriptionUz: DEFAULT_DESCRIPTION_UZ,
    brand: 'Mercedes-Benz',
    model: 'E-Class',
    year: 2024,
    trim: 'E 300 4MATIC',
    exteriorColor: 'Black',
    interiorColor: 'Brown',
    minPurchaseAmount: 88000,
    marketPrice: 100000,
    currency: 'USD',
    instagramUrl: 'https://www.instagram.com/auto_sale_umar/',
    orderHref: '/compare/',
    media: [
      { id: 1, publicUrl: '/ramadan-gift/mercedes-eclass-01.png', photoGroup: 'exterior', sortOrder: 0, isCover: true },
      { id: 2, publicUrl: '/ramadan-gift/mercedes-eclass-02.png', photoGroup: 'exterior', sortOrder: 1, isCover: false },
      { id: 3, publicUrl: '/ramadan-gift/mercedes-eclass-03.png', photoGroup: 'exterior', sortOrder: 2, isCover: false },
      { id: 4, publicUrl: '/ramadan-gift/mercedes-eclass-04.png', photoGroup: 'exterior', sortOrder: 3, isCover: false },
      { id: 5, publicUrl: '/ramadan-gift/mercedes-eclass-05.png', photoGroup: 'exterior', sortOrder: 4, isCover: false },
    ],
    updatedAt: null,
    updatedByName: null,
    isFallback: true,
  };
}

export async function ensureRamadanGiftTables(env: Env): Promise<void> {
  await statement(env, `
    CREATE TABLE IF NOT EXISTS ramadan_gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
      title_ru TEXT NOT NULL,
      title_uz TEXT NOT NULL,
      subtitle_ru TEXT NOT NULL,
      subtitle_uz TEXT NOT NULL,
      short_phrase_ru TEXT NOT NULL,
      short_phrase_uz TEXT NOT NULL,
      description_ru TEXT NOT NULL,
      description_uz TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER,
      trim TEXT,
      exterior_color TEXT,
      interior_color TEXT,
      min_purchase_amount INTEGER NOT NULL DEFAULT 88000,
      market_price INTEGER,
      currency TEXT NOT NULL DEFAULT 'USD',
      instagram_url TEXT,
      order_href TEXT,
      updated_by INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `).run();

  await statement(env, `
    CREATE TABLE IF NOT EXISTS ramadan_gift_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gift_id INTEGER NOT NULL,
      object_key TEXT NOT NULL UNIQUE,
      public_url TEXT NOT NULL,
      photo_group TEXT NOT NULL CHECK (photo_group IN ('exterior','interior')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_cover INTEGER NOT NULL DEFAULT 0 CHECK (is_cover IN (0,1)),
      mime_type TEXT,
      file_size INTEGER,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gift_id) REFERENCES ramadan_gifts(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `).run();

  await statement(env, 'CREATE INDEX IF NOT EXISTS idx_ramadan_gift_media_gift ON ramadan_gift_media(gift_id, sort_order, id)').run();
}

function rowToPayload(row: RamadanGiftRow, media: RamadanGiftMediaRow[]): RamadanGiftPayload {
  return {
    id: row.id,
    slug: row.slug,
    isActive: row.is_active === 1,
    titleRu: row.title_ru,
    titleUz: row.title_uz,
    subtitleRu: row.subtitle_ru,
    subtitleUz: row.subtitle_uz,
    shortPhraseRu: row.short_phrase_ru,
    shortPhraseUz: row.short_phrase_uz,
    descriptionRu: row.description_ru,
    descriptionUz: row.description_uz,
    brand: row.brand,
    model: row.model,
    year: row.year,
    trim: row.trim,
    exteriorColor: row.exterior_color,
    interiorColor: row.interior_color,
    minPurchaseAmount: Number(row.min_purchase_amount ?? 88000) || 88000,
    marketPrice: row.market_price == null ? null : (Number(row.market_price) || null),
    currency: row.currency === 'EUR' || row.currency === 'UZS' ? row.currency : 'USD',
    instagramUrl: row.instagram_url,
    orderHref: row.order_href,
    updatedAt: row.updated_at,
    updatedByName: row.updated_by_name,
    media: media.map((item) => ({
      id: item.id,
      publicUrl: item.public_url,
      photoGroup: item.photo_group,
      sortOrder: item.sort_order,
      isCover: item.is_cover === 1,
    })),
  };
}

export async function loadRamadanGift(env: Env, options?: { includeInactive?: boolean }): Promise<RamadanGiftPayload> {
  await ensureRamadanGiftTables(env);
  const includeInactive = options?.includeInactive === true;
  const row = await statement(env, `
    SELECT
      g.*,
      u.full_name AS updated_by_name
    FROM ramadan_gifts g
    LEFT JOIN users u ON u.id = g.updated_by
    ${includeInactive ? '' : 'WHERE g.is_active = 1'}
    ORDER BY g.updated_at DESC, g.id DESC
    LIMIT 1
  `).first<RamadanGiftRow>();

  if (!row) return getFallbackRamadanGift();

  const media = await statement(env, `
    SELECT id, public_url, photo_group, sort_order, is_cover
    FROM ramadan_gift_media
    WHERE gift_id = ?1
    ORDER BY is_cover DESC, sort_order ASC, id ASC
  `).bind(row.id).all<RamadanGiftMediaRow>();

  const payload = rowToPayload(row, Array.isArray(media.results) ? media.results : []);
  if (payload.media.length === 0) {
    const fallback = getFallbackRamadanGift();
    payload.media = fallback.media;
  }
  return payload;
}

export interface RamadanGiftMutationInput {
  isActive: boolean;
  titleRu: string;
  titleUz: string;
  subtitleRu: string;
  subtitleUz: string;
  shortPhraseRu: string;
  shortPhraseUz: string;
  descriptionRu: string;
  descriptionUz: string;
  brand: string;
  model: string;
  year: number | null;
  trim: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  minPurchaseAmount: number;
  marketPrice: number | null;
  currency: 'USD' | 'UZS' | 'EUR';
  instagramUrl: string | null;
  orderHref: string | null;
}

export async function saveRamadanGift(env: Env, input: RamadanGiftMutationInput, user: AuthenticatedUser): Promise<RamadanGiftPayload> {
  await ensureRamadanGiftTables(env);
  const existing = await statement(env, 'SELECT id FROM ramadan_gifts WHERE slug = ?1 LIMIT 1').bind('ramadan-gift').first<{ id: number }>();
  const now = new Date().toISOString();

  if (existing?.id) {
    await statement(env, `
      UPDATE ramadan_gifts
      SET
        is_active = ?2,
        title_ru = ?3,
        title_uz = ?4,
        subtitle_ru = ?5,
        subtitle_uz = ?6,
        short_phrase_ru = ?7,
        short_phrase_uz = ?8,
        description_ru = ?9,
        description_uz = ?10,
        brand = ?11,
        model = ?12,
        year = ?13,
        trim = ?14,
        exterior_color = ?15,
        interior_color = ?16,
        min_purchase_amount = ?17,
        market_price = ?18,
        currency = ?19,
        instagram_url = ?20,
        order_href = ?21,
        updated_by = ?22,
        updated_at = ?23
      WHERE id = ?1
    `).bind(
      existing.id,
      input.isActive ? 1 : 0,
      input.titleRu,
      input.titleUz,
      input.subtitleRu,
      input.subtitleUz,
      input.shortPhraseRu,
      input.shortPhraseUz,
      input.descriptionRu,
      input.descriptionUz,
      input.brand,
      input.model,
      input.year,
      input.trim,
      input.exteriorColor,
      input.interiorColor,
      input.minPurchaseAmount,
      input.marketPrice,
      input.currency,
      input.instagramUrl,
      input.orderHref,
      user.id,
      now,
    ).run();
  } else {
    await statement(env, `
      INSERT INTO ramadan_gifts (
        slug, is_active, title_ru, title_uz, subtitle_ru, subtitle_uz,
        short_phrase_ru, short_phrase_uz, description_ru, description_uz,
        brand, model, year, trim, exterior_color, interior_color,
        min_purchase_amount, market_price, currency, instagram_url, order_href,
        updated_by, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?23)
    `).bind(
      'ramadan-gift',
      input.isActive ? 1 : 0,
      input.titleRu,
      input.titleUz,
      input.subtitleRu,
      input.subtitleUz,
      input.shortPhraseRu,
      input.shortPhraseUz,
      input.descriptionRu,
      input.descriptionUz,
      input.brand,
      input.model,
      input.year,
      input.trim,
      input.exteriorColor,
      input.interiorColor,
      input.minPurchaseAmount,
      input.marketPrice,
      input.currency,
      input.instagramUrl,
      input.orderHref,
      user.id,
      now,
    ).run();
  }

  return loadRamadanGift(env, { includeInactive: true });
}
