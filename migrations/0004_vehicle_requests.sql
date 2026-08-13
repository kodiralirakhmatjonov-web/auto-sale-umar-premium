PRAGMA foreign_keys = ON;

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
);

CREATE INDEX IF NOT EXISTS idx_vehicle_requests_status
  ON vehicle_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_requests_demand
  ON vehicle_requests(brand, model, status, created_at DESC);
