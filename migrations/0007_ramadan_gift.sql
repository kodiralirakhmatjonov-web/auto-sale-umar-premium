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
);

CREATE TABLE IF NOT EXISTS ramadan_gift_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_id INTEGER NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  photo_group TEXT NOT NULL CHECK (photo_group IN ('exterior', 'interior')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_cover INTEGER NOT NULL DEFAULT 0 CHECK (is_cover IN (0,1)),
  mime_type TEXT,
  file_size INTEGER,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gift_id) REFERENCES ramadan_gifts(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ramadan_gift_media_gift
  ON ramadan_gift_media(gift_id, sort_order, id);
