import type { Metadata } from "next";
import { SEO } from "../seo-config";
import styles from "./location.module.css";

const YANDEX_MAPS_URL = "https://yandex.ru/maps/org/auto_sale_umar/98317002086?si=y1pjpr56py0hyc8ar2j2cw1t40";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: "Локация шоурума Auto Sale Umar в Ташкенте" },
  description:
    "Локация шоурума Auto Sale Umar в Ташкенте. Откройте маршрут в Яндекс Картах, посмотрите автомобили и забронируйте персональный визит.",
  alternates: { canonical: `${SEO.siteUrl}/location/` },
  openGraph: {
    title: "Локация шоурума Auto Sale Umar",
    description: "Шоурум Auto Sale Umar в Ташкенте — маршрут, автомобили и запись на персональный визит.",
    url: `${SEO.siteUrl}/location/`,
    type: "website",
  },
};

const locationJsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: "Auto Sale Umar",
  url: `${SEO.siteUrl}/`,
  hasMap: YANDEX_MAPS_URL,
  telephone: "+998771155553",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tashkent",
    addressCountry: "UZ",
  },
};

export default function LocationPage() {
  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(locationJsonLd) }}
      />

      <header className={styles.header}>
        <a className={styles.back} href="/" aria-label="На главную">←</a>
        <a className={styles.brand} href="/" aria-label="Auto Sale Umar">
          <img src="/brand/asu-wordmark-black.png" alt="Auto Sale Umar" />
        </a>
        <span className={styles.headerSpacer} aria-hidden="true" />
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>AUTO SALE UMAR · TASHKENT</p>
          <h1>Локация<br />шоурума.</h1>
          <p className={styles.lead}>
            Приезжайте посмотреть автомобиль в спокойной обстановке. Маршрут до Auto Sale Umar открывается одним нажатием.
          </p>
          <div className={styles.actions}>
            <a className={styles.primary} href={YANDEX_MAPS_URL} target="_blank" rel="noreferrer">
              Открыть в Яндекс Картах <span>↗</span>
            </a>
            <a className={styles.secondary} href="/booking/">Забронировать визит</a>
          </div>
        </div>

        <div className={styles.heroMedia}>
          <img src="/showroom/showroom-01.webp" alt="Шоурум Auto Sale Umar в Ташкенте" />
          <div className={styles.locationBadge}>
            <span>ЛОКАЦИЯ</span>
            <strong>Ташкент · Auto Sale Umar</strong>
          </div>
        </div>
      </section>

      <section className={styles.linkSection} aria-label="Основные разделы Auto Sale Umar">
        <a href="/#stock"><span>01</span><strong>Автомобили</strong><small>В наличии и в пути</small></a>
        <a href="/#showroom"><span>02</span><strong>Шоурум</strong><small>Пространство Auto Sale Umar</small></a>
        <a href={YANDEX_MAPS_URL} target="_blank" rel="noreferrer"><span>03</span><strong>Маршрут</strong><small>Открыть Яндекс Карты ↗</small></a>
      </section>

      <section className={styles.gallery}>
        <div className={styles.galleryCopy}>
          <p className={styles.kicker}>ШОУРУМ</p>
          <h2>Сначала почувствуйте автомобиль.</h2>
          <p>Посмотрите детали, салон и комплектацию вживую, а команда шоурума подготовит автомобиль к вашему визиту.</p>
        </div>
        <div className={styles.galleryRail}>
          <img src="/showroom/showroom-02.webp" alt="Интерьер шоурума Auto Sale Umar" loading="lazy" />
          <img src="/showroom/showroom-03.webp" alt="Автомобили в шоуруме Auto Sale Umar" loading="lazy" />
          <img src="/showroom/showroom-04.webp" alt="Клиентская зона Auto Sale Umar" loading="lazy" />
        </div>
      </section>

      <section className={styles.visitCard}>
        <div>
          <p className={styles.kicker}>ПЕРЕД ВИЗИТОМ</p>
          <h2>Мы подготовим автомобиль заранее.</h2>
          <p>Выберите удобное время или свяжитесь с командой Auto Sale Umar напрямую.</p>
        </div>
        <div className={styles.visitActions}>
          <a href="/booking/">Забронировать визит</a>
          <a href="tel:+998771155553">+998 77 115 55 53</a>
        </div>
      </section>

      <footer className={styles.footer}>
        <img src="/brand/asu-wordmark-black.png" alt="Auto Sale Umar" />
        <nav aria-label="Основные разделы">
          <a href="/#stock">Автомобили</a>
          <a href="/#showroom">Шоурум</a>
          <a href="/location/" aria-current="page">Локация</a>
        </nav>
        <p>Auto Sale Umar · Ташкент<br />© 2026</p>
      </footer>
    </main>
  );
}
