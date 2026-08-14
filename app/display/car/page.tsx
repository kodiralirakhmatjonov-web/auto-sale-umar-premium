"use client";

import { type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./display-car.module.css";

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
}

interface DisplayDetailCar {
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
  exteriorColor: string | null;
  interiorColor: string | null;
  shortDescriptionRu: string;
  descriptionRu: string;
  coverUrl: string | null;
  engineDisplacementL: number | null;
  horsepowerHp: number | null;
  torqueNm: number | null;
  acceleration0100: number | null;
  topSpeedKmh: number | null;
  fuelConsumptionL100: number | null;
  electricRangeKm: number | null;
  variants: Variant[];
}

interface DetailResponse {
  success?: boolean;
  error?: string;
  car?: DisplayDetailCar;
}

type FullscreenHost = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

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

function fullscreenElement(doc: FullscreenDocument): Element | null {
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function formatPrice(car: DisplayDetailCar): string {
  if (car.priceOnRequest || car.price == null) return "ЦЕНА ПО ЗАПРОСУ";
  const value = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(car.price);
  if (car.currency === "USD") return `${value} $`;
  if (car.currency === "EUR") return `${value} €`;
  return `${value} СУМ`;
}

function fallbackPhoto(car: DisplayDetailCar): Photo[] {
  return car.coverUrl ? [{ id: -1, url: car.coverUrl, isCover: true, sortOrder: 0 }] : [];
}

function qrUrl(slug: string): string {
  const target = `https://autosaleumar.com/car/?slug=${encodeURIComponent(slug)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=0&format=png&data=${encodeURIComponent(target)}`;
}

function displayValue(value: string | number | null | undefined, suffix = ""): string {
  if (value == null || value === "") return "—";
  return `${value}${suffix}`;
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function DisplayCarPage() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [car, setCar] = useState<DisplayDetailCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("slug")?.trim() ?? "";
    if (!slug) {
      setError("Автомобиль не найден.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetch(`/api/catalog?slug=${encodeURIComponent(slug)}`, { cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => {
        const body = (await response.json()) as DetailResponse;
        if (!response.ok || !body.success || !body.car) throw new Error(body.error || "Не удалось загрузить автомобиль.");
        return body.car;
      })
      .then((nextCar) => {
        if (cancelled) return;
        setCar(nextCar);
        setPhotoIndex(0);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить автомобиль.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const photos = useMemo(() => {
    if (!car) return [] as Photo[];
    const variant = car.variants?.[0];
    const combined = [...(variant?.photos ?? []), ...(variant?.interiorPhotos ?? [])];
    const seen = new Set<string>();
    const unique = combined.filter((photo) => {
      if (!photo.url || seen.has(photo.url)) return false;
      seen.add(photo.url);
      return true;
    });
    return unique.length ? unique : fallbackPhoto(car);
  }, [car]);

  useEffect(() => {
    if (photos.length < 2) return;
    const timer = window.setInterval(() => setPhotoIndex((current) => (current + 1) % photos.length), 7_500);
    return () => window.clearInterval(timer);
  }, [photos.length]);

  useEffect(() => {
    for (const photo of photos) {
      const image = new window.Image();
      image.decoding = "async";
      image.src = photo.url;
      if (typeof image.decode === "function") void image.decode().catch(() => undefined);
    }
  }, [photos]);

  useEffect(() => {
    const doc = document as FullscreenDocument;
    const onChange = () => setIsFullscreen(Boolean(fullscreenElement(doc)));
    onChange();
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange as EventListener);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const root = rootRef.current as FullscreenHost | null;
    const doc = document as FullscreenDocument;
    if (!root) return;
    try {
      if (fullscreenElement(doc)) {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
        return;
      }
      if (root.requestFullscreen) await root.requestFullscreen();
      else if (root.webkitRequestFullscreen) await root.webkitRequestFullscreen();
    } catch (reason) {
      console.error("TV detail fullscreen failed", reason);
    }
  }, []);

  if (loading || !car) {
    return (
      <main ref={rootRef} className={styles.root}>
        <div className={styles.marbleVeil} aria-hidden="true" />
        <div className={styles.centerState}>
          <img src="/brand/asu-wordmark-white.png" alt="Auto Sale Umar" />
          <span>{error || "ЗАГРУЖАЕМ АВТОМОБИЛЬ"}</span>
          {error ? <a href="/display/">ВЕРНУТЬСЯ К КОЛЛЕКЦИИ</a> : null}
        </div>
      </main>
    );
  }

  const activePhoto = photos[Math.min(photoIndex, Math.max(photos.length - 1, 0))]?.url ?? "/intro-poster.jpg";
  const country = car.countryCode ? COUNTRY_LABELS[car.countryCode] ?? car.countryCode : "—";
  const description = car.shortDescriptionRu?.trim() || car.descriptionRu?.trim() || "Автомобиль из коллекции Auto Sale Umar.";
  const engine = car.engineText || (car.engineDisplacementL ? `${car.engineDisplacementL} л` : "—");
  const drive = car.driveType?.toUpperCase() || "—";

  return (
    <main ref={rootRef} className={styles.root}>
      <div className={styles.marbleVeil} aria-hidden="true" />

      <header className={styles.header}>
        <a className={styles.backButton} href="/display/" aria-label="Вернуться к коллекции">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7M9 12h10" /></svg>
          <span>К КОЛЛЕКЦИИ</span>
        </a>
        <img className={styles.wordmark} src="/brand/asu-wordmark-white.png" alt="Auto Sale Umar" />
        <button className={styles.fullscreenButton} type="button" onClick={() => void toggleFullscreen()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" /></svg>
          <span>{isFullscreen ? "ВЫЙТИ" : "ПОЛНЫЙ ЭКРАН"}</span>
        </button>
      </header>

      <section className={styles.hero}>
        <aside className={styles.info}>
          <div className={styles.eyebrow}>AUTO SALE UMAR · SHOWROOM</div>
          <div className={styles.identity}>
            <span>{car.brand.toLocaleUpperCase("ru-RU")}</span>
            <h1>{car.model.toLocaleUpperCase("ru-RU")}</h1>
            <p>{[car.year, car.trim].filter(Boolean).join(" · ")}</p>
          </div>

          <div className={styles.status} data-status={car.status}>
            <i aria-hidden="true" />
            {STATUS_LABELS[car.status]}
          </div>

          <div className={styles.price}>{formatPrice(car)}</div>
          <p className={styles.description}>{description}</p>

          <div className={styles.quickFacts}>
            <div><span>ДВИГАТЕЛЬ</span><strong>{engine}</strong></div>
            <div><span>ПРИВОД</span><strong>{drive}</strong></div>
            <div><span>ПРОБЕГ</span><strong>{new Intl.NumberFormat("ru-RU").format(car.mileageKm || 0)} КМ</strong></div>
            <div><span>РЫНОК</span><strong>{country}</strong></div>
          </div>
        </aside>

        <section className={styles.visualCard}>
          <div className={styles.photoStage}>
            <img
              key={activePhoto}
              className={styles.photo}
              src={activePhoto}
              alt={`${car.brand} ${car.model}`}
              loading="eager"
              decoding="async"
              onError={(event: SyntheticEvent<HTMLImageElement>) => {
                if (!event.currentTarget.src.endsWith("/intro-poster.jpg")) event.currentTarget.src = "/intro-poster.jpg";
              }}
            />
            <div className={styles.photoFade} aria-hidden="true" />
            {photos.length > 1 ? (
              <div className={styles.dots} aria-label={`Фото ${photoIndex + 1} из ${photos.length}`}>
                {photos.slice(0, 8).map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    className={index === photoIndex ? styles.dotActive : undefined}
                    onClick={() => setPhotoIndex(index)}
                    aria-label={`Показать фото ${index + 1}`}
                  />
                ))}
              </div>
            ) : null}

            <div className={styles.phoneQr}>
              <div className={styles.qrImage}><img src={qrUrl(car.slug)} alt="QR автомобиля" /></div>
              <div><strong>ОТКРЫТЬ НА ТЕЛЕФОНЕ</strong><span>Наведите камеру телефона</span></div>
            </div>
          </div>

          <div className={styles.metrics}>
            <Metric value={displayValue(car.horsepowerHp, " л.с.")} label="Мощность" />
            <Metric value={displayValue(car.torqueNm, " Н·м")} label="Крутящий момент" />
            <Metric value={displayValue(car.acceleration0100, " с")} label="0–100 км/ч" />
            <Metric value={displayValue(car.topSpeedKmh, " км/ч")} label="Макс. скорость" />
          </div>
        </section>
      </section>

      <footer className={styles.footer}>
        <span>{car.exteriorColor || "AUTO SALE UMAR"}</span>
        <i aria-hidden="true" />
        <span>{car.interiorColor || car.fuelType || "PREMIUM COLLECTION"}</span>
        <span className={styles.footerRight}>DISPLAY CAR PROFILE</span>
      </footer>
    </main>
  );
}
