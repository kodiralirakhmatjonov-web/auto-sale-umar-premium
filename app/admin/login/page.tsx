"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

type Theme = "light" | "dark";
type Language = "ru" | "uz";

type StaffRole = "super_admin" | "admin" | "sales_manager";

interface LoginResponse {
  success: boolean;
  error?: string;
  user?: { role?: StaffRole };
}

interface MeResponse {
  success?: boolean;
  user?: { role?: StaffRole };
}

const copy = {
  ru: {
    back: "Вернуться на сайт",
    home: "Auto Sale Umar — на главную",
    options: "Открыть настройки",
    closeOptions: "Закрыть настройки",
    menuTitle: "Настройки",
    menuSubtitle: "Выберите оформление и язык",
    saved: "Настройки сохраняются автоматически",
    appearance: "Оформление",
    light: "Светлая",
    dark: "Тёмная",
    language: "Язык",
    russian: "Русский",
    uzbek: "O‘zbekcha",
    title: "Войти",
    description: "Управление Auto Sale Umar доступно только сотрудникам.",
    email: "Электронная почта",
    password: "Пароль",
    passwordPlaceholder: "Введите пароль",
    submitting: "Проверяем…",
    submit: "Войти",
    session: "Защищённая сессия",
    loginError: "Не удалось войти.",
    networkError: "Нет связи с сервером. Проверьте подключение и повторите вход.",
  },
  uz: {
    back: "Saytga qaytish",
    home: "Auto Sale Umar — bosh sahifa",
    options: "Sozlamalarni ochish",
    closeOptions: "Sozlamalarni yopish",
    menuTitle: "Sozlamalar",
    menuSubtitle: "Ko‘rinish va tilni tanlang",
    saved: "Sozlamalar avtomatik saqlanadi",
    appearance: "Ko‘rinish",
    light: "Yorug‘",
    dark: "Tungi",
    language: "Til",
    russian: "Русский",
    uzbek: "O‘zbekcha",
    title: "Kirish",
    description: "Auto Sale Umar boshqaruvi faqat xodimlar uchun.",
    email: "Elektron pochta",
    password: "Parol",
    passwordPlaceholder: "Parolni kiriting",
    submitting: "Tekshirilmoqda…",
    submit: "Kirish",
    session: "Himoyalangan seans",
    loginError: "Elektron pochta yoki parol noto‘g‘ri.",
    networkError: "Server bilan aloqa yo‘q. Internetni tekshirib, qayta urinib ko‘ring.",
  },
} as const;

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.2 15.1A8.6 8.6 0 0 1 8.9 3.8 8.7 8.7 0 1 0 20.2 15.1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.4V5M12 19v2.6M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.4 12H5M19 12h2.6M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.8 5.5 8.3 12l6.5 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="5.25"
        y="10.25"
        width="13.5"
        height="10"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8.4 10.25V7.8a3.6 3.6 0 0 1 7.2 0v2.45"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("ru");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const text = copy[language];

  const applyTheme = useCallback((nextTheme: Theme) => {
    setTheme(nextTheme);

    try {
      window.localStorage.setItem("asu-theme", nextTheme);
    } catch {
      // The system preference remains the fallback.
    }

    document.documentElement.dataset.asuTheme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    document.documentElement.style.backgroundColor = "#000000";
    document.body.dataset.asuTheme = nextTheme;
    document.body.style.backgroundColor = "#000000";

    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = "#000000";
  }, []);

  useEffect(() => {
    const rootTheme = document.documentElement.dataset.asuTheme;
    if (rootTheme === "light" || rootTheme === "dark") {
      applyTheme(rootTheme);
      return;
    }

    try {
      const stored = window.localStorage.getItem("asu-theme");
      if (stored === "light" || stored === "dark") {
        applyTheme(stored);
        return;
      }
    } catch {
      // Continue with the system preference.
    }

    const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    applyTheme(systemDark ? "dark" : "light");
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
    let cancelled = false;
    fetch("/api/me", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => ({ response, data: await response.json().catch(() => null) as MeResponse | null }))
      .then(({ response, data }) => {
        if (cancelled || !response.ok || !data?.user?.role) return;
        router.replace(data.user.role === "sales_manager" ? "/admin/cars/" : "/admin/staff/");
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnOutsidePress(event: PointerEvent) {
      if (!toolbarRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });

      const data = (await response.json()) as LoginResponse;
      if (!response.ok || !data.success) {
        setError(language === "uz" ? text.loginError : (data.error ?? text.loginError));
        return;
      }

      const destination = data.user?.role === "sales_manager"
        ? "/admin/cars/"
        : "/admin/staff/";
      router.replace(destination);
      router.refresh();
    } catch {
      setError(text.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page} data-theme={theme}>
      <div className={styles.mediaLayer} aria-hidden="true" />

      <div className={styles.toolbarShell} ref={toolbarRef}>
        <header className={styles.toolbar}>
          <a className={styles.toolbarButton} href="/" aria-label={text.back}>
            <ArrowLeftIcon />
          </a>

          <a className={styles.wordmarkWrap} href="/" aria-label={text.home}>
            <img src="/brand/asu-wordmark-white.png" alt="Auto Sale Umar" />
          </a>

          <button
            className={styles.toolbarButton}
            data-active={menuOpen}
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? text.closeOptions : text.options}
            aria-expanded={menuOpen}
            aria-controls="login-interface-options"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </header>

        <section
          className={styles.optionsMenu}
          id="login-interface-options"
          data-open={menuOpen}
          aria-hidden={!menuOpen}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-options-title"
        >
          <header className={styles.menuHeader}>
            <p>CONTROL SYSTEM</p>
            <h2 className={styles.menuTitle} id="login-options-title">{text.menuTitle}</h2>
            <span>{text.menuSubtitle}</span>
          </header>

          <div className={styles.menuContent}>
            <div className={styles.optionBlock}>
              <span className={styles.optionLabel}>{text.appearance}</span>
              <div className={styles.segmentedControl}>
                <button
                  type="button"
                  data-selected={theme === "light"}
                  onClick={() => applyTheme("light")}
                  aria-pressed={theme === "light"}
                  tabIndex={menuOpen ? 0 : -1}
                >
                  <SunIcon />
                  <span>{text.light}</span>
                </button>
                <button
                  type="button"
                  data-selected={theme === "dark"}
                  onClick={() => applyTheme("dark")}
                  aria-pressed={theme === "dark"}
                  tabIndex={menuOpen ? 0 : -1}
                >
                  <MoonIcon />
                  <span>{text.dark}</span>
                </button>
              </div>
            </div>

            <div className={styles.optionBlock}>
              <span className={styles.optionLabel}>{text.language}</span>
              <div className={styles.segmentedControl}>
                <button
                  type="button"
                  data-selected={language === "ru"}
                  onClick={() => applyLanguage("ru")}
                  aria-pressed={language === "ru"}
                  tabIndex={menuOpen ? 0 : -1}
                >
                  <span>{text.russian}</span>
                </button>
                <button
                  type="button"
                  data-selected={language === "uz"}
                  onClick={() => applyLanguage("uz")}
                  aria-pressed={language === "uz"}
                  tabIndex={menuOpen ? 0 : -1}
                >
                  <span>{text.uzbek}</span>
                </button>
              </div>
            </div>
          </div>

          <footer className={styles.menuFooter}>{text.saved}</footer>
        </section>
      </div>

      <button
        className={styles.menuBackdrop}
        data-open={menuOpen}
        type="button"
        onClick={() => setMenuOpen(false)}
        tabIndex={-1}
        aria-hidden="true"
      />

      <section className={styles.content}>
        <section className={styles.loginSheet} aria-labelledby="login-title">
          <div className={styles.sheetHeading}>
            <p><span aria-hidden="true" /> CONTROL SYSTEM</p>
            <h1 id="login-title">{text.title}</h1>
            <div>{text.description}</div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} aria-busy={loading}>
            <div className={styles.formGroup}>
              <label className={styles.field}>
                <span>{text.email}</span>
                <input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="email"
                  enterKeyHint="next"
                  placeholder="name@example.com"
                  required
                />
              </label>

              <span className={styles.fieldDivider} aria-hidden="true" />

              <label className={styles.field}>
                <span>{text.password}</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  enterKeyHint="go"
                  placeholder={text.passwordPlaceholder}
                  required
                />
              </label>
            </div>

            {error ? <p className={styles.error} role="alert" aria-live="polite">{error}</p> : null}

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? (
                <><span className={styles.spinner} aria-hidden="true" /> {text.submitting}</>
              ) : (
                text.submit
              )}
            </button>
          </form>

          <footer className={styles.sheetFooter}>
            <LockIcon />
            <span>{text.session}</span>
          </footer>
        </section>
      </section>
    </main>
  );
}
