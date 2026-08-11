PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS showroom_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  brand TEXT,
  car_id INTEGER,
  car_label TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'confirmed', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  managed_by INTEGER,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL,
  FOREIGN KEY (managed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_showroom_visits_schedule
  ON showroom_visits(visit_date, time_slot, status);

CREATE INDEX IF NOT EXISTS idx_showroom_visits_status
  ON showroom_visits(status, created_at DESC);
