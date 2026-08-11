import type { Metadata } from "next";
import styles from "../../seo-page.module.css";
import { SEO } from "../../seo-config";

const title = "Автомобили из США, Кореи, ОАЭ, Канады и Европы в страны СНГ";
const description =
  "Подбор и международная поставка премиальных автомобилей из США, Канады, Кореи, ОАЭ, Европы, Китая, Австралии и других рынков в Узбекистан и страны СНГ — Auto Sale Umar.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${SEO.siteUrl}${SEO.russianExportPath}`,
    languages: {
      ru: `${SEO.siteUrl}${SEO.russianExportPath}`,
      "uz-Latn": `${SEO.siteUrl}${SEO.uzbekLatinExportPath}`,
      "uz-Cyrl": `${SEO.siteUrl}${SEO.uzbekCyrillicExportPath}`,
      "x-default": `${SEO.siteUrl}${SEO.russianExportPath}`,
    },
  },
  openGraph: { title, description, url: `${SEO.siteUrl}${SEO.russianExportPath}`, locale: "ru_RU" },
};

export default function Page() {
  return (
    <main className={styles.seoPage} lang="ru">
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <a className={styles.brand} href="/">Auto Sale Umar</a>
          <nav className={styles.langs} aria-label="Язык">
            <a href={SEO.russianExportPath}>RU</a>
            <a href={SEO.uzbekLatinExportPath}>UZ</a>
            <a href={SEO.uzbekCyrillicExportPath}>ЎЗ</a>
          </nav>
        </header>

        <section className={styles.hero}>
          <p className={styles.kicker}>INTERNATIONAL AUTOMOTIVE SHOWROOM</p>
          <h1>Автомобили со всего мира — в Узбекистан и страны СНГ.</h1>
          <p className={styles.lead}>
            Auto Sale Umar — премиальный автомобильный шоурум в Ташкенте.
            Подбираем автомобили на международных рынках и сопровождаем путь
            от выбора конкретной комплектации до согласованных условий поставки.
          </p>
        </section>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2>С каких рынков подбираем автомобили</h2>
            <p>
              США, Канада, Южная Корея, ОАЭ, Европа, Китай, Австралия и другие
              рынки рассматриваются в зависимости от модели, комплектации,
              доступности и условий конкретной поставки.
            </p>
            <ul className={styles.list}>
              <li>авто из США и Канады;</li>
              <li>машины из Кореи;</li>
              <li>автомобили из ОАЭ;</li>
              <li>авто из Европы;</li>
              <li>автомобили из Китая и других азиатских рынков;</li>
              <li>индивидуальный подбор редких комплектаций.</li>
            </ul>
          </section>

          <section className={styles.card}>
            <h2>Точный выбор важнее количества</h2>
            <p>
              Для премиального автомобиля важны VIN, рынок происхождения,
              точная комплектация, цвет, опции, состояние и фактический статус.
              Поэтому Auto Sale Umar делает акцент на проверяемой информации,
              понятном выборе и персональном сопровождении.
            </p>
          </section>

          <section className={`${styles.card} ${styles.cardWide}`}>
            <h2>Как проходит подбор и поставка</h2>
            <ol className={styles.list}>
              <li><strong>Запрос.</strong> Марка, модель, год, бюджет, цвет и желаемая комплектация.</li>
              <li><strong>Подбор.</strong> Сравниваем подходящие варианты на доступных международных рынках.</li>
              <li><strong>Проверка.</strong> Уточняем VIN, конфигурацию, документы и статус конкретного автомобиля.</li>
              <li><strong>Условия.</strong> До решения фиксируем понятные для клиента условия, маршрут и ожидаемые сроки конкретной поставки.</li>
              <li><strong>Передача.</strong> Сопровождаем заказ до согласованной передачи автомобиля.</li>
            </ol>
          </section>

          <section className={styles.card}>
            <h2>Автомобили в наличии и под заказ</h2>
            <p>
              На основном сайте Auto Sale Umar публикуется актуальный статус:
              в наличии, в шоуруме, в пути или под индивидуальный заказ.
              Для конкретного автомобиля ориентируйтесь на его текущую карточку и подтверждение менеджера.
            </p>
          </section>

          <section className={styles.card}>
            <h2>Премиальный автомобильный шоурум в Ташкенте</h2>
            <p>
              Auto Sale Umar работает для клиентов, которым важны комплектация,
              реальный статус автомобиля и спокойный процесс без лишнего давления.
              Автомобиль, выбранный точно.
            </p>
          </section>
        </div>

        <section className={styles.cta}>
          <h2>Начните с конкретного автомобиля.</h2>
          <p>
            Сообщите модель и желаемую комплектацию. Мы определим, какие рынки
            стоит сравнить и какие данные нужны для точного предложения.
          </p>
          <div className={styles.actions}>
            <a className={styles.primary} href="/#cars">Смотреть автомобили</a>
            <a className={styles.secondary} href="/#contacts">Связаться</a>
          </div>
        </section>

        <footer className={styles.footer}>© 2026 Auto Sale Umar</footer>
      </div>
    </main>
  );
}
