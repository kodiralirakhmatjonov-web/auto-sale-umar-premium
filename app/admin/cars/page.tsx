"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./cars.module.css";

type Theme = "light" | "dark";
type CarStatus =
  | "in_stock"
  | "in_showroom"
  | "in_transit"
  | "made_to_order"
  | "reserved"
  | "sold"
  | "hidden";
type StatusFilter = "all" | CarStatus;
type CountryFilter = "all" | "KR" | "US" | "CA" | "AE";

interface CarRecord {
  id: number;
  slug: string;
  brand: string;
  model: string;
  year: number | null;
  trim: string | null;
  vin: string | null;
  stockNumber: string | null;
  status: CarStatus;
  countryCode: string | null;
  arrivalDate: string | null;
  price: number | null;
  currency: "USD" | "UZS" | "EUR";
  priceOnRequest: boolean;
  mileageKm: number;
  engineText: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  isPublic: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  updatedAt: string;
  coverUrl: string | null;
}

interface CarsApiResponse {
  success?: boolean;
  error?: string;
  total?: number;
  cars?: CarRecord[];
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "in_stock", label: "В наличии" },
  { value: "in_showroom", label: "В шоуруме" },
  { value: "in_transit", label: "В пути" },
  { value: "made_to_order", label: "Под заказ" },
  { value: "reserved", label: "Резерв" },
  { value: "sold", label: "Проданы" },
  { value: "hidden", label: "Скрытые" },
];

const COUNTRY_FILTERS: Array<{ value: CountryFilter; label: string }> = [
  { value: "all", label: "Все страны" },
  { value: "KR", label: "Корея" },
  { value: "US", label: "США" },
  { value: "CA", label: "Канада" },
  { value: "AE", label: "ОАЭ" },
];

const STATUS_LABELS: Record<CarStatus, string> = {
  in_stock: "В наличии",
  in_showroom: "В шоуруме",
  in_transit: "В пути",
  made_to_order: "Под заказ",
  reserved: "Резерв",
  sold: "Продан",
  hidden: "Скрыт",
};

const COUNTRY_LABELS: Record<string, string> = {
  KR: "Корея",
  US: "США",
  CA: "Канада",
  AE: "ОАЭ",
};

function formatPrice(car: CarRecord): string {
  if (car.priceOnRequest || car.price == null) return "Цена по запросу";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: car.currency,
    maximumFractionDigits: 0,
  }).format(car.price);
}

function formatCarCount(value: number): string {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return `${value} автомобиль`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${value} автомобиля`;
  }
  return `${value} автомобилей`;
}

export default function CarsPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [country, setCountry] = useState<CountryFilter>("all");
  const [cars, setCars] = useState<CarRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [createdCarId, setCreatedCarId] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (status !== "all") count += 1;
    if (country !== "all") count += 1;
    return count;
  }, [country, status]);

  const applyTheme = useCallback((nextTheme: Theme) => {
    setTheme(nextTheme);

    try {
      window.localStorage.setItem("asu-theme", nextTheme);
    } catch {
      // Theme persistence is optional.
    }

    const themeColor = nextTheme === "light" ? "#f5f5f3" : "#0b0c0d";

    document.documentElement.dataset.asuTheme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    document.documentElement.style.backgroundColor = themeColor;

    document.body.dataset.asuTheme = nextTheme;
    document.body.style.backgroundColor = themeColor;

    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = themeColor;
  }, []);

  useEffect(() => {
    try {
      const rootTheme = document.documentElement.dataset.asuTheme;
      if (rootTheme === "light" || rootTheme === "dark") {
        applyTheme(rootTheme);
        return;
      }

      const storedTheme = window.localStorage.getItem("asu-theme");
      if (storedTheme === "light" || storedTheme === "dark") {
        applyTheme(storedTheme);
        return;
      }

      applyTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      );
    } catch {
      applyTheme("light");
    }
  }, [applyTheme]);

  useEffect(() => {
    const created = new URLSearchParams(window.location.search).get("created");
    const parsed = created ? Number(created) : Number.NaN;
    if (Number.isSafeInteger(parsed) && parsed > 0) setCreatedCarId(parsed);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const delay = window.setTimeout(async () => {
      setLoading(true);
      setLoadError(null);

      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (status !== "all") params.set("status", status);
      if (country !== "all") params.set("country", country);
      const endpoint = `/api/v1/cars${params.size ? `?${params.toString()}` : ""}`;

      try {
        const response = await fetch(endpoint, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const data = (await response.json().catch(() => null)) as CarsApiResponse | null;

        if (response.status === 401) {
          window.location.replace("/admin/login/");
          return;
        }

        if (response.status === 403) {
          setAuthError(data?.error || "У вашей роли нет доступа к автомобилям.");
          return;
        }

        if (!response.ok || !data?.success || !Array.isArray(data.cars)) {
          throw new Error(data?.error || "Не удалось загрузить автомобили из D1.");
        }

        setCars(data.cars);
        setTotal(typeof data.total === "number" ? data.total : data.cars.length);
        setAuthReady(true);
        setAuthError(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setAuthReady(true);
        setLoadError(
          error instanceof Error ? error.message : "Не удалось загрузить автомобили из D1.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query.trim() ? 280 : 0);

    return () => {
      window.clearTimeout(delay);
      controller.abort();
    };
  }, [country, query, reloadToken, status]);

  useEffect(() => {
    if (!filtersOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setFiltersOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [filtersOpen]);

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const transitionDocument = document as ViewTransitionDocument;

    if (!reducedMotion && transitionDocument.startViewTransition) {
      transitionDocument.startViewTransition(() => {
        applyTheme(nextTheme);
      });
      return;
    }

    applyTheme(nextTheme);
  }

  function resetFilters() {
    setStatus("all");
    setCountry("all");
  }

  if (authError) {
    return (
      <main className={styles.accessState} data-theme={theme}>
        <div className={styles.accessCard}>
          <span className={styles.accessIcon}>
            <ShieldIcon />
          </span>
          <p className={styles.accessEyebrow}>AUTO SALE UMAR</p>
          <h1>Раздел автомобилей недоступен</h1>
          <p>{authError}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Повторить
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page} data-theme={theme}>
      <div className={styles.ambient} aria-hidden="true">
        <span className={styles.ambientOne} />
        <span className={styles.ambientTwo} />
      </div>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a className={styles.roundButton} href="/" aria-label="Вернуться на сайт">
            <ArrowLeftIcon />
          </a>

          <a className={styles.wordmarkWrap} href="/admin/cars/" aria-label="Auto Sale Umar">
            <img
              className={styles.wordmark}
              src="/brand/asu-wordmark-black.png"
              alt="Auto Sale Umar"
            />
          </a>

          <button
            className={styles.roundButton}
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
          >
            <span className={styles.iconStage}>
              <span className={styles.moonIcon}>
                <MoonIcon />
              </span>
              <span className={styles.sunIcon}>
                <SunIcon />
              </span>
            </span>
          </button>
        </div>
      </header>

      <nav className={styles.sectionNav} aria-label="Разделы Control System">
        <a className={styles.sectionNavItem} href="/admin/staff/">
          Команда
        </a>
        <a
          className={`${styles.sectionNavItem} ${styles.sectionNavItemActive}`}
          href="/admin/cars/"
          aria-current="page"
        >
          Автомобили
        </a>
      </nav>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>AUTO SALE UMAR / CONTROL SYSTEM</p>
            <h1>Автомобили</h1>
            <p className={styles.lead}>
              Единая база автомобилей Auto Sale Umar — в наличии, в пути,
              зарезервированные и проданные.
            </p>
          </div>

          <a
            className={styles.primaryCta}
            href="/admin/cars/new/"
          >
            <span className={styles.ctaIcon}>
              <PlusIcon />
            </span>
            <span>Добавить автомобиль</span>
          </a>
        </section>

        {createdCarId ? (
          <div className={styles.successBanner} role="status">
            <span className={styles.successMark}>
              <CheckIcon />
            </span>
            <span>
              Автомобиль сохранён в D1. Запись №{createdCarId} уже находится в общем каталоге.
            </span>
            <button type="button" onClick={() => setCreatedCarId(null)} aria-label="Закрыть">
              <CloseSmallIcon />
            </button>
          </div>
        ) : null}

        <section
          className={styles.catalog}
          aria-label="Каталог автомобилей"
          aria-busy={loading}
        >
          <div className={styles.catalogTop}>
            <div>
              <p className={styles.sectionKicker}>БАЗА АВТОМОБИЛЕЙ</p>
              <h2>Каталог</h2>
            </div>

            <span className={styles.catalogCount}>
              {authReady ? formatCarCount(total) : "Проверка доступа…"}
            </span>
          </div>

          <div className={styles.toolbar}>
            <label className={styles.search}>
              <SearchIcon />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Марка, модель, VIN"
                autoComplete="off"
                spellCheck={false}
                aria-label="Поиск автомобилей"
              />
              {query ? (
                <button
                  className={styles.clearSearch}
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Очистить поиск"
                >
                  <CloseSmallIcon />
                </button>
              ) : null}
            </label>

            <button
              className={styles.filterButton}
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Открыть фильтры"
            >
              <FilterIcon />
              <span>Фильтры</span>
              {activeFilterCount > 0 ? (
                <b className={styles.filterCount}>{activeFilterCount}</b>
              ) : null}
            </button>
          </div>

          <div className={styles.statusScroller} aria-label="Статус автомобиля">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`${styles.statusChip} ${
                  status === item.value ? styles.statusChipActive : ""
                }`}
                onClick={() => setStatus(item.value)}
                aria-pressed={status === item.value}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={styles.divider} />

          {loadError ? (
            <div className={styles.loadError} role="alert">
              <span>{loadError}</span>
              <button type="button" onClick={() => setReloadToken((value) => value + 1)}>
                Повторить
              </button>
            </div>
          ) : null}

          {loading && cars.length === 0 ? (
            <div className={styles.skeletonGrid} aria-label="Загрузка автомобилей">
              {[0, 1, 2].map((item) => (
                <div className={styles.skeletonCard} key={item} aria-hidden="true">
                  <span />
                  <i />
                  <i />
                </div>
              ))}
            </div>
          ) : null}

          {cars.length > 0 ? (
            <div className={styles.carsGrid}>
              {cars.map((car) => (
                <article
                  className={`${styles.carCard} ${
                    car.id === createdCarId ? styles.carCardCreated : ""
                  }`}
                  key={car.id}
                >
                  <div className={styles.carMedia}>
                    {car.coverUrl ? (
                      <img
                        src={car.coverUrl}
                        alt={`${car.brand} ${car.model}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.carMediaFallback} aria-hidden="true">
                        <CarOutlineIcon />
                      </div>
                    )}

                    <span className={styles.statusBadge} data-status={car.status}>
                      {STATUS_LABELS[car.status]}
                    </span>

                    <span className={styles.publishBadge} data-published={car.isPublic}>
                      {car.isPublic ? "Опубликован" : "Черновик"}
                    </span>
                  </div>

                  <div className={styles.carContent}>
                    <div className={styles.carTitleRow}>
                      <div>
                        <p className={styles.carBrand}>{car.brand}</p>
                        <h3>{car.model}</h3>
                      </div>
                      {car.year ? <span className={styles.carYear}>{car.year}</span> : null}
                    </div>

                    {car.trim ? <p className={styles.carTrim}>{car.trim}</p> : null}

                    <div className={styles.carFacts}>
                      {car.countryCode ? (
                        <span>{COUNTRY_LABELS[car.countryCode] ?? car.countryCode}</span>
                      ) : null}
                      {car.engineText ? <span>{car.engineText}</span> : null}
                      {car.exteriorColor ? <span>{car.exteriorColor}</span> : null}
                    </div>

                    <div className={styles.carFooter}>
                      <div>
                        <span className={styles.priceLabel}>Цена</span>
                        <strong>{formatPrice(car)}</strong>
                      </div>
                      <div className={styles.stockMeta}>
                        <span>{car.stockNumber || `ID ${car.id}`}</span>
                        {car.vin ? <span>VIN · {car.vin.slice(-6)}</span> : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {!loading && !loadError && cars.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.carSymbol} aria-hidden="true">
                <CarOutlineIcon />
              </div>
              <p className={styles.emptyEyebrow}>
                {query || activeFilterCount > 0 ? "НИЧЕГО НЕ НАЙДЕНО" : "БАЗА ГОТОВА К НАПОЛНЕНИЮ"}
              </p>
              <h3>
                {query || activeFilterCount > 0
                  ? "Измените поиск или фильтры"
                  : "Добавьте первый автомобиль"}
              </h3>
              <p>
                {query || activeFilterCount > 0
                  ? "В D1 нет автомобилей, соответствующих выбранным условиям."
                  : "После сохранения здесь появятся только реальные автомобили AutoSale Umar."}
              </p>

              {query || activeFilterCount > 0 ? (
                <button
                  className={styles.emptyReset}
                  type="button"
                  onClick={() => {
                    setQuery("");
                    resetFilters();
                  }}
                >
                  Сбросить поиск
                </button>
              ) : (
                <a className={styles.emptyReset} href="/admin/cars/new/">
                  Добавить автомобиль
                </a>
              )}
            </div>
          ) : null}
        </section>
      </div>

      {filtersOpen ? (
        <div className={styles.modalLayer} role="presentation">
          <button
            className={styles.scrim}
            type="button"
            onClick={() => setFiltersOpen(false)}
            aria-label="Закрыть фильтры"
          />

          <section
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cars-filter-title"
          >
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <div>
                <p className={styles.sheetEyebrow}>КАТАЛОГ</p>
                <h2 id="cars-filter-title">Фильтры</h2>
              </div>

              <button
                className={styles.sheetClose}
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Закрыть"
              >
                <CloseIcon />
              </button>
            </div>

            <div className={styles.filterGroup}>
              <p>Статус</p>
              <div className={styles.optionGrid}>
                {STATUS_FILTERS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`${styles.optionButton} ${
                      status === item.value ? styles.optionButtonActive : ""
                    }`}
                    onClick={() => setStatus(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <p>Страна</p>
              <div className={styles.optionGrid}>
                {COUNTRY_FILTERS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`${styles.optionButton} ${
                      country === item.value ? styles.optionButtonActive : ""
                    }`}
                    onClick={() => setCountry(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.sheetActions}>
              <button className={styles.secondaryAction} type="button" onClick={resetFilters}>
                Сбросить
              </button>
              <button
                className={styles.primaryAction}
                type="button"
                onClick={() => setFiltersOpen(false)}
              >
                Готово
              </button>
            </div>
          </section>
        </div>
      ) : null}

    </main>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.8 5.2 8 12l6.8 6.8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.6 8.6 0 1 0 20.2 15.2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="m15.6 15.6 4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h3M11 17h9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseSmallIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m6.5 6.5 7 7M13.5 6.5l-7 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="m4.5 10.2 3.4 3.4 7.6-7.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CarOutlineIcon() {
  return (
    <svg viewBox="0 0 120 62" aria-hidden="true">
      <path
        d="M16 40.5 23.5 24c1.5-3.3 4.7-5.5 8.4-5.7l42.6-2.1c4.1-.2 8 1.6 10.5 4.9l12.5 16.6 8.6 3.7c2.3 1 3.9 3.3 3.9 5.8v3.3H10v-3.7c0-2.7 1.7-5.2 4.3-6.1l1.7-.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      <path d="M29 25h50l11 14H22l7-14Z" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
      <circle cx="30" cy="49.5" r="8" fill="none" stroke="currentColor" strokeWidth="2.3" />
      <circle cx="91" cy="49.5" r="8" fill="none" stroke="currentColor" strokeWidth="2.3" />
      <path d="M48 25v14M78 25v14" fill="none" stroke="currentColor" strokeWidth="2.3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 19 6v5.4c0 4.4-2.7 7.9-7 9.1-4.3-1.2-7-4.7-7-9.1V6l7-2.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
