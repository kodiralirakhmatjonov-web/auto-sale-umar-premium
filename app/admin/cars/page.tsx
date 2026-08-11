"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./cars.module.css";
import AdminChrome from "../_components/AdminChrome";

type Theme = "light" | "dark";
type Language = "ru" | "uz";
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

interface CarCardPhoto {
  id: number;
  url: string;
  isCover: boolean;
  sortOrder: number;
}

interface CarCardVariant {
  id: number;
  exteriorColorName: string | null;
  exteriorSwatch: string;
  interiorColorName: string | null;
  interiorSwatch: string;
  vin: string | null;
  stockNumber: string | null;
  quantity: number;
  exteriorPhotos: CarCardPhoto[];
}

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
  variants: CarCardVariant[];
}

interface CarsApiResponse {
  success?: boolean;
  error?: string;
  total?: number;
  cars?: CarRecord[];
  viewer?: { id?: number; role?: "super_admin" | "admin" | "sales_manager" };
}

interface QuickPatchResponse {
  success?: boolean;
  error?: string;
  car?: Partial<CarRecord> & { id: number };
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "in_stock",
  "in_showroom",
  "in_transit",
  "made_to_order",
  "reserved",
  "sold",
  "hidden",
];

const COUNTRY_FILTERS: CountryFilter[] = ["all", "KR", "US", "CA", "AE"];

const STATUS_FILTER_LABELS: Record<Language, Record<StatusFilter, string>> = {
  ru: {
    all: "Все",
    in_stock: "В наличии",
    in_showroom: "В шоуруме",
    in_transit: "В пути",
    made_to_order: "Под заказ",
    reserved: "Резерв",
    sold: "Проданы",
    hidden: "Скрытые",
  },
  uz: {
    all: "Barchasi",
    in_stock: "Mavjud",
    in_showroom: "Shourumda",
    in_transit: "Yo‘lda",
    made_to_order: "Buyurtma asosida",
    reserved: "Band qilingan",
    sold: "Sotilgan",
    hidden: "Yashirilgan",
  },
};

const COUNTRY_FILTER_LABELS: Record<Language, Record<CountryFilter, string>> = {
  ru: { all: "Все страны", KR: "Корея", US: "США", CA: "Канада", AE: "ОАЭ" },
  uz: { all: "Barcha davlatlar", KR: "Koreya", US: "AQSh", CA: "Kanada", AE: "BAA" },
};

const STATUS_LABELS: Record<Language, Record<CarStatus, string>> = {
  ru: {
    in_stock: "В наличии",
    in_showroom: "В шоуруме",
    in_transit: "В пути",
    made_to_order: "Под заказ",
    reserved: "Резерв",
    sold: "Продан",
    hidden: "Скрыт",
  },
  uz: {
    in_stock: "Mavjud",
    in_showroom: "Shourumda",
    in_transit: "Yo‘lda",
    made_to_order: "Buyurtma asosida",
    reserved: "Band qilingan",
    sold: "Sotilgan",
    hidden: "Yashirilgan",
  },
};

const COUNTRY_LABELS: Record<Language, Record<string, string>> = {
  ru: { KR: "Корея", US: "США", CA: "Канада", AE: "ОАЭ" },
  uz: { KR: "Koreya", US: "AQSh", CA: "Kanada", AE: "BAA" },
};

const UZ_COPY: Record<string, string> = {
  "Раздел автомобилей недоступен": "Avtomobillar bo‘limiga kirish yopiq",
  "Повторить": "Qayta urinish",
  "Вернуться на сайт": "Saytga qaytish",
  "Открыть настройки": "Sozlamalarni ochish",
  "Закрыть настройки": "Sozlamalarni yopish",
  "Настройки": "Sozlamalar",
  "Выберите оформление и язык": "Ko‘rinish va tilni tanlang",
  "Оформление": "Ko‘rinish",
  "Светлая": "Yorug‘",
  "Тёмная": "Tungi",
  "Язык": "Til",
  "Настройки сохраняются автоматически": "Sozlamalar avtomatik saqlanadi",
  "Разделы Control System": "Control System bo‘limlari",
  "Команда": "Jamoa",
  "Автомобили": "Avtomobillar",
  "Главная": "Bosh sahifa",
  "Визиты": "Tashriflar",
  "Единая база автомобилей Auto Sale Umar — в наличии, в пути, зарезервированные и проданные.":
    "Auto Sale Umar avtomobillarining yagona bazasi — mavjud, yo‘ldagi, band qilingan va sotilgan avtomobillar.",
  "Добавить автомобиль": "Avtomobil qo‘shish",
  "Закрыть": "Yopish",
  "Каталог автомобилей": "Avtomobillar katalogi",
  "БАЗА АВТОМОБИЛЕЙ": "AVTOMOBILLAR BAZASI",
  "Каталог": "Katalog",
  "Проверка доступа…": "Kirish tekshirilmoqda…",
  "Марка, модель, VIN": "Brend, model, VIN",
  "Поиск автомобилей": "Avtomobillarni qidirish",
  "Очистить поиск": "Qidiruvni tozalash",
  "Открыть фильтры": "Filtrlarni ochish",
  "Фильтры": "Filtrlar",
  "Статус автомобиля": "Avtomobil holati",
  "Загрузка автомобилей": "Avtomobillar yuklanmoqda",
  "Опубликован": "E’lon qilingan",
  "Черновик": "Qoralama",
  "Цена": "Narx",
  "НИЧЕГО НЕ НАЙДЕНО": "HECH NARSA TOPILMADI",
  "БАЗА ГОТОВА К НАПОЛНЕНИЮ": "BAZA TO‘LDIRISHGA TAYYOR",
  "Измените поиск или фильтры": "Qidiruv yoki filtrlarni o‘zgartiring",
  "Добавьте первый автомобиль": "Birinchi avtomobilni qo‘shing",
  "В D1 нет автомобилей, соответствующих выбранным условиям.":
    "D1 bazasida tanlangan shartlarga mos avtomobillar yo‘q.",
  "После сохранения здесь появятся только реальные автомобили AutoSale Umar.":
    "Saqlangandan keyin bu yerda faqat Auto Sale Umar avtomobillari ko‘rinadi.",
  "Сбросить поиск": "Qidiruvni tozalash",
  "Закрыть фильтры": "Filtrlarni yopish",
  "КАТАЛОГ": "KATALOG",
  "Статус": "Holat",
  "Страна": "Davlat",
  "Сбросить": "Tozalash",
  "Готово": "Tayyor",
  "Редактировать": "Tahrirlash",
  "Статус и цена": "Holat va narx",
  "Быстро изменить статус и цену": "Holat va narxni tez o‘zgartirish",
  "Сохранить изменения": "O‘zgarishlarni saqlash",
  "Сохранение…": "Saqlanmoqda…",
  "Цена по запросу": "Narx so‘rov asosida",
  "VIN не указан": "VIN ko‘rsatilmagan",
  "Быстрый просмотр фотографий": "Suratlarni tez ko‘rish",
  "Предыдущее фото": "Oldingi surat",
  "Следующее фото": "Keyingi surat",
  "Цвет автомобиля": "Avtomobil rangi",
  "Не удалось изменить статус и цену.": "Holat va narxni o‘zgartirib bo‘lmadi.",
};

function formatPrice(car: CarRecord, language: Language): string {
  if (car.priceOnRequest || car.price == null) {
    return language === "uz" ? "Narx so‘rov asosida" : "Цена по запросу";
  }
  return new Intl.NumberFormat(language === "uz" ? "uz-UZ" : "ru-RU", {
    style: "currency",
    currency: car.currency,
    maximumFractionDigits: 0,
  }).format(car.price);
}

function formatCarCount(value: number, language: Language): string {
  if (language === "uz") return `${value} avtomobil`;

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
  const [language, setLanguage] = useState<Language>("ru");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [country, setCountry] = useState<CountryFilter>("all");
  const [cars, setCars] = useState<CarRecord[]>([]);
  const [viewerRole, setViewerRole] = useState<"super_admin" | "admin" | "sales_manager" | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [createdCarId, setCreatedCarId] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickCar, setQuickCar] = useState<CarRecord | null>(null);
  const [quickStatus, setQuickStatus] = useState<CarStatus>("in_stock");
  const [quickPrice, setQuickPrice] = useState("");
  const [quickCurrency, setQuickCurrency] = useState<"USD" | "UZS" | "EUR">("USD");
  const [quickPriceOnRequest, setQuickPriceOnRequest] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const t = useCallback(
    (russian: string) => (language === "uz" ? (UZ_COPY[russian] ?? russian) : russian),
    [language],
  );

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

  const applyLanguage = useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;

    try {
      window.localStorage.setItem("asu-language", nextLanguage);
    } catch {
      // The browser language remains the fallback.
    }
  }, []);

  useEffect(() => {
    let nextLanguage: Language = navigator.language.toLowerCase().startsWith("uz") ? "uz" : "ru";

    try {
      const stored = window.localStorage.getItem("asu-language");
      if (stored === "ru" || stored === "uz") nextLanguage = stored;
    } catch {
      // Continue with the browser language.
    }

    applyLanguage(nextLanguage);
  }, [applyLanguage]);

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
      const endpoint = `/api/cars${params.size ? `?${params.toString()}` : ""}`;

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
          setAuthError(
            document.documentElement.lang === "uz"
              ? "Sizning rolingiz avtomobillar bo‘limiga kira olmaydi."
              : (data?.error || "У вашей роли нет доступа к автомобилям."),
          );
          return;
        }

        if (!response.ok || !data?.success || !Array.isArray(data.cars)) {
          throw new Error(
            document.documentElement.lang === "uz"
              ? "D1 bazasidan avtomobillarni yuklab bo‘lmadi."
              : (data?.error || "Не удалось загрузить автомобили из D1."),
          );
        }

        setViewerRole(data.viewer?.role ?? null);
        setCars(data.cars);
        setTotal(typeof data.total === "number" ? data.total : data.cars.length);
        setAuthReady(true);
        setAuthError(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setAuthReady(true);
        setLoadError(
          error instanceof Error
            ? error.message
            : document.documentElement.lang === "uz"
              ? "D1 bazasidan avtomobillarni yuklab bo‘lmadi."
              : "Не удалось загрузить автомобили из D1.",
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
    if (!settingsOpen && !filtersOpen && !quickCar) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSettingsOpen(false);
      setFiltersOpen(false);
      setQuickCar(null);
      setQuickError(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen, filtersOpen, quickCar]);

  function changeTheme(nextTheme: Theme) {
    if (nextTheme === theme) return;

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

  function openQuickEditor(car: CarRecord) {
    setSettingsOpen(false);
    setFiltersOpen(false);
    setQuickCar(car);
    setQuickStatus(car.status);
    setQuickPrice(car.price == null ? "" : String(car.price));
    setQuickCurrency(car.currency);
    setQuickPriceOnRequest(car.priceOnRequest);
    setQuickError(null);
  }

  function closeQuickEditor() {
    if (quickSaving) return;
    setQuickCar(null);
    setQuickError(null);
  }

  async function saveQuickEditor() {
    if (!quickCar || quickSaving) return;

    if (!quickPriceOnRequest) {
      const numericPrice = Number(quickPrice);
      if (!Number.isSafeInteger(numericPrice) || numericPrice < 0) {
        setQuickError(language === "uz" ? "Narxni tekshiring." : "Проверьте цену автомобиля.");
        return;
      }
    }

    setQuickSaving(true);
    setQuickError(null);
    try {
      const response = await fetch("/api/cars", {
        method: "PATCH",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quickCar.id,
          status: quickStatus,
          price: quickPriceOnRequest ? null : quickPrice,
          currency: quickCurrency,
          priceOnRequest: quickPriceOnRequest,
        }),
      });
      const data = (await response.json().catch(() => null)) as QuickPatchResponse | null;
      if (response.status === 401) {
        window.location.replace("/admin/login/");
        return;
      }
      if (!response.ok || !data?.success || !data.car) {
        throw new Error(data?.error || t("Не удалось изменить статус и цену."));
      }

      setCars((current) => current.map((car) => car.id === quickCar.id
        ? { ...car, ...data.car, variants: car.variants }
        : car));
      setQuickCar(null);
    } catch (error) {
      setQuickError(error instanceof Error ? error.message : t("Не удалось изменить статус и цену."));
    } finally {
      setQuickSaving(false);
    }
  }

  if (authError) {
    return (
      <main className={styles.accessState} data-theme={theme}>
        <div className={styles.accessCard}>
          <span className={styles.accessIcon}>
            <ShieldIcon />
          </span>
          <p className={styles.accessEyebrow}>AUTO SALE UMAR</p>
          <h1>{t("Раздел автомобилей недоступен")}</h1>
          <p>{authError}</p>
          <button type="button" onClick={() => window.location.reload()}>
            {t("Повторить")}
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

      <AdminChrome
        current="cars"
        language={language}
        theme={theme}
        role={viewerRole}
        onLanguageChange={applyLanguage}
        onThemeChange={changeTheme}
      />

      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>AUTO SALE UMAR / CONTROL SYSTEM</p>
            <h1>{t("Автомобили")}</h1>
            <p className={styles.lead}>
              {t("Единая база автомобилей Auto Sale Umar — в наличии, в пути, зарезервированные и проданные.")}
            </p>
          </div>

          <a
            className={styles.primaryCta}
            href="/admin/cars/new/"
          >
            <span className={styles.ctaIcon}>
              <PlusIcon />
            </span>
            <span>{t("Добавить автомобиль")}</span>
          </a>
        </section>

        {createdCarId ? (
          <div className={styles.successBanner} role="status">
            <span className={styles.successMark}>
              <CheckIcon />
            </span>
            <span>
              {language === "uz"
                ? `Avtomobil D1 bazasiga saqlandi. №${createdCarId} yozuv umumiy katalogda.`
                : `Автомобиль сохранён в D1. Запись №${createdCarId} уже находится в общем каталоге.`}
            </span>
            <button type="button" onClick={() => setCreatedCarId(null)} aria-label={t("Закрыть")}>
              <CloseSmallIcon />
            </button>
          </div>
        ) : null}

        <section
          className={styles.catalog}
          aria-label={t("Каталог автомобилей")}
          aria-busy={loading}
        >
          <div className={styles.catalogTop}>
            <div>
              <p className={styles.sectionKicker}>{t("БАЗА АВТОМОБИЛЕЙ")}</p>
              <h2>{t("Каталог")}</h2>
            </div>

            <span className={styles.catalogCount}>
              {authReady ? formatCarCount(total, language) : t("Проверка доступа…")}
            </span>
          </div>

          <div className={styles.toolbar}>
            <label className={styles.search}>
              <SearchIcon />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Марка, модель, VIN")}
                autoComplete="off"
                spellCheck={false}
                aria-label={t("Поиск автомобилей")}
              />
              {query ? (
                <button
                  className={styles.clearSearch}
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t("Очистить поиск")}
                >
                  <CloseSmallIcon />
                </button>
              ) : null}
            </label>

            <button
              className={styles.filterButton}
              type="button"
              onClick={() => {
                setSettingsOpen(false);
                setFiltersOpen(true);
              }}
              aria-label={t("Открыть фильтры")}
            >
              <FilterIcon />
              <span>{t("Фильтры")}</span>
              {activeFilterCount > 0 ? (
                <b className={styles.filterCount}>{activeFilterCount}</b>
              ) : null}
            </button>
          </div>

          <div className={styles.statusScroller} aria-label={t("Статус автомобиля")}>
            {STATUS_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                className={`${styles.statusChip} ${
                  status === item ? styles.statusChipActive : ""
                }`}
                onClick={() => setStatus(item)}
                aria-pressed={status === item}
              >
                {STATUS_FILTER_LABELS[language][item]}
              </button>
            ))}
          </div>

          <div className={styles.divider} />

          {loadError ? (
            <div className={styles.loadError} role="alert">
              <span>{loadError}</span>
              <button type="button" onClick={() => setReloadToken((value) => value + 1)}>
                {t("Повторить")}
              </button>
            </div>
          ) : null}

          {loading && cars.length === 0 ? (
            <div className={styles.skeletonGrid} aria-label={t("Загрузка автомобилей")}>
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
                <CatalogCarCard
                  key={car.id}
                  car={car}
                  language={language}
                  created={car.id === createdCarId}
                  t={t}
                  onQuickEdit={openQuickEditor}
                />
              ))}
            </div>
          ) : null}

          {!loading && !loadError && cars.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.carSymbol} aria-hidden="true">
                <CarOutlineIcon />
              </div>
              <p className={styles.emptyEyebrow}>
                {query || activeFilterCount > 0
                  ? t("НИЧЕГО НЕ НАЙДЕНО")
                  : t("БАЗА ГОТОВА К НАПОЛНЕНИЮ")}
              </p>
              <h3>
                {query || activeFilterCount > 0
                  ? t("Измените поиск или фильтры")
                  : t("Добавьте первый автомобиль")}
              </h3>
              <p>
                {query || activeFilterCount > 0
                  ? t("В D1 нет автомобилей, соответствующих выбранным условиям.")
                  : t("После сохранения здесь появятся только реальные автомобили AutoSale Umar.")}
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
                  {t("Сбросить поиск")}
                </button>
              ) : (
                <a className={styles.emptyReset} href="/admin/cars/new/">
                  {t("Добавить автомобиль")}
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
            aria-label={t("Закрыть фильтры")}
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
                <p className={styles.sheetEyebrow}>{t("КАТАЛОГ")}</p>
                <h2 id="cars-filter-title">{t("Фильтры")}</h2>
              </div>

              <button
                className={styles.sheetClose}
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label={t("Закрыть")}
              >
                <CloseIcon />
              </button>
            </div>

            <div className={styles.filterGroup}>
              <p>{t("Статус")}</p>
              <div className={styles.optionGrid}>
                {STATUS_FILTERS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.optionButton} ${
                      status === item ? styles.optionButtonActive : ""
                    }`}
                    onClick={() => setStatus(item)}
                  >
                    {STATUS_FILTER_LABELS[language][item]}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <p>{t("Страна")}</p>
              <div className={styles.optionGrid}>
                {COUNTRY_FILTERS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.optionButton} ${
                      country === item ? styles.optionButtonActive : ""
                    }`}
                    onClick={() => setCountry(item)}
                  >
                    {COUNTRY_FILTER_LABELS[language][item]}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.sheetActions}>
              <button className={styles.secondaryAction} type="button" onClick={resetFilters}>
                {t("Сбросить")}
              </button>
              <button
                className={styles.primaryAction}
                type="button"
                onClick={() => setFiltersOpen(false)}
              >
                {t("Готово")}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {quickCar ? (
        <div className={styles.modalLayer} role="presentation">
          <button
            className={styles.scrim}
            type="button"
            onClick={closeQuickEditor}
            aria-label={t("Закрыть")}
          />

          <section
            className={`${styles.sheet} ${styles.quickSheet}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-status-title"
          >
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <div>
                <p className={styles.sheetEyebrow}>ID {quickCar.id} · {quickCar.brand}</p>
                <h2 id="quick-status-title">{t("Статус и цена")}</h2>
                <p className={styles.quickSubtitle}>{quickCar.model}{quickCar.trim ? ` · ${quickCar.trim}` : ""}</p>
              </div>
              <button className={styles.sheetClose} type="button" onClick={closeQuickEditor} aria-label={t("Закрыть")}>
                <CloseIcon />
              </button>
            </div>

            <div className={styles.quickGroup}>
              <p>{t("Статус")}</p>
              <div className={styles.quickStatusGrid}>
                {STATUS_FILTERS.filter((item): item is CarStatus => item !== "all").map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.quickStatusButton} ${quickStatus === item ? styles.quickStatusButtonActive : ""}`}
                    data-status={item}
                    onClick={() => setQuickStatus(item)}
                  >
                    {STATUS_LABELS[language][item]}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.quickGroup}>
              <p>{t("Цена")}</p>
              <div className={styles.quickPriceRow}>
                <input
                  value={quickPrice}
                  disabled={quickPriceOnRequest}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="258000"
                  onChange={(event) => setQuickPrice(event.target.value.replace(/[^0-9]/g, ""))}
                  aria-label={t("Цена")}
                />
                <select
                  value={quickCurrency}
                  disabled={quickPriceOnRequest}
                  onChange={(event) => setQuickCurrency(event.target.value as "USD" | "UZS" | "EUR")}
                  aria-label={language === "uz" ? "Valyuta" : "Валюта"}
                >
                  <option value="USD">USD</option>
                  <option value="UZS">UZS</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <button
                className={styles.priceRequestToggle}
                type="button"
                data-active={quickPriceOnRequest}
                onClick={() => setQuickPriceOnRequest((value) => !value)}
                aria-pressed={quickPriceOnRequest}
              >
                <span className={styles.toggleDot} />
                {t("Цена по запросу")}
              </button>
            </div>

            {quickError ? <div className={styles.quickError} role="alert">{quickError}</div> : null}

            <div className={styles.quickActions}>
              <button type="button" className={styles.secondaryAction} onClick={closeQuickEditor} disabled={quickSaving}>
                {t("Закрыть")}
              </button>
              <button type="button" className={styles.primaryAction} onClick={saveQuickEditor} disabled={quickSaving}>
                {quickSaving ? t("Сохранение…") : t("Сохранить изменения")}
              </button>
            </div>
          </section>
        </div>
      ) : null}

    </main>
  );
}

function CatalogCarCard({
  car,
  language,
  created,
  t,
  onQuickEdit,
}: {
  car: CarRecord;
  language: Language;
  created: boolean;
  t: (text: string) => string;
  onQuickEdit: (car: CarRecord) => void;
}) {
  const [variantId, setVariantId] = useState<number | null>(car.variants[0]?.id ?? null);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (variantId != null && car.variants.some((variant) => variant.id === variantId)) return;
    setVariantId(car.variants[0]?.id ?? null);
    setPhotoIndex(0);
  }, [car.variants, variantId]);

  const activeVariant = car.variants.find((variant) => variant.id === variantId) ?? car.variants[0] ?? null;
  const photos = activeVariant?.exteriorPhotos?.length
    ? activeVariant.exteriorPhotos
    : car.coverUrl
      ? [{ id: -1, url: car.coverUrl, isCover: true, sortOrder: 0 }]
      : [];
  const safeIndex = photos.length > 0 ? Math.min(photoIndex, photos.length - 1) : 0;
  const currentPhoto = photos[safeIndex] ?? null;
  const vin = activeVariant ? activeVariant.vin : car.vin;
  const stockNumber = activeVariant ? activeVariant.stockNumber : car.stockNumber;

  function openEditor() {
    window.location.assign(`/admin/cars/edit/?id=${car.id}`);
  }

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeGuardRef = useRef(false);

  function changePhoto(direction: -1 | 1) {
    if (photos.length < 2) return;
    setPhotoIndex((current) => (current + direction + photos.length) % photos.length);
  }

  return (
    <article
      className={`${styles.carCard} ${created ? styles.carCardCreated : ""}`}
      role="link"
      tabIndex={0}
      onClick={openEditor}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openEditor();
        }
      }}
      aria-label={`${t("Редактировать")}: ${car.brand} ${car.model}`}
    >
      <div
        className={styles.carMedia}
        onClick={(event) => {
          if (!swipeGuardRef.current) return;
          event.stopPropagation();
          swipeGuardRef.current = false;
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          swipeGuardRef.current = false;
          if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchCancel={() => { touchStartRef.current = null; }}
        onTouchEnd={(event) => {
          const touch = event.changedTouches[0];
          const touchStart = touchStartRef.current;
          touchStartRef.current = null;

          if (!touchStart || !touch || photos.length < 2) return;

          const deltaX = touch.clientX - touchStart.x;
          const deltaY = touch.clientY - touchStart.y;
          if (Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) return;

          event.stopPropagation();
          swipeGuardRef.current = true;
          window.setTimeout(() => { swipeGuardRef.current = false; }, 650);
          changePhoto(deltaX < 0 ? 1 : -1);
        }}
      >
        {currentPhoto ? (
          <img key={`${activeVariant?.id ?? 0}-${currentPhoto.id}`} src={currentPhoto.url} alt={`${car.brand} ${car.model}`} loading="lazy" draggable={false} />
        ) : (
          <div className={styles.carMediaFallback} aria-hidden="true"><CarOutlineIcon /></div>
        )}

        <span className={styles.statusBadge} data-status={car.status}>{STATUS_LABELS[language][car.status]}</span>

        {photos.length > 1 ? (
          <div className={styles.mediaDots} aria-label={t("Быстрый просмотр фотографий")}>
            {photos.map((photo, index) => (
              <span
                key={photo.id}
                className={styles.mediaDot}
                data-active={index === safeIndex}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : null}
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
          {car.countryCode ? <span>{COUNTRY_LABELS[language][car.countryCode] ?? car.countryCode}</span> : null}
          {car.engineText ? <span>{car.engineText}</span> : null}
          {activeVariant?.exteriorColorName || car.exteriorColor ? <span>{activeVariant?.exteriorColorName || car.exteriorColor}</span> : null}
        </div>

        {car.variants.length > 0 ? (
          <div className={styles.variantChooser} aria-label={t("Цвет автомобиля")}>
            <div className={styles.variantSwatches}>
              {car.variants.map((variant) => (
                <button
                  key={variant.id}
                  className={styles.variantSwatch}
                  data-selected={activeVariant?.id === variant.id}
                  type="button"
                  title={variant.exteriorColorName || t("Цвет автомобиля")}
                  aria-label={variant.exteriorColorName || t("Цвет автомобиля")}
                  aria-pressed={activeVariant?.id === variant.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    setVariantId(variant.id);
                    setPhotoIndex(0);
                  }}
                >
                  <span style={{ backgroundColor: variant.exteriorSwatch }} />
                </button>
              ))}
            </div>
            {activeVariant?.exteriorColorName ? <span className={styles.variantName}>{activeVariant.exteriorColorName}</span> : null}
          </div>
        ) : null}

        <div className={styles.identityRow}>
          <div className={styles.vinBlock}>
            <span>VIN</span>
            <strong>{vin || t("VIN не указан")}</strong>
            {stockNumber ? <small>{language === "uz" ? "Ichki raqam" : "Внутренний номер"} · {stockNumber}</small> : null}
          </div>
          <div className={styles.idBlock}>
            <span>ID</span>
            <strong>{car.id}</strong>
          </div>
        </div>

        <div className={styles.carBottom}>
          <div className={styles.priceBlock}>
            <span className={styles.priceLabel}>{t("Цена")}</span>
            <strong>{formatPrice(car, language)}</strong>
          </div>
          <div className={styles.cardActions}>
            <button
              className={styles.editAction}
              type="button"
              onClick={(event) => { event.stopPropagation(); openEditor(); }}
            >
              <EditIcon />
              <span>{t("Редактировать")}</span>
            </button>
            <button
              className={styles.statusAction}
              type="button"
              onClick={(event) => { event.stopPropagation(); onQuickEdit(car); }}
            >
              <SlidersIcon />
              <span>{t("Статус")}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function EditIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4.2L19 9.2 14.8 5 4 15.8V20Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="m13.6 6.2 4.2 4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

function SlidersIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="8" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg>;
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={styles.menuGlyph} data-open={open} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
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
