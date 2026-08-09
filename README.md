# AutoSale Umar

Единая цифровая платформа автосалона: публичный сайт, браузерный Control System,
будущее мобильное приложение и TV Mode используют один API, Cloudflare D1 и R2.

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `out`
- Root directory: оставить пустым

Перед production-запуском в `Settings → Runtime → Fail open/closed` необходимо
выбрать `Fail closed`, потому что доступ к `/admin` защищают Pages Functions.

## Архитектура

- Версионированный API: `/api/v1`.
- D1 — единый источник данных.
- R2 — единое хранилище фотографий и видео.
- Web-аутентификация — `HttpOnly` cookie.
- Mobile-аутентификация — Bearer-token из того же серверного session-механизма.
- Описание архитектуры: [`docs/architecture.md`](docs/architecture.md).
- Машиночитаемый API-контракт: [`docs/openapi.yaml`](docs/openapi.yaml).
- Исходная схема D1: [`migrations/0001_baseline.sql`](migrations/0001_baseline.sql).

Старые `/api/*` маршруты временно сохранены для безопасного перехода, но новые
клиенты должны использовать только `/api/v1/*`.

## Медиа

Заставочное видео находится в `public/intro.mp4`.
