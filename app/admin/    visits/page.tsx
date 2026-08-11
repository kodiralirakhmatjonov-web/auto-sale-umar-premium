"use client";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  MapPin,
  Menu,
  Phone,
  RefreshCw,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./visits.module.css";

type Language = "ru" | "uz";
type Theme = "light" | "dark";
type Role = "super_admin" | "admin" | "sales_manager";
type VisitStatus = "new" | "confirmed" | "completed" | "cancelled";

interface Visit {
  id: number;
  code: string;
  customerName: string;
  phone: string;
  visitDate: string;
  timeSlot: string;
  brand: string | null;
  carId: number | null;
  carLabel: string | null;
  note: string | null;
  status: VisitStatus;
  createdAt: string;
  updatedAt: string;
}
interface VisitsResponse { success?: boolean; visits?: Visit[]; viewer?: { id: number; role: Role }; visit?: Visit; error?: string }

const TEXT = {
  ru: {
    team: "Команда", cars: "Автомобили", home: "Главная", visits: "Визиты", publicSite: "Вернуться на сайт",
    eyebrow: "AUTO SALE UMAR / CONTROL SYSTEM", title: "Забронированные визиты", lead: "Все заявки на посещение шоурума — дата, время, интересующий автомобиль и контакт клиента.",
    all: "Все", fresh: "Новые", confirmed: "Подтверждены", completed: "Завершены", cancelled: "Отменены",
    empty: "В этой категории визитов пока нет.", reload: "Обновить", confirm: "Подтвердить", complete: "Завершить", cancel: "Отменить", restore: "Вернуть в новые",
    newStatus: "Новый", confirmedStatus: "Подтверждён", completedStatus: "Завершён", cancelledStatus: "Отменён",
    note: "Комментарий", noCar: "Без конкретного автомобиля", booking: "Бронирование", loading: "Загружаем визиты…",
  },
  uz: {
    team: "Jamoa", cars: "Avtomobillar", home: "Bosh sahifa", visits: "Tashriflar", publicSite: "Saytga qaytish",
    eyebrow: "AUTO SALE UMAR / CONTROL SYSTEM", title: "Band qilingan tashriflar", lead: "Shourumga tashrif buyurish uchun barcha arizalar — sana, vaqt, avtomobil va mijoz aloqasi.",
    all: "Barchasi", fresh: "Yangi", confirmed: "Tasdiqlangan", completed: "Yakunlangan", cancelled: "Bekor qilingan",
    empty: "Bu bo‘limda hozircha tashrif yo‘q.", reload: "Yangilash", confirm: "Tasdiqlash", complete: "Yakunlash", cancel: "Bekor qilish", restore: "Yangi holatga qaytarish",
    newStatus: "Yangi", confirmedStatus: "Tasdiqlangan", completedStatus: "Yakunlangan", cancelledStatus: "Bekor qilingan",
    note: "Izoh", noCar: "Aniq avtomobilsiz", booking: "Band qilish", loading: "Tashriflar yuklanmoqda…",
  },
} as const;

const STATUS_LABEL: Record<Language, Record<VisitStatus, string>> = {
  ru: { new: "Новый", confirmed: "Подтверждён", completed: "Завершён", cancelled: "Отменён" },
  uz: { new: "Yangi", confirmed: "Tasdiqlangan", completed: "Yakunlangan", cancelled: "Bekor qilingan" },
};

function dateLabel(value: string, language: Language): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "uz" ? "uz-UZ" : "ru-RU", { weekday: "short", day: "2-digit", month: "long" }).format(date);
}

export default function AdminVisitsPage() {
  const [language, setLanguage] = useState<Language>("ru");
  const [theme, setTheme] = useState<Theme>("light");
  const [viewerRole, setViewerRole] = useState<Role | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filter, setFilter] = useState<VisitStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const c = TEXT[language];

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem("asu-language");
      setLanguage(storedLanguage === "uz" ? "uz" : "ru");
      const storedTheme = localStorage.getItem("asu-theme");
      setTheme(storedTheme === "dark" ? "dark" : "light");
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/visits", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
      if (response.status === 401) { location.replace("/admin/login/"); return; }
      const data = await response.json().catch(() => null) as VisitsResponse | null;
      if (!response.ok || !data?.success) throw new Error(data?.error || "Не удалось загрузить визиты.");
      setVisits(Array.isArray(data.visits) ? data.visits : []);
      setViewerRole(data.viewer?.role ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить визиты.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(id: number, status: VisitStatus) {
    if (updatingId) return;
    setUpdatingId(id);
    setError(null);
    try {
      const response = await fetch("/api/visits", {
        method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ id, status }),
      });
      if (response.status === 401) { location.replace("/admin/login/"); return; }
      const data = await response.json().catch(() => null) as VisitsResponse | null;
      if (!response.ok || !data?.success || !data.visit) throw new Error(data?.error || "Не удалось обновить визит.");
      setVisits((current) => current.map((visit) => visit.id === id ? data.visit as Visit : visit));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Не удалось обновить визит."); }
    finally { setUpdatingId(null); }
  }

  function applyTheme(next: Theme) {
    setTheme(next);
    try { localStorage.setItem("asu-theme", next); } catch {}
    document.documentElement.dataset.asuTheme = next;
    document.documentElement.style.colorScheme = next;
  }

  function applyLanguage(next: Language) {
    setLanguage(next);
    try { localStorage.setItem("asu-language", next); } catch {}
    document.documentElement.lang = next;
  }

  const filtered = useMemo(() => filter === "all" ? visits : visits.filter((visit) => visit.status === filter), [filter, visits]);
  const counts = useMemo(() => ({
    all: visits.length,
    new: visits.filter((visit) => visit.status === "new").length,
    confirmed: visits.filter((visit) => visit.status === "confirmed").length,
    completed: visits.filter((visit) => visit.status === "completed").length,
    cancelled: visits.filter((visit) => visit.status === "cancelled").length,
  }), [visits]);
  const manager = viewerRole === "sales_manager";

  return (
    <main className={styles.page} data-theme={theme}>
      <header className={styles.toolbar}>
        <a className={styles.roundControl} href="/" aria-label={c.publicSite}><ArrowLeft /></a>
        <a className={styles.wordmark} href="/admin/visits/"><img src={theme === "dark" ? "/brand/asu-wordmark-white.png" : "/brand/asu-wordmark-black.png"} alt="Auto Sale Umar" /></a>
        <button className={styles.roundControl} type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Menu">{menuOpen ? <X /> : <Menu />}</button>
        <div className={styles.quickMenu} data-open={menuOpen}>
          <a href="/"><ExternalLink />{c.publicSite}</a>
          <div><button type="button" data-active={language === "ru"} onClick={() => applyLanguage("ru")}>RU</button><button type="button" data-active={language === "uz"} onClick={() => applyLanguage("uz")}>UZ</button></div>
          <div><button type="button" data-active={theme === "light"} onClick={() => applyTheme("light")}>Light</button><button type="button" data-active={theme === "dark"} onClick={() => applyTheme("dark")}>Dark</button></div>
        </div>
      </header>

      <nav className={styles.sectionNav} data-manager={manager}>
        {!manager ? <a href="/admin/staff/">{c.team}</a> : null}
        <a href="/admin/cars/">{c.cars}</a>
        {!manager ? <a href="/admin/home/">{c.home}</a> : null}
        <a className={styles.active} href="/admin/visits/" aria-current="page">{c.visits}</a>
      </nav>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <div><p>{c.eyebrow}</p><h1>{c.title}</h1><span>{c.lead}</span></div>
          <button type="button" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? styles.spin : undefined} />{c.reload}</button>
        </section>

        <section className={styles.filters}>
          {([
            ["all", c.all], ["new", c.fresh], ["confirmed", c.confirmed], ["completed", c.completed], ["cancelled", c.cancelled],
          ] as const).map(([value, label]) => <button type="button" key={value} data-active={filter === value} onClick={() => setFilter(value)}><span>{label}</span><b>{counts[value]}</b></button>)}
        </section>

        {error ? <div className={styles.error}>{error}</div> : null}
        {loading ? <div className={styles.loading}><span />{c.loading}</div> : filtered.length === 0 ? <div className={styles.empty}><CalendarDays /><p>{c.empty}</p></div> : (
          <section className={styles.visitGrid}>
            {filtered.map((visit) => (
              <article className={styles.visitCard} key={visit.id}>
                <div className={styles.visitTop}>
                  <div><small>{c.booking} · {visit.code}</small><h2>{visit.customerName}</h2></div>
                  <span className={styles.status} data-status={visit.status}>{STATUS_LABEL[language][visit.status]}</span>
                </div>
                <div className={styles.schedule}>
                  <div><CalendarDays /><span>{dateLabel(visit.visitDate, language)}</span></div>
                  <div><Clock3 /><span>{visit.timeSlot}</span></div>
                </div>
                <div className={styles.visitDetails}>
                  <a href={`tel:${visit.phone}`}><Phone /><div><small>{language === "ru" ? "Телефон" : "Telefon"}</small><strong>{visit.phone}</strong></div></a>
                  <div><UserRound /><div><small>{language === "ru" ? "Интерес" : "Qiziqish"}</small><strong>{visit.carLabel || visit.brand || c.noCar}</strong></div></div>
                  {visit.note ? <div className={styles.note}><MapPin /><div><small>{c.note}</small><p>{visit.note}</p></div></div> : null}
                </div>
                <div className={styles.actions}>
                  {visit.status !== "confirmed" ? <button type="button" onClick={() => void updateStatus(visit.id, "confirmed")} disabled={updatingId === visit.id}><Check />{c.confirm}</button> : null}
                  {visit.status !== "completed" ? <button type="button" onClick={() => void updateStatus(visit.id, "completed")} disabled={updatingId === visit.id}><Check />{c.complete}</button> : null}
                  {visit.status !== "cancelled" ? <button className={styles.cancel} type="button" onClick={() => void updateStatus(visit.id, "cancelled")} disabled={updatingId === visit.id}><XCircle />{c.cancel}</button> : <button type="button" onClick={() => void updateStatus(visit.id, "new")} disabled={updatingId === visit.id}>{c.restore}</button>}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
