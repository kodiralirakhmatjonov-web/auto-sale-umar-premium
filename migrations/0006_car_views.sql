CREATE TABLE IF NOT EXISTS car_view_daily (
  car_id INTEGER NOT NULL,
  view_date TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  PRIMARY KEY (car_id, view_date),
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);
