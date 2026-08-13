CREATE TABLE IF NOT EXISTS browser_profiles (
  browser_key TEXT PRIMARY KEY,
  advice_used INTEGER NOT NULL DEFAULT 0 CHECK (advice_used >= 0),
  deep_used INTEGER NOT NULL DEFAULT 0 CHECK (deep_used >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compare_ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  browser_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('advice', 'deep')),
  car_slugs_json TEXT NOT NULL,
  model TEXT,
  success INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (browser_key) REFERENCES browser_profiles(browser_key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_compare_ai_usage_browser_created
  ON compare_ai_usage(browser_key, created_at DESC);
