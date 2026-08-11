"use client";

import {
  ArrowLeft,
  Film,
  LockKeyhole,
  Menu,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import styles from "./home.module.css";

type Language = "ru" | "uz";
type Theme = "light" | "dark";

interface MeResponse {
  user?: { role?: "super_admin" | "admin" | "sales_manager" };
  error?: string;
}

interface VideoItem {
  key: string;
  url: string;
  size: number;
  uploadedAt: string | null;
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
    eyebrow: "AUTO SALE UMAR / CONTROL SYSTEM",
    title: "Главная страница",
    lead: "Управляйте короткими видео первого блока публичного сайта. Базовое intro-видео всегда остаётся первым.",
    fixed: "Системное видео",
    fixedTitle: "Intro · первый слайд",
    fixedText: "Используется при загрузке сайта и всегда стоит первым в рекламной карусели.",
    uploaded: "Видео карусели",
    count: "добавлено",
    add: "Добавить видео",
    uploadHint: "MP4, WebM или MOV · до 80 МБ. Для максимальной совместимости используйте MP4.",
    uploading: "Загружаем…",
    empty: "Дополнительных видео пока нет.",
    emptyText: "Добавьте короткие автомобильные видео — они появятся после intro.mp4 на главной странице.",
    delete: "Удалить",
    deleteConfirm: "Удалить это видео с главной страницы?",
    errorLoad: "Не удалось загрузить список видео.",
    errorUpload: "Не удалось загрузить видео.",
    errorDelete: "Не удалось удалить видео.",
    managerDenied: "У вашей роли нет доступа к управлению главной страницей.",
  },
  uz: {
    nav: "Control System bo‘limlari",
    team: "Jamoa",
    cars: "Avtomobillar",
    home: "Bosh sahifa",
    eyebrow: "AUTO SALE UMAR / CONTROL SYSTEM",
    title: "Bosh sahifa",
    lead: "Ommaviy saytning birinchi blokidagi qisqa videolarni boshqaring. Asosiy intro-video doimo birinchi bo‘lib qoladi.",
    fixed: "Tizim videosi",
    fixedTitle: "Intro · birinchi slayd",
    fixedText: "Sayt yuklanishida ishlatiladi va reklama karuselida doimo birinchi turadi.",
    uploaded: "Karusel videolari",
    count: "qo‘shilgan",
    add: "Video qo‘shish",
    uploadHint: "MP4, WebM yoki MOV · 80 MB gacha. Eng yaxshi moslik uchun MP4 ishlating.",
    uploading: "Yuklanmoqda…",
    empty: "Qo‘shimcha videolar hali yo‘q.",
    emptyText: "Qisqa avtomobil videolarini qo‘shing — ular bosh sahifada intro.mp4 dan keyin chiqadi.",
    delete: "O‘chirish",
    deleteConfirm: "Bu videoni bosh sahifadan o‘chirasizmi?",
    errorLoad: "Video ro‘yxatini yuklab bo‘lmadi.",
    errorUpload: "Videoni yuklab bo‘lmadi.",
    errorDelete: "Videoni o‘chirib bo‘lmadi.",
    managerDenied: "Sizning rolingiz bosh sahifani boshqarishga ruxsat bermaydi.",
  },
} as const;

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

  async function uploadVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    const body = new FormData();
    body.set("file", file, file.name);
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
      <header className={styles.toolbar}>
        <a className={styles.roundControl} href="/admin/" aria-label="Back"><ArrowLeft /></a>
        <a className={styles.wordmark} href="/admin/"><img src={theme === "dark" ? "/brand/asu-wordmark-white.png" : "/brand/asu-wordmark-black.png"} alt="Auto Sale Umar" /></a>
        <button className={styles.roundControl} type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Menu">{menuOpen ? <X /> : <Menu />}</button>
        <div className={styles.quickMenu} data-open={menuOpen}>
          <div className={styles.menuRow}>
            <button type="button" data-active={language === "ru"} onClick={() => changeLanguage("ru")}>RU</button>
            <button type="button" data-active={language === "uz"} onClick={() => changeLanguage("uz")}>UZ</button>
          </div>
          <div className={styles.menuRow}>
            <button type="button" data-active={theme === "light"} onClick={() => applyTheme("light")}>Light</button>
            <button type="button" data-active={theme === "dark"} onClick={() => applyTheme("dark")}>Dark</button>
          </div>
        </div>
      </header>

      <nav className={styles.sectionNav} aria-label={c.nav}>
        <a href="/admin/staff/">{c.team}</a>
        <a href="/admin/cars/">{c.cars}</a>
        <a className={styles.active} href="/admin/home/" aria-current="page">{c.home}</a>
      </nav>

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
          <div className={styles.fixedCopy}><p>01</p><h2>{c.fixedTitle}</h2><span>{c.fixedText}</span></div>
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
              {videos.map((video, index) => (
                <article className={styles.videoCard} key={video.key}>
                  <div className={styles.videoPreview}>
                    <video src={video.url} muted playsInline controls preload="metadata" />
                    <b>{String(index + 2).padStart(2, "0")}</b>
                  </div>
                  <div className={styles.videoMeta}>
                    <div><strong>Hero video {index + 2}</strong><small>{formatSize(video.size)}</small></div>
                    <button type="button" disabled={deletingKey === video.key} onClick={() => void deleteVideo(video)} aria-label={c.delete}><Trash2 /></button>
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
