import type { Env } from "./auth";

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

export async function ensureCarViewTables(env: Env): Promise<void> {
  await statement(env, `
    CREATE TABLE IF NOT EXISTS car_view_daily (
      car_id INTEGER NOT NULL,
      view_date TEXT NOT NULL,
      views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
      PRIMARY KEY (car_id, view_date),
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    )
  `).run();
}

export async function recordCarView(env: Env, carId: number): Promise<{ weeklyViews: number; totalViews: number }> {
  await ensureCarViewTables(env);
  await statement(env, `
    INSERT INTO car_view_daily (car_id, view_date, views)
    VALUES (?1, date('now'), 1)
    ON CONFLICT(car_id, view_date)
    DO UPDATE SET views = car_view_daily.views + 1
  `).bind(carId).run();

  const totals = await statement(env, `
    SELECT
      COALESCE(SUM(views), 0) AS total_views,
      COALESCE(SUM(CASE WHEN view_date >= date('now', '-6 days') THEN views ELSE 0 END), 0) AS weekly_views
    FROM car_view_daily
    WHERE car_id = ?1
  `).bind(carId).first<{ total_views: number | string | null; weekly_views: number | string | null }>();

  return {
    totalViews: Number(totals?.total_views ?? 0) || 0,
    weeklyViews: Number(totals?.weekly_views ?? 0) || 0,
  };
}

export async function loadWeeklyCarViews(env: Env, carIds: number[]): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (carIds.length === 0) return result;

  try {
    const placeholders = carIds.map((_, index) => `?${index + 1}`).join(", ");
    const rows = await statement(env, `
      SELECT car_id, COALESCE(SUM(views), 0) AS weekly_views
      FROM car_view_daily
      WHERE car_id IN (${placeholders})
        AND view_date >= date('now', '-6 days')
      GROUP BY car_id
    `).bind(...carIds).all<{ car_id: number; weekly_views: number | string | null }>();

    for (const row of Array.isArray(rows.results) ? rows.results : []) {
      result.set(Number(row.car_id), Number(row.weekly_views ?? 0) || 0);
    }
  } catch (error) {
    // The first public catalog request can arrive before the lazy view table is created.
    // Treat that as zero views instead of breaking the catalog.
    console.warn("Weekly car views unavailable", error);
  }

  return result;
}
