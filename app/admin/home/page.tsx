"use client";

import {
  ArrowLeft,
  ExternalLink,
  Film,
  LockKeyhole,
  Menu,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import styles from "./home.module.css";
import AdminChrome from "../_components/AdminChrome";

type Language = "ru" | "uz";
type Theme = "light" | "dark";
type VideoStatus = "in_stock" | "in_showroom" | "in_transit" | "made_to_order" | "reserved";
type Currency = "USD" | "UZS" | "EUR";

interface MeResponse {
  user?: { role?: "super_admin" | "admin" | "sales_manager" };
  error?: string;
}

interface VideoItem {
  key: string;
  url: string;
  size: number;
  uploadedAt: string | null;
  brand: string;
  model: string;
  price: number | null;
  currency: Currency;
  priceOnRequest: boolean;
  status: VideoStatus;
}

interface MediaResponse {
  success?: boolean;
  videos?: VideoItem[];
  video?: VideoItem;
  error?: string;
}

const TEXT = {
  ru: {
    nav: "Разделы Control System",
    team: "Команда",
    cars: "Автомобили",
    home: "Главная",
    visits: "Визиты",
    eyebrow: "AUTO SALE UMAR / CONTROL SYSTEM",
    title: "Главная страница",
    lead: "Управляйте рекламной видео-каруселью и подписью каждого ролика. Данные меняются вместе с видео на публичной главной.",
    fixed: "Системное видео",
    fixedTitle: "Intro · первый слайд",
    fixedText: "Используется при загрузке сайта и всегда остаётся первым. Его карточка на главной подписана Auto Sale Umar.",
    uploaded: "Видео карусели",
    count: "добавлено",
    add: "Добавить видео",
    uploadHint: "MP4, WebM или MOV · до 80 МБ. Вертикальные 9:16 подходят лучше всего для мобильной главной.",
    uploading: "Загружаем…",
    empty: "Дополнительных видео пока нет.",
    emptyText: "Добавьте короткий ролик автомобиля, затем укажите марку, модель, цену и статус.",
    delete: "Удалить",
    deleteConfirm: "Удалить это видео с главной страницы?",
    save: "Сохранить подпись",
    saving: "Сохраняем…",
    saved: "Сохранено",
    brand: "Марка",
    model: "Модель / комплектация",
    price: "Цена",
    currency: "Валюта",
    request: "Цена по запросу",
    status: "Статус",
    publicSite: "Открыть основной сайт",
    errorLoad: "Не удалось загрузить список видео.",
    errorUpload: "Не удалось загрузить видео.",
    errorDelete: "Не удалось удалить видео.",
    errorSave: "Не удалось сохранить подпись видео.",
    managerDenied: "У вашей роли нет доступа к управлению главной страницей.",
  },
  uz: {
    nav: "Control System bo‘limlari",
    team: "Jamoa",
    cars: "Avtomobillar",
    home: "Bosh sahifa",
    visits: "Tashriflar",
    eyebrow: "AUTO SALE UMAR / CONTROL SYSTEM",
    title: "Bosh sahifa",
    lead: "Reklama video karuseli va har bir rolik yozuvini boshqaring. Ma’lumotlar ommaviy sahifada video bilan birga almashadi.",
    fixed: "Tizim videosi",
    fixedTitle: "Intro · birinchi slayd",
    fixedText: "Sayt yuklanishida ishlatiladi va doimo birinchi bo‘lib qoladi. Ommaviy sahifada Auto Sale Umar sifatida ko‘rsatiladi.",
    uploaded: "Karusel videolari",
    count: "qo‘shilgan",
    add: "Video qo‘shish",
    uploadHint: "MP4, WebM yoki MOV · 80 MB gacha. Mobil bosh sahifa uchun vertikal 9:16 eng mos.",
    uploading: "Yuklanmoqda…",
    empty: "Qo‘shimcha videolar hali yo‘q.",
    emptyText: "Avtomobilning qisqa videosini qo‘shing, keyin marka, model, narx va statusni kiriting.",
    delete: "O‘chirish",
    deleteConfirm: "Bu videoni bosh sahifadan o‘chirasizmi?",
    save: "Yozuvni saqlash",
    saving: "Saqlanmoqda…",
    saved: "Saqlandi",
    brand: "Marka",
    model: "Model / komplektatsiya",
    price: "Narx",
    currency: "Valyuta",
    request: "Narx so‘rov bo‘yicha",
    status: "Status",
    publicSite: "Asosiy saytni ochish",
    errorLoad: "Video ro‘yxatini yuklab bo‘lmadi.",
    errorUpload: "Videoni yuklab bo‘lmadi.",
    errorDelete: "Videoni o‘chirib bo‘lmadi.",
    errorSave: "Video yozuvini saqlab bo‘lmadi.",
    managerDenied: "Sizning rolingiz bosh sahifani boshqarishga ruxsat bermaydi.",
  },
} as const;

const BRANDS = [
  { name: "Mercedes-Benz", logo: "/brands/mercedes-benz.jpg" },
  { name: "Range Rover", logo: "/brands/range-rover.png" },
  { name: "Rolls-Royce", logo: "/brands/rolls-royce.png" },
  { name: "Cadillac", logo: "/brands/cadillac.png" },
  { name: "Lexus", logo: "/brands/lexus.png" },
  { name: "Toyota", logo: "/brands/toyota.png" },
  { name: "Genesis", logo: "/brands/genesis.png" },
  { name: "BMW", logo: "/brands/bmw.png" },
  { name: "Lamborghini", logo: "/brands/lamborghini.png" },
] as const;

const STATUS_LABEL: Record<Language, Record<VideoStatus, string>> = {
  ru: { in_stock: "В наличии", in_showroom: "В шоуруме", in_transit: "В пути", made_to_order: "Под заказ", reserved: "Резерв" },
  uz: { in_stock: "Mavjud", in_showroom: "Shourumda", in_transit: "Yo‘lda", made_to_order: "Buyurtma", reserved: "Rezerv" },
};

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

export default function AdminHomePage() {
  const [language, setLanguage] = useState<Language>("ru");
  const [theme, setTheme] = useState<Theme>("light");
  const [authReady, setAuthReady] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const c = TEXT[language];

  const applyTheme = useCallback((next: Theme) => {
    setTheme(next);
    try { localStorage.setItem("asu-theme", next); } catch {}
    document.documentElement.dataset.asuTheme = next;
    document.documentElement.style.colorScheme = next;
  }, []);

  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem("asu-language");
      setLanguage(savedLanguage === "uz" ? "uz" : "ru");
      const savedTheme = localStorage.getItem("asu-theme");
      applyTheme(savedTheme === "dark" ? "dark" : "light");
    } catch { applyTheme("light"); }
  }, [applyTheme]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const meResponse = await fetch("/api/me", { cache: "no-store", credentials: "same-origin" });
        const me = await meResponse.json().catch(() => null) as MeResponse | null;
        if (meResponse.status === 401) { location.replace("/admin/login/"); return; }
        if (!meResponse.ok) throw new Error(me?.error || c.errorLoad);
        if (me?.user?.role === "sales_manager") { location.replace("/admin/cars/"); return; }
        if (me?.user?.role !== "admin" && me?.user?.role !== "super_admin") throw new Error(c.managerDenied);
        if (!cancelled) setAuthReady(true);

        const response = await fetch("/api/home-media", { cache: "no-store", credentials: "same-origin" });
        const data = await response.json().catch(() => null) as MediaResponse | null;
        if (!response.ok || !data?.success) throw new Error(data?.error || c.errorLoad);
        if (!cancelled) setVideos(Array.isArray(data.videos) ? data.videos : []);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : c.errorLoad);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [c.errorLoad, c.managerDenied]);

  function changeLanguage(next: Language) {
    setLanguage(next);
    try { localStorage.setItem("asu-language", next); } catch {}
  }

  function updateVideo(key: string, patch: Partial<VideoItem>) {
    setSavedKey((current) => current === key ? null : current);
    setVideos((current) => current.map((video) => video.key === key ? { ...video, ...patch } : video));
  }

  async function uploadVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    const body = new FormData();
    body.set("file", file, file.name);
    body.set("status", "in_showroom");
    body.set("currency", "USD");
    body.set("priceOnRequest", "1");
    try {
      const response = await fetch("/api/home-media", { method: "POST", credentials: "same-origin", body });
      const data = await response.json().catch(() => null) as MediaResponse | null;
      if (response.status === 401) { location.replace("/admin/login/"); return; }
      if (!response.ok || !data?.success || !data.video) throw new Error(data?.error || c.errorUpload);
      setVideos((current) => [...current, data.video as VideoItem]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : c.errorUpload);
    } finally {
      setUploading(false);
    }
  }

  async function saveVideo(video: VideoItem) {
    if (savingKey) return;
    setSavingKey(video.key);
    setSavedKey(null);
    setError(null);
    try {
      const response = await fetch("/api/home-media", {
        method: "PATCH",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          key: video.key,
          brand: video.brand,
          model: video.model,
          price: video.price,
          currency: video.currency,
          priceOnRequest: video.priceOnRequest,
          status: video.status,
        }),
      });
      const data = await response.json().catch(() => null) as MediaResponse | null;
      if (response.status === 401) { location.replace("/admin/login/"); return; }
      if (!response.ok || !data?.success || !data.video) throw new Error(data?.error || c.errorSave);
      setVideos((current) => current.map((item) => item.key === video.key ? data.video as VideoItem : item));
      setSavedKey(video.key);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : c.errorSave);
    } finally {
      setSavingKey(null);
    }
  }

  async function deleteVideo(video: VideoItem) {
    if (deletingKey || !confirm(c.deleteConfirm)) return;
    setDeletingKey(video.key);
    setError(null);
    try {
      const response = await fetch(`/api/home-media?key=${encodeURIComponent(video.key)}`, { method: "DELETE", credentials: "same-origin" });
      const data = await response.json().catch(() => null) as MediaResponse | null;
      if (response.status === 401) { location.replace("/admin/login/"); return; }
      if (!response.ok || !data?.success) throw new Error(data?.error || c.errorDelete);
      setVideos((current) => current.filter((item) => item.key !== video.key));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : c.errorDelete);
    } finally {
      setDeletingKey(null);
    }
  }

  if (!authReady && loading) return <main className={styles.loading} data-theme={theme}><span /></main>;

  return (
    <main className={styles.page} data-theme={theme}>
      <AdminChrome
        current="home"
        language={language}
        theme={theme}
        role="admin"
        onLanguageChange={changeLanguage}
        onThemeChange={applyTheme}
      />

      <div className={styles.shell}>
        <section className={styles.hero}>
          <p>{c.eyebrow}</p>
          <h1>{c.title}</h1>
          <span>{c.lead}</span>
        </section>

        {error ? <div className={styles.error} role="alert">{error}</div> : null}

        <section className={styles.fixedCard}>
          <div className={styles.fixedMedia}>
            <video src="/intro.mp4" poster="/intro-poster.jpg" muted playsInline controls preload="metadata" />
            <span><LockKeyhole />{c.fixed}</span>
          </div>
          <div className={styles.fixedCopy}><p>INTRO</p><h2>{c.fixedTitle}</h2><span>{c.fixedText}</span></div>
        </section>

        <section className={styles.library}>
          <div className={styles.libraryTop}>
            <div><p>{c.uploaded}</p><h2>{videos.length} <span>{c.count}</span></h2></div>
            <button className={styles.uploadButton} type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Upload className={styles.spin} /> : <Plus />}<span>{uploading ? c.uploading : c.add}</span>
            </button>
            <input ref={fileRef} className={styles.hiddenInput} type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" onChange={uploadVideo} />
          </div>
          <p className={styles.hint}>{c.uploadHint}</p>

          {loading ? <div className={styles.loadingCard}><span /></div> : videos.length === 0 ? (
            <div className={styles.empty}><Film /><h3>{c.empty}</h3><p>{c.emptyText}</p></div>
          ) : (
            <div className={styles.videoGrid}>
              {videos.map((video) => (
                <article className={styles.videoCard} key={video.key}>
                  <div className={styles.videoPreview}>
                    <video src={video.url} muted playsInline controls preload="metadata" />
                    <span className={styles.previewStatus}>{STATUS_LABEL[language][video.status]}</span>
                  </div>

                  <div className={styles.videoEditor}>
                    <div className={styles.editorGrid}>
                      <div className={styles.brandPicker}>
                        <span className={styles.editorLabel}>{c.brand}</span>
                        <div className={styles.brandPickerRail}>
                          {BRANDS.map((item) => (
                            <button
                              className={styles.brandPickerCard}
                              type="button"
                              key={item.name}
                              data-active={video.brand === item.name}
                              onClick={() => updateVideo(video.key, { brand: item.name })}
                            >
                              <span><img src={item.logo} alt="" /></span>
                              <b>{item.name}</b>
                            </button>
                          ))}
                        </div>
                      </div>
                      <label><span>{c.model}</span><input value={video.model} onChange={(event) => updateVideo(video.key, { model: event.target.value })} placeholder="Cullinan Black Badge" /></label>
                      <label><span>{c.status}</span><select value={video.status} onChange={(event) => updateVideo(video.key, { status: event.target.value as VideoStatus })}>{(Object.keys(STATUS_LABEL[language]) as VideoStatus[]).map((status) => <option key={status} value={status}>{STATUS_LABEL[language][status]}</option>)}</select></label>
                      <label><span>{c.currency}</span><select value={video.currency} onChange={(event) => updateVideo(video.key, { currency: event.target.value as Currency })}><option>USD</option><option>EUR</option><option>UZS</option></select></label>
                      <label className={styles.priceField}><span>{c.price}</span><input inputMode="numeric" value={video.price ?? ""} disabled={video.priceOnRequest} onChange={(event) => updateVideo(video.key, { price: event.target.value.trim() ? Number(event.target.value.replace(/\D/g, "")) : null })} placeholder="258000" /></label>
                    </div>

                    <label className={styles.requestToggle}><input type="checkbox" checked={video.priceOnRequest} onChange={(event) => updateVideo(video.key, { priceOnRequest: event.target.checked })} /><span>{c.request}</span></label>

                    <div className={styles.videoActions}>
                      <div><strong>{video.brand || "Auto Sale Umar"} {video.model}</strong><small>{formatSize(video.size)}</small></div>
                      <button className={styles.saveButton} type="button" disabled={savingKey === video.key} onClick={() => void saveVideo(video)}><Save />{savingKey === video.key ? c.saving : savedKey === video.key ? c.saved : c.save}</button>
                      <button className={styles.deleteButton} type="button" disabled={deletingKey === video.key} onClick={() => void deleteVideo(video)} aria-label={c.delete}><Trash2 /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
