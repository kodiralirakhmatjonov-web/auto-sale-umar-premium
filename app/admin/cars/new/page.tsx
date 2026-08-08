"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./new-car.module.css";

type Theme = "light" | "dark";
type Step = 1 | 2 | 3 | 4;
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
  fuelType: string;
  driveType: string;
  transmission: string;
  engineText: string;
  seats: string;
  exteriorColor: string;
  interiorColor: string;

  price: string;
  currency: Currency;
  priceOnRequest: boolean;
  isNew: boolean;
  isNewArrival: boolean;
  isPublic: boolean;
  isFeatured: boolean;

  shortDescriptionRu: string;
  shortDescriptionUz: string;
  descriptionRu: string;
  descriptionUz: string;
}

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
  fuelType: "",
  driveType: "",
  transmission: "",
  engineText: "",
  seats: "",
  exteriorColor: "",
  interiorColor: "",

  price: "",
  currency: "USD",
  priceOnRequest: false,
  isNew: true,
  isNewArrival: true,
  isPublic: false,
  isFeatured: false,

  shortDescriptionRu: "",
  shortDescriptionUz: "",
  descriptionRu: "",
  descriptionUz: "",
};

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
];

const STEP_LABELS: Record<Step, string> = {
  1: "Основное",
  2: "Характеристики",
  3: "Цена и публикация",
  4: "Описание",
};

export default function NewCarPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [authReady, setAuthReady] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const progress = useMemo(() => `${step} / 4`, [step]);

  const applyTheme = useCallback((nextTheme: Theme) => {
    setTheme(nextTheme);

    try {
      window.localStorage.setItem("asu-theme", nextTheme);
    } catch {
      // Theme persistence is optional.
    }

    const color = nextTheme === "light" ? "#f5f5f3" : "#0b0c0d";

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

      const stored = window.localStorage.getItem("asu-theme");
      if (stored === "light" || stored === "dark") {
        applyTheme(stored);
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

    async function verify() {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
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

    void verify();

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const transitionDocument = document as ViewTransitionDocument;

    if (!reducedMotion && transitionDocument.startViewTransition) {
      transitionDocument.startViewTransition(() => applyTheme(nextTheme));
      return;
    }

    applyTheme(nextTheme);
  }

  function setTextField(
    key: keyof FormState,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));
    setError(null);
  }

  function setBooleanField(
    key: "priceOnRequest" | "isNew" | "isNewArrival" | "isPublic" | "isFeatured",
    value: boolean,
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "priceOnRequest" && value ? { price: "" } : {}),
    }));
    setError(null);
  }

  function validateStep(target: Step): string | null {
    if (target === 1) {
      if (!form.brand.trim()) return "Укажите марку автомобиля.";
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
    }

    if (target === 2) {
      if (form.mileageKm) {
        const mileage = Number(form.mileageKm);
        if (!Number.isSafeInteger(mileage) || mileage < 0) {
          return "Проверьте пробег.";
        }
      }

      if (form.seats) {
        const seats = Number(form.seats);
        if (!Number.isInteger(seats) || seats < 1 || seats > 99) {
          return "Проверьте количество мест.";
        }
      }
    }

    if (target === 3) {
      if (!form.priceOnRequest && !form.price.trim()) {
        return "Введите цену или включите «Цена по запросу».";
      }

      if (form.price) {
        const price = Number(form.price);
        if (!Number.isSafeInteger(price) || price < 0) {
          return "Цена должна быть целым положительным числом.";
        }
      }
    }

    return null;
  }

  function goNext() {
    const validation = validateStep(step);
    if (validation) {
      setError(validation);
      return;
    }

    setError(null);
    setStep((current) => Math.min(4, current + 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBackStep() {
    setError(null);
    setStep((current) => Math.max(1, current - 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    for (const target of [1, 2, 3] as Step[]) {
      const validation = validateStep(target);
      if (validation) {
        setStep(target);
        setError(validation);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: form.year ? Number(form.year) : null,
        trim: form.trim.trim() || null,
        vin: form.vin.trim().toUpperCase() || null,
        stockNumber: form.stockNumber.trim() || null,
        status: form.status,
        countryCode: form.countryCode,
        arrivalDate: form.arrivalDate || null,

        mileageKm: form.mileageKm ? Number(form.mileageKm) : 0,
        fuelType: form.fuelType || null,
        driveType: form.driveType || null,
        transmission: form.transmission || null,
        engineText: form.engineText.trim() || null,
        seats: form.seats ? Number(form.seats) : null,
        exteriorColor: form.exteriorColor.trim() || null,
        interiorColor: form.interiorColor.trim() || null,

        price: form.priceOnRequest || !form.price ? null : Number(form.price),
        currency: form.currency,
        priceOnRequest: form.priceOnRequest,
        isNew: form.isNew,
        isNewArrival: form.isNewArrival,
        isPublic: form.isPublic,
        isFeatured: form.isFeatured,

        shortDescriptionRu: form.shortDescriptionRu.trim() || null,
        shortDescriptionUz: form.shortDescriptionUz.trim() || null,
        descriptionRu: form.descriptionRu.trim() || null,
        descriptionUz: form.descriptionUz.trim() || null,
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

      const data = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string; car?: { id?: number } }
        | null;

      if (response.status === 401) {
        window.location.replace("/admin/login/");
        return;
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Не удалось добавить автомобиль.");
      }

      const createdId = data.car?.id;
      window.location.assign(createdId ? `/admin/cars/?created=${createdId}` : "/admin/cars/");
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

  return (
    <main className={styles.page} data-theme={theme}>
      <div className={styles.ambient} aria-hidden="true">
        <span />
        <span />
      </div>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a className={styles.roundButton} href="/admin/cars/" aria-label="Назад к автомобилям">
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

      <div className={styles.shell}>
        <div className={styles.topline}>
          <span>НОВЫЙ АВТОМОБИЛЬ</span>
          <span>{progress}</span>
        </div>

        <div className={styles.progressTrack} aria-hidden="true">
          <span style={{ width: `${step * 25}%` }} />
        </div>

        <section className={styles.hero}>
          <p>{STEP_LABELS[step]}</p>
          <h1>
            {step === 1
              ? "Основные данные."
              : step === 2
                ? "Характеристики."
                : step === 3
                  ? "Цена и статус."
                  : "Тексты для сайта."}
          </h1>
          <span>
            Форма сохраняет данные в существующую структуру D1: cars, brands,
            car_specs и car_variants. Фотографии подключим отдельным следующим этапом.
          </span>
        </section>

        <form className={styles.formCard} onSubmit={submit}>
          {!authReady && !error ? (
            <div className={styles.loadingState}>Проверяем защищённый доступ…</div>
          ) : null}

          {step === 1 ? (
            <div className={styles.stepPanel}>
              <div className={styles.fieldGrid}>
                <Field label="Марка" required>
                  <input
                    value={form.brand}
                    onChange={(event) => setTextField("brand", event)}
                    placeholder="Например, Genesis"
                    autoComplete="off"
                    maxLength={80}
                  />
                </Field>

                <Field label="Модель" required>
                  <input
                    value={form.model}
                    onChange={(event) => setTextField("model", event)}
                    placeholder="GV80"
                    autoComplete="off"
                    maxLength={100}
                  />
                </Field>

                <Field label="Год">
                  <input
                    value={form.year}
                    onChange={(event) => setTextField("year", event)}
                    placeholder="2026"
                    inputMode="numeric"
                    maxLength={4}
                  />
                </Field>

                <Field label="Комплектация">
                  <input
                    value={form.trim}
                    onChange={(event) => setTextField("trim", event)}
                    placeholder="3.5T Prestige"
                    maxLength={120}
                  />
                </Field>

                <Field label="VIN">
                  <input
                    value={form.vin}
                    onChange={(event) => setTextField("vin", event)}
                    placeholder="17 символов"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={17}
                  />
                </Field>

                <Field label="Внутренний номер">
                  <input
                    value={form.stockNumber}
                    onChange={(event) => setTextField("stockNumber", event)}
                    placeholder="Например, ASU-1024"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    maxLength={80}
                  />
                </Field>

                <Field label="Дата прибытия" wide>
                  <input
                    type="date"
                    value={form.arrivalDate}
                    onChange={(event) => setTextField("arrivalDate", event)}
                  />
                </Field>
              </div>

              <div className={styles.choiceBlock}>
                <p>Статус</p>
                <div className={styles.choiceGrid}>
                  {STATUS_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      className={form.status === item.value ? styles.choiceActive : styles.choice}
                      type="button"
                      onClick={() => {
                        setForm((current) => ({ ...current, status: item.value }));
                        setError(null);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.choiceBlock}>
                <p>Страна поставки</p>
                <div className={styles.choiceGrid}>
                  {COUNTRY_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      className={
                        form.countryCode === item.value ? styles.choiceActive : styles.choice
                      }
                      type="button"
                      onClick={() => {
                        setForm((current) => ({ ...current, countryCode: item.value }));
                        setError(null);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className={styles.stepPanel}>
              <div className={styles.fieldGrid}>
                <Field label="Пробег, км">
                  <input
                    value={form.mileageKm}
                    onChange={(event) => setTextField("mileageKm", event)}
                    placeholder="0"
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Количество мест">
                  <input
                    value={form.seats}
                    onChange={(event) => setTextField("seats", event)}
                    placeholder="5"
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Топливо">
                  <select
                    value={form.fuelType}
                    onChange={(event) => setTextField("fuelType", event)}
                  >
                    <option value="">Не указано</option>
                    <option value="gasoline">Бензин</option>
                    <option value="diesel">Дизель</option>
                    <option value="hybrid">Гибрид</option>
                    <option value="phev">Plug-in Hybrid</option>
                    <option value="electric">Электро</option>
                  </select>
                </Field>

                <Field label="Привод">
                  <select
                    value={form.driveType}
                    onChange={(event) => setTextField("driveType", event)}
                  >
                    <option value="">Не указано</option>
                    <option value="FWD">FWD</option>
                    <option value="RWD">RWD</option>
                    <option value="AWD">AWD</option>
                    <option value="4WD">4WD</option>
                  </select>
                </Field>

                <Field label="Коробка передач">
                  <select
                    value={form.transmission}
                    onChange={(event) => setTextField("transmission", event)}
                  >
                    <option value="">Не указано</option>
                    <option value="automatic">Автомат</option>
                    <option value="robot">Робот</option>
                    <option value="cvt">Вариатор</option>
                    <option value="manual">Механика</option>
                  </select>
                </Field>

                <Field label="Двигатель">
                  <input
                    value={form.engineText}
                    onChange={(event) => setTextField("engineText", event)}
                    placeholder="3.5T V6 / 375 л.с."
                    maxLength={180}
                  />
                </Field>

                <Field label="Цвет кузова">
                  <input
                    value={form.exteriorColor}
                    onChange={(event) => setTextField("exteriorColor", event)}
                    placeholder="Чёрный"
                    maxLength={100}
                  />
                </Field>

                <Field label="Цвет салона">
                  <input
                    value={form.interiorColor}
                    onChange={(event) => setTextField("interiorColor", event)}
                    placeholder="Чёрный / коричневый"
                    maxLength={100}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className={styles.stepPanel}>
              <div className={styles.priceGrid}>
                <Field label="Цена">
                  <input
                    value={form.price}
                    onChange={(event) => setTextField("price", event)}
                    placeholder={form.priceOnRequest ? "Цена по запросу" : "Например, 89000"}
                    inputMode="numeric"
                    disabled={form.priceOnRequest}
                  />
                </Field>

                <Field label="Валюта">
                  <select
                    value={form.currency}
                    onChange={(event) => setTextField("currency", event)}
                  >
                    <option value="USD">USD</option>
                    <option value="UZS">UZS</option>
                    <option value="EUR">EUR</option>
                  </select>
                </Field>
              </div>

              <div className={styles.switchList}>
                <SwitchRow
                  title="Цена по запросу"
                  description="Публичная цена не будет отображаться."
                  checked={form.priceOnRequest}
                  onChange={(value) => setBooleanField("priceOnRequest", value)}
                />
                <SwitchRow
                  title="Новый автомобиль"
                  description="Машина учитывается как новая, даже если указан технический пробег."
                  checked={form.isNew}
                  onChange={(value) => setBooleanField("isNew", value)}
                />
                <SwitchRow
                  title="Новое поступление"
                  description="Используется для блока последних поступлений."
                  checked={form.isNewArrival}
                  onChange={(value) => setBooleanField("isNewArrival", value)}
                />
                <SwitchRow
                  title="Опубликовать на сайте"
                  description="Пока фотографии не добавлены, безопаснее оставить выключенным."
                  checked={form.isPublic}
                  onChange={(value) => setBooleanField("isPublic", value)}
                />
                <SwitchRow
                  title="Выделить автомобиль"
                  description="Для приоритетного отображения в будущих подборках."
                  checked={form.isFeatured}
                  onChange={(value) => setBooleanField("isFeatured", value)}
                />
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className={styles.stepPanel}>
              <div className={styles.textareaStack}>
                <Field label="Короткое описание — RU">
                  <textarea
                    value={form.shortDescriptionRu}
                    onChange={(event) => setTextField("shortDescriptionRu", event)}
                    placeholder="Короткая строка для карточки автомобиля."
                    rows={3}
                    maxLength={220}
                  />
                </Field>

                <Field label="Короткое описание — UZ">
                  <textarea
                    value={form.shortDescriptionUz}
                    onChange={(event) => setTextField("shortDescriptionUz", event)}
                    placeholder="Avtomobil kartasi uchun qisqa tavsif."
                    rows={3}
                    maxLength={220}
                  />
                </Field>

                <Field label="Полное описание — RU">
                  <textarea
                    value={form.descriptionRu}
                    onChange={(event) => setTextField("descriptionRu", event)}
                    placeholder="Описание автомобиля для русской версии сайта…"
                    rows={6}
                    maxLength={10000}
                  />
                </Field>

                <Field label="Полное описание — UZ">
                  <textarea
                    value={form.descriptionUz}
                    onChange={(event) => setTextField("descriptionUz", event)}
                    placeholder="Saytning o‘zbekcha versiyasi uchun tavsif…"
                    rows={6}
                    maxLength={10000}
                  />
                </Field>
              </div>

              <section className={styles.review}>
                <div>
                  <p>ПРОВЕРКА</p>
                  <h2>
                    {form.brand || "Марка"} {form.model || "Модель"}
                  </h2>
                  <span>
                    {[form.year, form.trim, form.countryCode, form.currency]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>

                <b>
                  {form.priceOnRequest
                    ? "По запросу"
                    : form.price
                      ? new Intl.NumberFormat("ru-RU").format(Number(form.price))
                      : "Цена не указана"}
                </b>
              </section>
            </div>
          ) : null}

          {error ? (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          ) : null}

          <div className={styles.actions}>
            {step > 1 ? (
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={goBackStep}
                disabled={saving}
              >
                Назад
              </button>
            ) : (
              <a className={styles.secondaryButton} href="/admin/cars/">
                Отмена
              </a>
            )}

            {step < 4 ? (
              <button
                className={styles.primaryButton}
                type="button"
                onClick={goNext}
                disabled={!authReady || saving}
              >
                Продолжить
                <ArrowRightIcon />
              </button>
            ) : (
              <button
                className={styles.primaryButton}
                type="submit"
                disabled={!authReady || saving}
              >
                {saving ? "Сохраняем…" : "Добавить автомобиль"}
                {!saving ? <ArrowRightIcon /> : null}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
  required = false,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={`${styles.field} ${wide ? styles.fieldWide : ""}`}>
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      {children}
    </label>
  );
}

function SwitchRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className={styles.switchRow}>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
    </label>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.8 5.2 8 12l6.8 6.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h13M13 7l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.6 8.6 0 1 0 20.2 15.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
