import type { Metadata } from "next";
import styles from "../../seo-page.module.css";
import { SEO } from "../../seo-config";

const title = "Дунё бозорларидан Ўзбекистон ва МДҲга автомобил етказиб бериш";
const description =
  "АҚШ, Канада, Корея, БАА, Европа, Хитой, Австралия ва бошқа бозорлардан премиум автомобилларни танлаш ва Ўзбекистон ҳамда МДҲ мамлакатларига етказиб бериш — Auto Sale Umar.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${SEO.siteUrl}${SEO.uzbekCyrillicExportPath}`,
    languages: {
      ru: `${SEO.siteUrl}${SEO.russianExportPath}`,
      "uz-Latn": `${SEO.siteUrl}${SEO.uzbekLatinExportPath}`,
      "uz-Cyrl": `${SEO.siteUrl}${SEO.uzbekCyrillicExportPath}`,
      "x-default": `${SEO.siteUrl}${SEO.russianExportPath}`,
    },
  },
  openGraph: { title, description, url: `${SEO.siteUrl}${SEO.uzbekCyrillicExportPath}`, locale: "uz_UZ" },
};

export default function Page() {
  return (
    <main className={styles.seoPage} lang="uz-Cyrl">
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <a className={styles.brand} href="/">Auto Sale Umar</a>
          <nav className={styles.langs} aria-label="Тил">
            <a href={SEO.russianExportPath}>RU</a>
            <a href={SEO.uzbekLatinExportPath}>UZ</a>
            <a href={SEO.uzbekCyrillicExportPath}>ЎЗ</a>
          </nav>
        </header>

        <section className={styles.hero}>
          <p className={styles.kicker}>INTERNATIONAL AUTOMOTIVE SHOWROOM</p>
          <h1>Дунё бозорларидан Ўзбекистон ва МДҲга автомобил.</h1>
          <p className={styles.lead}>
            Auto Sale Umar — Тошкентдаги премиум автомобил шоуруми.
            Халқаро бозорлардан автомобил танлашда ёрдам берамиз ва аниқ
            комплектацияни танлашдан келишилган етказиб бериш шартларигача жараённи кузатамиз.
          </p>
        </section>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2>Қайси бозорлардан автомобил танлаш мумкин</h2>
            <p>
              АҚШ, Канада, Жанубий Корея, БАА, Европа, Хитой, Австралия
              ва бошқа бозорлардаги вариантлар модель, комплектация, мавжудлик
              ва конкрет етказиб бериш шартларига қараб кўриб чиқилади.
            </p>
            <ul className={styles.list}>
              <li>АҚШ ва Канададан автомобил;</li>
              <li>Кореядан машина;</li>
              <li>БААдан премиум автомобил;</li>
              <li>Европадан автомобил;</li>
              <li>Хитой ва бошқа Осиё бозорларидан автомобил;</li>
              <li>индивидуал ва ноёб комплектациялар.</li>
            </ul>
          </section>

          <section className={styles.card}>
            <h2>Аниқ танлов — асосий принцип</h2>
            <p>
              Премиум автомобил учун VIN, келиб чиқиш бозори, аниқ комплектация,
              ранг, опциялар, ҳолат ва реал статус муҳим. Auto Sale Umar текшириладиган
              маълумот ва тушунарли танловга эътибор беради.
            </p>
          </section>

          <section className={`${styles.card} ${styles.cardWide}`}>
            <h2>Танлаш ва етказиб бериш жараёни</h2>
            <ol className={styles.list}>
              <li><strong>Сўров.</strong> Марка, модель, йил, бюджет, ранг ва керакли комплектация.</li>
              <li><strong>Танлов.</strong> Мавжуд халқаро бозорлардаги мос вариантларни солиштирамиз.</li>
              <li><strong>Текширув.</strong> VIN, конфигурация, ҳужжатлар ва конкрет автомобил статуси аниқлаштирилади.</li>
              <li><strong>Шартлар.</strong> Конкрет буюртма бўйича йўл, кутилаётган муддат ва шартлар олдиндан тушунтирилади.</li>
              <li><strong>Топшириш.</strong> Буюртма келишилган топшириш босқичигача кузатилади.</li>
            </ol>
          </section>

          <section className={styles.card}>
            <h2>Мавжуд, йўлда ёки буюртма асосида</h2>
            <p>
              Асосий Auto Sale Umar сайтида автомобилнинг актуал статуси кўрсатилади:
              мавжуд, шоурумда, йўлда ёки индивидуал буюртма асосида.
            </p>
          </section>

          <section className={styles.card}>
            <h2>Тошкентдаги премиум автомобил шоуруми</h2>
            <p>
              Аниқ комплектация, реал статус ва хотиржам хизматни қадрлайдиган
              мижозлар учун. Auto Sale Umar — аниқ танланган автомобил.
            </p>
          </section>
        </div>

        <section className={styles.cta}>
          <h2>Конкрет автомобилдан бошланг.</h2>
          <p>Модель ва керакли комплектацияни юборинг. Қайси бозорларни солиштириш кераклигини аниқлаймиз.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="/#cars">Автомобиллар</a>
            <a className={styles.secondary} href="/#contacts">Боғланиш</a>
          </div>
        </section>

        <footer className={styles.footer}>© 2026 Auto Sale Umar</footer>
      </div>
    </main>
  );
}
