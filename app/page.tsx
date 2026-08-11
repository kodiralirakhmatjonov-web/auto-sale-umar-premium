import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { SEO } from "./seo-config";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: "Auto Sale Umar — премиальные автомобили в Ташкенте" },
  description:
    "Премиальные автомобили в наличии и под заказ. Подбор и поставка автомобилей из США, Канады, Кореи, ОАЭ, Европы и других рынков в Узбекистан и страны СНГ.",
  alternates: { canonical: `${SEO.siteUrl}/` },
  openGraph: {
    title: "Auto Sale Umar — автомобиль, выбранный точно",
    description:
      "Премиальный автомобильный шоурум. Автомобили в наличии и под заказ, международный подбор и поставка.",
    url: `${SEO.siteUrl}/`,
  },
};

const autoDealerJsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: "Auto Sale Umar",
  url: `${SEO.siteUrl}/`,
  logo: `${SEO.siteUrl}/brand/asu-wordmark-black.png`,
  telephone: "+998771155553",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tashkent",
    addressCountry: "UZ",
  },
  sameAs: [
    "https://www.instagram.com/auto_sale_umar/",
    "https://www.threads.net/@auto_sale_umar",
    "https://t.me/auto_sale_umar777",
  ],
};

function loadShowroomHtml(): string {
  const indexPath = path.join(process.cwd(), "index.html");

  if (!fs.existsSync(indexPath)) {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Auto Sale Umar</title>
    <style>
      html, body {
        margin: 0;
        min-height: 100%;
        background: #070707;
        color: #f7f4ef;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        display: grid;
        place-items: center;
        padding: 24px;
        text-align: center;
      }
      .error {
        max-width: 560px;
        padding: 28px;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 28px;
        background: #131313;
      }
    </style>
  </head>
  <body>
    <div class="error">
      <h1>Файл index.html не найден</h1>
      <p>Он должен находиться в корне репозитория рядом с package.json.</p>
    </div>
  </body>
</html>`;
  }

  let html = fs.readFileSync(indexPath, "utf8");

  /*
   * В обычном HTML использовались пути вида ./public/intro.mp4.
   * В Next.js содержимое папки public открывается прямо от корня сайта:
   * /intro.mp4, /cars/lexus-lx.svg и так далее.
   */
  html = html.replaceAll("./public/", "/");

  /*
   * Базовый адрес нужен, чтобы относительные ссылки внутри srcDoc
   * корректно открывались от корня сайта Cloudflare Pages.
   */
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, '<head$1><base href="/" />');
  }

  return html;
}

export default function HomePage() {
  const showroomHtml = loadShowroomHtml();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(autoDealerJsonLd) }}
      />
      <main
        style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
        background: "#070707",
      }}
    >
      <iframe
        title="Auto Sale Umar"
        srcDoc={showroomHtml}
        allow="autoplay; fullscreen"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          border: 0,
          background: "#070707",
        }}
        />
      </main>
    </>
  );
}
