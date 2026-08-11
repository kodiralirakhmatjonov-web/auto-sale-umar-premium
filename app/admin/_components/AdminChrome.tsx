"use client";

import { ArrowLeft, ExternalLink, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./admin-chrome.module.css";

export type AdminLanguage = "ru" | "uz";
export type AdminTheme = "light" | "dark";
export type AdminRole = "super_admin" | "admin" | "sales_manager" | null;
export type AdminSection = "staff" | "cars" | "home" | "visits";

interface AdminChromeProps {
  current: AdminSection;
  language: AdminLanguage;
  theme: AdminTheme;
  role?: AdminRole;
  backHref?: string;
  onLanguageChange: (language: AdminLanguage) => void;
  onThemeChange: (theme: AdminTheme) => void;
}

const LABELS = {
  ru: {
    staff: "Команда",
    cars: "Автомобили",
    home: "Главная",
    visits: "Визиты",
    settings: "Настройки",
    appearance: "Оформление",
    language: "Язык",
    light: "Светлая",
    dark: "Тёмная",
    publicSite: "Вернуться на сайт",
    open: "Открыть меню",
    close: "Закрыть меню",
  },
  uz: {
    staff: "Jamoa",
    cars: "Avtomobillar",
    home: "Bosh sahifa",
    visits: "Tashriflar",
    settings: "Sozlamalar",
    appearance: "Ko‘rinish",
    language: "Til",
    light: "Yorug‘",
    dark: "Tungi",
    publicSite: "Saytga qaytish",
    open: "Menyuni ochish",
    close: "Menyuni yopish",
  },
} as const;

const NAV: Array<{ id: AdminSection; href: string }> = [
  { id: "staff", href: "/admin/staff/" },
  { id: "cars", href: "/admin/cars/" },
  { id: "home", href: "/admin/home/" },
  { id: "visits", href: "/admin/visits/" },
];

export default function AdminChrome({
  current,
  language,
  theme,
  role = null,
  backHref = "/",
  onLanguageChange,
  onThemeChange,
}: AdminChromeProps) {
  const [open, setOpen] = useState(false);
  const copy = LABELS[language];
  const manager = role === "sales_manager";
  const visibleNav = NAV.filter((item) => !manager || item.id === "cars" || item.id === "visits");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <>
      <div className={styles.dock} data-theme={theme}>
        <header className={styles.toolbar}>
          <a className={styles.roundControl} href={backHref} aria-label={copy.publicSite}>
            <ArrowLeft />
          </a>
          <a className={styles.brand} href="/admin/cars/" aria-label="Auto Sale Umar">
            <img
              src={theme === "dark" ? "/brand/asu-wordmark-white.png" : "/brand/asu-wordmark-black.png"}
              alt="Auto Sale Umar"
            />
          </a>
          <button
            className={styles.roundControl}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? copy.close : copy.open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </header>

        <nav className={styles.nav} data-count={visibleNav.length} aria-label="Control System">
          {visibleNav.map((item) => (
            <a key={item.id} href={item.href} data-active={current === item.id} aria-current={current === item.id ? "page" : undefined}>
              {copy[item.id]}
            </a>
          ))}
        </nav>

        <section className={styles.menu} data-open={open} aria-hidden={!open}>
          <div className={styles.menuHead}>
            <p>CONTROL SYSTEM</p>
            <h2>{copy.settings}</h2>
          </div>
          <div className={styles.controlBlock}>
            <span>{copy.appearance}</span>
            <div className={styles.segments}>
              <button type="button" data-active={theme === "light"} onClick={() => onThemeChange("light")}><Sun />{copy.light}</button>
              <button type="button" data-active={theme === "dark"} onClick={() => onThemeChange("dark")}><Moon />{copy.dark}</button>
            </div>
          </div>
          <div className={styles.controlBlock}>
            <span>{copy.language}</span>
            <div className={styles.segments}>
              <button type="button" data-active={language === "ru"} onClick={() => onLanguageChange("ru")}>RU</button>
              <button type="button" data-active={language === "uz"} onClick={() => onLanguageChange("uz")}>UZ</button>
            </div>
          </div>
          <a className={styles.publicLink} href="/"><ExternalLink />{copy.publicSite}</a>
        </section>
      </div>
      <button className={styles.backdrop} data-open={open} type="button" onClick={() => setOpen(false)} aria-label={copy.close} />
      <div className={styles.spacer} aria-hidden="true" />
    </>
  );
}
