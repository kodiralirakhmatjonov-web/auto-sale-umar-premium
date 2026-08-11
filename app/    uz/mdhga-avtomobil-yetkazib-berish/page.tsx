import type { Metadata } from "next";
import styles from "../../seo-page.module.css";
import { SEO } from "../../seo-config";

const title = "Dunyo bozorlaridan O‘zbekiston va MDHga avtomobil yetkazib berish";
const description =
  "AQSh, Kanada, Koreya, BAA, Yevropa, Xitoy, Avstraliya va boshqa bozorlardan premium avtomobillarni tanlash va O‘zbekiston hamda MDH mamlakatlariga yetkazib berish — Auto Sale Umar.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${SEO.siteUrl}${SEO.uzbekLatinExportPath}`,
    languages: {
      ru: `${SEO.siteUrl}${SEO.russianExportPath}`,
      "uz-Latn": `${SEO.siteUrl}${SEO.uzbekLatinExportPath}`,
      "uz-Cyrl": `${SEO.siteUrl}${SEO.uzbekCyrillicExportPath}`,
      "x-default": `${SEO.siteUrl}${SEO.russianExportPath}`,
    },
  },
  openGraph: { title, description, url: `${SEO.siteUrl}${SEO.uzbekLatinExportPath}`, locale: "uz_UZ" },
};

export default function Page() {
  return (
    <main className={styles.seoPage} lang="uz-Latn">
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <a className={styles.brand} href="/">Auto Sale Umar</a>
          <nav className={styles.langs} aria-label="Til">
            <a href={SEO.russianExportPath}>RU</a>
            <a href={SEO.uzbekLatinExportPath}>UZ</a>
            <a href={SEO.uzbekCyrillicExportPath}>ЎЗ</a>
          </nav>
        </header>

        <section className={styles.hero}>
          <p className={styles.kicker}>INTERNATIONAL AUTOMOTIVE SHOWROOM</p>
          <h1>Dunyo bozorlaridan O‘zbekiston va MDHga avtomobil.</h1>
          <p className={styles.lead}>
            Auto Sale Umar — Toshkentdagi premium avtomobil showroomi.
            Xalqaro bozorlardan avtomobil tanlashda yordam beramiz va aniq
            komplektatsiyani tanlashdan kelishilgan yetkazib berish shartlarigacha jarayonni kuzatamiz.
          </p>
        </section>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2>Qaysi bozorlardan avtomobil tanlash mumkin</h2>
            <p>
              AQSh, Kanada, Janubiy Koreya, BAA, Yevropa, Xitoy, Avstraliya
              va boshqa bozorlardagi variantlar model, komplektatsiya, mavjudlik
              va konkret yetkazib berish shartlariga qarab ko‘rib chiqiladi.
            </p>
            <ul className={styles.list}>
              <li>AQSh va Kanadadan avtomobil;</li>
              <li>Koreyadan mashina;</li>
              <li>BAAdan premium avtomobil;</li>
              <li>Yevropadan avtomobil;</li>
              <li>Xitoy va boshqa Osiyo bozorlaridan avtomobil;</li>
              <li>individual va noyob komplektatsiyalar.</li>
            </ul>
          </section>

          <section className={styles.card}>
            <h2>Aniq tanlov — asosiy prinsip</h2>
            <p>
              Premium avtomobil uchun VIN, kelib chiqish bozori, aniq komplektatsiya,
              rang, opsiyalar, holat va real status muhim. Auto Sale Umar tekshiriladigan
              ma’lumot va tushunarli tanlovga e’tibor beradi.
            </p>
          </section>

          <section className={`${styles.card} ${styles.cardWide}`}>
            <h2>Tanlash va yetkazib berish jarayoni</h2>
            <ol className={styles.list}>
              <li><strong>So‘rov.</strong> Marka, model, yil, budjet, rang va kerakli komplektatsiya.</li>
              <li><strong>Tanlov.</strong> Mavjud xalqaro bozorlardagi mos variantlarni solishtiramiz.</li>
              <li><strong>Tekshiruv.</strong> VIN, konfiguratsiya, hujjatlar va konkret avtomobil statusi aniqlashtiriladi.</li>
              <li><strong>Shartlar.</strong> Konkret buyurtma bo‘yicha yo‘l, kutilayotgan muddat va shartlar oldindan tushuntiriladi.</li>
              <li><strong>Topshirish.</strong> Buyurtma kelishilgan topshirish bosqichigacha kuzatiladi.</li>
            </ol>
          </section>

          <section className={styles.card}>
            <h2>Mavjud, yo‘lda yoki buyurtma asosida</h2>
            <p>
              Asosiy Auto Sale Umar saytida avtomobilning aktual statusi ko‘rsatiladi:
              mavjud, showroomda, yo‘lda yoki individual buyurtma asosida.
            </p>
          </section>

          <section className={styles.card}>
            <h2>Toshkentdagi premium avtomobil showroomi</h2>
            <p>
              Aniq komplektatsiya, real status va xotirjam xizmatni qadrlaydigan
              mijozlar uchun. Auto Sale Umar — aniq tanlangan avtomobil.
            </p>
          </section>
        </div>

        <section className={styles.cta}>
          <h2>Konkret avtomobildan boshlang.</h2>
          <p>Model va kerakli komplektatsiyani yuboring. Qaysi bozorlarni solishtirish kerakligini aniqlaymiz.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="/#cars">Avtomobillar</a>
            <a className={styles.secondary} href="/#contacts">Bog‘lanish</a>
          </div>
        </section>

        <footer className={styles.footer}>© 2026 Auto Sale Umar</footer>
      </div>
    </main>
  );
}
