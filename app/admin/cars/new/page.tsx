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
type Language = "ru" | "uz";
type CarStatus =
  | "in_stock"
  | "in_showroom"
  | "in_transit"
  | "made_to_order"
  | "reserved"
  | "sold"
  | "hidden";
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

interface MeResponse {
  success?: boolean;
  error?: string;
  user?: {
    role?: "super_admin" | "admin" | "sales_manager";
  };
}

const BRANDS = [
  { value: "Mercedes-Benz", logo: "/brands/mercedes-benz.jpg" },
  { value: "Range Rover", logo: "/brands/range-rover.png" },
  { value: "Rolls-Royce", logo: "/brands/rolls-royce.png" },
  { value: "Cadillac", logo: "/brands/cadillac.png" },
  { value: "Lexus", logo: "/brands/lexus.png" },
  { value: "Toyota", logo: "/brands/toyota.png" },
  { value: "Genesis", logo: "/brands/genesis.png" },
  { value: "BMW", logo: "/brands/bmw.png" },
  { value: "Lamborghini", logo: "/brands/lamborghini.png" },
] as const;

const STATUS_OPTIONS: Array<{ value: CarStatus; label: Record<Language, string> }> = [
  { value: "in_stock", label: { ru: "В наличии", uz: "Mavjud" } },
  { value: "in_showroom", label: { ru: "В шоуруме", uz: "Shourumda" } },
  { value: "in_transit", label: { ru: "В пути", uz: "Yo‘lda" } },
  { value: "made_to_order", label: { ru: "Под заказ", uz: "Buyurtma asosida" } },
  { value: "reserved", label: { ru: "Резерв", uz: "Band qilingan" } },
  { value: "sold", label: { ru: "Продан", uz: "Sotilgan" } },
  { value: "hidden", label: { ru: "Скрыт", uz: "Yashirilgan" } },
];

const COUNTRY_OPTIONS = [
  { value: "KR", label: { ru: "Корея", uz: "Koreya" } },
  { value: "US", label: { ru: "США", uz: "AQSh" } },
  { value: "CA", label: { ru: "Канада", uz: "Kanada" } },
  { value: "AE", label: { ru: "ОАЭ", uz: "BAA" } },
] as const;

const UZ_COPY: Record<string, string> = {
  "Не удалось проверить защищённую сессию.": "Himoyalangan sessiyani tekshirib bo‘lmadi.",
  "У вашей роли нет права добавлять автомобили.":
    "Sizning rolingizga avtomobil qo‘shish huquqi berilmagan.",
  "Выберите марку автомобиля.": "Avtomobil brendini tanlang.",
  "Укажите модель автомобиля.": "Avtomobil modelini kiriting.",
  "Проверьте год автомобиля.": "Avtomobil yilini tekshiring.",
  "VIN должен содержать 11–17 допустимых латинских символов и цифр.":
    "VIN 11–17 ta ruxsat etilgan lotin harfi va raqamdan iborat bo‘lishi kerak.",
  "Проверьте дату прибытия.": "Yetib kelish sanasini tekshiring.",
  "Проверьте пробег.": "Yurgan masofani tekshiring.",
  "Проверьте количество мест.": "O‘rindiqlar sonini tekshiring.",
  "Цена должна быть целым положительным числом.":
    "Narx musbat butun son bo‘lishi kerak.",
  "Не удалось добавить автомобиль.": "Avtomobilni qo‘shib bo‘lmadi.",
  "D1 не подтвердил ID созданного автомобиля. Переход отменён.":
    "D1 yaratilgan avtomobil ID raqamini tasdiqlamadi. O‘tish bekor qilindi.",
  "Проверка сессии": "Sessiya tekshirilmoqda",
  "Назад к автомобилям": "Avtomobillarga qaytish",
  "Открыть настройки": "Sozlamalarni ochish",
  "Закрыть настройки": "Sozlamalarni yopish",
  "Настройки": "Sozlamalar",
  "Выберите оформление и язык": "Ko‘rinish va tilni tanlang",
  "Оформление": "Ko‘rinish",
  "Светлая": "Yorug‘",
  "Тёмная": "Tungi",
  "Язык": "Til",
  "Настройки сохраняются автоматически": "Sozlamalar avtomatik saqlanadi",
  "CONTROL SYSTEM · АВТОМОБИЛИ": "CONTROL SYSTEM · AVTOMOBILLAR",
  "Новый автомобиль": "Yangi avtomobil",
  "Одна форма. После сохранения автомобиль появится в D1 только после подтверждённой записи.":
    "Bitta shakl. Saqlangandan keyin avtomobil faqat D1 yozuvni tasdiqlagach paydo bo‘ladi.",
  "Автомобиль": "Avtomobil",
  "Сначала выберите марку, затем укажите модель.":
    "Avval brendni tanlang, keyin modelni kiriting.",
  "Марка автомобиля": "Avtomobil brendi",
  "Марка": "Brend",
  "Выберите выше": "Yuqoridan tanlang",
  "Модель *": "Model *",
  "Комплектация": "Komplektatsiya",
  "Год": "Yil",
  "Внутренний номер": "Ichki raqam",
  "Поставка": "Yetkazib berish",
  "Статус и источник поставки используются в каталоге и фильтрах.":
    "Holat va yetkazib berish manbasi katalog hamda filtrlarda ishlatiladi.",
  "Статус": "Holat",
  "Страна поставки": "Yetkazib beruvchi davlat",
  "Дата прибытия": "Yetib kelish sanasi",
  "Пробег, км": "Yurgan masofa, km",
  "Характеристики": "Xususiyatlar",
  "Основные данные, которые будут видны в карточке автомобиля.":
    "Avtomobil kartasida ko‘rinadigan asosiy ma’lumotlar.",
  "Двигатель": "Dvigatel",
  "Топливо": "Yoqilg‘i",
  "Не указано": "Ko‘rsatilmagan",
  "Бензин": "Benzin",
  "Дизель": "Dizel",
  "Гибрид": "Gibrid",
  "Plug-in гибрид": "Plug-in gibrid",
  "Электро": "Elektr",
  "Привод": "Uzatma turi",
  "Коробка": "Uzatmalar qutisi",
  "Автомат": "Avtomat",
  "Робот": "Robot",
  "Вариатор": "Variator",
  "Механика": "Mexanika",
  "Мест": "O‘rindiqlar",
  "Цвет кузова": "Kuzov rangi",
  "Цвет салона": "Salon rangi",
  "Цена и публикация": "Narx va e’lon",
  "По умолчанию автомобиль не публикуется до добавления фотографий.":
    "Standart holatda suratlar qo‘shilmaguncha avtomobil e’lon qilinmaydi.",
  "Цена": "Narx",
  "Валюта": "Valyuta",
  "Цена по запросу": "Narx so‘rov asosida",
  "Вместо числа в публичной карточке показывается запрос цены.":
    "Ommaviy kartada raqam o‘rniga narx so‘rovi ko‘rsatiladi.",
  "Используется для классификации автомобиля.": "Avtomobilni tasniflash uchun ishlatiladi.",
  "Новое поступление": "Yangi kelgan",
  "Разрешает выводить автомобиль в блоке последних поступлений.":
    "Avtomobilni so‘nggi kelganlar bo‘limida ko‘rsatishga ruxsat beradi.",
  "Рекомендуемый": "Tavsiya etilgan",
  "Поднимает автомобиль выше в административном каталоге.":
    "Avtomobilni boshqaruv katalogida yuqoriroqqa chiqaradi.",
  "Опубликовать на сайте": "Saytda e’lon qilish",
  "Оставьте выключенным, пока не добавлены качественные фотографии.":
    "Sifatli suratlar qo‘shilmaguncha o‘chiq qoldiring.",
  "Описание": "Tavsif",
  "Русская и узбекская версии хранятся отдельно.":
    "Ruscha va o‘zbekcha versiyalar alohida saqlanadi.",
  "Коротко · RU": "Qisqa · RU",
  "Краткое описание для карточки": "Karta uchun qisqa tavsif",
  "Описание · RU": "Tavsif · RU",
  "Полное описание автомобиля": "Avtomobilning to‘liq tavsifi",
  "Марка не выбрана": "Brend tanlanmagan",
  "НОВЫЙ АВТОМОБИЛЬ": "YANGI AVTOMOBIL",
  "Сохраняем в D1…": "D1 bazasiga saqlanmoqda…",
  "Сохранить автомобиль": "Avtomobilni saqlash",
  "Автомобиль сохранён": "Avtomobil saqlandi",
  "D1 подтвердил запись": "D1 yozuvni tasdiqladi",
};

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
  const [language, setLanguage] = useState<Language>("ru");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdCar, setCreatedCar] = useState<{ id: number; title: string } | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const t = useCallback(
    (russian: string) => (language === "uz" ? (UZ_COPY[russian] ?? russian) : russian),
    [language],
  );

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

  const applyLanguage = useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;

    try {
      localStorage.setItem("asu-language", nextLanguage);
    } catch {
      // The browser language remains the fallback.
    }
  }, []);

  useEffect(() => {
    let nextLanguage: Language = navigator.language.toLowerCase().startsWith("uz") ? "uz" : "ru";

    try {
      const stored = localStorage.getItem("asu-language");
      if (stored === "ru" || stored === "uz") nextLanguage = stored;
    } catch {
      // Continue with the browser language.
    }

    applyLanguage(nextLanguage);
  }, [applyLanguage]);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        const response = await fetch("/api/me", {
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const data = (await response.json().catch(() => null)) as MeResponse | null;

        if (response.status === 401) {
          location.replace("/admin/login/");
          return;
        }

        if (!response.ok) {
          throw new Error(data?.error || t("Не удалось проверить защищённую сессию."));
        }

        if (data?.user?.role !== "super_admin" && data?.user?.role !== "admin") {
          throw new Error(t("У вашей роли нет права добавлять автомобили."));
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
              : t("Не удалось проверить защищённую сессию."),
          );
        }
      }
    }

    void verifySession();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!error) return;
    errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  useEffect(() => {
    if (!settingsOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);

  function changeTheme(nextTheme: Theme) {
    if (nextTheme === theme) return;

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
    if (!form.brand) return t("Выберите марку автомобиля.");
    if (!form.model.trim()) return t("Укажите модель автомобиля.");

    if (form.year) {
      const year = Number(form.year);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        return t("Проверьте год автомобиля.");
      }
    }

    const vin = form.vin.trim().toUpperCase();
    if (vin && !/^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin)) {
      return t("VIN должен содержать 11–17 допустимых латинских символов и цифр.");
    }

    if (form.arrivalDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.arrivalDate)) {
      return t("Проверьте дату прибытия.");
    }

    if (form.mileageKm) {
      const mileage = Number(form.mileageKm);
      if (!Number.isSafeInteger(mileage) || mileage < 0) return t("Проверьте пробег.");
    }

    if (form.seats) {
      const seats = Number(form.seats);
      if (!Number.isInteger(seats) || seats < 1 || seats > 99) {
        return t("Проверьте количество мест.");
      }
    }

    if (!form.priceOnRequest && form.price) {
      const price = Number(form.price);
      if (!Number.isSafeInteger(price) || price < 0) {
        return t("Цена должна быть целым положительным числом.");
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
        throw new Error(data?.error || t("Не удалось добавить автомобиль."));
      }

      const createdId = data.car?.id;
      if (!Number.isInteger(createdId) || !createdId) {
        throw new Error(t("D1 не подтвердил ID созданного автомобиля. Переход отменён."));
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
          : t("Не удалось добавить автомобиль."),
      );
    } finally {
      setSaving(false);
    }
  }

  if (!authReady && !error) {
    return (
      <main className={styles.loadingPage} data-theme={theme}>
        <div className={styles.loadingDot} aria-label={t("Проверка сессии")} />
      </main>
    );
  }

  return (
    <main className={styles.page} data-theme={theme}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <a
            className={styles.roundControl}
            href="/admin/cars/"
            aria-label={t("Назад к автомобилям")}
          >
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
            data-active={settingsOpen}
            onClick={() => setSettingsOpen((current) => !current)}
            aria-label={settingsOpen ? t("Закрыть настройки") : t("Открыть настройки")}
            aria-expanded={settingsOpen}
            aria-controls="new-car-interface-options"
          >
            <MenuIcon open={settingsOpen} />
          </button>
        </div>

        <section
          className={styles.settingsMenu}
          id="new-car-interface-options"
          data-open={settingsOpen}
          aria-hidden={!settingsOpen}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-car-options-title"
        >
          <header className={styles.settingsHeader}>
            <p>CONTROL SYSTEM</p>
            <h2 id="new-car-options-title">{t("Настройки")}</h2>
            <span>{t("Выберите оформление и язык")}</span>
          </header>

          <div className={styles.settingsContent}>
            <div className={styles.settingsBlock}>
              <span className={styles.settingsLabel}>{t("Оформление")}</span>
              <div className={styles.settingsSegments}>
                <button
                  type="button"
                  data-selected={theme === "light"}
                  onClick={() => changeTheme("light")}
                  aria-pressed={theme === "light"}
                  tabIndex={settingsOpen ? 0 : -1}
                >
                  <SunIcon />
                  <span>{t("Светлая")}</span>
                </button>
                <button
                  type="button"
                  data-selected={theme === "dark"}
                  onClick={() => changeTheme("dark")}
                  aria-pressed={theme === "dark"}
                  tabIndex={settingsOpen ? 0 : -1}
                >
                  <MoonIcon />
                  <span>{t("Тёмная")}</span>
                </button>
              </div>
            </div>

            <div className={styles.settingsBlock}>
              <span className={styles.settingsLabel}>{t("Язык")}</span>
              <div className={styles.settingsSegments}>
                <button
                  type="button"
                  data-selected={language === "ru"}
                  onClick={() => applyLanguage("ru")}
                  aria-pressed={language === "ru"}
                  tabIndex={settingsOpen ? 0 : -1}
                >
                  Русский
                </button>
                <button
                  type="button"
                  data-selected={language === "uz"}
                  onClick={() => applyLanguage("uz")}
                  aria-pressed={language === "uz"}
                  tabIndex={settingsOpen ? 0 : -1}
                >
                  O‘zbekcha
                </button>
              </div>
            </div>
          </div>

          <footer className={styles.settingsFooter}>
            {t("Настройки сохраняются автоматически")}
          </footer>
        </section>
      </header>

      <button
        className={styles.settingsBackdrop}
        data-open={settingsOpen}
        type="button"
        onClick={() => setSettingsOpen(false)}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className={styles.shell}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>{t("CONTROL SYSTEM · АВТОМОБИЛИ")}</p>
          <h1>{t("Новый автомобиль")}</h1>
          <p className={styles.introText}>
            {t("Одна форма. После сохранения автомобиль появится в D1 только после подтверждённой записи.")}
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
                <h2>{t("Автомобиль")}</h2>
              </div>
              <p>{t("Сначала выберите марку, затем укажите модель.")}</p>
            </div>

            <div
              className={styles.brandRail}
              role="listbox"
              aria-label={t("Марка автомобиля")}
            >
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
                    <span className={styles.brandLogoWrap} aria-hidden="true">
                      <img
                        className={styles.brandLogo}
                        src={brand.logo}
                        alt=""
                        draggable={false}
                      />
                    </span>
                    <span className={styles.brandName}>{brand.value}</span>
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
                <span>{t("Марка")}</span>
                <input
                  value={selectedBrand?.value ?? ""}
                  readOnly
                  placeholder={t("Выберите выше")}
                />
              </label>

              <label className={styles.field}>
                <span>{t("Модель *")}</span>
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
                <span>{t("Комплектация")}</span>
                <input
                  value={form.trim}
                  onChange={(event) => setText("trim", event)}
                  placeholder="3.5T AWD Prestige"
                />
              </label>

              <label className={styles.field}>
                <span>{t("Год")}</span>
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
                <span>{t("Внутренний номер")}</span>
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
                <h2>{t("Поставка")}</h2>
              </div>
              <p>{t("Статус и источник поставки используются в каталоге и фильтрах.")}</p>
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>{t("Статус")}</span>
              <div className={styles.segmentGrid}>
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.segment} ${form.status === option.value ? styles.segmentActive : ""}`}
                    onClick={() => setForm((current) => ({ ...current, status: option.value }))}
                  >
                    {option.label[language]}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>{t("Страна поставки")}</span>
              <div className={styles.segmentGrid}>
                {COUNTRY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.segment} ${form.countryCode === option.value ? styles.segmentActive : ""}`}
                    onClick={() => setForm((current) => ({ ...current, countryCode: option.value }))}
                  >
                    {option.label[language]}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>{t("Дата прибытия")}</span>
                <input
                  className={styles.dateInput}
                  type="date"
                  value={form.arrivalDate}
                  onChange={(event) => setText("arrivalDate", event)}
                />
              </label>

              <label className={styles.field}>
                <span>{t("Пробег, км")}</span>
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
                <h2>{t("Характеристики")}</h2>
              </div>
              <p>{t("Основные данные, которые будут видны в карточке автомобиля.")}</p>
            </div>

            <div className={styles.fieldGrid}>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>{t("Двигатель")}</span>
                <input
                  value={form.engineText}
                  onChange={(event) => setText("engineText", event)}
                  placeholder="3.5 T-GDI · 375 л.с."
                />
              </label>

              <label className={styles.field}>
                <span>{t("Топливо")}</span>
                <select value={form.fuelType} onChange={(event) => setText("fuelType", event)}>
                  <option value="">{t("Не указано")}</option>
                  <option value="gasoline">{t("Бензин")}</option>
                  <option value="diesel">{t("Дизель")}</option>
                  <option value="hybrid">{t("Гибрид")}</option>
                  <option value="phev">{t("Plug-in гибрид")}</option>
                  <option value="electric">{t("Электро")}</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>{t("Привод")}</span>
                <select value={form.driveType} onChange={(event) => setText("driveType", event)}>
                  <option value="">{t("Не указано")}</option>
                  <option value="AWD">AWD</option>
                  <option value="4WD">4WD</option>
                  <option value="RWD">RWD</option>
                  <option value="FWD">FWD</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>{t("Коробка")}</span>
                <select value={form.transmission} onChange={(event) => setText("transmission", event)}>
                  <option value="">{t("Не указано")}</option>
                  <option value="automatic">{t("Автомат")}</option>
                  <option value="robot">{t("Робот")}</option>
                  <option value="cvt">{t("Вариатор")}</option>
                  <option value="manual">{t("Механика")}</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>{t("Мест")}</span>
                <input
                  value={form.seats}
                  onChange={(event) => setText("seats", event)}
                  inputMode="numeric"
                  placeholder="5"
                />
              </label>

              <label className={styles.field}>
                <span>{t("Цвет кузова")}</span>
                <input
                  value={form.exteriorColor}
                  onChange={(event) => setText("exteriorColor", event)}
                  placeholder="Uyuni White"
                />
              </label>

              <label className={styles.field}>
                <span>{t("Цвет салона")}</span>
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
                <h2>{t("Цена и публикация")}</h2>
              </div>
              <p>{t("По умолчанию автомобиль не публикуется до добавления фотографий.")}</p>
            </div>

            <div className={styles.priceRow}>
              <label className={`${styles.field} ${styles.priceField}`}>
                <span>{t("Цена")}</span>
                <input
                  value={form.price}
                  onChange={(event) => setText("price", event)}
                  inputMode="numeric"
                  placeholder="125000"
                  disabled={form.priceOnRequest}
                />
              </label>

              <label className={`${styles.field} ${styles.currencyField}`}>
                <span>{t("Валюта")}</span>
                <select value={form.currency} onChange={(event) => setText("currency", event)}>
                  <option value="USD">USD</option>
                  <option value="UZS">UZS</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>
            </div>

            <div className={styles.switchList}>
              <SwitchRow
                label={t("Цена по запросу")}
                detail={t("Вместо числа в публичной карточке показывается запрос цены.")}
                checked={form.priceOnRequest}
                onChange={(checked) => setForm((current) => ({ ...current, priceOnRequest: checked }))}
              />
              <SwitchRow
                label={t("Новый автомобиль")}
                detail={t("Используется для классификации автомобиля.")}
                checked={form.isNew}
                onChange={(checked) => setForm((current) => ({ ...current, isNew: checked }))}
              />
              <SwitchRow
                label={t("Новое поступление")}
                detail={t("Разрешает выводить автомобиль в блоке последних поступлений.")}
                checked={form.isNewArrival}
                onChange={(checked) => setForm((current) => ({ ...current, isNewArrival: checked }))}
              />
              <SwitchRow
                label={t("Рекомендуемый")}
                detail={t("Поднимает автомобиль выше в административном каталоге.")}
                checked={form.isFeatured}
                onChange={(checked) => setForm((current) => ({ ...current, isFeatured: checked }))}
              />
              <SwitchRow
                label={t("Опубликовать на сайте")}
                detail={t("Оставьте выключенным, пока не добавлены качественные фотографии.")}
                checked={form.isPublic}
                onChange={(checked) => setForm((current) => ({ ...current, isPublic: checked }))}
              />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionKicker}>05</p>
                <h2>{t("Описание")}</h2>
              </div>
              <p>{t("Русская и узбекская версии хранятся отдельно.")}</p>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>{t("Коротко · RU")}</span>
                <textarea
                  className={styles.shortTextarea}
                  value={form.shortDescriptionRu}
                  onChange={(event) => setText("shortDescriptionRu", event)}
                  placeholder={t("Краткое описание для карточки")}
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
                <span>{t("Описание · RU")}</span>
                <textarea
                  value={form.descriptionRu}
                  onChange={(event) => setText("descriptionRu", event)}
                  placeholder={t("Полное описание автомобиля")}
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
              <span>{form.brand || t("Марка не выбрана")}</span>
              <strong>{form.model || t("НОВЫЙ АВТОМОБИЛЬ")}</strong>
            </div>
            <button className={styles.saveButton} type="submit" disabled={saving || !authReady}>
              {saving ? <span className={styles.spinner} aria-hidden="true" /> : <CheckIcon />}
              <span>{saving ? t("Сохраняем в D1…") : t("Сохранить автомобиль")}</span>
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
            <p>{t("Автомобиль сохранён")}</p>
            <h2>{createdCar.title}</h2>
            <span>{t("D1 подтвердил запись")} · ID {createdCar.id}</span>
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

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={styles.menuGlyph} data-open={open} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
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
