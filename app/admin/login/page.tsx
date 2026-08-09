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
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
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
      // Theme persistence is optional.
    }

    document.documentElement.dataset.asuTheme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    document.body.dataset.asuTheme = nextTheme;

    const themeColor = nextTheme === "light" ? "#f5f5f3" : "#0b0c0d";
    document.documentElement.style.backgroundColor = themeColor;
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
      // Continue to system theme.
    }

    const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    applyTheme(systemDark ? "dark" : "light");
  }, [applyTheme]);

  function toggleTheme() {
    applyTheme(theme === "light" ? "dark" : "light");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
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
      setError("Не удалось связаться с сервером.");
    } finally {
      setLoading(false);
    }
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

          <div className={styles.wordmarkWrap} aria-label="Auto Sale Umar">
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
          </div>

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

      <section className={styles.content}>
        <div className={styles.intro}>
          <div className={styles.pills}>
            <span className={styles.pill}>CONTROL SYSTEM</span>
            <span className={styles.pill}>
              <i className={styles.onlineDot} />
              SECURE ACCESS
            </span>
          </div>

          <p className={styles.eyebrow}>AUTO SALE UMAR</p>
          <h1 className={styles.headline}>
            Управление.
            <br />
            Без лишнего.
          </h1>
          <p className={styles.lead}>
            Закрытая система для команды Auto Sale Umar: сотрудники,
            автомобили, клиенты и операции в одном пространстве.
          </p>
        </div>

        <section className={styles.loginCard} aria-label="Вход в систему">
          <div className={styles.cardTop}>
            <div>
              <p className={styles.cardEyebrow}>ЗАЩИЩЁННЫЙ ВХОД</p>
              <h2 className={styles.cardTitle}>Войти</h2>
            </div>
            <span className={styles.securityBadge}>D1</span>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Электронная почта</span>
              <input
                name="email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="name@example.com"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Пароль</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Введите пароль"
                required
              />
            </label>

            {error ? <p className={styles.error}>{error}</p> : null}

            <button className={styles.submit} type="submit" disabled={loading}>
              <span>{loading ? "Входим…" : "Войти в Control System"}</span>
              <span className={styles.submitArrow} aria-hidden="true">→</span>
            </button>
          </form>

          <div className={styles.cardFooter}>
            <span className={styles.lockDot} aria-hidden="true" />
            <span>Сессия защищена. Доступ только для сотрудников.</span>
          </div>
        </section>
      </section>
    </main>
  );
}
