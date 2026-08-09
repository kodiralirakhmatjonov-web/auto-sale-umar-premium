"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

type Theme = "light" | "dark";
type Language = "ru" | "uz";

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
}

const UZ_COPY: Record<string, string> = {
  "Назад ко входу": "Kirish sahifasiga qaytish",
  "Открыть настройки": "Sozlamalarni ochish",
  "Закрыть настройки": "Sozlamalarni yopish",
  "Настройки": "Sozlamalar",
  "Выберите оформление и язык": "Ko‘rinish va tilni tanlang",
  "Оформление": "Ko‘rinish",
  "Светлая": "Yorug‘",
  "Тёмная": "Tungi",
  "Язык": "Til",
  "Настройки сохраняются автоматически": "Sozlamalar avtomatik saqlanadi",
  "CONTROL SYSTEM · ПЕРВЫЙ ЗАПУСК": "CONTROL SYSTEM · BIRINCHI ISHGA TUSHIRISH",
  "Создайте первый доступ": "Birinchi kirishni yarating",
  "Одно защищённое действие связывает административную панель с вашей D1 и создаёт единственного супер-администратора.":
    "Bitta himoyalangan amal boshqaruv panelini D1 bazangiz bilan bog‘laydi va yagona super-administratorni yaratadi.",
  "ОДНОРАЗОВАЯ НАСТРОЙКА": "BIR MARTALIK SOZLASH",
  "Защищённый старт": "Himoyalangan boshlanish",
  "Форма доступна только до создания первого пользователя.":
    "Shakl faqat birinchi foydalanuvchi yaratilguncha ishlaydi.",
  "Пароль сохраняется в D1 только как защищённый хеш.":
    "Parol D1 bazasida faqat himoyalangan xesh ko‘rinishida saqlanadi.",
  "SETUP_KEY проверяется на сервере и не записывается в базу.":
    "SETUP_KEY serverda tekshiriladi va bazaga yozilmaydi.",
  "Повторный запуск автоматически блокируется.":
    "Takroriy ishga tushirish avtomatik ravishda bloklanadi.",
  "Данные супер-администратора": "Super-administrator ma’lumotlari",
  "Используйте рабочую почту и уникальный пароль длиной не менее 10 символов.":
    "Ishchi elektron pochta va kamida 10 belgidan iborat noyob paroldan foydalaning.",
  "Ваше имя": "Ismingiz",
  "Имя и фамилия": "Ism va familiya",
  "Электронная почта": "Elektron pochta",
  "Новый пароль": "Yangi parol",
  "Не менее 10 символов": "Kamida 10 ta belgi",
  "Повторите пароль": "Parolni takrorlang",
  "Введите пароль ещё раз": "Parolni yana bir bor kiriting",
  "Одноразовый ключ SETUP_KEY": "Bir martalik SETUP_KEY kaliti",
  "Ключ из Cloudflare Pages → Settings → Variables and secrets":
    "Cloudflare Pages → Settings → Variables and secrets bo‘limidagi kalit",
  "Создаём защищённую запись…": "Himoyalangan yozuv yaratilmoqda…",
  "Создать супер-администратора": "Super-administrator yaratish",
  "Пароли не совпадают.": "Parollar bir xil emas.",
  "Не удалось создать супер-администратора.": "Super-administratorni yaratib bo‘lmadi.",
  "Супер-администратор создан.": "Super-administrator yaratildi.",
  "Не удалось связаться с сервером. Проверьте последний Cloudflare-деплой.":
    "Server bilan bog‘lanib bo‘lmadi. Cloudflare’dagi so‘nggi deployni tekshiring.",
  "Готово. Перенаправляем ко входу…": "Tayyor. Kirish sahifasiga o‘tkazilmoqda…",
};

export default function SetupPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("ru");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const t = useCallback(
    (russian: string) => (language === "uz" ? (UZ_COPY[russian] ?? russian) : russian),
    [language],
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const passwordConfirmation = String(form.get("passwordConfirmation") ?? "");

    if (password !== passwordConfirmation) {
      setError(t("Пароли не совпадают."));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: String(form.get("fullName") ?? ""),
          email: String(form.get("email") ?? ""),
          password,
          setupKey: String(form.get("setupKey") ?? ""),
        }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        setError(data.error ?? t("Не удалось создать супер-администратора."));
        return;
      }

      setSuccess(data.message ?? t("Супер-администратор создан."));
      window.setTimeout(() => router.replace("/admin/login/"), 1100);
    } catch {
      setError(t("Не удалось связаться с сервером. Проверьте последний Cloudflare-деплой."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page} data-theme={theme}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <a className={styles.roundControl} href="/admin/login/" aria-label={t("Назад ко входу")}>
            <ChevronLeftIcon />
          </a>

          <a className={styles.wordmarkLink} href="/" aria-label="Auto Sale Umar">
            <img
              className={styles.wordmark}
              src={
                theme === "dark"
                  ? "/brand/asu-wordmark-white.png"
                  : "/brand/asu-wordmark-black.png"
              }
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
            aria-controls="setup-interface-options"
          >
            <MenuIcon open={settingsOpen} />
          </button>
        </div>

        <section
          className={styles.settingsMenu}
          id="setup-interface-options"
          data-open={settingsOpen}
          aria-hidden={!settingsOpen}
          role="dialog"
          aria-modal="true"
          aria-labelledby="setup-options-title"
        >
          <header className={styles.settingsHeader}>
            <p>CONTROL SYSTEM</p>
            <h2 id="setup-options-title">{t("Настройки")}</h2>
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
          <p className={styles.eyebrow}>{t("CONTROL SYSTEM · ПЕРВЫЙ ЗАПУСК")}</p>
          <h1>{t("Создайте первый доступ")}</h1>
          <p className={styles.introText}>
            {t(
              "Одно защищённое действие связывает административную панель с вашей D1 и создаёт единственного супер-администратора.",
            )}
          </p>
        </section>

        <section className={styles.setupCard}>
          <aside className={styles.securityPanel}>
            <div className={styles.securityIcon} aria-hidden="true">
              <ShieldIcon />
            </div>
            <p className={styles.sectionKicker}>{t("ОДНОРАЗОВАЯ НАСТРОЙКА")}</p>
            <h2>{t("Защищённый старт")}</h2>
            <p className={styles.securityLead}>
              {t("Форма доступна только до создания первого пользователя.")}
            </p>

            <ul className={styles.securityList}>
              <li>
                <CheckIcon />
                <span>{t("Пароль сохраняется в D1 только как защищённый хеш.")}</span>
              </li>
              <li>
                <CheckIcon />
                <span>{t("SETUP_KEY проверяется на сервере и не записывается в базу.")}</span>
              </li>
              <li>
                <CheckIcon />
                <span>{t("Повторный запуск автоматически блокируется.")}</span>
              </li>
            </ul>
          </aside>

          <div className={styles.formPanel}>
            <div className={styles.formHeading}>
              <h2>{t("Данные супер-администратора")}</h2>
              <p>
                {t(
                  "Используйте рабочую почту и уникальный пароль длиной не менее 10 символов.",
                )}
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit} aria-busy={loading}>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>{t("Ваше имя")}</span>
                  <input
                    name="fullName"
                    autoComplete="name"
                    placeholder={t("Имя и фамилия")}
                    required
                    minLength={2}
                    maxLength={120}
                  />
                </label>

                <label className={styles.field}>
                  <span>{t("Электронная почта")}</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="name@example.com"
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>{t("Новый пароль")}</span>
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("Не менее 10 символов")}
                    required
                    minLength={10}
                  />
                </label>

                <label className={styles.field}>
                  <span>{t("Повторите пароль")}</span>
                  <input
                    name="passwordConfirmation"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("Введите пароль ещё раз")}
                    required
                    minLength={10}
                  />
                </label>

                <label className={`${styles.field} ${styles.fieldWide}`}>
                  <span>{t("Одноразовый ключ SETUP_KEY")}</span>
                  <div className={styles.keyField}>
                    <KeyIcon />
                    <input
                      name="setupKey"
                      type="password"
                      autoComplete="off"
                      placeholder={t(
                        "Ключ из Cloudflare Pages → Settings → Variables and secrets",
                      )}
                      required
                    />
                  </div>
                </label>
              </div>

              {error ? (
                <p className={styles.error} role="alert">
                  <span aria-hidden="true">!</span>
                  {error}
                </p>
              ) : null}

              {success ? (
                <p className={styles.success} role="status">
                  <CheckIcon />
                  <span>
                    {success} {t("Готово. Перенаправляем ко входу…")}
                  </span>
                </p>
              ) : null}

              <button className={styles.submitButton} type="submit" disabled={loading || Boolean(success)}>
                <span className={styles.submitIcon} aria-hidden="true">
                  {loading ? <span className={styles.spinner} /> : <ArrowRightIcon />}
                </span>
                <span>
                  {loading
                    ? t("Создаём защищённую запись…")
                    : t("Создать супер-администратора")}
                </span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
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

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.8 19 5.6v5.3c0 4.4-2.8 8.2-7 10.3-4.2-2.1-7-5.9-7-10.3V5.6L12 2.8Z" />
      <path d="m8.8 12 2.1 2.1 4.4-4.5" />
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

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8.2" cy="12" r="4.2" />
      <path d="M12.4 12H22M18.2 12v3M15.4 12v2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13.5 6.5 19 12l-5.5 5.5" />
    </svg>
  );
}
