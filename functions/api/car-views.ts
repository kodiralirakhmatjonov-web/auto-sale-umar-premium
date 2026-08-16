import { json, type Env } from "../_lib/auth";
import { normalizeText } from "./cars";
import { recordCarView } from "../_lib/car-views";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  if (!env.DB) return json({ success: false, error: "Счётчик просмотров временно недоступен." }, 500);
  if (!isSameOrigin(request)) return json({ success: false, error: "Запрос отклонён." }, 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ success: false, error: "Некорректный запрос." }, 400);
  }

  const slug = normalizeText(body.slug, 140);
  if (!slug) return json({ success: false, error: "Автомобиль не указан." }, 400);

  try {
    const car = await env.DB.prepare(`
      SELECT id
      FROM cars
      WHERE slug = ?1
        AND is_published = 1
        AND status <> 'hidden'
      LIMIT 1
    `).bind(slug).first<{ id: number }>();

    if (!car) return json({ success: false, error: "Автомобиль не найден." }, 404);

    const totals = await recordCarView(env, car.id);
    return json({ success: true, ...totals });
  } catch (error) {
    console.error("Car view record failed", error);
    return json({ success: false, error: "Не удалось обновить просмотры." }, 500);
  }
}

export function onRequest(): Response {
  return json({ success: false, error: "Используйте POST-запрос." }, 405, { allow: "POST" });
}
