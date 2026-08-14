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
  arrivalDate?: string | null;
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

function qrUrl(slug: string): string {
  const target = `https://autosaleumar.com/car/?slug=${encodeURIComponent(slug)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=0&format=png&data=${encodeURIComponent(target)}`;
}

function displayValue(value: string | number | null | undefined, suffix = ""): string {
  if (value == null || value === "") return "—";
  return `${value}${suffix}`;
}

function uniquePhotos(items: Photo[]): Photo[] {
  const seen = new Set<string>();
  return items.filter((photo) => {
    if (!photo.url || seen.has(photo.url)) return false;
    seen.add(photo.url);
    return true;
  });
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
  const [brandCovers, setBrandCovers] = useState<BrandCoverItem[]>([]);
  const [brandCoverIndex, setBrandCoverIndex] = useState(0);

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

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!car?.brand) return;
    let cancelled = false;
    fetch(`/api/brand-media?brand=${encodeURIComponent(car.brand)}`, { cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as BrandMediaResponse | null;
        if (!response.ok || !body?.success || !Array.isArray(body.images)) return [] as BrandCoverItem[];
        return body.images.slice(0, 3);
      })
      .then((images) => { if (!cancelled) setBrandCovers(images); })
      .catch(() => { if (!cancelled) setBrandCovers([]); });
    return () => { cancelled = true; };
  }, [car?.brand]);

  const exteriorPhotos = useMemo(() => {
    if (!car) return [] as Photo[];
    const variant = car.variants?.[0];
    const photos = uniquePhotos(variant?.photos ?? []);
    if (photos.length) return photos;
    return car.coverUrl ? [{ id: -1, url: car.coverUrl, isCover: true, sortOrder: 0 }] : [];
  }, [car]);

  const interiorPhotos = useMemo(() => {
    if (!car) return [] as Photo[];
    return uniquePhotos(car.variants?.[0]?.interiorPhotos ?? []);
  }, [car]);

  const gallery = useMemo(() => uniquePhotos([...exteriorPhotos, ...interiorPhotos]), [exteriorPhotos, interiorPhotos]);

  useEffect(() => {
    if (exteriorPhotos.length < 2) return;
    const timer = window.setInterval(() => setPhotoIndex((current) => (current + 1) % exteriorPhotos.length), 7_500);
    return () => window.clearInterval(timer);
  }, [exteriorPhotos.length]);

  useEffect(() => {
    if (brandCovers.length < 2) return;
    const timer = window.setInterval(() => setBrandCoverIndex((current) => (current + 1) % brandCovers.length), 5_600);
    return () => window.clearInterval(timer);
  }, [brandCovers.length]);

  useEffect(() => {
    for (const photo of [...gallery, ...brandCovers.map((cover, index) => ({ id: index, url: cover.url, isCover: false, sortOrder: index }))]) {
      const image = new window.Image();
      image.decoding = "async";
      image.src = photo.url;
      if (typeof image.decode === "function") void image.decode().catch(() => undefined);
    }
  }, [gallery, brandCovers]);

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
        <div className={styles.centerState}>
          <img src="/brand/asu-wordmark-white.png" alt="Auto Sale Umar" />
          <span>{error || "ЗАГРУЖАЕМ АВТОМОБИЛЬ"}</span>
          {error ? <a href="/display/">ВЕРНУТЬСЯ К КОЛЛЕКЦИИ</a> : null}
        </div>
      </main>
    );
  }

  const activePhoto = exteriorPhotos[Math.min(photoIndex, Math.max(exteriorPhotos.length - 1, 0))]?.url ?? "/intro-poster.jpg";
  const brandCover = brandCovers[Math.min(brandCoverIndex, Math.max(brandCovers.length - 1, 0))]?.url ?? null;
  const country = car.countryCode ? COUNTRY_LABELS[car.countryCode] ?? car.countryCode : "—";
  const description = car.descriptionRu?.trim() || car.shortDescriptionRu?.trim() || "Автомобиль из коллекции Auto Sale Umar.";
  const shortDescription = car.shortDescriptionRu?.trim() || description;
  const engine = car.engineText || (car.engineDisplacementL ? `${car.engineDisplacementL} л` : "—");
  const drive = car.driveType?.toUpperCase() || "—";
  const variant = car.variants?.[0] ?? null;
  const exteriorColor = variant?.exteriorColorName || car.exteriorColor || "—";
  const interiorColor = variant?.interiorColorName || car.interiorColor || "—";

  const specificationRows = [
    ["Двигатель", engine],
    ["Объём двигателя", displayValue(car.engineDisplacementL, " л")],
    ["Топливо", car.fuelType || "—"],
    ["Привод", drive],
    ["Коробка", car.transmission || "—"],
    ["Мест", displayValue(car.seats)],
    ["Пробег", `${new Intl.NumberFormat("ru-RU").format(car.mileageKm || 0)} км`],
    ["Рынок поставки", country],
    ["Расход", displayValue(car.fuelConsumptionL100, " л/100 км")],
    ["Запас хода", displayValue(car.electricRangeKm, " км")],
    ["Цвет кузова", exteriorColor],
    ["Цвет салона", interiorColor],
  ];

  return (
    <main ref={rootRef} className={styles.root}>
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

      <section className={styles.heroSection}>
        <div className={styles.heroMarble} aria-hidden="true" />
        <aside className={styles.heroCopy}>
          <p className={styles.kicker}>AUTO SALE UMAR · SELECTED</p>
          <div className={styles.identity}>
            <span>{car.brand.toLocaleUpperCase("ru-RU")}</span>
            <h1>{car.model.toLocaleUpperCase("ru-RU")}</h1>
            <p>{[car.year, car.trim].filter(Boolean).join(" · ")}</p>
          </div>
          <div className={styles.heroMetaRow}>
            <span className={styles.status} data-status={car.status}><i aria-hidden="true" />{STATUS_LABELS[car.status]}</span>
            <strong className={styles.price}>{formatPrice(car)}</strong>
          </div>
          <p className={styles.heroDescription}>{shortDescription}</p>
          <div className={styles.heroFacts}>
            <div><span>ДВИГАТЕЛЬ</span><strong>{engine}</strong></div>
            <div><span>ПРИВОД</span><strong>{drive}</strong></div>
            <div><span>ПРОБЕГ</span><strong>{new Intl.NumberFormat("ru-RU").format(car.mileageKm || 0)} КМ</strong></div>
            <div><span>РЫНОК</span><strong>{country}</strong></div>
          </div>
        </aside>

        <div className={styles.heroVisual}>
          <img
            key={activePhoto}
            src={activePhoto}
            alt={`${car.brand} ${car.model}`}
            loading="eager"
            decoding="async"
            onError={(event: SyntheticEvent<HTMLImageElement>) => {
              if (!event.currentTarget.src.endsWith("/intro-poster.jpg")) event.currentTarget.src = "/intro-poster.jpg";
            }}
          />
          {exteriorPhotos.length > 1 ? (
            <div className={styles.photoDots} aria-label={`Фото ${photoIndex + 1} из ${exteriorPhotos.length}`}>
              {exteriorPhotos.slice(0, 8).map((photo, index) => (
                <button key={photo.id} type="button" data-active={index === photoIndex} onClick={() => setPhotoIndex(index)} aria-label={`Показать фото ${index + 1}`} />
              ))}
            </div>
          ) : null}
          <div className={styles.phoneQr}>
            <div className={styles.qrImage}><img src={qrUrl(car.slug)} alt="QR автомобиля" /></div>
            <div><strong>ОТКРЫТЬ НА ТЕЛЕФОНЕ</strong><span>Наведите камеру телефона</span></div>
          </div>
        </div>
      </section>

      <section className={styles.metricStrip}>
        <Metric value={displayValue(car.horsepowerHp, " л.с.")} label="Мощность" />
        <Metric value={displayValue(car.torqueNm, " Н·м")} label="Крутящий момент" />
        <Metric value={displayValue(car.acceleration0100, " с")} label="0–100 км/ч" />
        <Metric value={displayValue(car.topSpeedKmh, " км/ч")} label="Макс. скорость" />
      </section>

      <section className={styles.brandScene}>
        {brandCover ? <img key={brandCover} className={styles.brandSceneImage} src={brandCover} alt="" /> : <div className={styles.brandSceneFallback} aria-hidden="true" />}
        <div className={styles.brandSceneShade} aria-hidden="true" />
        <div className={styles.brandSceneCopy}>
          <p className={styles.kicker}>ХАРАКТЕР В ДЕТАЛЯХ</p>
          <h2>Автомобиль,<br />который раскрывается ближе.</h2>
          <p>{description}</p>
        </div>
        <div className={styles.brandSceneName}>{car.brand}</div>
      </section>

      <section className={styles.editorialSection}>
        <div className={styles.editorialCopy}>
          <p className={styles.kickerDark}>ЭКСТЕРЬЕР</p>
          <h2>Пропорции,<br />которые читаются сразу.</h2>
          <p>{exteriorColor !== "—" ? `Выбранный цвет — ${exteriorColor}. ` : ""}Каждая линия автомобиля показана крупно, без мобильного масштаба и без лишних рамок.</p>
        </div>
        <div className={styles.editorialPhoto}>
          <img src={exteriorPhotos[1]?.url ?? activePhoto} alt={`${car.brand} ${car.model}`} />
        </div>
      </section>

      <section className={styles.performanceSection}>
        <div className={styles.performanceHeading}>
          <p className={styles.kicker}>ДИНАМИКА</p>
          <h2>Уверенность<br />в каждом движении.</h2>
        </div>
        <div className={styles.performanceBig}>{car.horsepowerHp ?? car.torqueNm ?? car.topSpeedKmh ?? "—"}</div>
        <div className={styles.performanceGrid}>
          <Metric value={displayValue(car.horsepowerHp, " л.с.")} label="Мощность" />
          <Metric value={displayValue(car.torqueNm, " Н·м")} label="Крутящий момент" />
          <Metric value={displayValue(car.acceleration0100, " с")} label="0–100 км/ч" />
          <Metric value={displayValue(car.topSpeedKmh, " км/ч")} label="Макс. скорость" />
        </div>
      </section>

      {interiorPhotos.length ? (
        <section className={styles.interiorSection}>
          <div className={styles.interiorCopy}>
            <p className={styles.kickerDark}>ИНТЕРЬЕР</p>
            <h2>Тишина становится<br />частью автомобиля.</h2>
            <div className={styles.colorSummary}>
              <div><i style={{ backgroundColor: variant?.exteriorSwatch || "#151515" }} /><span><small>Цвет кузова</small><b>{exteriorColor}</b></span></div>
              <div><i style={{ backgroundColor: variant?.interiorSwatch || "#151515" }} /><span><small>Цвет салона</small><b>{interiorColor}</b></span></div>
            </div>
          </div>
          <div className={styles.interiorPhoto}><img src={interiorPhotos[0].url} alt={`${car.brand} ${car.model} интерьер`} /></div>
        </section>
      ) : null}

      {gallery.length > 1 ? (
        <section className={styles.gallerySection}>
          <div className={styles.galleryHeading}>
            <p className={styles.kicker}>ГАЛЕРЕЯ</p>
            <h2>Посмотрите автомобиль<br />со всех сторон.</h2>
          </div>
          <div className={styles.galleryRail}>
            {gallery.map((photo, index) => <div className={styles.galleryCard} key={`${photo.id}-${index}`}><img src={photo.url} alt={`${car.brand} ${car.model}`} loading="lazy" /></div>)}
          </div>
        </section>
      ) : null}

      <section className={styles.specSection}>
        <div className={styles.specHeading}>
          <p className={styles.kickerDark}>ХАРАКТЕРИСТИКИ</p>
          <h2>Всё важное —<br />в одном месте.</h2>
        </div>
        <div className={styles.specGrid}>
          {specificationRows.map(([label, value]) => (
            <div key={label}><span>{label}</span><strong>{value}</strong></div>
          ))}
        </div>
      </section>

      <section className={styles.finalSection}>
        <div className={styles.finalCopy}>
          <p className={styles.kicker}>AUTO SALE UMAR · SHOWROOM</p>
          <h2>{car.brand}<br />{car.model}</h2>
          <strong>{formatPrice(car)}</strong>
          <p>Откройте эту же страницу на телефоне или вернитесь к коллекции на телевизоре.</p>
          <a href="/display/">ВЕРНУТЬСЯ К КОЛЛЕКЦИИ</a>
        </div>
        <div className={styles.finalQr}>
          <img src={qrUrl(car.slug)} alt="QR автомобиля" />
          <strong>ОТКРЫТЬ НА ТЕЛЕФОНЕ</strong>
          <span>autosaleumar.com</span>
        </div>
      </section>

      <footer className={styles.footer}>
        <img src="/brand/asu-wordmark-white.png" alt="Auto Sale Umar" />
        <span>DISPLAY CAR PROFILE · SELECTED WITH PRECISION</span>
      </footer>
    </main>
  );
}
