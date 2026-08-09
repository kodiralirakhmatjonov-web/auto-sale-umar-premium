"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./new-car.module.css";

type Theme = "light" | "dark";
type CarStatus = "in_stock" | "in_transit" | "reserved" | "sold";
type Currency = "USD" | "UZS" | "EUR";

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

interface FormState {
  brand: string;
  model: string;
  year: string;
  trim: string;
  vin: string;
  stockNumber: string;
  status: CarStatus;
  countryCode: string;
  arrivalDate: string;

  mileageKm: string;
  engineText: string;
  fuelType: string;
  driveType: string;
  transmission: string;
  seats: string;
  exteriorColor: string;
  interiorColor: string;

  price: string;
  currency: Currency;
  priceOnRequest: boolean;

  shortDescriptionRu: string;
  shortDescriptionUz: string;
  descriptionRu: string;
  descriptionUz: string;

  isNew: boolean;
  isNewArrival: boolean;
  isPublic: boolean;
  isFeatured: boolean;
}

interface CreateCarResponse {
  success?: boolean;
  error?: string;
  message?: string;
  car?: {
    id?: number;
    brand?: string;
    model?: string;
    vin?: string | null;
    stockNumber?: string | null;
  };
}

const BRANDS = [
  { value: "Mercedes-Benz", mark: "MERCEDES\nBENZ" },
  { value: "Range Rover", mark: "RANGE\nROVER" },
  { value: "Rolls-Royce", mark: "ROLLS\nROYCE" },
  { value: "Cadillac", mark: "CADILLAC" },
  { value: "Lexus", mark: "LEXUS" },
  { value: "Toyota", mark: "TOYOTA" },
  { value: "Genesis", mark: "GENESIS" },
  { value: "BMW", mark: "BMW" },
  { value: "Lamborghini", mark: "LAMBORGHINI" },
] as const;

const STATUS_OPTIONS: Array<{ value: CarStatus; label: string }> = [
  { value: "in_stock", label: "В наличии" },
  { value: "in_transit", label: "В пути" },
  { value: "reserved", label: "Резерв" },
  { value: "sold", label: "Продан" },
];

const COUNTRY_OPTIONS = [
  { value: "KR", label: "Корея" },
  { value: "US", label: "США" },
  { value: "CA", label: "Канада" },
  { value: "AE", label: "ОАЭ" },
] as const;

const INITIAL_FORM: FormState = {
  brand: "",
  model: "",
  year: "",
  trim: "",
  vin: "",
  stockNumber: "",
  status: "in_stock",
  countryCode: "KR",
  arrivalDate: "",

  mileageKm: "0",
  engineText: "",
  fuelType: "",
  driveType: "",
  transmission: "",
  seats: "",
  exteriorColor: "",
  interiorColor: "",

  price: "",
  currency: "USD",
  priceOnRequest: false,

  shortDescriptionRu: "",
  shortDescriptionUz: "",
  descriptionRu: "",
  descriptionUz: "",

  isNew: true,
  isNewArrival: true,
  isPublic: false,
  isFeatured: false,
};

function normalizeUpper(value: string, maxLength: number): string {
  return value.toUpperCase().replace(/\s{2,}/g, " ").slice(0, maxLength);
}

export default function NewCarPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [authReady, setAuthReady] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdCar, setCreatedCar] = useState<{ id: number; title: string } | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const selectedBrand = useMemo(
    () => BRANDS.find((brand) => brand.value === form.brand) ?? null,
    [form.brand],
  );

  const applyTheme = useCallback((nextTheme: Theme) => {
    setTheme(nextTheme);

    try {
      localStorage.setItem("asu-theme", nextTheme);
    } catch {
      // Theme persistence is optional.
    }

    const color = nextTheme === "light" ? "#f5f5f7" : "#0b0b0d";
    document.documentElement.dataset.asuTheme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    document.documentElement.style.backgroundColor = color;
    document.body.dataset.asuTheme = nextTheme;
    document.body.style.backgroundColor = color;

    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = color;
  }, []);

  useEffect(() => {
    try {
      const rootTheme = document.documentElement.dataset.asuTheme;
      if (rootTheme === "light" || rootTheme === "dark") {
        applyTheme(rootTheme);
        return;
      }

      const stored = localStorage.getItem("asu-theme");
      if (stored === "light" || stored === "dark") {
        applyTheme(stored);
        return;
      }

      applyTheme(matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch {
      applyTheme("light");
    }
  }, [applyTheme]);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        const response = await fetch("/api/me", {
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (response.status === 401) {
          location.replace("/admin/login/");
          return;
        }

        if (!response.ok) {
          throw new Error("Не удалось проверить защищённую сессию.");
        }

        if (!cancelled) {
          setAuthReady(true);
          setError(null);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
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
    if (!error) return;
    errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const transitionDocument = document as ViewTransitionDocument;

    if (!reducedMotion && transitionDocument.startViewTransition) {
      transitionDocument.startViewTransition(() => applyTheme(nextTheme));
      return;
    }

    applyTheme(nextTheme);
  }

  function setText(
    key: keyof FormState,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setError(null);
  }

  function setUpperText(
    key: "model" | "vin" | "stockNumber",
    event: ChangeEvent<HTMLInputElement>,
    maxLength: number,
  ) {
    setForm((current) => ({
      ...current,
      [key]: normalizeUpper(event.target.value, maxLength),
    }));
    setError(null);
  }

  function selectBrand(brand: string) {
    setForm((current) => ({ ...current, brand }));
    setError(null);
  }

  function validate(): string | null {
    if (!form.brand) return "Выберите марку автомобиля.";
    if (!form.model.trim()) return "Укажите модель автомобиля.";

    if (form.year) {
      const year = Number(form.year);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        return "Проверьте год автомобиля.";
      }
    }

    const vin = form.vin.trim().toUpperCase();
    if (vin && !/^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin)) {
      return "VIN должен содержать 11–17 допустимых латинских символов и цифр.";
    }

    if (form.arrivalDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.arrivalDate)) {
      return "Проверьте дату прибытия.";
    }

    if (form.mileageKm) {
      const mileage = Number(form.mileageKm);
      if (!Number.isSafeInteger(mileage) || mileage < 0) return "Проверьте пробег.";
    }

    if (form.seats) {
      const seats = Number(form.seats);
      if (!Number.isInteger(seats) || seats < 1 || seats > 99) {
        return "Проверьте количество мест.";
      }
    }

    if (!form.priceOnRequest && form.price) {
      const price = Number(form.price);
      if (!Number.isSafeInteger(price) || price < 0) {
        return "Цена должна быть целым положительным числом.";
      }
    }

    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        brand: form.brand,
        model: form.model.trim().toUpperCase(),
        year: form.year ? Number(form.year) : null,
        trim: form.trim.trim() || null,
        vin: form.vin.trim().toUpperCase() || null,
        stockNumber: form.stockNumber.trim().toUpperCase() || null,
        status: form.status,
        countryCode: form.countryCode,
        arrivalDate: form.arrivalDate || null,

        mileageKm: form.mileageKm ? Number(form.mileageKm) : 0,
        engineText: form.engineText.trim() || null,
        fuelType: form.fuelType || null,
        driveType: form.driveType || null,
        transmission: form.transmission || null,
        seats: form.seats ? Number(form.seats) : null,
        exteriorColor: form.exteriorColor.trim() || null,
        interiorColor: form.interiorColor.trim() || null,

        price: form.priceOnRequest || !form.price ? null : Number(form.price),
        currency: form.currency,
        priceOnRequest: form.priceOnRequest || !form.price,

        shortDescriptionRu: form.shortDescriptionRu.trim() || null,
        shortDescriptionUz: form.shortDescriptionUz.trim() || null,
        descriptionRu: form.descriptionRu.trim() || null,
        descriptionUz: form.descriptionUz.trim() || null,

        isNew: form.isNew,
        isNewArrival: form.isNewArrival,
        isPublic: form.isPublic,
        isFeatured: form.isFeatured,
      };

      const response = await fetch("/api/cars", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as CreateCarResponse | null;

      if (response.status === 401) {
        location.replace("/admin/login/");
        return;
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Не удалось добавить автомобиль.");
      }

      const createdId = data.car?.id;
      if (!Number.isInteger(createdId) || !createdId) {
        throw new Error("D1 не подтвердил ID созданного автомобиля. Переход отменён.");
      }

      const title = `${data.car?.brand || form.brand} ${data.car?.model || form.model}`.trim();
      setCreatedCar({ id: createdId, title });

      window.setTimeout(() => {
        location.assign(`/admin/cars/?created=${createdId}`);
      }, 850);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось добавить автомобиль.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!authReady && !error) {
    return (
      <main className={styles.loadingPage} data-theme={theme}>
        <div className={styles.loadingDot} aria-label="Проверка сессии" />
      </main>
    );
  }

  return (
    <main className={styles.page} data-theme={theme}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <a className={styles.roundControl} href="/admin/cars/" aria-label="Назад к автомобилям">
            <ChevronLeftIcon />
          </a>

          <a className={styles.wordmarkLink} href="/admin/cars/" aria-label="Auto Sale Umar">
            <img
              className={styles.wordmark}
              src={theme === "dark" ? "/brand/asu-wordmark-white.png" : "/brand/asu-wordmark-black.png"}
              alt="Auto Sale Umar"
            />
          </a>

          <button
            className={styles.roundControl}
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>

      <div className={styles.shell}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>CONTROL SYSTEM · АВТОМОБИЛИ</p>
          <h1>Новый автомобиль</h1>
          <p className={styles.introText}>
            Одна форма. После сохранения автомобиль появится в D1 только после подтверждённой записи.
          </p>
        </section>

        {error ? (
          <div ref={errorRef} className={styles.errorBanner} role="alert">
            <span className={styles.errorIcon}>!</span>
            <span>{error}</span>
          </div>
        ) : null}

        <form className={styles.form} onSubmit={submit} noValidate>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionKicker}>01</p>
                <h2>Автомобиль</h2>
              </div>
              <p>Сначала выберите марку, затем укажите модель.</p>
            </div>

            <div className={styles.brandRail} role="listbox" aria-label="Марка автомобиля">
              {BRANDS.map((brand) => {
                const active = form.brand === brand.value;
                return (
                  <button
                    key={brand.value}
                    className={`${styles.brandTile} ${active ? styles.brandTileActive : ""}`}
                    type="button"
                    onClick={() => selectBrand(brand.value)}
                    role="option"
                    aria-selected={active}
                  >
                    <span className={styles.brandMark}>
                      {brand.mark.split("\n").map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </span>
                    {active ? (
                      <span className={styles.brandCheck} aria-hidden="true">
                        <CheckIcon />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Марка</span>
                <input value={selectedBrand?.value ?? ""} readOnly placeholder="Выберите выше" />
              </label>

              <label className={styles.field}>
                <span>Модель *</span>
                <input
                  value={form.model}
                  onChange={(event) => setUpperText("model", event, 100)}
                  placeholder="GV80"
                  autoCapitalize="characters"
                  spellCheck={false}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Комплектация</span>
                <input
                  value={form.trim}
                  onChange={(event) => setText("trim", event)}
                  placeholder="3.5T AWD Prestige"
                />
              </label>

              <label className={styles.field}>
                <span>Год</span>
                <input
                  value={form.year}
                  onChange={(event) => setText("year", event)}
                  inputMode="numeric"
                  placeholder="2026"
                  maxLength={4}
                />
              </label>

              <label className={styles.field}>
                <span>VIN</span>
                <input
                  value={form.vin}
                  onChange={(event) => setUpperText("vin", event, 17)}
                  placeholder="KMUHBDSB7TU000001"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </label>

              <label className={styles.field}>
                <span>Внутренний номер</span>
                <input
                  value={form.stockNumber}
                  onChange={(event) => setUpperText("stockNumber", event, 80)}
                  placeholder="ASU-1024"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionKicker}>02</p>
                <h2>Поставка</h2>
              </div>
              <p>Статус и источник поставки используются в каталоге и фильтрах.</p>
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Статус</span>
              <div className={styles.segmentGrid}>
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.segment} ${form.status === option.value ? styles.segmentActive : ""}`}
                    onClick={() => setForm((current) => ({ ...current, status: option.value }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Страна поставки</span>
              <div className={styles.segmentGrid}>
                {COUNTRY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.segment} ${form.countryCode === option.value ? styles.segmentActive : ""}`}
                    onClick={() => setForm((current) => ({ ...current, countryCode: option.value }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Дата прибытия</span>
                <input
                  className={styles.dateInput}
                  type="date"
                  value={form.arrivalDate}
                  onChange={(event) => setText("arrivalDate", event)}
                />
              </label>

              <label className={styles.field}>
                <span>Пробег, км</span>
                <input
                  value={form.mileageKm}
                  onChange={(event) => setText("mileageKm", event)}
                  inputMode="numeric"
                  placeholder="0"
                />
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionKicker}>03</p>
                <h2>Характеристики</h2>
              </div>
              <p>Основные данные, которые будут видны в карточке автомобиля.</p>
            </div>

            <div className={styles.fieldGrid}>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Двигатель</span>
                <input
                  value={form.engineText}
                  onChange={(event) => setText("engineText", event)}
                  placeholder="3.5 T-GDI · 375 л.с."
                />
              </label>

              <label className={styles.field}>
                <span>Топливо</span>
                <select value={form.fuelType} onChange={(event) => setText("fuelType", event)}>
                  <option value="">Не указано</option>
                  <option value="gasoline">Бензин</option>
                  <option value="diesel">Дизель</option>
                  <option value="hybrid">Гибрид</option>
                  <option value="phev">Plug-in гибрид</option>
                  <option value="electric">Электро</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>Привод</span>
                <select value={form.driveType} onChange={(event) => setText("driveType", event)}>
                  <option value="">Не указано</option>
                  <option value="AWD">AWD</option>
                  <option value="4WD">4WD</option>
                  <option value="RWD">RWD</option>
                  <option value="FWD">FWD</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>Коробка</span>
                <select value={form.transmission} onChange={(event) => setText("transmission", event)}>
                  <option value="">Не указано</option>
                  <option value="automatic">Автомат</option>
                  <option value="robot">Робот</option>
                  <option value="cvt">Вариатор</option>
                  <option value="manual">Механика</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>Мест</span>
                <input
                  value={form.seats}
                  onChange={(event) => setText("seats", event)}
                  inputMode="numeric"
                  placeholder="5"
                />
              </label>

              <label className={styles.field}>
                <span>Цвет кузова</span>
                <input
                  value={form.exteriorColor}
                  onChange={(event) => setText("exteriorColor", event)}
                  placeholder="Uyuni White"
                />
              </label>

              <label className={styles.field}>
                <span>Цвет салона</span>
                <input
                  value={form.interiorColor}
                  onChange={(event) => setText("interiorColor", event)}
                  placeholder="Obsidian Black"
                />
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionKicker}>04</p>
                <h2>Цена и публикация</h2>
              </div>
              <p>По умолчанию автомобиль не публикуется до добавления фотографий.</p>
            </div>

            <div className={styles.priceRow}>
              <label className={`${styles.field} ${styles.priceField}`}>
                <span>Цена</span>
                <input
                  value={form.price}
                  onChange={(event) => setText("price", event)}
                  inputMode="numeric"
                  placeholder="125000"
                  disabled={form.priceOnRequest}
                />
              </label>

              <label className={`${styles.field} ${styles.currencyField}`}>
                <span>Валюта</span>
                <select value={form.currency} onChange={(event) => setText("currency", event)}>
                  <option value="USD">USD</option>
                  <option value="UZS">UZS</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>
            </div>

            <div className={styles.switchList}>
              <SwitchRow
                label="Цена по запросу"
                detail="Вместо числа в публичной карточке показывается запрос цены."
                checked={form.priceOnRequest}
                onChange={(checked) => setForm((current) => ({ ...current, priceOnRequest: checked }))}
              />
              <SwitchRow
                label="Новый автомобиль"
                detail="Используется для классификации автомобиля."
                checked={form.isNew}
                onChange={(checked) => setForm((current) => ({ ...current, isNew: checked }))}
              />
              <SwitchRow
                label="Новое поступление"
                detail="Разрешает выводить автомобиль в блоке последних поступлений."
                checked={form.isNewArrival}
                onChange={(checked) => setForm((current) => ({ ...current, isNewArrival: checked }))}
              />
              <SwitchRow
                label="Рекомендуемый"
                detail="Поднимает автомобиль выше в административном каталоге."
                checked={form.isFeatured}
                onChange={(checked) => setForm((current) => ({ ...current, isFeatured: checked }))}
              />
              <SwitchRow
                label="Опубликовать на сайте"
                detail="Оставьте выключенным, пока не добавлены качественные фотографии."
                checked={form.isPublic}
                onChange={(checked) => setForm((current) => ({ ...current, isPublic: checked }))}
              />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionKicker}>05</p>
                <h2>Описание</h2>
              </div>
              <p>Русская и узбекская версии хранятся отдельно.</p>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Коротко · RU</span>
                <textarea
                  className={styles.shortTextarea}
                  value={form.shortDescriptionRu}
                  onChange={(event) => setText("shortDescriptionRu", event)}
                  placeholder="Краткое описание для карточки"
                  maxLength={220}
                />
              </label>

              <label className={styles.field}>
                <span>Qisqa · UZ</span>
                <textarea
                  className={styles.shortTextarea}
                  value={form.shortDescriptionUz}
                  onChange={(event) => setText("shortDescriptionUz", event)}
                  placeholder="Kartochka uchun qisqa tavsif"
                  maxLength={220}
                />
              </label>

              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Описание · RU</span>
                <textarea
                  value={form.descriptionRu}
                  onChange={(event) => setText("descriptionRu", event)}
                  placeholder="Полное описание автомобиля"
                />
              </label>

              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Tavsif · UZ</span>
                <textarea
                  value={form.descriptionUz}
                  onChange={(event) => setText("descriptionUz", event)}
                  placeholder="Avtomobilning to‘liq tavsifi"
                />
              </label>
            </div>
          </section>

          <div className={styles.saveDock}>
            <div className={styles.saveMeta}>
              <span>{form.brand || "Марка не выбрана"}</span>
              <strong>{form.model || "НОВЫЙ АВТОМОБИЛЬ"}</strong>
            </div>
            <button className={styles.saveButton} type="submit" disabled={saving || !authReady}>
              {saving ? <span className={styles.spinner} aria-hidden="true" /> : <CheckIcon />}
              <span>{saving ? "Сохраняем в D1…" : "Сохранить автомобиль"}</span>
            </button>
          </div>
        </form>
      </div>

      {createdCar ? (
        <div className={styles.successOverlay} role="status" aria-live="polite">
          <div className={styles.successCard}>
            <span className={styles.successIcon}>
              <CheckIcon />
            </span>
            <p>Автомобиль сохранён</p>
            <h2>{createdCar.title}</h2>
            <span>D1 подтвердил запись · ID {createdCar.id}</span>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SwitchRow({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.switchRow}>
      <span className={styles.switchCopy}>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <input
        className={styles.switchInput}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.switchTrack} aria-hidden="true">
        <span className={styles.switchThumb} />
      </span>
    </label>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.75 5.5 8.25 12l6.5 6.5" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 15.2A8.1 8.1 0 0 1 8.8 4 8.25 8.25 0 1 0 20 15.2Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.4v2.1M12 19.5v2.1M2.4 12h2.1M19.5 12h2.1M5.2 5.2l1.5 1.5M17.3 17.3l1.5 1.5M18.8 5.2l-1.5 1.5M6.7 17.3l-1.5 1.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5.5 12.4 4.2 4.2 8.8-9.1" />
    </svg>
  );
}
