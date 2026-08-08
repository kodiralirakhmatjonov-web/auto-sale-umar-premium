"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./cars.module.css";

type Theme = "light" | "dark";
type StatusFilter = "all" | "in_stock" | "in_transit" | "reserved" | "sold";
type CountryFilter = "all" | "KR" | "US" | "CA" | "AE";

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "in_stock", label: "В наличии" },
  { value: "in_transit", label: "В пути" },
  { value: "reserved", label: "Резерв" },
  { value: "sold", label: "Проданы" },
];

const COUNTRY_FILTERS: Array<{ value: CountryFilter; label: string }> = [
  { value: "all", label: "Все страны" },
  { value: "KR", label: "Корея" },
  { value: "US", label: "США" },
  { value: "CA", label: "Канада" },
  { value: "AE", label: "ОАЭ" },
];

export default function CarsPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [country, setCountry] = useState<CountryFilter>("all");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addNoticeOpen, setAddNoticeOpen] = useState(false);

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
    let cancelled = false;

    async function verifySession() {
      try {
        const response = await fetch("/api/staff", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (response.status === 401) {
          window.location.replace("/admin/login/");
          return;
        }

        if (!response.ok) {
          throw new Error("Не удалось проверить защищённую сессию.");
        }

        if (!cancelled) {
          setAuthReady(true);
          setAuthError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setAuthError(
            error instanceof Error
              ? error.message
              : "Не удалось проверить защищённую сессию.",
          );
        }
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!filtersOpen && !addNoticeOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setFiltersOpen(false);
      setAddNoticeOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [addNoticeOpen, filtersOpen]);

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
          <h1>Нет соединения с Control System</h1>
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
          <a className={styles.roundButton} href="/admin/staff/" aria-label="Назад к команде">
            <ArrowLeftIcon />
          </a>

          <a className={styles.wordmarkWrap} href="/admin/cars/" aria-label="Auto Sale Umar">
            <img
              className={`${styles.wordmark} ${styles.wordmarkLight}`}
              src="/brand/asu-wordmark-black.png"
              alt="Auto Sale Umar"
            />
            <img
              className={`${styles.wordmark} ${styles.wordmarkDark}`}
              src="/brand/asu-wordmark-white.png"
              alt=""
              aria-hidden="true"
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

          <button
            className={styles.primaryCta}
            type="button"
            onClick={() => setAddNoticeOpen(true)}
          >
            <span className={styles.ctaIcon}>
              <PlusIcon />
            </span>
            <span>Добавить автомобиль</span>
          </button>
        </section>

        <section className={styles.catalog} aria-label="Каталог автомобилей">
          <div className={styles.catalogTop}>
            <div>
              <p className={styles.sectionKicker}>БАЗА АВТОМОБИЛЕЙ</p>
              <h2>Каталог</h2>
            </div>

            <span className={styles.catalogCount}>
              {authReady ? "0 автомобилей" : "Проверка доступа…"}
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

          <div className={styles.emptyState}>
            <div className={styles.carSymbol} aria-hidden="true">
              <CarOutlineIcon />
            </div>
            <p className={styles.emptyEyebrow}>БАЗА ГОТОВА К НАПОЛНЕНИЮ</p>
            <h3>Здесь появятся автомобили</h3>
            <p>
              Мы не добавляем демонстрационные машины. После подключения формы
              и D1 здесь будут только реальные автомобили Auto Sale Umar.
            </p>

            <div className={styles.emptyMeta}>
              <span>
                <i />
                В наличии
              </span>
              <span>В пути</span>
              <span>Резерв</span>
              <span>Проданы</span>
            </div>
          </div>
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

      {addNoticeOpen ? (
        <div className={styles.modalLayer} role="presentation">
          <button
            className={styles.scrim}
            type="button"
            onClick={() => setAddNoticeOpen(false)}
            aria-label="Закрыть"
          />

          <section
            className={`${styles.sheet} ${styles.compactSheet}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-car-title"
          >
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <div>
                <p className={styles.sheetEyebrow}>СЛЕДУЮЩИЙ ЭТАП</p>
                <h2 id="add-car-title">Новый автомобиль</h2>
              </div>

              <button
                className={styles.sheetClose}
                type="button"
                onClick={() => setAddNoticeOpen(false)}
                aria-label="Закрыть"
              >
                <CloseIcon />
              </button>
            </div>

            <p className={styles.noticeText}>
              Каталог готов. Следующим файлом подключим полноценную форму
              добавления автомобиля без изменения текущей авторизации.
            </p>

            <button
              className={styles.primaryAction}
              type="button"
              onClick={() => setAddNoticeOpen(false)}
            >
              Понятно
            </button>
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
