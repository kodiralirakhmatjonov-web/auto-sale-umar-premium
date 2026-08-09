"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

type Theme = "light" | "dark";

interface LoginResponse {
  success: boolean;
  error?: string;
}

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  function toggleTheme() {
    applyTheme(theme === "light" ? "dark" : "light");
  }

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
        setError(data.error ?? "Не удалось войти.");
        return;
      }

      router.replace("/admin/staff/");
      router.refresh();
    } catch {
      setError("Нет связи с сервером. Проверьте подключение и повторите вход.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page} data-theme={theme}>
      <div className={styles.mediaLayer} aria-hidden="true" />

      <header className={styles.toolbar}>
        <a className={styles.toolbarButton} href="/" aria-label="Вернуться на сайт">
          <ArrowLeftIcon />
        </a>

        <a className={styles.wordmarkWrap} href="/" aria-label="Auto Sale Umar — на главную">
          <img src="/brand/asu-wordmark-white.png" alt="Auto Sale Umar" />
        </a>

        <button
          className={styles.toolbarButton}
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
          aria-pressed={theme === "dark"}
        >
          <span className={styles.iconStage}>
            <span className={styles.moonIcon}><MoonIcon /></span>
            <span className={styles.sunIcon}><SunIcon /></span>
          </span>
        </button>
      </header>

      <section className={styles.content}>
        <section className={styles.loginSheet} aria-labelledby="login-title">
          <div className={styles.sheetHeading}>
            <p><span aria-hidden="true" /> CONTROL SYSTEM</p>
            <h1 id="login-title">Войти</h1>
            <div>Управление Auto Sale Umar доступно только сотрудникам.</div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} aria-busy={loading}>
            <div className={styles.formGroup}>
              <label className={styles.field}>
                <span>Электронная почта</span>
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
                <span>Пароль</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  enterKeyHint="go"
                  placeholder="Введите пароль"
                  required
                />
              </label>
            </div>

            {error ? <p className={styles.error} role="alert" aria-live="polite">{error}</p> : null}

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? (
                <><span className={styles.spinner} aria-hidden="true" /> Проверяем…</>
              ) : (
                "Войти"
              )}
            </button>
          </form>

          <footer className={styles.sheetFooter}>
            <LockIcon />
            <span>Защищённая сессия</span>
          </footer>
        </section>
      </section>
    </main>
  );
}
