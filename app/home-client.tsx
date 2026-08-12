"use client";

import {
  ArrowUpRight,
  CalendarDays,
  CarFront,
  ChevronRight,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  Ship,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./home.module.css";
import PublicChrome from "./_components/PublicChrome";

type Language = "ru" | "uz";
type ThemeMode = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";
type CarStatus = "in_stock" | "in_showroom" | "in_transit" | "made_to_order" | "reserved" | "sold" | "hidden";

interface CatalogPhoto {
  id: number;
  url: string;
  isCover: boolean;
  sortOrder: number;
}

interface CatalogVariant {
  id: number;
  exteriorColorName: string | null;
  exteriorSwatch: string;
  interiorColorName: string | null;
  interiorSwatch: string;
  photos: CatalogPhoto[];
}

interface CatalogCar {
  id: number;
  slug: string;
  brand: string;
  model: string;
  year: number | null;
  trim: string | null;
  status: CarStatus;
  countryCode: string | null;
  arrivalDate: string | null;
  price: number | null;
  currency: "USD" | "UZS" | "EUR";
  priceOnRequest: boolean;
  engineText: string | null;
  shortDescriptionRu: string;
  shortDescriptionUz: string;
  coverUrl: string | null;
  variants?: CatalogVariant[];
}

interface CatalogResponse {
  success?: boolean;
  cars?: CatalogCar[];
}

interface HomeMediaItem {
  key: string;
  url: string;
  size: number;
  uploadedAt: string | null;
  brand: string;
  model: string;
  price: number | null;
  currency: "USD" | "UZS" | "EUR";
  priceOnRequest: boolean;
  status: Exclude<CarStatus, "sold" | "hidden">;
}

interface HomeMediaResponse {
  success?: boolean;
  videos?: HomeMediaItem[];
}

const BRANDS = [
  { name: "Mercedes-Benz", logo: "/brands/mercedes-benz.jpg" },
  { name: "Range Rover", logo: "/brands/range-rover.png" },
  { name: "Rolls-Royce", logo: "/brands/rolls-royce.png" },
  { name: "Cadillac", logo: "/brands/cadillac.png" },
  { name: "Lexus", logo: "/brands/lexus.png" },
  { name: "Toyota", logo: "/brands/toyota.png" },
  { name: "Genesis", logo: "/brands/genesis.png" },
  { name: "BMW", logo: "/brands/bmw.png" },
  { name: "Lamborghini", logo: "/brands/lamborghini.png" },
];

const MARKETS = [
  { flag: "🇺🇸", ru: "США", uz: "AQSH" },
  { flag: "🇨🇦", ru: "Канада", uz: "Kanada" },
  { flag: "🇰🇷", ru: "Корея", uz: "Koreya" },
  { flag: "🇦🇪", ru: "ОАЭ", uz: "BAA" },
  { flag: "🇪🇺", ru: "Европа", uz: "Yevropa" },
  { flag: "🇬🇧", ru: "Великобритания", uz: "Buyuk Britaniya" },
  { flag: "🇦🇺", ru: "Австралия", uz: "Avstraliya" },
];

const SHOWROOM_STORIES = [
  {
    image: "/showroom/showroom-01.webp",
    ruTitle: "Тишина снаружи. Характер внутри.",
    ruText: "Пространство, где автомобиль говорит сам за себя. Без лишнего шума, давления и спешки.",
    uzTitle: "Tashqarida sokinlik. Ichkarida xarakter.",
    uzText: "Avtomobil o‘zi haqida gapiradigan makon. Ortiqcha shovqin, bosim va shoshilishsiz.",
  },
  {
    image: "/showroom/showroom-02.webp",
    ruTitle: "Комфорт начинается до поездки.",
    ruText: "Спокойная клиентская зона, персональное внимание и время для обдуманного решения.",
    uzTitle: "Qulaylik safardan oldin boshlanadi.",
    uzText: "Sokin mijozlar zonasi, shaxsiy e’tibor va o‘ylangan qaror uchun yetarli vaqt.",
  },
  {
    image: "/showroom/showroom-03.webp",
    ruTitle: "Свет подчёркивает главное.",
    ruText: "Архитектура шоурума раскрывает линии автомобиля, материалы и детали без визуального шума.",
    uzTitle: "Yorug‘lik asosiy narsani ko‘rsatadi.",
    uzText: "Shourum arxitekturasi avtomobil chiziqlari, materiallari va detallarini vizual shovqinsiz ochib beradi.",
  },
  {
    image: "/showroom/showroom-04.webp",
    ruTitle: "Выбирайте не из доступного. Выбирайте своё.",
    ruText: "Подберём модель, комплектацию и организуем путь автомобиля до передачи ключей.",
    uzTitle: "Mavjudidan emas. O‘zingiznikini tanlang.",
    uzText: "Model va komplektatsiyani tanlaymiz, avtomobil yo‘lini kalit topshirilgunga qadar tashkil qilamiz.",
  },
  {
    image: "/showroom/showroom-05.webp",
    ruTitle: "Доверие строится на деталях.",
    ruText: "Прозрачный статус автомобиля, серьёзное сопровождение и правильное отношение к клиенту.",
    uzTitle: "Ishonch detallardan quriladi.",
    uzText: "Avtomobilning aniq statusi, jiddiy kuzatuv va mijozga to‘g‘ri munosabat.",
  },
] as const;

const COPY = {
  ru: {
    menu: "Меню",
    close: "Закрыть",
    cars: "Автомобили",
    employees: "Сотрудники",
    showroomMenu: "Шоурум",
    contacts: "Контакты",
    language: "Язык",
    theme: "Тема",
    system: "Системная",
    light: "Светлая",
    dark: "Тёмная",
    skip: "Пропустить",
    heroKicker: "AUTO SALE UMAR · TASHKENT",
    heroTitle: "Автомобиль,\nвыбранный точно.",
    heroText: "Новые автомобили в наличии и в пути. Международный подбор, прозрачный статус и персональное сопровождение.",
    seeCars: "Смотреть автомобили",
    contact: "Связаться",
    brandsKicker: "ВЫБЕРИТЕ МАРКУ",
    brandsTitle: "Начните с характера.",
    brandsText: "Коллекция формируется из автомобилей, которые действительно есть в базе Auto Sale Umar.",
    stockKicker: "В НАЛИЧИИ",
    stockTitle: "Можно увидеть сегодня.",
    stockText: "Автомобили, которые уже доступны для просмотра и покупки.",
    showroomCarsKicker: "В ШОУРУМЕ",
    showroomCarsTitle: "Можно посмотреть лично.",
    showroomCarsText: "Автомобили, которые сейчас находятся в шоуруме Auto Sale Umar.",
    emptyShowroomCars: "Сейчас опубликованных автомобилей в шоуруме нет.",
    transitKicker: "В ПУТИ",
    transitTitle: "Следующее поступление.",
    transitText: "Следите за автомобилями, которые уже направляются в шоурум.",
    emptyStock: "Сейчас опубликованных автомобилей в наличии нет.",
    emptyTransit: "Сейчас опубликованных автомобилей в пути нет.",
    trustKicker: "ПОЧЕМУ AUTO SALE UMAR",
    trustTitle: "Спокойствие строится на деталях.",
    trust1: "Статус без догадок",
    trust1d: "В наличии, в пути или в резерве — состояние автомобиля видно сразу.",
    trust2: "Конкретный автомобиль",
    trust2d: "Фотографии, цвета и данные относятся к реальной карточке автомобиля.",
    trust3: "Персональное сопровождение",
    trust3d: "От первого вопроса до передачи автомобиля — один понятный контакт с шоурумом.",
    showroomKicker: "О ШОУРУМЕ",
    showroomTitle: "Пространство для спокойного выбора.",
    showroomText: "Автомобиль остаётся в центре внимания, а атмосфера даёт время рассмотреть детали и принять решение без спешки.",
    bookVisit: "Забронировать визит",
    bookVisitText: "Выберите дату, время и автомобиль — команда шоурума увидит бронирование в Control System и подготовит визит.",
    locationKicker: "МЕСТОПОЛОЖЕНИЕ",
    locationTitle: "Ваш новый автомобиль ближе, чем кажется.",
    locationText: "Откройте маршрут в Яндекс Картах и приезжайте на персональный просмотр.",
    route: "Построить маршрут",
    location: "Ташкент · Auto Sale Umar",
    exportKicker: "МЕЖДУНАРОДНАЯ ПОСТАВКА",
    exportTitle: "Ищем автомобиль там, где он есть.",
    exportText: "Привозим новые автомобили под заказ из США, Канады, Кореи, ОАЭ, Европы, Великобритании и Австралии. Подбираем конкретную комплектацию и сопровождаем автомобиль на всём пути до прибытия.",
    exportStep1: "Подбор под задачу",
    exportStep1d: "Ищем нужную модель, комплектацию и цвет на подходящем рынке.",
    exportStep2: "Понятный путь",
    exportStep2d: "Фиксируем источник поставки и поддерживаем актуальный статус автомобиля.",
    exportStep3: "До передачи ключей",
    exportStep3d: "Сопровождаем логистику и держим клиента в курсе до прибытия автомобиля.",
    exportNote: "Страна и маршрут поставки зависят от выбранного автомобиля, комплектации и условий конкретного рынка.",
    contactsKicker: "КОНТАКТЫ",
    contactsTitle: "Продолжим там, где удобно вам.",
    contactsText: "Instagram остаётся главным каналом обзоров. Для консультации можно написать или позвонить напрямую.",
    instagram: "Instagram",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    call: "Позвонить",
    footer: "Auto Sale Umar · Премиальный автомобильный шоурум · Ташкент",
    priceRequest: "Цена по запросу",
    showroomStatus: "В шоуруме",
    inStockStatus: "В наличии",
    transitStatus: "В пути",
    orderStatus: "Под заказ",
    reserveStatus: "Резерв",
    color: "Цвет",
  },
  uz: {
    menu: "Menyu",
    close: "Yopish",
    cars: "Avtomobillar",
    employees: "Xodimlar",
    showroomMenu: "Shourum",
    contacts: "Kontaktlar",
    language: "Til",
    theme: "Mavzu",
    system: "Tizim",
    light: "Yorug‘",
    dark: "Tungi",
    skip: "O‘tkazib yuborish",
    heroKicker: "AUTO SALE UMAR · TOSHKENT",
    heroTitle: "Aniq tanlangan\navtomobil.",
    heroText: "Mavjud va yo‘ldagi yangi avtomobillar. Xalqaro tanlov, shaffof status va shaxsiy kuzatuv.",
    seeCars: "Avtomobillarni ko‘rish",
    contact: "Bog‘lanish",
    brandsKicker: "MARKANI TANLANG",
    brandsTitle: "Xarakterdan boshlang.",
    brandsText: "Kolleksiya Auto Sale Umar bazasida haqiqatan mavjud bo‘lgan avtomobillardan shakllanadi.",
    stockKicker: "MAVJUD",
    stockTitle: "Bugun ko‘rish mumkin.",
    stockText: "Ko‘rish va xarid qilish uchun hozirning o‘zida mavjud avtomobillar.",
    showroomCarsKicker: "SHOURUMDA",
    showroomCarsTitle: "Shaxsan ko‘rish mumkin.",
    showroomCarsText: "Hozir Auto Sale Umar shourumida turgan avtomobillar.",
    emptyShowroomCars: "Hozir shourumda e’lon qilingan avtomobil yo‘q.",
    transitKicker: "YO‘LDA",
    transitTitle: "Keyingi kelish.",
    transitText: "Shourumga yo‘l olgan avtomobillarni kuzating.",
    emptyStock: "Hozir ommaviy katalogda mavjud avtomobil yo‘q.",
    emptyTransit: "Hozir ommaviy katalogda yo‘ldagi avtomobil yo‘q.",
    trustKicker: "NEGA AUTO SALE UMAR",
    trustTitle: "Xotirjamlik tafsilotlardan boshlanadi.",
    trust1: "Aniq status",
    trust1d: "Mavjud, yo‘lda yoki rezervda — avtomobil holati darhol ko‘rinadi.",
    trust2: "Aniq avtomobil",
    trust2d: "Suratlar, ranglar va ma’lumotlar haqiqiy avtomobil kartasiga tegishli.",
    trust3: "Shaxsiy kuzatuv",
    trust3d: "Birinchi savoldan kalit topshirilguncha — shourum bilan bitta tushunarli aloqa.",
    showroomKicker: "SHOURUM HAQIDA",
    showroomTitle: "Xotirjam tanlov uchun makon.",
    showroomText: "Avtomobil markazda qoladi, muhit esa detallarni ko‘rish va shoshilmasdan qaror qilish uchun vaqt beradi.",
    bookVisit: "Tashrifni band qilish",
    bookVisitText: "Sana, vaqt va avtomobilni tanlang — shourum jamoasi band qilishni Control System’da ko‘radi va tashrifni tayyorlaydi.",
    locationKicker: "MANZIL",
    locationTitle: "Yangi avtomobilingiz o‘ylagandan ham yaqin.",
    locationText: "Yandex Xaritalarda yo‘nalishni oching va shaxsiy ko‘rikka tashrif buyuring.",
    route: "Yo‘nalishni ochish",
    location: "Toshkent · Auto Sale Umar",
    exportKicker: "XALQARO YETKAZIB BERISH",
    exportTitle: "Avtomobil qayerda bo‘lsa, o‘sha yerdan izlaymiz.",
    exportText: "AQSH, Kanada, Koreya, BAA, Yevropa, Buyuk Britaniya va Avstraliyadan yangi avtomobillarni buyurtma asosida olib kelamiz. Kerakli komplektatsiyani tanlaymiz va avtomobil yo‘lini kelguniga qadar kuzatamiz.",
    exportStep1: "Vazifa bo‘yicha tanlov",
    exportStep1d: "Kerakli model, komplektatsiya va rangni mos bozordan izlaymiz.",
    exportStep2: "Tushunarli yo‘l",
    exportStep2d: "Yetkazib berish manbasini belgilaymiz va avtomobil statusini yangilab boramiz.",
    exportStep3: "Kalit topshirilgunga qadar",
    exportStep3d: "Logistikani kuzatamiz va avtomobil yetib kelguniga qadar mijozni xabardor qilamiz.",
    exportNote: "Mamlakat va yetkazib berish yo‘li tanlangan avtomobil, komplektatsiya va bozor shartlariga bog‘liq.",
    contactsKicker: "KONTAKTLAR",
    contactsTitle: "Sizga qulay joyda davom etamiz.",
    contactsText: "Instagram asosiy avtomobil sharhlari kanali bo‘lib qoladi. Maslahat uchun yozish yoki qo‘ng‘iroq qilish mumkin.",
    instagram: "Instagram",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    call: "Qo‘ng‘iroq",
    footer: "Auto Sale Umar · Premium avtomobil shourumi · Toshkent",
    priceRequest: "Narx so‘rov bo‘yicha",
    showroomStatus: "Shourumda",
    inStockStatus: "Mavjud",
    transitStatus: "Yo‘lda",
    orderStatus: "Buyurtma",
    reserveStatus: "Rezerv",
    color: "Rang",
  },
} as const;

const YANDEX_MAPS_URL = "https://yandex.ru/maps/org/auto_sale_umar/98317002086?si=y1pjpr56py0hyc8ar2j2cw1t40";

function formatPrice(car: CatalogCar, language: Language): string {
  if (car.priceOnRequest || car.price == null) return COPY[language].priceRequest;
  const value = new Intl.NumberFormat(language === "ru" ? "ru-RU" : "uz-UZ", { maximumFractionDigits: 0 }).format(car.price);
  if (car.currency === "USD") return `${value} $`;
  if (car.currency === "EUR") return `${value} €`;
  return `${value} сум`;
}

function formatHeroPrice(video: HomeMediaItem, language: Language): string {
  if (video.priceOnRequest || video.price == null) return COPY[language].priceRequest;
  const value = new Intl.NumberFormat(language === "ru" ? "ru-RU" : "uz-UZ", { maximumFractionDigits: 0 }).format(video.price);
  if (video.currency === "USD") return `${value} $`;
  if (video.currency === "EUR") return `${value} €`;
  return `${value} сум`;
}

function statusLabel(status: CarStatus, language: Language): string {
  const c = COPY[language];
  if (status === "in_showroom") return c.showroomStatus;
  if (status === "in_stock") return c.inStockStatus;
  if (status === "in_transit") return c.transitStatus;
  if (status === "made_to_order") return c.orderStatus;
  if (status === "reserved") return c.reserveStatus;
  return "";
}

export default function HomeClient() {
  const [language, setLanguage] = useState<Language>("ru");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [introVisible, setIntroVisible] = useState(true);
  const [muted, setMuted] = useState(true);
  const [cars, setCars] = useState<CatalogCar[]>([]);
  const [videos, setVideos] = useState<HomeMediaItem[]>([]);
  const [brand, setBrand] = useState<string>("all");
  const [heroIndex, setHeroIndex] = useState(0);
  const heroRailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem("asu-public-language");
      if (storedLanguage === "uz" || storedLanguage === "ru") setLanguage(storedLanguage);
      else if (navigator.language.toLowerCase().startsWith("uz")) setLanguage("uz");

      const storedTheme = localStorage.getItem("asu-public-theme");
      if (storedTheme === "system" || storedTheme === "light" || storedTheme === "dark") setThemeMode(storedTheme);
    } catch {}
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const next: ResolvedTheme = themeMode === "system" ? (media.matches ? "dark" : "light") : themeMode;
      setResolvedTheme(next);
      document.documentElement.dataset.asuPublicTheme = next;
      document.documentElement.style.colorScheme = next;
      const color = next === "dark" ? "#090a0b" : "#f5f5f3";
      document.documentElement.style.backgroundColor = color;
      document.body.style.backgroundColor = color;
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
      }
      meta.content = color;
    };
    apply();
    if (themeMode === "system") media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [themeMode]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/catalog?pageSize=100", { cache: "no-store", headers: { Accept: "application/json" } })
        .then((response) => response.json() as Promise<CatalogResponse>)
        .catch(() => null),
      fetch("/api/home-media", { cache: "no-store", headers: { Accept: "application/json" } })
        .then((response) => response.json() as Promise<HomeMediaResponse>)
        .catch(() => null),
    ]).then(([catalog, media]) => {
      if (cancelled) return;
      if (catalog?.success && Array.isArray(catalog.cars)) setCars(catalog.cars);
      if (media?.success && Array.isArray(media.videos)) setVideos(media.videos);
    });
    return () => { cancelled = true; };
  }, []);

  const c = COPY[language];
  const heroVideos = useMemo<HomeMediaItem[]>(() => [
    {
      key: "built-in-intro",
      url: "/intro.mp4",
      size: 0,
      uploadedAt: null,
      brand: "AUTO SALE UMAR",
      model: language === "ru" ? "Премиальный шоурум" : "Premium shourum",
      price: null,
      currency: "USD",
      priceOnRequest: true,
      status: "in_showroom",
    },
    ...videos,
  ], [videos, language]);

  const stockCars = useMemo(() => cars.filter((car) =>
    car.status === "in_stock" && (brand === "all" || car.brand === brand),
  ).slice(0, 10), [cars, brand]);

  const showroomCars = useMemo(() => cars.filter((car) =>
    car.status === "in_showroom" && (brand === "all" || car.brand === brand),
  ).slice(0, 10), [cars, brand]);

  const transitCars = useMemo(() => cars.filter((car) =>
    (car.status === "in_transit" || car.status === "made_to_order") && (brand === "all" || car.brand === brand),
  ).slice(0, 10), [cars, brand]);

  const closeIntro = useCallback(() => setIntroVisible(false), []);

  useEffect(() => {
    if (!introVisible) return;
    const timer = window.setTimeout(closeIntro, 5200);
    return () => window.clearTimeout(timer);
  }, [introVisible, closeIntro]);

  function changeLanguage(next: Language) {
    setLanguage(next);
    try { localStorage.setItem("asu-public-language", next); } catch {}
  }

  function changeTheme(next: ThemeMode) {
    setThemeMode(next);
    try { localStorage.setItem("asu-public-theme", next); } catch {}
  }

  function goHero(index: number) {
    const safe = Math.max(0, Math.min(index, heroVideos.length - 1));
    setHeroIndex(safe);
    const rail = heroRailRef.current;
    if (rail) rail.scrollTo({ left: rail.clientWidth * safe, behavior: "smooth" });
  }

  function handleHeroScroll() {
    const rail = heroRailRef.current;
    if (!rail || rail.clientWidth <= 0) return;
    const next = Math.round(rail.scrollLeft / rail.clientWidth);
    if (next !== heroIndex) setHeroIndex(next);
  }



  const wordmark = resolvedTheme === "dark" ? "/brand/asu-wordmark-white.png" : "/brand/asu-wordmark-black.png";
  const activeHero = heroVideos[heroIndex] ?? heroVideos[0]!;

  return (
    <main className={styles.page} data-theme={resolvedTheme}>
      {introVisible ? (
        <div className={styles.intro} aria-label="Auto Sale Umar intro">
          <video className={styles.introVideo} src="/intro.mp4" poster="/intro-poster.jpg" autoPlay muted playsInline preload="auto" onEnded={closeIntro} onError={closeIntro} />
          <div className={styles.introShade} />
          <img className={styles.introWordmark} src="/brand/asu-wordmark-white.png" alt="Auto Sale Umar" />
          <button className={styles.introSkip} type="button" onClick={closeIntro}>{c.skip}</button>
        </div>
      ) : null}

      <PublicChrome
        language={language}
        themeMode={themeMode}
        resolvedTheme={resolvedTheme}
        onLanguageChange={changeLanguage}
        onThemeChange={changeTheme}
      />

      <section className={styles.hero} id="top">
        <div className={styles.heroRail} ref={heroRailRef} onScroll={handleHeroScroll}>
          {heroVideos.map((video, index) => (
            <article className={styles.heroSlide} key={video.key}>
              <HeroVideo src={video.url} poster={index === 0 ? "/intro-poster.jpg" : undefined} active={index === heroIndex && !introVisible} muted={muted} near={Math.abs(index - heroIndex) <= 1} loop={heroVideos.length === 1} onEnded={heroVideos.length > 1 ? () => goHero((index + 1) % heroVideos.length) : undefined} />
            </article>
          ))}
        </div>

        <div className={styles.heroCaption} aria-live="polite">
          <div className={styles.heroCaptionMain}>
            <span>{activeHero.brand || "AUTO SALE UMAR"}</span>
            <strong>{activeHero.model || (language === "ru" ? "Автомобиль" : "Avtomobil")}</strong>
          </div>
          <div className={styles.heroCaptionMeta}>
            <b>{formatHeroPrice(activeHero, language)}</b>
            <i>{statusLabel(activeHero.status, language)}</i>
          </div>
        </div>

        <button className={styles.soundButton} type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Sound on" : "Sound off"}>
          {muted ? <VolumeX /> : <Volume2 />}
        </button>
        {heroVideos.length > 1 ? (
          <div className={styles.heroDots} aria-label="Hero videos">
            {heroVideos.map((video, index) => <button key={video.key} type="button" data-active={index === heroIndex} onClick={() => goHero(index)} aria-label={`Video ${index + 1}`} />)}
          </div>
        ) : null}
      </section>

      <section className={styles.section} id="cars">
        <SectionHeading kicker={c.brandsKicker} title={c.brandsTitle} text={c.brandsText} />
        <div className={styles.brandRail}>
          <button className={styles.brandCard} type="button" data-active={brand === "all"} onClick={() => setBrand("all")}>
            <span className={styles.allBrands}><Sparkles /></span><b>{language === "ru" ? "Все" : "Barchasi"}</b>
          </button>
          {BRANDS.map((item) => (
            <button className={styles.brandCard} type="button" key={item.name} data-active={brand === item.name} onClick={() => setBrand(item.name)}>
              <span><img src={item.logo} alt="" /></span><b>{item.name}</b>
            </button>
          ))}
        </div>
      </section>

      <InventorySection id="stock" kicker={c.stockKicker} title={c.stockTitle} text={c.stockText} empty={c.emptyStock} cars={stockCars} language={language} />
      <InventorySection id="showroom-cars" kicker={c.showroomCarsKicker} title={c.showroomCarsTitle} text={c.showroomCarsText} empty={c.emptyShowroomCars} cars={showroomCars} language={language} />
      <InventorySection id="transit" kicker={c.transitKicker} title={c.transitTitle} text={c.transitText} empty={c.emptyTransit} cars={transitCars} language={language} />

      <section className={`${styles.section} ${styles.showroomSection}`} id="showroom">
        <SectionHeading kicker={c.showroomKicker} title={c.showroomTitle} text={c.showroomText} />
        <div className={styles.showroomRail}>
          {SHOWROOM_STORIES.map((story, index) => (
            <article className={styles.showroomStory} key={story.image}>
              <div className={styles.showroomImageWrap}>
                <img src={story.image} alt="Auto Sale Umar showroom" loading={index < 2 ? "eager" : "lazy"} />
              </div>
              <div className={styles.showroomStoryCopy}>
                <h3>{language === "ru" ? story.ruTitle : story.uzTitle}</h3>
                <p>{language === "ru" ? story.ruText : story.uzText}</p>
              </div>
            </article>
          ))}
        </div>
        <div className={styles.showroomActions}>
          <div className={styles.showroomBookingCopy}>
            <p className={styles.kicker}>{c.locationKicker}</p>
            <strong>{c.bookVisit}</strong>
            <span>{c.bookVisitText}</span>
          </div>
          <div className={styles.showroomActionButtons}>
            <a className={styles.bookingPill} href="/booking/"><CalendarDays />{c.bookVisit}<ChevronRight /></a>
            <a className={styles.showroomRoutePill} href={YANDEX_MAPS_URL} target="_blank" rel="noreferrer"><MapPin />{c.route}<ArrowUpRight /></a>
          </div>
        </div>
      </section>

      <section className={styles.section} id="delivery">
        <div className={styles.exportCard}>
          <div className={styles.exportHeading}>
            <p className={styles.kicker}>{c.exportKicker}</p>
            <h2>{c.exportTitle}</h2>
            <p>{c.exportText}</p>
          </div>
          <div className={styles.worldMapStage}>
            <img src="/homepage/world-map.webp" alt="" aria-hidden="true" />
          </div>
          <div className={styles.exportWorkflow}>
            <div><span>01</span><strong>{c.exportStep1}</strong><p>{c.exportStep1d}</p></div>
            <div><span>02</span><strong>{c.exportStep2}</strong><p>{c.exportStep2d}</p></div>
            <div><span>03</span><strong>{c.exportStep3}</strong><p>{c.exportStep3d}</p></div>
          </div>
          <div className={styles.marketRail}>
            {MARKETS.map((market) => <div className={styles.marketPill} key={market.ru}><span>{market.flag}</span><b>{market[language]}</b></div>)}
          </div>
          <p className={styles.exportNote}><Ship />{c.exportNote}</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.contactsSection}`} id="contacts">
        <SectionHeading kicker={c.contactsKicker} title={c.contactsTitle} text={c.contactsText} />
        <div className={styles.contactGrid}>
          <ContactCard href="https://www.instagram.com/auto_sale_umar/" icon={<Instagram />} label={c.instagram} detail="@auto_sale_umar" />
          <ContactCard href="https://t.me/auto_sale_umar777" icon={<MessageCircle />} label={c.telegram} detail="auto_sale_umar777" />
          <ContactCard href="https://wa.me/998771155553" icon={<MessageCircle />} label={c.whatsapp} detail="+998 77 115 55 53" />
          <ContactCard href="tel:+998771155553" icon={<Phone />} label={c.call} detail="+998 77 115 55 53" />
        </div>
      </section>

      <footer className={styles.footer}>
        <img src={wordmark} alt="Auto Sale Umar" />
        <p>{c.footer}<br />© 2026</p>
      </footer>
    </main>
  );
}

function HeroVideo({ src, poster, active, muted, near, loop, onEnded }: { src: string; poster?: string; active: boolean; muted: boolean; near: boolean; loop: boolean; onEnded?: () => void }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = muted;
    if (active) void video.play().catch(() => undefined);
    else video.pause();
  }, [active, muted, src]);
  return <video ref={ref} src={src} poster={poster} muted={muted} playsInline loop={loop} onEnded={onEnded} preload={near ? "metadata" : "none"} />;
}

function SectionHeading({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return <div className={styles.sectionHeading}><p className={styles.kicker}>{kicker}</p><h2>{title}</h2>{text ? <p>{text}</p> : null}</div>;
}

function InventorySection({ id, kicker, title, text, empty, cars, language }: { id: string; kicker: string; title: string; text: string; empty: string; cars: CatalogCar[]; language: Language }) {
  return (
    <section className={styles.section} id={id}>
      <SectionHeading kicker={kicker} title={title} text={text} />
      {cars.length ? <div className={styles.carRail}>{cars.map((car) => <PublicCarCard key={car.id} car={car} language={language} />)}</div> : <div className={styles.emptyCard}><CarFront /><p>{empty}</p></div>}
    </section>
  );
}

function PublicCarCard({ car, language }: { car: CatalogCar; language: Language }) {
  const variants = car.variants ?? [];
  const [variantIndex, setVariantIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const safeVariantIndex = Math.min(variantIndex, Math.max(variants.length - 1, 0));
  const activeVariant = variants[safeVariantIndex] ?? null;
  const photos = activeVariant?.photos?.length
    ? activeVariant.photos
    : car.coverUrl
      ? [{ id: -1, url: car.coverUrl, isCover: true, sortOrder: 0 }]
      : [];

  function selectVariant(index: number) {
    setVariantIndex(index);
    setPhotoIndex(0);
    mediaRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }

  function handlePhotoScroll() {
    const rail = mediaRef.current;
    if (!rail || rail.clientWidth <= 0) return;
    const next = Math.round(rail.scrollLeft / rail.clientWidth);
    if (next !== photoIndex) setPhotoIndex(next);
  }

  return (
    <article className={styles.carCard}>
      <div className={styles.carMediaShell}>
        <div className={styles.carMediaRail} ref={mediaRef} onScroll={handlePhotoScroll}>
          {photos.length ? photos.map((photo) => (
            <div className={styles.carMediaSlide} key={`${activeVariant?.id ?? "fallback"}-${photo.id}`}>
              <img src={photo.url} alt={`${car.brand} ${car.model}`} loading="lazy" />
            </div>
          )) : <div className={styles.carPlaceholder}><CarFront /></div>}
        </div>
        <span className={styles.statusPill} data-status={car.status}>{statusLabel(car.status, language)}</span>
        {photos.length > 1 ? (
          <div className={styles.photoDots}>{photos.map((photo, index) => <i key={photo.id} data-active={index === photoIndex} />)}</div>
        ) : null}
      </div>

      <div className={styles.carInfo}>
        <div className={styles.carMeta}><span>{car.brand}</span>{car.year ? <b>{car.year}</b> : null}</div>
        <h3>{car.model}</h3>
        {car.trim ? <p>{car.trim}</p> : null}
        {car.engineText ? <span className={styles.engineTag}>{car.engineText}</span> : null}

        {variants.length ? (
          <div className={styles.colorSelector}>
            <div className={styles.colorDots}>
              {variants.map((variant, index) => (
                <button key={variant.id} type="button" data-active={index === safeVariantIndex} onClick={() => selectVariant(index)} aria-label={variant.exteriorColorName || `${COPY[language].color} ${index + 1}`}>
                  <span style={{ backgroundColor: variant.exteriorSwatch || "#111214" }} />
                </button>
              ))}
            </div>
            <p>{activeVariant?.exteriorColorName || ""}</p>
          </div>
        ) : null}

        <div className={styles.carPrice}><span>{language === "ru" ? "Цена" : "Narx"}</span><b>{formatPrice(car, language)}</b></div>
      </div>
    </article>
  );
}


function ContactCard({ href, icon, label, detail }: { href: string; icon: ReactNode; label: string; detail: string }) {
  return <a className={styles.contactCard} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}><span>{icon}</span><div><b>{label}</b><small>{detail}</small></div><ArrowUpRight /></a>;
}
