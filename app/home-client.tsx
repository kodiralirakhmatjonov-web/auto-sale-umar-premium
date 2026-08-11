"use client";

import {
  ArrowUpRight,
  BadgeCheck,
  CarFront,
  ChevronRight,
  CircleCheck,
  Globe2,
  Instagram,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Ship,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./home.module.css";

type Language = "ru" | "uz";
type CarStatus = "in_stock" | "in_showroom" | "in_transit" | "made_to_order" | "reserved" | "sold" | "hidden";

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

const COPY = {
  ru: {
    menu: "Меню",
    close: "Закрыть",
    cars: "Автомобили",
    stock: "В наличии",
    transit: "В пути",
    showroom: "Шоурум",
    delivery: "Поставка",
    contacts: "Контакты",
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
    showroomKicker: "ШОУРУМ",
    showroomTitle: "Пространство для спокойного выбора.",
    showroomText: "Мы оставляем главное на первом плане: автомобиль, детали и время для решения без визуального шума.",
    visit: "Запланировать визит",
    location: "Ташкент · Auto Sale Umar",
    exportKicker: "МЕЖДУНАРОДНАЯ ПОСТАВКА",
    exportTitle: "Ищем автомобиль там, где он есть.",
    exportText: "Новые автомобили и индивидуальные поставки из ключевых автомобильных рынков мира.",
    exportNote: "Маршрут зависит от конкретного автомобиля, комплектации и рынка поставки.",
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
  },
  uz: {
    menu: "Menyu",
    close: "Yopish",
    cars: "Avtomobillar",
    stock: "Mavjud",
    transit: "Yo‘lda",
    showroom: "Shourum",
    delivery: "Yetkazib berish",
    contacts: "Kontaktlar",
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
    showroomKicker: "SHOURUM",
    showroomTitle: "Xotirjam tanlov uchun makon.",
    showroomText: "Asosiy narsani oldinga chiqaramiz: avtomobil, detallar va ortiqcha shovqinsiz qaror qilish uchun vaqt.",
    visit: "Tashrifni rejalashtirish",
    location: "Toshkent · Auto Sale Umar",
    exportKicker: "XALQARO YETKAZIB BERISH",
    exportTitle: "Avtomobil qayerda bo‘lsa, o‘sha yerdan izlaymiz.",
    exportText: "Dunyoning asosiy avtomobil bozorlaridan yangi avtomobillar va individual yetkazib berish.",
    exportNote: "Yo‘nalish aniq avtomobil, komplektatsiya va bozorga qarab belgilanadi.",
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
  },
} as const;

function formatPrice(car: CatalogCar, language: Language): string {
  if (car.priceOnRequest || car.price == null) return COPY[language].priceRequest;
  const value = new Intl.NumberFormat(language === "ru" ? "ru-RU" : "uz-UZ", { maximumFractionDigits: 0 }).format(car.price);
  if (car.currency === "USD") return `${value} $`;
  if (car.currency === "EUR") return `${value} €`;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [muted, setMuted] = useState(true);
  const [cars, setCars] = useState<CatalogCar[]>([]);
  const [videos, setVideos] = useState<HomeMediaItem[]>([]);
  const [brand, setBrand] = useState<string>("all");
  const [heroIndex, setHeroIndex] = useState(0);
  const heroRailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("asu-public-language");
      if (stored === "uz" || stored === "ru") setLanguage(stored);
      else if (navigator.language.toLowerCase().startsWith("uz")) setLanguage("uz");
    } catch {}
  }, []);

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
  const heroVideos = useMemo(() => [
    { key: "built-in-intro", url: "/intro.mp4" },
    ...videos.map((video) => ({ key: video.key, url: video.url })),
  ], [videos]);

  const stockCars = useMemo(() => cars.filter((car) =>
    (car.status === "in_stock" || car.status === "in_showroom") && (brand === "all" || car.brand === brand),
  ).slice(0, 8), [cars, brand]);

  const transitCars = useMemo(() => cars.filter((car) =>
    (car.status === "in_transit" || car.status === "made_to_order") && (brand === "all" || car.brand === brand),
  ).slice(0, 8), [cars, brand]);

  const closeIntro = useCallback(() => {
    setIntroVisible(false);
  }, []);

  useEffect(() => {
    if (!introVisible) return;
    const timer = window.setTimeout(closeIntro, 5200);
    return () => window.clearTimeout(timer);
  }, [introVisible, closeIntro]);

  function changeLanguage(next: Language) {
    setLanguage(next);
    try { localStorage.setItem("asu-public-language", next); } catch {}
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

  return (
    <main className={styles.page}>
      {introVisible ? (
        <div className={styles.intro} aria-label="Auto Sale Umar intro">
          <video
            className={styles.introVideo}
            src="/intro.mp4"
            poster="/intro-poster.jpg"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={closeIntro}
            onError={closeIntro}
          />
          <div className={styles.introShade} />
          <img className={styles.introWordmark} src="/brand/asu-wordmark-white.png" alt="Auto Sale Umar" />
          <button className={styles.introSkip} type="button" onClick={closeIntro}>{c.skip}</button>
        </div>
      ) : null}

      <header className={styles.header}>
        <a className={styles.headerBrand} href="#top" aria-label="Auto Sale Umar">
          <img src="/brand/asu-wordmark-black.png" alt="Auto Sale Umar" />
        </a>
        <div className={styles.headerActions}>
          <div className={styles.languageSwitch} aria-label="Language">
            <button type="button" data-active={language === "ru"} onClick={() => changeLanguage("ru")}>RU</button>
            <button type="button" data-active={language === "uz"} onClick={() => changeLanguage("uz")}>UZ</button>
          </div>
          <button className={styles.circleButton} type="button" onClick={() => setMenuOpen(true)} aria-label={c.menu}>
            <Menu />
          </button>
        </div>
      </header>

      <button className={styles.menuBackdrop} data-open={menuOpen} type="button" onClick={() => setMenuOpen(false)} aria-label={c.close} />
      <aside className={styles.menuSheet} data-open={menuOpen} aria-hidden={!menuOpen}>
        <div className={styles.menuTop}>
          <img src="/brand/asu-wordmark-black.png" alt="Auto Sale Umar" />
          <button className={styles.circleButton} type="button" onClick={() => setMenuOpen(false)} aria-label={c.close}><X /></button>
        </div>
        <nav>
          {[
            ["#cars", c.cars], ["#stock", c.stock], ["#transit", c.transit], ["#showroom", c.showroom], ["#delivery", c.delivery], ["#contacts", c.contacts],
          ].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}><span>{label}</span><ChevronRight /></a>
          ))}
        </nav>
        <div className={styles.menuContact}>
          <a href="https://www.instagram.com/auto_sale_umar/" target="_blank" rel="noreferrer"><Instagram /> Instagram <ArrowUpRight /></a>
          <a href="tel:+998771155553"><Phone /> +998 77 115 55 53</a>
        </div>
      </aside>

      <section className={styles.hero} id="top">
        <div className={styles.heroRail} ref={heroRailRef} onScroll={handleHeroScroll}>
          {heroVideos.map((video, index) => (
            <article className={styles.heroSlide} key={video.key}>
              <HeroVideo
                src={video.url}
                poster={index === 0 ? "/intro-poster.jpg" : undefined}
                active={index === heroIndex && !introVisible}
                muted={muted}
                near={Math.abs(index - heroIndex) <= 1}
                loop={heroVideos.length === 1}
                onEnded={heroVideos.length > 1 ? () => goHero((index + 1) % heroVideos.length) : undefined}
              />
              <div className={styles.heroShade} />
            </article>
          ))}
        </div>
        <div className={styles.heroCopy}>
          <p>{c.heroKicker}</p>
          <h1>{c.heroTitle.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
          <div className={styles.heroBottom}>
            <p>{c.heroText}</p>
            <div className={styles.heroButtons}>
              <a className={styles.lightPill} href="#stock">{c.seeCars}<ChevronRight /></a>
              <a className={styles.glassPill} href="#contacts">{c.contact}<ArrowUpRight /></a>
            </div>
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
      <InventorySection id="transit" kicker={c.transitKicker} title={c.transitTitle} text={c.transitText} empty={c.emptyTransit} cars={transitCars} language={language} />

      <section className={styles.section}>
        <SectionHeading kicker={c.trustKicker} title={c.trustTitle} />
        <div className={styles.trustGrid}>
          <TrustCard icon={<CircleCheck />} title={c.trust1} text={c.trust1d} />
          <TrustCard icon={<BadgeCheck />} title={c.trust2} text={c.trust2d} />
          <TrustCard icon={<ShieldCheck />} title={c.trust3} text={c.trust3d} />
        </div>
      </section>

      <section className={styles.section} id="showroom">
        <div className={styles.showroomCard}>
          <div className={styles.showroomCopy}>
            <p className={styles.kicker}>{c.showroomKicker}</p>
            <h2>{c.showroomTitle}</h2>
            <p>{c.showroomText}</p>
            <a className={styles.darkPill} href="tel:+998771155553"><MapPin />{c.visit}</a>
          </div>
          <div className={styles.showroomVisual} aria-hidden="true">
            <img src="/brand/asu-wordmark-white.png" alt="" />
            <div className={styles.showroomLines} />
            <span><MapPin />{c.location}</span>
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
          <div className={styles.globeStage} aria-hidden="true">
            <Globe2 />
            <span className={styles.orbitOne} />
            <span className={styles.orbitTwo} />
            <i className={styles.globeGlow} />
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
        <img src="/brand/asu-wordmark-black.png" alt="Auto Sale Umar" />
        <p>{c.footer}<br />© 2026</p>
      </footer>
    </main>
  );
}

function HeroVideo({
  src, poster, active, muted, near, loop, onEnded,
}: {
  src: string;
  poster?: string;
  active: boolean;
  muted: boolean;
  near: boolean;
  loop: boolean;
  onEnded?: () => void;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = muted;
    if (active) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
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
  return (
    <article className={styles.carCard}>
      <div className={styles.carMedia}>
        {car.coverUrl ? <img src={car.coverUrl} alt={`${car.brand} ${car.model}`} /> : <div className={styles.carPlaceholder}><CarFront /></div>}
        <span className={styles.statusPill} data-status={car.status}>{statusLabel(car.status, language)}</span>
      </div>
      <div className={styles.carInfo}>
        <div className={styles.carMeta}><span>{car.brand}</span>{car.year ? <b>{car.year}</b> : null}</div>
        <h3>{car.model}</h3>
        {car.trim ? <p>{car.trim}</p> : null}
        <div className={styles.carSpecs}>{car.countryCode ? <span>{car.countryCode}</span> : null}{car.engineText ? <span>{car.engineText}</span> : null}</div>
        <strong>{formatPrice(car, language)}</strong>
      </div>
    </article>
  );
}

function TrustCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <article className={styles.trustCard}><span>{icon}</span><h3>{title}</h3><p>{text}</p></article>;
}

function ContactCard({ href, icon, label, detail }: { href: string; icon: ReactNode; label: string; detail: string }) {
  const external = href.startsWith("http");
  return <a className={styles.contactCard} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}><span>{icon}</span><div><b>{label}</b><small>{detail}</small></div><ArrowUpRight /></a>;
}
