"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Globe2,
  Heart,
  Menu,
  MessageCircle,
  Moon,
  Phone,
  Play,
  ShieldCheck,
  Sun,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Language = "ru" | "uz";
type Theme = "dark" | "light";

const copy = {
  ru: {
    navCars: "Автомобили",
    navShowroom: "Шоурум",
    navContacts: "Контакты",
    navAdmin: "Панель администратора",
    navManager: "Панель менеджера",
    heroEyebrow: "PREMIUM SHOWROOM · TASHKENT",
    heroTitle: "Новые автомобили для тех, кто выбирает без компромиссов.",
    heroText: "Премиальные автомобили в наличии и под заказ. Персональное сопровождение от выбора до передачи ключей.",
    book: "Забронировать визит",
    consult: "Получить консультацию",
    soundOn: "Включить звук",
    soundOff: "Выключить звук",
    brands: "Выберите марку",
    brandsText: "Откройте коллекцию новых автомобилей по бренду.",
    available: "Автомобили в наличии",
    latest: "Новые поступления",
    seeAll: "Смотреть все",
    showroomTitle: "Тихая роскошь. Без лишнего шума.",
    showroomText: "Auto Sale Umar — шоурум новых премиальных автомобилей. Только проверенные поставки, прозрачный статус каждого автомобиля и персональный сервис.",
    onlyNew: "Только новые автомобили",
    direct: "Прямые поставки",
    order: "В наличии и под заказ",
    official: "Официальный дилер Genesis",
    finalTitle: "Готовы увидеть ваш новый автомобиль?",
    finalText: "Забронируйте персональный визит — мы подготовим выбранный автомобиль к вашему приезду.",
    footer: "Genesis Motors Uzbekistan · All Rights Reserved · 2026",
    noCars: "Сейчас нет автомобилей этой марки в наличии.",
    preorder: "Оставить заявку на заказ",
  },
  uz: {
    navCars: "Avtomobillar",
    navShowroom: "Shourum",
    navContacts: "Kontaktlar",
    navAdmin: "Administrator paneli",
    navManager: "Menejer paneli",
    heroEyebrow: "PREMIUM SHOWROOM · TOSHKENT",
    heroTitle: "Murosasiz tanlov qiladiganlar uchun yangi avtomobillar.",
    heroText: "Premium avtomobillar mavjud va buyurtma asosida. Tanlovdan kalit topshirishgacha shaxsiy hamrohlik.",
    book: "Tashrifni band qilish",
    consult: "Maslahat olish",
    soundOn: "Ovozni yoqish",
    soundOff: "Ovozni o‘chirish",
    brands: "Brendni tanlang",
    brandsText: "Yangi avtomobillar kolleksiyasini brend bo‘yicha oching.",
    available: "Mavjud avtomobillar",
    latest: "Yangi kelganlar",
    seeAll: "Barchasini ko‘rish",
    showroomTitle: "Sokin hashamat. Ortiqcha shovqinsiz.",
    showroomText: "Auto Sale Umar — yangi premium avtomobillar shourumi. Tekshirilgan yetkazib berish, aniq status va shaxsiy servis.",
    onlyNew: "Faqat yangi avtomobillar",
    direct: "To‘g‘ridan-to‘g‘ri yetkazib berish",
    order: "Mavjud va buyurtma asosida",
    official: "Genesis rasmiy dileri",
    finalTitle: "Yangi avtomobilingizni ko‘rishga tayyormisiz?",
    finalText: "Shaxsiy tashrifni band qiling — tanlangan avtomobilni kelishingizga tayyorlaymiz.",
    footer: "Genesis Motors Uzbekistan · All Rights Reserved · 2026",
    noCars: "Hozir bu brenddagi avtomobillar mavjud emas.",
    preorder: "Buyurtma uchun ariza",
  },
};

const brands = ["Все", "Lexus", "Genesis", "Mercedes-Benz", "Range Rover", "Cadillac", "BMW", "Maybach"];

const cars = [
  {
    brand: "Lexus",
    name: "Lexus LX 600",
    year: "2026",
    meta: "3.5T · 415 л.с. · AWD",
    status: "В наличии",
    image: "/cars/lexus-lx.svg",
  },
  {
    brand: "Genesis",
    name: "Genesis GV80",
    year: "2026",
    meta: "3.5T · 380 л.с. · AWD",
    status: "В шоуруме",
    image: "/cars/genesis-gv80.svg",
  },
  {
    brand: "Mercedes-Benz",
    name: "Mercedes-Benz GLS",
    year: "2026",
    meta: "3.0 · 381 л.с. · 4MATIC",
    status: "В пути",
    image: "/cars/mercedes-gls.svg",
  },
  {
    brand: "Range Rover",
    name: "Range Rover Autobiography",
    year: "2026",
    meta: "4.4 V8 · 530 л.с. · AWD",
    status: "Под заказ",
    image: "/cars/range-rover.svg",
  },
];

function BrandMark({ name }: { name: string }) {
  return (
    <span className="brand-mark" aria-hidden="true">
      {name === "Все" ? "A" : name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("ru");
  const [theme, setTheme] = useState<Theme>("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [muted, setMuted] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState("Все");
  const heroVideo = useRef<HTMLVideoElement>(null);
  const t = copy[language];

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroVisible(false), 3900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (heroVideo.current) heroVideo.current.muted = muted;
  }, [muted]);

  const visibleCars = selectedBrand === "Все"
    ? cars
    : cars.filter((car) => car.brand === selectedBrand);

  return (
    <main>
      <AnimatePresence>
        {introVisible && (
          <motion.section
            className="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.025 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <video
              className="intro-video"
              autoPlay
              muted
              playsInline
              preload="auto"
              poster="/intro-poster.jpg"
            >
              <source src="/intro.mp4" type="video/mp4" />
            </video>
            <div className="intro-shade" />
            <motion.div
              className="intro-brand"
              initial={{ opacity: 0, y: 22, letterSpacing: "0.05em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.01em" }}
              transition={{ delay: 0.6, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <strong>Auto Sale Umar</strong>
              <span>SHOWROOMS</span>
            </motion.div>
            <button className="skip-intro" onClick={() => setIntroVisible(false)}>
              Пропустить
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      <header className="floating-header">
        <a className="logo" href="#top" aria-label="Auto Sale Umar">
          <span>Auto Sale Umar</span>
          <small>SHOWROOMS</small>
        </a>

        <div className="header-actions">
          <div className="language-switch" aria-label="Language">
            <button className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>RU</button>
            <button className={language === "uz" ? "active" : ""} onClick={() => setLanguage("uz")}>UZ</button>
          </div>
          <button
            className="icon-button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Theme"
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button className="icon-button" onClick={() => setMenuOpen(true)} aria-label="Menu">
            <Menu size={21} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              className="menu-backdrop"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              className="menu-drawer"
              initial={{ x: "105%" }}
              animate={{ x: 0 }}
              exit={{ x: "105%" }}
              transition={{ type: "spring", stiffness: 250, damping: 28 }}
            >
              <div className="menu-top">
                <div className="logo">
                  <span>Auto Sale Umar</span>
                  <small>SHOWROOMS</small>
                </div>
                <button className="icon-button" onClick={() => setMenuOpen(false)}>
                  <X size={21} />
                </button>
              </div>
              <nav>
                <a href="#cars" onClick={() => setMenuOpen(false)}>{t.navCars}<ChevronRight /></a>
                <a href="#showroom" onClick={() => setMenuOpen(false)}>{t.navShowroom}<ChevronRight /></a>
                <a href="#contacts" onClick={() => setMenuOpen(false)}>{t.navContacts}<ChevronRight /></a>
              </nav>
              <div className="demo-links">
                <span>DEMO ACCESS</span>
                <button>{t.navAdmin}</button>
                <button>{t.navManager}</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <section className="hero" id="top">
        <video
          ref={heroVideo}
          className="hero-video"
          autoPlay
          loop
          muted={muted}
          playsInline
          preload="metadata"
          poster="/intro-poster.jpg"
        >
          <source src="/intro.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-vignette" />

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.1, duration: 1.1 }}
        >
          <span className="eyebrow">{t.heroEyebrow}</span>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroText}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#visit">
              {t.book}<ArrowRight size={19} />
            </a>
            <a className="button button-glass" href="tel:+998000000000">
              {t.consult}<MessageCircle size={18} />
            </a>
          </div>
        </motion.div>

        <button className="sound-button" onClick={() => setMuted(!muted)}>
          {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          <span>{muted ? t.soundOn : t.soundOff}</span>
        </button>

        <div className="story-progress" aria-hidden="true">
          <i className="active" /><i /><i /><i />
        </div>
      </section>

      <section className="section brand-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">COLLECTION</span>
            <h2>{t.brands}</h2>
            <p>{t.brandsText}</p>
          </div>
        </div>

        <div className="brand-carousel">
          {brands.map((brand) => (
            <button
              key={brand}
              className={selectedBrand === brand ? "brand-card active" : "brand-card"}
              onClick={() => setSelectedBrand(brand)}
            >
              <BrandMark name={brand} />
              <span>{brand}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section" id="cars">
        <div className="section-heading row">
          <div>
            <span className="section-kicker">AVAILABLE NOW</span>
            <h2>{t.available}</h2>
          </div>
          <a className="text-link" href="#cars">{t.seeAll}<ArrowRight size={16} /></a>
        </div>

        <AnimatePresence mode="popLayout">
          {visibleCars.length > 0 ? (
            <motion.div className="car-grid" layout>
              {visibleCars.map((car, index) => (
                <motion.article
                  className="car-card"
                  key={car.name}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <div className="car-media">
                    <img src={car.image} alt={car.name} />
                    <span className="status">{car.status}</span>
                    <button className="favorite" aria-label="Add to favorites">
                      <Heart size={19} />
                    </button>
                  </div>
                  <div className="car-info">
                    <div>
                      <span>{car.year}</span>
                      <h3>{car.name}</h3>
                      <p>{car.meta}</p>
                    </div>
                    <button className="round-arrow"><ArrowRight size={18} /></button>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3>{t.noCars}</h3>
              <button className="button button-primary">
                {t.preorder}<ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="section new-arrivals">
        <div className="section-heading row">
          <div>
            <span className="section-kicker">JUST ARRIVED</span>
            <h2>{t.latest}</h2>
          </div>
          <a className="text-link" href="#cars">{t.seeAll}<ArrowRight size={16} /></a>
        </div>

        <div className="arrival-carousel">
          {cars.concat(cars.slice(0, 2)).map((car, index) => (
            <article className="arrival-card" key={`${car.name}-${index}`}>
              <img src={car.image} alt="" />
              <div>
                <strong>{car.name}</strong>
                <span>{car.year}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section showroom-section" id="showroom">
        <div className="showroom-copy">
          <span className="section-kicker">AUTO SALE UMAR</span>
          <h2>{t.showroomTitle}</h2>
          <p>{t.showroomText}</p>
          <a className="button button-primary" href="#visit">
            {t.book}<CalendarDays size={18} />
          </a>
        </div>

        <div className="showroom-visual">
          <div className="showroom-glow" />
          <div className="showroom-wordmark">ASU</div>
        </div>
      </section>

      <section className="section value-grid">
        <article>
          <ShieldCheck />
          <h3>{t.onlyNew}</h3>
          <p>Без пробега, без истории, в идеальном состоянии.</p>
        </article>
        <article>
          <Globe2 />
          <h3>{t.direct}</h3>
          <p>США, Канада, Корея и официальные каналы поставки.</p>
        </article>
        <article>
          <Play />
          <h3>{t.order}</h3>
          <p>Актуальный статус автомобиля — от заказа до шоурума.</p>
        </article>
        <article>
          <ShieldCheck />
          <h3>{t.official}</h3>
          <p>Официальное представление Genesis Motors Uzbekistan.</p>
        </article>
      </section>

      <section className="section performance">
        <div className="section-heading">
          <span className="section-kicker">PERFORMANCE</span>
          <h2>Динамика, которую видно.</h2>
        </div>
        <div className="gauge-grid">
          {[
            ["0–100 км/ч", "4.4", "сек."],
            ["Мощность", "415", "л.с."],
            ["Макс. скорость", "250", "км/ч"],
          ].map(([label, value, unit], index) => (
            <motion.div
              className="gauge"
              key={label}
              initial={{ "--gauge": "0deg" } as React.CSSProperties}
              whileInView={{ "--gauge": `${220 + index * 22}deg` } as React.CSSProperties}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="gauge-inner">
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{unit}</small>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section final-cta" id="visit">
        <div>
          <span className="section-kicker">PRIVATE APPOINTMENT</span>
          <h2>{t.finalTitle}</h2>
          <p>{t.finalText}</p>
        </div>
        <a className="button button-primary" href="tel:+998000000000">
          {t.book}<ArrowRight size={19} />
        </a>
      </section>

      <footer className="footer" id="contacts">
        <div className="footer-brand">
          <span>Auto Sale Umar</span>
          <small>SHOWROOMS</small>
        </div>
        <div className="footer-links">
          <a href="tel:+998000000000"><Phone size={17} />+998 00 000 00 00</a>
          <a href="#visit"><CalendarDays size={17} />Ежедневно · 10:00–19:00</a>
          <a href="#contacts"><Globe2 size={17} />Ташкент, Узбекистан</a>
        </div>
        <p>{t.footer}</p>
      </footer>
    </main>
  );
}
