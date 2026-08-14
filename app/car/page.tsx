"use client";

import {
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Gauge,
  Heart,
  Instagram,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PublicChrome, {
  type PublicLanguage,
  type PublicResolvedTheme,
  type PublicThemeMode,
} from "../_components/PublicChrome";
import styles from "./car.module.css";

type CarStatus = "in_stock" | "in_showroom" | "in_transit" | "made_to_order" | "reserved" | "sold" | "hidden";
type Currency = "USD" | "UZS" | "EUR";

interface Photo {
  id: number;
  url: string;
  isCover: boolean;
  sortOrder: number;
}

interface Variant {
  id: number;
  exteriorColorName: string | null;
  exteriorSwatch: string;
  interiorColorName: string | null;
  interiorSwatch: string;
  photos: Photo[];
  interiorPhotos?: Photo[];
  detailPhotos?: Photo[];
}

interface PublicCar {
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
  currency: Currency;
  priceOnRequest: boolean;
  mileageKm: number;
  fuelType: string | null;
  driveType: string | null;
  transmission: string | null;
  engineText: string | null;
  seats: number | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  shortDescriptionRu: string;
  shortDescriptionUz: string;
  descriptionRu: string;
  descriptionUz: string;
  isNew: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  updatedAt: string;
  coverUrl: string | null;
  engineDisplacementL: number | null;
  horsepowerHp: number | null;
  torqueNm: number | null;
  acceleration0100: number | null;
  topSpeedKmh: number | null;
  fuelConsumptionL100: number | null;
  electricRangeKm: number | null;
  instagramUrl: string | null;
  variants: Variant[];
}

interface DetailResponse {
  success?: boolean;
  error?: string;
  car?: PublicCar;
}

interface BrandCoverItem {
  key: string;
  url: string;
  size: number;
  uploadedAt: string | null;
}

interface BrandMediaResponse {
  success?: boolean;
  images?: BrandCoverItem[];
}

const COPY = {
  ru: {
    loading: "Загружаем автомобиль",
    error: "Не удалось открыть автомобиль.",
    back: "Вернуться в каталог",
    book: "Забронировать",
    video: "Смотреть обзор",
    compare: "Сравнить",
    favoriteAdd: "Добавить в избранное",
    favoriteRemove: "Убрать из избранного",
    detailsKicker: "ХАРАКТЕР В ДЕТАЛЯХ",
    detailsTitle: "Создан для тех, кто выбирает без компромиссов",
    detailsFallback: "Каждая деталь этого автомобиля подобрана так, чтобы создавать цельное впечатление — от первого взгляда до ежедневного владения.",
    detailLight: "Свет",
    detailLightText: "Оптика и характерная световая графика",
    detailDesign: "Детали",
    detailDesignText: "Отделка, диски и элементы конкретной комплектации",
    detailCharacter: "Характер",
    detailCharacterText: "Фирменные акценты и текстуры",
    performance: "Уверенность в каждом движении",
    interiorKicker: "ИНТЕРЬЕР",
    interiorTitle: "Тишина становится роскошью",
    interiorText: "Материалы, эргономика и атмосфера салона раскрывают автомобиль не меньше, чем его динамика.",
    gallery: "Автомобиль со всех сторон",
    availability: "Автомобиль доступен",
    availabilityText: "Проверенная информация, актуальный статус и сопровождение Auto Sale Umar до передачи ключей.",
    finalTitle: "Ваш автомобиль ждёт",
    finalButton: "Записаться на просмотр",
    power: "Мощность",
    torque: "Крутящий момент",
    acceleration: "Разгон 0–100 км/ч",
    drive: "Привод",
    mileage: "Пробег",
    engine: "Двигатель",
    transmission: "Коробка",
    seats: "Мест",
    source: "Рынок",
    speed: "Макс. скорость",
    economy: "Расход",
    range: "Запас хода",
    year: "Год выпуска",
    fuel: "Тип топлива",
    selectedColor: "Цвет кузова",
    interiorColor: "Цвет салона",
    priceRequest: "Цена по запросу",
    in_showroom: "В шоуруме",
    in_stock: "В наличии",
    in_transit: "В пути",
    made_to_order: "Под заказ",
    reserved: "Резерв",
    sold: "Продан",
    hidden: "Скрыт",
  },
  uz: {
    loading: "Avtomobil yuklanmoqda",
    error: "Avtomobilni ochib bo‘lmadi.",
    back: "Katalogga qaytish",
    book: "Ko‘rishga yozilish",
    video: "Sharhni ko‘rish",
    compare: "Solishtirish",
    favoriteAdd: "Sevimlilarga qo‘shish",
    favoriteRemove: "Sevimlilardan olib tashlash",
    detailsKicker: "XARAKTER DETALLARDA",
    detailsTitle: "Murosasiz tanlov qiladiganlar uchun yaratilgan",
    detailsFallback: "Avtomobilning har bir detali birinchi taassurotdan kundalik foydalanishgacha yaxlit tajriba yaratadi.",
    detailLight: "Yorug‘lik",
    detailLightText: "Optika va o‘ziga xos yorug‘lik grafikasi",
    detailDesign: "Detallar",
    detailDesignText: "Disklar, bezak va aynan shu komplektatsiya elementlari",
    detailCharacter: "Xarakter",
    detailCharacterText: "Brend aksentlari va teksturalar",
    performance: "Har bir harakatda ishonch",
    interiorKicker: "INTERYER",
    interiorTitle: "Sokinlik hashamatga aylanadi",
    interiorText: "Materiallar, ergonomika va salon muhiti avtomobilni uning dinamikasidek ochib beradi.",
    gallery: "Avtomobilni har tomondan ko‘ring",
    availability: "Avtomobil mavjud",
    availabilityText: "Tekshirilgan ma’lumot, dolzarb status va kalit topshirilgunga qadar Auto Sale Umar hamrohligi.",
    finalTitle: "Avtomobilingiz sizni kutmoqda",
    finalButton: "Ko‘rishga yozilish",
    power: "Quvvat",
    torque: "Aylanish momenti",
    acceleration: "0–100 km/soat",
    drive: "Uzatma",
    mileage: "Yurgan masofa",
    engine: "Dvigatel",
    transmission: "Quti",
    seats: "O‘rin",
    source: "Bozor",
    speed: "Maks. tezlik",
    economy: "Sarf",
    range: "Yurish zaxirasi",
    year: "Ishlab chiqarilgan yil",
    fuel: "Yoqilg‘i",
    selectedColor: "Kuzov rangi",
    interiorColor: "Salon rangi",
    priceRequest: "Narx so‘rov bo‘yicha",
    in_showroom: "Shourumda",
    in_stock: "Mavjud",
    in_transit: "Yo‘lda",
    made_to_order: "Buyurtma asosida",
    reserved: "Band qilingan",
    sold: "Sotilgan",
    hidden: "Yashirilgan",
  },
} as const;

const BRAND_LOGOS: Record<string, string> = {
  "mercedes-benz": "/brands/mercedes-benz.jpg",
  "range rover": "/brands/range-rover.png",
  "rolls-royce": "/brands/rolls-royce.png",
  cadillac: "/brands/cadillac.png",
  lexus: "/brands/lexus.png",
  toyota: "/brands/toyota.png",
  genesis: "/brands/genesis.png",
  bmw: "/brands/bmw.png",
  lamborghini: "/brands/lamborghini.png",
  porsche: "/brands/porsche.png",
};

const COUNTRY_NAMES = {
  ru: { US: "США", CA: "Канада", KR: "Корея", AE: "ОАЭ", DE: "Германия", GB: "Великобритания", AU: "Австралия", EU: "Европа" },
  uz: { US: "AQSH", CA: "Kanada", KR: "Koreya", AE: "BAA", DE: "Germaniya", GB: "Buyuk Britaniya", AU: "Avstraliya", EU: "Yevropa" },
} as const;

function brandLogo(brand: string): string | null {
  return BRAND_LOGOS[brand.trim().toLowerCase()] ?? null;
}

function formatPrice(car: PublicCar, language: PublicLanguage): string {
  if (car.priceOnRequest || car.price == null) return COPY[language].priceRequest;
  const amount = new Intl.NumberFormat(language === "ru" ? "ru-RU" : "uz-UZ", { maximumFractionDigits: 0 }).format(car.price);
  if (car.currency === "USD") return `${amount} $`;
  if (car.currency === "EUR") return `${amount} €`;
  return `${amount} сум`;
}

function countryLabel(code: string | null, language: PublicLanguage): string | null {
  if (!code) return null;
  return COUNTRY_NAMES[language][code as keyof typeof COUNTRY_NAMES.ru] ?? code;
}

function statusLabel(status: CarStatus, language: PublicLanguage): string {
  return COPY[language][status];
}

function usePublicPreferences() {
  const [language, setLanguage] = useState<PublicLanguage>("ru");
  const [themeMode, setThemeMode] = useState<PublicThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<PublicResolvedTheme>("light");

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem("asu-public-language");
      if (storedLanguage === "ru" || storedLanguage === "uz") setLanguage(storedLanguage);
      else if (navigator.language.toLowerCase().startsWith("uz")) setLanguage("uz");
      const storedTheme = localStorage.getItem("asu-public-theme");
      if (storedTheme === "system" || storedTheme === "light" || storedTheme === "dark") setThemeMode(storedTheme);
    } catch {}
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const next: PublicResolvedTheme = themeMode === "system" ? (media.matches ? "dark" : "light") : themeMode;
      setResolvedTheme(next);
      document.documentElement.dataset.asuPublicTheme = next;
      document.documentElement.style.colorScheme = next;
      const background = next === "dark" ? "#09090a" : "#f4f4f2";
      document.documentElement.style.backgroundColor = background;
      document.body.style.backgroundColor = background;
    };
    apply();
    if (themeMode === "system") media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [themeMode]);

  function changeLanguage(next: PublicLanguage) {
    setLanguage(next);
    try { localStorage.setItem("asu-public-language", next); } catch {}
  }

  function changeTheme(next: PublicThemeMode) {
    setThemeMode(next);
    try { localStorage.setItem("asu-public-theme", next); } catch {}
  }

  return { language, themeMode, resolvedTheme, changeLanguage, changeTheme };
}

export default function CarPage() {
  const { language, themeMode, resolvedTheme, changeLanguage, changeTheme } = usePublicPreferences();
  const [car, setCar] = useState<PublicCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variantIndex, setVariantIndex] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [brandCovers, setBrandCovers] = useState<BrandCoverItem[]>([]);
  const c = COPY[language];

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("slug")?.trim();
    if (!slug) {
      setError(c.error);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/catalog?slug=${encodeURIComponent(slug)}`, { cache: "no-store", signal: controller.signal });
        const body = await response.json().catch(() => null) as DetailResponse | null;
        if (!response.ok || !body?.success || !body.car) throw new Error(body?.error || c.error);
        setCar(body.car);
        try {
          const stored = JSON.parse(localStorage.getItem("asu-public-favorites") || "[]") as unknown;
          setFavorite(Array.isArray(stored) && stored.includes(body.car.slug));
        } catch {}
      } catch (requestError) {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : c.error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [c.error]);

  useEffect(() => {
    if (!car?.brand) return;
    let cancelled = false;
    fetch(`/api/brand-media?brand=${encodeURIComponent(car.brand)}`, { cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as BrandMediaResponse | null;
        return response.ok && body?.success && Array.isArray(body.images) ? body.images.slice(0, 3) : [];
      })
      .then((images) => { if (!cancelled) setBrandCovers(images); })
      .catch(() => { if (!cancelled) setBrandCovers([]); });
    return () => { cancelled = true; };
  }, [car?.brand]);

  const activeVariant = car?.variants[Math.min(variantIndex, Math.max((car?.variants.length ?? 1) - 1, 0))] ?? null;
  const exteriorPhotos = useMemo(() => {
    if (!car) return [] as Photo[];
    if (activeVariant?.photos?.length) return activeVariant.photos;
    return car.coverUrl ? [{ id: -1, url: car.coverUrl, isCover: true, sortOrder: 0 }] : [];
  }, [car, activeVariant]);
  const interiorPhotos = activeVariant?.interiorPhotos ?? [];
  const detailPhotos = activeVariant?.detailPhotos ?? [];
  const fallbackDetailPhotos = detailPhotos.length ? detailPhotos : exteriorPhotos.slice(1, 4);
  const galleryPhotos = useMemo(() => [...exteriorPhotos.slice(1), ...interiorPhotos], [exteriorPhotos, interiorPhotos]);

  function toggleFavorite() {
    if (!car) return;
    const next = !favorite;
    setFavorite(next);
    try {
      const stored = JSON.parse(localStorage.getItem("asu-public-favorites") || "[]") as unknown;
      const values = Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string") : [];
      const result = next ? Array.from(new Set([...values, car.slug])) : values.filter((item) => item !== car.slug);
      localStorage.setItem("asu-public-favorites", JSON.stringify(result));
    } catch {}
  }

  if (loading) {
    return (
      <main className={styles.statePage} data-theme={resolvedTheme}>
        <PublicChrome language={language} themeMode={themeMode} resolvedTheme={resolvedTheme} backHref="/" onLanguageChange={changeLanguage} onThemeChange={changeTheme} />
        <div className={styles.stateCard}><span className={styles.loader} /><strong>{c.loading}</strong></div>
      </main>
    );
  }

  if (!car || error) {
    return (
      <main className={styles.statePage} data-theme={resolvedTheme}>
        <PublicChrome language={language} themeMode={themeMode} resolvedTheme={resolvedTheme} backHref="/" onLanguageChange={changeLanguage} onThemeChange={changeTheme} />
        <div className={styles.stateCard}><strong>{error || c.error}</strong><a href="/#cars">{c.back}<ChevronRight /></a></div>
      </main>
    );
  }

  const logo = brandLogo(car.brand);
  const description = language === "ru" ? (car.descriptionRu || car.shortDescriptionRu) : (car.descriptionUz || car.shortDescriptionUz);
  const shortDescription = language === "ru" ? car.shortDescriptionRu : car.shortDescriptionUz;
  const heroPhoto = exteriorPhotos[0]?.url ?? car.coverUrl;
  const editorialPhoto = exteriorPhotos[1]?.url ?? heroPhoto;
  const interiorHero = interiorPhotos[0]?.url ?? exteriorPhotos[2]?.url ?? heroPhoto;
  const selectedExterior = activeVariant?.exteriorColorName || car.exteriorColor || "—";
  const selectedInterior = activeVariant?.interiorColorName || car.interiorColor || "—";
  const bookingHref = `/booking/?brand=${encodeURIComponent(car.brand)}&car=${encodeURIComponent(`${car.brand} ${car.model}`)}`;
  const compareHref = `/compare/?cars=${encodeURIComponent(car.slug)}`;
  const brandMood = brandCovers[0]?.url ?? null;

  const topSpecs = [
    car.horsepowerHp != null ? { label: c.power, value: `${car.horsepowerHp} ${language === "ru" ? "л.с." : "o.k."}` } : null,
    car.acceleration0100 != null ? { label: c.acceleration, value: `${car.acceleration0100} с` } : null,
    car.driveType ? { label: c.drive, value: car.driveType } : null,
    { label: c.mileage, value: `${new Intl.NumberFormat(language === "ru" ? "ru-RU" : "uz-UZ").format(car.mileageKm || 0)} км` },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const inventorySpecs = [
    car.year ? { label: c.year, value: String(car.year) } : null,
    { label: c.mileage, value: `${new Intl.NumberFormat(language === "ru" ? "ru-RU" : "uz-UZ").format(car.mileageKm || 0)} км` },
    car.fuelType ? { label: c.fuel, value: car.fuelType } : null,
    car.driveType ? { label: c.drive, value: car.driveType } : null,
    car.engineText ? { label: c.engine, value: car.engineText } : null,
    car.transmission ? { label: c.transmission, value: car.transmission } : null,
    countryLabel(car.countryCode, language) ? { label: c.source, value: countryLabel(car.countryCode, language)! } : null,
    { label: c.selectedColor, value: selectedExterior },
    { label: c.interiorColor, value: selectedInterior },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const performanceStats = [
    car.horsepowerHp != null ? { label: c.power, value: `${car.horsepowerHp} ${language === "ru" ? "л.с." : "o.k."}` } : null,
    car.torqueNm != null ? { label: c.torque, value: `${car.torqueNm} Н·м` } : null,
    car.acceleration0100 != null ? { label: c.acceleration, value: `${car.acceleration0100} с` } : null,
    car.driveType ? { label: c.drive, value: car.driveType } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const detailCards = [
    { title: c.detailLight, text: c.detailLightText },
    { title: c.detailDesign, text: c.detailDesignText },
    { title: c.detailCharacter, text: c.detailCharacterText },
  ];

  return (
    <main className={styles.page} data-theme={resolvedTheme}>
      <PublicChrome language={language} themeMode={themeMode} resolvedTheme={resolvedTheme} backHref="/" onLanguageChange={changeLanguage} onThemeChange={changeTheme} />

      <div className={styles.shell}>
        <section className={styles.hero}>
          {brandMood ? <div className={styles.heroMood} style={{ backgroundImage: `url(${brandMood})` }} aria-hidden="true" /> : null}
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{car.year ? `${car.year} · ` : ""}{car.trim || car.engineText || car.brand}</p>
            <h1>{car.brand} <span>{car.model}</span></h1>
            <div className={styles.statusPriceRow}>
              <span className={styles.statusPill} data-status={car.status}>{statusLabel(car.status, language)}</span>
              <strong>{formatPrice(car, language)}</strong>
            </div>
            <p className={styles.heroText}>{shortDescription || description || c.detailsFallback}</p>
            <div className={styles.heroActions}>
              <a href={bookingHref} className={styles.primaryButton}><CalendarDays /><span>{c.book}</span></a>
              {car.instagramUrl ? <a href={car.instagramUrl} target="_blank" rel="noreferrer" className={styles.secondaryButton}><Instagram /><span>{c.video}</span></a> : null}
              <button type="button" className={styles.favoriteButton} onClick={toggleFavorite} aria-label={favorite ? c.favoriteRemove : c.favoriteAdd}><Heart fill={favorite ? "currentColor" : "none"} /></button>
            </div>
          </div>

          <div className={styles.heroVisual}>
            {logo ? <img className={styles.heroBrandLogo} src={logo} alt="" /> : null}
            {heroPhoto ? <img className={styles.heroCar} src={heroPhoto} alt={`${car.brand} ${car.model}`} /> : <div className={styles.photoFallback}>{car.brand} {car.model}</div>}
          </div>
        </section>

        {topSpecs.length ? (
          <section className={styles.topSpecBar}>
            {topSpecs.map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
          </section>
        ) : null}

        {car.variants.length > 1 ? (
          <section className={styles.variantBar} aria-label={language === "ru" ? "Цветовые варианты" : "Rang variantlari"}>
            <span>{language === "ru" ? "Варианты" : "Variantlar"}</span>
            <div>{car.variants.map((variant, index) => (
              <button key={variant.id} type="button" data-active={index === variantIndex} onClick={() => setVariantIndex(index)} aria-label={variant.exteriorColorName || `${index + 1}`}>
                <i style={{ backgroundColor: variant.exteriorSwatch }} />
                <b>{variant.exteriorColorName || `${index + 1}`}</b>
              </button>
            ))}</div>
          </section>
        ) : null}

        <section className={styles.editorialFeature}>
          <div className={styles.editorialCopy}>
            <p className={styles.sectionKicker}>{c.detailsKicker}</p>
            <h2>{c.detailsTitle}</h2>
            <p>{description || c.detailsFallback}</p>
          </div>
          <div className={styles.editorialImage}>{editorialPhoto ? <img src={editorialPhoto} alt={`${car.brand} ${car.model}`} /> : null}</div>
        </section>

        <section className={styles.detailGrid}>
          {detailCards.map((card, index) => {
            const photo = fallbackDetailPhotos[index]?.url ?? exteriorPhotos[(index + 1) % Math.max(exteriorPhotos.length, 1)]?.url ?? heroPhoto;
            return (
              <article key={card.title} className={styles.detailCard}>
                {photo ? <img src={photo} alt="" loading="lazy" /> : null}
                <div><strong>{card.title}</strong><span>{card.text}</span></div>
              </article>
            );
          })}
        </section>

        <section className={styles.performancePanel}>
          <div className={styles.performanceNumber}>{car.horsepowerHp ?? car.torqueNm ?? "—"}</div>
          <div className={styles.performanceContent}>
            <p className={styles.sectionKicker}>{language === "ru" ? "ДИНАМИКА" : "DINAMIKA"}</p>
            <h2>{c.performance}</h2>
            <div className={styles.performanceStats}>
              {performanceStats.map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
            </div>
          </div>
        </section>

        <section className={styles.interiorFeature}>
          <div className={styles.interiorCopy}>
            <p className={styles.sectionKicker}>{c.interiorKicker}</p>
            <h2>{c.interiorTitle}</h2>
            <p>{c.interiorText}</p>
            <div className={styles.materialCards}>
              <div><span>{c.interiorColor}</span><strong>{selectedInterior}</strong></div>
              <div><span>{c.transmission}</span><strong>{car.transmission || "—"}</strong></div>
            </div>
          </div>
          <div className={styles.interiorImage}>{interiorHero ? <img src={interiorHero} alt={`${car.brand} ${car.model} interior`} loading="lazy" /> : null}</div>
        </section>

        {galleryPhotos.length ? (
          <section className={styles.gallerySection}>
            <div className={styles.sectionHeading}><p className={styles.sectionKicker}>{language === "ru" ? "ГАЛЕРЕЯ" : "GALEREYA"}</p><h2>{c.gallery}</h2></div>
            <div className={styles.galleryGrid}>
              {galleryPhotos.slice(0, 6).map((photo, index) => <figure key={`${photo.id}-${index}`}><img src={photo.url} alt={`${car.brand} ${car.model}`} loading="lazy" /></figure>)}
            </div>
          </section>
        ) : null}

        <section className={styles.inventoryPanel}>
          <div className={styles.inventoryHeader}>
            <div><p className={styles.sectionKicker}>AUTO SALE UMAR</p><h2>{c.availability}</h2></div>
            <span className={styles.statusPill} data-status={car.status}>{statusLabel(car.status, language)}</span>
          </div>
          <p>{c.availabilityText}</p>
          <div className={styles.inventoryGrid}>{inventorySpecs.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
          <div className={styles.trustRow}>
            <span><ShieldCheck />{language === "ru" ? "Проверенная информация" : "Tekshirilgan ma’lumot"}</span>
            <span><Gauge />{language === "ru" ? "Актуальный статус" : "Dolzarb status"}</span>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.finalImage}>{exteriorPhotos[2]?.url || heroPhoto ? <img src={exteriorPhotos[2]?.url || heroPhoto || ""} alt="" loading="lazy" /> : null}</div>
          <div className={styles.finalCopy}>
            <p>{c.finalTitle}</p>
            <strong>{formatPrice(car, language)}</strong>
            <div className={styles.finalActions}>
              <a href={bookingHref}>{c.finalButton}<ArrowUpRight /></a>
              <a href={compareHref} className={styles.compareButton}><ArrowLeftRight />{c.compare}</a>
            </div>
          </div>
        </section>

        <footer className={styles.footer}><img src="/brand/asu-wordmark-black.png" alt="Auto Sale Umar" onError={(event) => { event.currentTarget.style.display = "none"; }} /><span>Selected with precision.</span></footer>
      </div>
    </main>
  );
}
