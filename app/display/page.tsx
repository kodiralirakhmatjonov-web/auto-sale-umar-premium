"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./display.module.css";

type CarStatus = "in_stock" | "in_showroom" | "in_transit" | "made_to_order" | "reserved" | "sold" | "hidden";
type Currency = "USD" | "UZS" | "EUR";
type DisplayPhase = "loading" | "intro" | "catalog";

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

interface DisplayCar {
  id: number;
  slug: string;
  brand: string;
  model: string;
  year: number | null;
  trim: string | null;
  status: CarStatus;
  countryCode: string | null;
  price: number | null;
  currency: Currency;
  priceOnRequest: boolean;
  mileageKm: number;
  fuelType: string | null;
  driveType: string | null;
  transmission: string | null;
  engineText: string | null;
  seats: number | null;
  shortDescriptionRu: string;
  coverUrl: string | null;
  variants?: CatalogVariant[];
}

interface CatalogResponse {
  success?: boolean;
  cars?: DisplayCar[];
}

const ROTATION_MS = 11_000;
const CATALOG_REFRESH_MS = 60_000;
const INTRO_FALLBACK_MS = 9_000;

const STATUS_LABELS: Record<CarStatus, string> = {
  in_stock: "В НАЛИЧИИ",
  in_showroom: "В ШОУРУМЕ",
  in_transit: "В ПУТИ",
  made_to_order: "ПОД ЗАКАЗ",
  reserved: "РЕЗЕРВ",
  sold: "ПРОДАН",
  hidden: "СКРЫТ",
};

const COUNTRY_LABELS: Record<string, string> = {
  US: "США",
  CA: "КАНАДА",
  KR: "КОРЕЯ",
  AE: "ОАЭ",
  DE: "ГЕРМАНИЯ",
  GB: "ВЕЛИКОБРИТАНИЯ",
  AU: "АВСТРАЛИЯ",
  EU: "ЕВРОПА",
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatPrice(car: DisplayCar): string {
  if (car.priceOnRequest || car.price == null) return "ЦЕНА ПО ЗАПРОСУ";
  const value = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(car.price);
  if (car.currency === "USD") return `${value} $`;
  if (car.currency === "EUR") return `${value} €`;
  return `${value} СУМ`;
}

function carImage(car: DisplayCar): string {
  if (car.coverUrl) return car.coverUrl;
  for (const variant of car.variants ?? []) {
    const cover = variant.photos?.find((photo) => photo.isCover) ?? variant.photos?.[0];
    if (cover?.url) return cover.url;
  }
  return "/intro-poster.jpg";
}

function normalizeFuel(value: string | null): string {
  if (!value) return "ПРЕМИУМ";
  const key = value.trim().toLowerCase();
  if (key.includes("electric") || key.includes("элект")) return "ЭЛЕКТРО";
  if (key.includes("hybrid") || key.includes("гибрид")) return "ГИБРИД";
  if (key.includes("diesel") || key.includes("диз")) return "ДИЗЕЛЬ";
  if (key.includes("gas") || key.includes("petrol") || key.includes("бенз")) return "БЕНЗИН";
  return value.toLocaleUpperCase("ru-RU");
}

function normalizeDrive(value: string | null): string {
  if (!value) return "PREMIUM";
  const key = value.trim().toLowerCase();
  if (key.includes("awd") || key.includes("полный") || key.includes("4wd")) return "AWD";
  if (key.includes("rwd") || key.includes("задн")) return "RWD";
  if (key.includes("fwd") || key.includes("передн")) return "FWD";
  return value.toLocaleUpperCase("ru-RU");
}

function compactTrim(value: string | null): string {
  if (!value) return "ПРЕМИУМ";
  const cleaned = value.trim();
  return cleaned.length > 22 ? `${cleaned.slice(0, 20)}…` : cleaned.toLocaleUpperCase("ru-RU");
}

function publicCarUrl(slug: string): string {
  return `https://autosaleumar.com/car/?slug=${encodeURIComponent(slug)}`;
}

function qrUrl(slug: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=0&format=png&data=${encodeURIComponent(publicCarUrl(slug))}`;
}

function displayDescription(car: DisplayCar): string {
  const description = car.shortDescriptionRu?.trim();
  if (description) return description;
  if (car.status === "in_transit") return "Следующее поступление Auto Sale Umar.";
  if (car.status === "made_to_order") return "Подберём конфигурацию точно под ваш запрос.";
  if (car.status === "reserved") return "Автомобиль выбран и находится в резерве.";
  return "Автомобиль, выбранный точно.";
}

function clampIndex(value: number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(Math.max(value, 0), length - 1);
}

function StatusPill({ status }: { status: CarStatus }) {
  return (
    <span className={styles.statusPill} data-status={status}>
      <i aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

function SpecCell({ value }: { value: string }) {
  return (
    <div className={styles.specCell}>
      <strong>{value}</strong>
    </div>
  );
}

export default function DisplayPage() {
  const [cars, setCars] = useState<DisplayCar[]>([]);
  const [index, setIndex] = useState(0);
  const [time, setTime] = useState(() => new Date());
  const [error, setError] = useState(false);
  const [phase, setPhase] = useState<DisplayPhase>("loading");
  const [introCycle, setIntroCycle] = useState(0);

  const currentSlugRef = useRef<string | null>(null);
  const pendingIndexRef = useRef<number | null>(0);
  const warmedAssetsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    currentSlugRef.current = cars[index]?.slug ?? null;
  }, [cars, index]);

  const startIntro = useCallback(
    (targetIndex: number) => {
      pendingIndexRef.current = clampIndex(targetIndex, cars.length);
      setPhase("intro");
      setIntroCycle((current) => current + 1);
    },
    [cars.length],
  );

  const finishIntro = useCallback(() => {
    setPhase("catalog");
    setIndex((current) => {
      const nextIndex = pendingIndexRef.current;
      pendingIndexRef.current = null;
      return clampIndex(nextIndex ?? current, cars.length);
    });
  }, [cars.length]);

  const loadCars = useCallback(async () => {
    try {
      const response = await fetch("/api/catalog?pageSize=100", { cache: "no-store" });
      const payload = (await response.json()) as CatalogResponse;
      if (!response.ok || payload.success !== true || !Array.isArray(payload.cars)) {
        throw new Error("Catalog unavailable");
      }

      const active = payload.cars.filter((car) => car.status !== "hidden" && car.status !== "sold");
      const nextCars = active.length > 0 ? active : payload.cars.filter((car) => car.status !== "hidden");
      const currentSlug = currentSlugRef.current;

      setCars(nextCars);
      if (nextCars.length > 0) {
        const preservedIndex = currentSlug ? nextCars.findIndex((car) => car.slug === currentSlug) : -1;
        setIndex((current) => {
          if (preservedIndex >= 0) return preservedIndex;
          return Math.min(current, nextCars.length - 1);
        });
      } else {
        setIndex(0);
        setPhase("loading");
      }
      setError(false);
    } catch (catalogError) {
      console.error("Showroom display catalog failed", catalogError);
      setError(true);
    }
  }, []);

  useEffect(() => {
    void loadCars();
    const refresh = window.setInterval(() => void loadCars(), CATALOG_REFRESH_MS);
    return () => window.clearInterval(refresh);
  }, [loadCars]);

  useEffect(() => {
    if (cars.length === 0) return;

    const warm = (src: string) => {
      if (!src || warmedAssetsRef.current.has(src)) return;
      warmedAssetsRef.current.add(src);

      const preload = new window.Image();
      preload.decoding = "async";
      preload.src = src;
      if (typeof preload.decode === "function") {
        void preload.decode().catch(() => undefined);
      }
    };

    const preloadCount = Math.min(3, cars.length);
    for (let offset = 0; offset < preloadCount; offset += 1) {
      const displayCar = cars[(index + offset) % cars.length];
      if (!displayCar) continue;
      warm(carImage(displayCar));
      warm(qrUrl(displayCar.slug));
    }
  }, [cars, index]);

  useEffect(() => {
    const clock = window.setInterval(() => setTime(new Date()), 15_000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (cars.length > 0 && phase === "loading") {
      startIntro(index);
    }
  }, [cars.length, index, phase, startIntro]);

  useEffect(() => {
    if (phase !== "intro") return;
    const fallback = window.setTimeout(() => finishIntro(), INTRO_FALLBACK_MS);
    return () => window.clearTimeout(fallback);
  }, [finishIntro, introCycle, phase]);

  useEffect(() => {
    if (phase !== "catalog" || cars.length === 0) return;
    const rotation = window.setTimeout(() => {
      if (index >= cars.length - 1) {
        startIntro(0);
        return;
      }
      setIndex((current) => clampIndex(current + 1, cars.length));
    }, ROTATION_MS);
    return () => window.clearTimeout(rotation);
  }, [cars.length, index, phase, startIntro]);

  const car = cars[index] ?? null;
  const counter = useMemo(() => {
    if (!car || cars.length === 0) return "00 / 00";
    return `${pad(index + 1)} / ${pad(cars.length)}`;
  }, [car, cars.length, index]);

  const yearLine = car
    ? [car.year ? String(car.year) : null, car.engineText || normalizeFuel(car.fuelType)].filter(Boolean).join(" · ")
    : "";
  const country = car?.countryCode ? COUNTRY_LABELS[car.countryCode] ?? car.countryCode : null;
  const image = car ? carImage(car) : "/intro-poster.jpg";

  return (
    <main className={styles.displayRoot}>
      <div className={styles.texture} aria-hidden="true" />
      <div className={styles.ambientGlow} aria-hidden="true" />

      <AnimatePresence initial={false} mode="sync">
        {phase === "intro" ? (
          <motion.section
            key={`intro-${introCycle}`}
            className={styles.introScene}
            initial={{ opacity: 0, scale: 1.004 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.998 }}
            transition={{ duration: 1.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <video
              key={`intro-video-${introCycle}`}
              className={styles.introVideo}
              autoPlay
              muted
              playsInline
              preload="auto"
              poster="/intro-poster.jpg"
              onEnded={finishIntro}
            >
              <source src="/intro.mp4" type="video/mp4" />
            </video>
            <div className={styles.introVeil} aria-hidden="true" />
            <div className={styles.introBrand}>
              <img src="/brand/asu-wordmark-white.png" alt="Auto Sale Umar" />
              <span>SHOWROOM DISPLAY</span>
              <strong>PREMIUM COLLECTION</strong>
            </div>
          </motion.section>
        ) : !car ? (
          <motion.section
            key="loading"
            className={styles.loadingStage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <img className={styles.loadingLogo} src="/brand/asu-wordmark-white.png" alt="Auto Sale Umar" />
            <div className={styles.loadingCopy}>
              <span>SHOWROOM DISPLAY</span>
              <strong>{error ? "ОБНОВЛЯЕМ ДАННЫЕ" : "ЗАГРУЖАЕМ КОЛЛЕКЦИЮ"}</strong>
            </div>
          </motion.section>
        ) : (
          <motion.section
            className={styles.scene}
            key={`${car.id}-${car.slug}`}
            initial={{ opacity: 0, scale: 1.004 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.999 }}
            transition={{ duration: 1.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className={styles.topBar}>
              <img src="/brand/asu-wordmark-white.png" alt="Auto Sale Umar" />
              <div className={styles.displayMeta}>
                <span>SHOWROOM DISPLAY</span>
                <i aria-hidden="true" />
                <time>{formatTime(time)}</time>
              </div>
            </header>

            <section className={styles.contentGrid}>
              <aside className={styles.infoPanel}>
                <div className={styles.selectionLabel}>ВЫБОР AUTO SALE UMAR</div>

                <div className={styles.identity}>
                  <span>{car.brand.toLocaleUpperCase("ru-RU")}</span>
                  <h1>{car.model.toLocaleUpperCase("ru-RU")}</h1>
                  {car.trim ? <p>{car.trim}</p> : null}
                </div>

                <div className={styles.yearLine}>{yearLine || "PREMIUM"}</div>
                <StatusPill status={car.status} />

                <div className={styles.price}>{formatPrice(car)}</div>

                <div className={styles.specGrid}>
                  <SpecCell value={normalizeFuel(car.fuelType)} />
                  <SpecCell value={normalizeDrive(car.driveType)} />
                  <SpecCell value={`${new Intl.NumberFormat("ru-RU").format(car.mileageKm || 0)} КМ`} />
                  <SpecCell value={country ?? compactTrim(car.trim)} />
                </div>

                <div className={styles.description}>{displayDescription(car)}</div>
              </aside>

              <div className={styles.visualCard}>
                <div className={styles.imageStage}>
                  <img
                    key={image}
                    className={styles.carImage}
                    src={image}
                    alt={`${car.brand} ${car.model}`}
                    loading="eager"
                    decoding="async"
                    onError={(event: SyntheticEvent<HTMLImageElement>) => {
                      const target = event.currentTarget;
                      if (!target.src.endsWith("/intro-poster.jpg")) target.src = "/intro-poster.jpg";
                    }}
                  />
                  <div className={styles.softSweep} aria-hidden="true" />
                </div>

                <a className={styles.qrCard} href={publicCarUrl(car.slug)}>
                  <div className={styles.qrWrap}>
                    <img src={qrUrl(car.slug)} alt={`QR ${car.brand} ${car.model}`} />
                  </div>
                  <div>
                    <strong>
                      ОТКРЫТЬ
                      <br />
                      АВТОМОБИЛЬ
                    </strong>
                    <span>Наведите камеру телефона</span>
                  </div>
                </a>
              </div>
            </section>

            <footer className={styles.footerBar}>
              <div className={styles.progressRail} aria-hidden="true">
                <span key={`${car.id}-progress`} />
              </div>
              <div className={styles.footerMeta}>
                <strong>{counter}</strong>
                <span>АВТОМОБИЛИ</span>
              </div>
            </footer>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
