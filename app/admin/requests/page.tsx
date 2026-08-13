"use client";

import {
  ArrowUpRight,
  Check,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Gauge,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminChrome from "../_components/AdminChrome";
import styles from "./requests.module.css";

type Language = "ru" | "uz";
type Theme = "light" | "dark";
type Role = "super_admin" | "admin" | "sales_manager";
type RequestStatus = "new" | "contacted" | "sourcing" | "offered" | "completed" | "cancelled";
type ContactChannel = "whatsapp" | "telegram" | "phone";
type PurchaseTiming = "7_days" | "30_days" | "90_days" | "flexible";
type Currency = "USD" | "UZS" | "EUR";

interface VehicleRequest {
  id: number;
  code: string;
  customerName: string;
  phone: string;
  contactChannel: ContactChannel;
  brand: string;
  model: string;
  trim: string | null;
  desiredYear: number | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  importantOptions: string | null;
  maxBudget: number | null;
  currency: Currency;
  purchaseTiming: PurchaseTiming;
  acceptInTransit: boolean;
  sourceUrl: string | null;
  note: string | null;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  managedBy: number | null;
}

interface RequestsResponse {
  success?: boolean;
  requests?: VehicleRequest[];
  viewer?: { id: number; role: Role };
  request?: VehicleRequest;
  error?: string;
}

const TEXT = {
  ru: {
    eyebrow: "AUTO SALE UMAR / DEMAND RADAR",
    title: "Запросы на автомобили",
    lead: "Реальный спрос от клиентов: модель, бюджет, срок покупки и параметры. Здесь нет просмотров и лайков — только отправленные заявки.",
    reload: "Обновить",
    all: "Все",
    fresh: "Новые",
    contacted: "Связались",
    sourcing: "Ищем",
    offered: "Предложено",
    completed: "Сделка",
    cancelled: "Закрыто",
    newStatus: "Новый",
    contactedStatus: "Связались",
    sourcingStatus: "Подбор",
    offeredStatus: "Предложение",
    completedStatus: "Сделка",
    cancelledStatus: "Закрыт",
    radar: "Demand Radar",
    radarText: "Сводка по активным квалифицированным запросам. Чем больше одинаковых запросов, тем сильнее сигнал для закупки или импорта.",
    activeDemand: "Активный спрос",
    urgent: "До 30 дней",
    newRequests: "Новые запросы",
    noRadar: "Пока недостаточно активных запросов для сводки.",
    clients: "клиентов",
    budget: "Бюджет",
    timing: "Срок",
    colors: "Цвета",
    options: "Опции",
    reference: "Открыть пример",
    comment: "Комментарий",
    transitYes: "Готов рассмотреть авто в пути",
    transitNo: "Только автомобиль, который можно купить сейчас",
    call: "Позвонить",
    openContact: "Открыть контакт",
    toContacted: "Связались",
    toSourcing: "Начать подбор",
    toOffered: "Предложение отправлено",
    toCompleted: "Сделка",
    close: "Закрыть",
    restore: "Вернуть в новые",
    empty: "В этой категории запросов пока нет.",
    loading: "Загружаем запросы…",
    sourceMissing: "Ссылка-пример не указана",
  },
  uz: {
    eyebrow: "AUTO SALE UMAR / DEMAND RADAR",
    title: "Avtomobil so‘rovlari",
    lead: "Mijozlarning real talabi: model, budjet, xarid muddati va parametrlar. Bu yerda ko‘rishlar emas, faqat yuborilgan arizalar bor.",
    reload: "Yangilash",
    all: "Barchasi",
    fresh: "Yangi",
    contacted: "Bog‘landik",
    sourcing: "Qidiruvda",
    offered: "Taklif berildi",
    completed: "Savdo",
    cancelled: "Yopilgan",
    newStatus: "Yangi",
    contactedStatus: "Bog‘landik",
    sourcingStatus: "Qidiruv",
    offeredStatus: "Taklif",
    completedStatus: "Savdo",
    cancelledStatus: "Yopilgan",
    radar: "Demand Radar",
    radarText: "Faol malakali so‘rovlar bo‘yicha jamlanma. Bir xil so‘rovlar ko‘paygan sari import yoki xarid signali kuchayadi.",
    activeDemand: "Faol talab",
    urgent: "30 kungacha",
    newRequests: "Yangi so‘rovlar",
    noRadar: "Jamlanma uchun hozircha faol so‘rov yetarli emas.",
    clients: "mijoz",
    budget: "Budjet",
    timing: "Muddat",
    colors: "Ranglar",
    options: "Opsiyalar",
    reference: "Namunani ochish",
    comment: "Izoh",
    transitYes: "Yo‘ldagi avtomobilni ham ko‘rib chiqadi",
    transitNo: "Faqat hozir sotib olish mumkin bo‘lgan avtomobil",
    call: "Qo‘ng‘iroq",
    openContact: "Kontaktni ochish",
    toContacted: "Bog‘landik",
    toSourcing: "Qidiruvni boshlash",
    toOffered: "Taklif yuborildi",
    toCompleted: "Savdo",
    close: "Yopish",
    restore: "Yangi holatga qaytarish",
    empty: "Bu bo‘limda hozircha so‘rov yo‘q.",
    loading: "So‘rovlar yuklanmoqda…",
    sourceMissing: "Namuna havolasi ko‘rsatilmagan",
  },
} as const;

const STATUS_LABEL: Record<Language, Record<RequestStatus, string>> = {
  ru: {
    new: "Новый",
    contacted: "Связались",
    sourcing: "Подбор",
    offered: "Предложение",
    completed: "Сделка",
    cancelled: "Закрыт",
  },
  uz: {
    new: "Yangi",
    contacted: "Bog‘landik",
    sourcing: "Qidiruv",
    offered: "Taklif",
    completed: "Savdo",
    cancelled: "Yopilgan",
  },
};

function budgetLabel(request: VehicleRequest): string {
  if (!request.maxBudget) return "—";
  const value = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(request.maxBudget);
  if (request.currency === "USD") return `${value} $`;
  if (request.currency === "EUR") return `${value} €`;
  return `${value} сум`;
}

function timingLabel(value: PurchaseTiming, language: Language): string {
  if (language === "uz") {
    if (value === "7_days") return "7 kun";
    if (value === "30_days") return "30 kun";
    if (value === "90_days") return "3 oy";
    return "Muddat erkin";
  }
  if (value === "7_days") return "7 дней";
  if (value === "30_days") return "30 дней";
  if (value === "90_days") return "3 месяца";
  return "Без жёсткого срока";
}

function dateTimeLabel(value: string, language: Language): string {
  const date = new Date(value.replace(" ", "T") + (value.includes("T") ? "" : "Z"));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "uz" ? "uz-UZ" : "ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function contactHref(request: VehicleRequest): string {
  const digits = request.phone.replace(/\D/g, "");
  if (request.contactChannel === "whatsapp" && digits) return `https://wa.me/${digits}`;
  if (request.contactChannel === "telegram" && request.phone.startsWith("@")) return `https://t.me/${request.phone.slice(1)}`;
  return `tel:${request.phone}`;
}

export default function AdminRequestsPage() {
  const [language, setLanguage] = useState<Language>("ru");
  const [theme, setTheme] = useState<Theme>("light");
  const [viewerRole, setViewerRole] = useState<Role | null>(null);
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      const response = await fetch("/api/vehicle-requests", {
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (response.status === 401) { location.replace("/admin/login/"); return; }
      const data = await response.json().catch(() => null) as RequestsResponse | null;
      if (!response.ok || !data?.success) throw new Error(data?.error || "Не удалось загрузить запросы.");
      setRequests(Array.isArray(data.requests) ? data.requests : []);
      setViewerRole(data.viewer?.role ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить запросы.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(id: number, status: RequestStatus) {
    if (updatingId) return;
    setUpdatingId(id);
    setError(null);
    try {
      const response = await fetch("/api/vehicle-requests", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (response.status === 401) { location.replace("/admin/login/"); return; }
      const data = await response.json().catch(() => null) as RequestsResponse | null;
      if (!response.ok || !data?.success || !data.request) throw new Error(data?.error || "Не удалось обновить запрос.");
      setRequests((current) => current.map((item) => item.id === id ? data.request as VehicleRequest : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось обновить запрос.");
    } finally {
      setUpdatingId(null);
    }
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

  const filtered = useMemo(() => filter === "all" ? requests : requests.filter((item) => item.status === filter), [filter, requests]);
  const counts = useMemo(() => ({
    all: requests.length,
    new: requests.filter((item) => item.status === "new").length,
    contacted: requests.filter((item) => item.status === "contacted").length,
    sourcing: requests.filter((item) => item.status === "sourcing").length,
    offered: requests.filter((item) => item.status === "offered").length,
    completed: requests.filter((item) => item.status === "completed").length,
    cancelled: requests.filter((item) => item.status === "cancelled").length,
  }), [requests]);

  const activeRequests = useMemo(
    () => requests.filter((item) => item.status !== "completed" && item.status !== "cancelled"),
    [requests],
  );

  const radar = useMemo(() => {
    const groups = new Map<string, { brand: string; model: string; count: number; urgent: number; budgets: VehicleRequest[] }>();
    for (const item of activeRequests) {
      const key = `${item.brand.trim().toLowerCase()}\u0000${item.model.trim().toLowerCase()}`;
      const group = groups.get(key) ?? { brand: item.brand, model: item.model, count: 0, urgent: 0, budgets: [] };
      group.count += 1;
      if (item.purchaseTiming === "7_days" || item.purchaseTiming === "30_days") group.urgent += 1;
      if (item.maxBudget) group.budgets.push(item);
      groups.set(key, group);
    }
    return Array.from(groups.values()).sort((a, b) => b.count - a.count || b.urgent - a.urgent).slice(0, 6);
  }, [activeRequests]);

  const urgentCount = useMemo(
    () => activeRequests.filter((item) => item.purchaseTiming === "7_days" || item.purchaseTiming === "30_days").length,
    [activeRequests],
  );

  return (
    <main className={styles.page} data-theme={theme}>
      <AdminChrome
        current="requests"
        language={language}
        theme={theme}
        role={viewerRole}
        onLanguageChange={applyLanguage}
        onThemeChange={applyTheme}
      />

      <div className={styles.shell}>
        <section className={styles.hero}>
          <div><p>{c.eyebrow}</p><h1>{c.title}</h1><span>{c.lead}</span></div>
          <button type="button" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? styles.spin : undefined} />{c.reload}</button>
        </section>

        <section className={styles.radarPanel}>
          <div className={styles.radarIntro}>
            <div><Gauge /><span>LIVE QUALIFIED DEMAND</span></div>
            <h2>{c.radar}</h2>
            <p>{c.radarText}</p>
          </div>
          <div className={styles.metricGrid}>
            <div><small>{c.activeDemand}</small><strong>{activeRequests.length}</strong></div>
            <div><small>{c.urgent}</small><strong>{urgentCount}</strong></div>
            <div><small>{c.newRequests}</small><strong>{counts.new}</strong></div>
          </div>
          {radar.length ? (
            <div className={styles.radarList}>
              {radar.map((item, index) => (
                <article key={`${item.brand}-${item.model}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{item.brand} {item.model}</strong><small>{item.urgent} · {c.urgent}</small></div>
                  <b>{item.count} {c.clients}</b>
                </article>
              ))}
            </div>
          ) : <div className={styles.noRadar}><Search /><span>{c.noRadar}</span></div>}
        </section>

        <section className={styles.filters}>
          {([
            ["all", c.all], ["new", c.fresh], ["contacted", c.contacted], ["sourcing", c.sourcing], ["offered", c.offered], ["completed", c.completed], ["cancelled", c.cancelled],
          ] as const).map(([value, label]) => (
            <button type="button" key={value} data-active={filter === value} onClick={() => setFilter(value)}><span>{label}</span><b>{counts[value]}</b></button>
          ))}
        </section>

        {error ? <div className={styles.error}>{error}</div> : null}
        {loading ? <div className={styles.loading}><span />{c.loading}</div> : filtered.length === 0 ? <div className={styles.empty}><Search /><p>{c.empty}</p></div> : (
          <section className={styles.requestGrid}>
            {filtered.map((item) => (
              <article className={styles.requestCard} key={item.id}>
                <div className={styles.cardTop}>
                  <div><small>{item.code} · {dateTimeLabel(item.createdAt, language)}</small><h2>{item.brand} {item.model}</h2>{item.trim ? <p>{item.trim}</p> : null}</div>
                  <span className={styles.status} data-status={item.status}>{STATUS_LABEL[language][item.status]}</span>
                </div>

                <div className={styles.keyFacts}>
                  <div><CircleDollarSign /><span><small>{c.budget}</small><strong>{budgetLabel(item)}</strong></span></div>
                  <div><Clock3 /><span><small>{c.timing}</small><strong>{timingLabel(item.purchaseTiming, language)}</strong></span></div>
                </div>

                <div className={styles.specs}>
                  {item.desiredYear ? <span>{item.desiredYear}</span> : null}
                  {item.exteriorColor ? <span>{item.exteriorColor}</span> : null}
                  {item.interiorColor ? <span>{item.interiorColor}</span> : null}
                  <span>{item.acceptInTransit ? c.transitYes : c.transitNo}</span>
                </div>

                {item.importantOptions ? <div className={styles.detailBlock}><small>{c.options}</small><p>{item.importantOptions}</p></div> : null}
                {item.note ? <div className={styles.detailBlock}><small>{c.comment}</small><p>{item.note}</p></div> : null}

                <div className={styles.customerBlock}>
                  <div><UserRound /><span><small>{item.contactChannel.toUpperCase()}</small><strong>{item.customerName}</strong></span></div>
                  <a href={contactHref(item)} target={item.contactChannel === "phone" ? undefined : "_blank"} rel={item.contactChannel === "phone" ? undefined : "noreferrer"}><Phone /><span>{item.phone}</span><ArrowUpRight /></a>
                </div>

                {item.sourceUrl ? <a className={styles.sourceButton} href={item.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink />{c.reference}<ArrowUpRight /></a> : <div className={styles.sourceMissing}>{c.sourceMissing}</div>}

                <div className={styles.actions}>
                  {item.status === "new" ? <button type="button" onClick={() => void updateStatus(item.id, "contacted")} disabled={updatingId === item.id}><MessageCircle />{c.toContacted}</button> : null}
                  {item.status !== "sourcing" && item.status !== "completed" && item.status !== "cancelled" ? <button type="button" onClick={() => void updateStatus(item.id, "sourcing")} disabled={updatingId === item.id}><Search />{c.toSourcing}</button> : null}
                  {item.status !== "offered" && item.status !== "completed" && item.status !== "cancelled" ? <button type="button" onClick={() => void updateStatus(item.id, "offered")} disabled={updatingId === item.id}><Check />{c.toOffered}</button> : null}
                  {item.status !== "completed" ? <button type="button" onClick={() => void updateStatus(item.id, "completed")} disabled={updatingId === item.id}><Check />{c.toCompleted}</button> : null}
                  {item.status !== "cancelled" ? <button className={styles.cancel} type="button" onClick={() => void updateStatus(item.id, "cancelled")} disabled={updatingId === item.id}><XCircle />{c.close}</button> : <button type="button" onClick={() => void updateStatus(item.id, "new")} disabled={updatingId === item.id}>{c.restore}</button>}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
