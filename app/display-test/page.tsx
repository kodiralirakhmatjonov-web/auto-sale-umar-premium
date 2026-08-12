"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./display-test.module.css";

type CarStatus = "in_stock" | "in_showroom" | "in_transit" | "made_to_order" | "reserved" | "sold" | "hidden";
type Currency = "USD" | "UZS" | "EUR";

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

const ROTATION_MS = 5000;
const CATALOG_REFRESH_MS = 60_000;

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

function SpecCell({ value }: { value: string }) {
  return (
    <div className={styles.specCell}>
      <strong>{value}</strong>
    </div>
  );
}

export default function DisplayTestPage() {
  const [cars, setCars] = useState<DisplayCar[]>([]);
  const [index, setIndex] = useState(0);
  const [time, setTime] = useState(() => new Date());
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(false);
  const currentSlugRef = useRef<string | null>(null);

  useEffect(() => {
    currentSlugRef.current = cars[index]?.slug ?? null;
  }, [cars, index]);

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
      }
      setError(false);
    } catch (catalogError) {
      console.error("Showroom display test catalog failed", catalogError);
      setError(true);
    }
  }, []);

  useEffect(() => {
    void loadCars();
    const refresh = window.setInterval(() => void loadCars(), CATALOG_REFRESH_MS);
    return () => window.clearInterval(refresh);
  }, [loadCars]);

  useEffect(() => {
    const clock = window.setInterval(() => setTime(new Date()), 15_000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (paused || cars.length < 2) return;
    const rotation = window.setInterval(() => {
      setIndex((current) => (current + 1) % cars.length);
    }, ROTATION_MS);
    return () => window.clearInterval(rotation);
  }, [cars.length, paused]);

  const previous = useCallback(() => {
    if (cars.length === 0) return;
    setIndex((current) => (current - 1 + cars.length) % cars.length);
  }, [cars.length]);

  const next = useCallback(() => {
    if (cars.length === 0) return;
    setIndex((current) => (current + 1) % cars.length);
  }, [cars.length]);

  const car = cars[index] ?? null;
  const counter = useMemo(() => {
    if (!car || cars.length === 0) return "00 / 00";
    return `${pad(index + 1)} / ${pad(cars.length)}`;
  }, [car, cars.length, index]);

  const testControls = (
    <div className={styles.testControls}>
      <button type="button" onClick={previous} disabled={cars.length < 2} aria-label="Предыдущий автомобиль">
        <ChevronLeft aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        disabled={cars.length < 2}
        aria-label={paused ? "Продолжить автопереключение" : "Поставить автопереключение на паузу"}
      >
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      </button>
      <button type="button" onClick={next} disabled={cars.length < 2} aria-label="Следующий автомобиль">
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <main className={styles.testRoot}>
      <header className={styles.testHeader}>
        <div>
          <strong>TV MODE TEST</strong>
          <span>16:9 · LIVE DATA · iPHONE PREVIEW</span>
        </div>
        {testControls}
      </header>

      <section className={styles.previewArea} aria-label="Предпросмотр TV Mode">
        <div className={styles.screenFrame}>
          <div className={styles.screen}>
            <div className={styles.texture} aria-hidden="true" />
            <div className={styles.ambientGlow} aria-hidden="true" />

            {!car ? (
              <div className={styles.loadingScene}>
                <img src="/brand/asu-wordmark-white.png" alt="Auto Sale Umar" />
                <span>SHOWROOM DISPLAY</span>
                <strong>{error ? "ОБНОВЛЯЕМ ДАННЫЕ" : "ЗАГРУЖАЕМ КОЛЛЕКЦИЮ"}</strong>
              </div>
            ) : (
              <AnimatePresence initial={false} mode="sync">
                <motion.section
                  className={styles.scene}
                  key={`${car.id}-${car.slug}`}
                  initial={{ opacity: 0, y: "1.2cqh", scale: 0.997, filter: "blur(0.45cqw)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: "-0.8cqh", scale: 1.002, filter: "blur(0.45cqw)" }}
                  transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
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

                      <div className={styles.yearLine}>
                        {[car.year ? String(car.year) : null, car.engineText || normalizeFuel(car.fuelType)]
                          .filter(Boolean)
                          .join(" · ") || "PREMIUM"}
                      </div>

                      <span className={styles.statusPill} data-status={car.status}>
                        <i aria-hidden="true" />
                        {STATUS_LABELS[car.status]}
                      </span>

                      <div className={styles.price}>{formatPrice(car)}</div>

                      <div className={styles.specGrid}>
                        <SpecCell value={normalizeFuel(car.fuelType)} />
                        <SpecCell value={normalizeDrive(car.driveType)} />
                        <SpecCell value={`${new Intl.NumberFormat("ru-RU").format(car.mileageKm || 0)} КМ`} />
                        <SpecCell
                          value={
                            car.countryCode
                              ? COUNTRY_LABELS[car.countryCode] ?? car.countryCode
                              : compactTrim(car.trim)
                          }
                        />
                      </div>

                      <div className={styles.description}>{displayDescription(car)}</div>
                    </aside>

                    <div className={styles.visualCard}>
                      <div className={styles.imageStage}>
                        <motion.img
                          key={carImage(car)}
                          className={styles.carImage}
                          src={carImage(car)}
                          alt={`${car.brand} ${car.model}`}
                          initial={{ opacity: 0, scale: 1.018 }}
                          animate={{ opacity: 1, scale: 1.002 }}
                          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
                          onError={(event) => {
                            const target = event.currentTarget;
                            if (!target.src.endsWith("/intro-poster.jpg")) target.src = "/intro-poster.jpg";
                          }}
                        />
                        <div className={styles.softSweep} aria-hidden="true" />
                      </div>

                      <div className={styles.profileBadge}>{pad(index + 1)} · ПРОФИЛЬ</div>

                      <a className={styles.qrCard} href={publicCarUrl(car.slug)}>
                        <div className={styles.qrWrap}>
                          <img src={qrUrl(car.slug)} alt={`QR ${car.brand} ${car.model}`} />
                        </div>
                        <div>
                          <strong>ОТКРЫТЬ<br />АВТОМОБИЛЬ</strong>
                          <span>Наведите камеру телефона</span>
                        </div>
                      </a>
                    </div>
                  </section>

                  <footer className={styles.footerBar}>
                    <div className={styles.progressRail} aria-hidden="true">
                      <span
                        key={`${car.id}-${paused ? "paused" : "running"}-progress`}
                        className={paused ? styles.progressPaused : undefined}
                      />
                    </div>
                    <div className={styles.footerMeta}>
                      <strong>{counter}</strong>
                      <span>АВТОМОБИЛИ</span>
                    </div>
                  </footer>
                </motion.section>
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>

      <footer className={styles.testFooter}>
        <span className={styles.liveDot} aria-hidden="true" />
        <span>{paused ? "Автопереключение приостановлено" : "Автопереключение каждые 5 секунд"}</span>
        <span className={styles.landscapeHint}>Поверни iPhone горизонтально для крупного preview</span>
      </footer>
    </main>
  );
}
