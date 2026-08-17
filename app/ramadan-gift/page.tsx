"use client";

import { ArrowRight, CalendarDays, ChevronRight, Gift, Instagram, Loader2, ShieldCheck, Sparkles, Stars, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PublicChrome, { type PublicLanguage, type PublicResolvedTheme, type PublicThemeMode } from '../_components/PublicChrome';
import styles from './ramadan-gift.module.css';

type Currency = 'USD' | 'UZS' | 'EUR';
type PhotoGroup = 'exterior' | 'interior';

interface GiftMedia {
  id: number;
  publicUrl: string;
  photoGroup: PhotoGroup;
  sortOrder: number;
  isCover: boolean;
}

interface GiftPayload {
  id: number | null;
  slug: string;
  isActive: boolean;
  titleRu: string;
  titleUz: string;
  subtitleRu: string;
  subtitleUz: string;
  shortPhraseRu: string;
  shortPhraseUz: string;
  descriptionRu: string;
  descriptionUz: string;
  brand: string;
  model: string;
  year: number | null;
  trim: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  minPurchaseAmount: number;
  marketPrice: number | null;
  currency: Currency;
  instagramUrl: string | null;
  orderHref: string | null;
  media: GiftMedia[];
  updatedAt: string | null;
  updatedByName: string | null;
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  gift?: GiftPayload;
}

const COPY = {
  ru: {
    eyebrow: 'AUTO SALE UMAR · RAMADAN GIFT',
    badge: 'Программа благодарности клиентам',
    back: 'Главная страница',
    bookVisit: 'Забронировать визит',
    becomeParticipant: 'Условия программы',
    orderCar: 'Заказать автомобиль',
    instagram: 'Instagram',
    storyTitle: 'Ramadan Gift — благодарность, оформленная как отдельная программа.',
    storyText: 'Ежегодная премиальная программа благодарности клиентам Auto Sale Umar. Участие определяется официальными условиями, а подарочный автомобиль представлен на этой странице.',
    rulesTitle: 'Как работает Ramadan Gift',
    rule1: 'Клиенты, выполнившие условия покупки в установленный период, участвуют в программе согласно официальным условиям Auto Sale Umar.',
    rule2: 'В Рамадан один участник получает подарочный автомобиль, представленный на этой странице.',
    rule3: 'Порядок участия и итог программы определяются официальными условиями Ramadan Gift.',
    conditionLabel: 'Текущий порог участия',
    highlightsTitle: 'Детали подарочного автомобиля',
    trim: 'Комплектация',
    exterior: 'Цвет кузова',
    interior: 'Цвет салона',
    galleryTitle: 'Галерея автомобиля',
    eligibilityTitle: 'Программа Auto Sale Umar',
    eligibilityText: 'Один автомобиль. Один клиент. Благодарность за доверие. Актуальные условия участия и данные подарочного автомобиля публикуются на этой странице.',
    updated: 'Последнее обновление',
    fallbackDate: '—',
    noGift: 'Сейчас страница Ramadan Gift временно недоступна.',
  },
  uz: {
    eyebrow: 'AUTO SALE UMAR · RAMADAN GIFT',
    badge: 'Mijozlar uchun minnatdorchilik dasturi',
    back: 'Bosh sahifa',
    bookVisit: 'Tashrifni band qilish',
    becomeParticipant: 'Dastur shartlari',
    orderCar: 'Avtomobil buyurtma qilish',
    instagram: 'Instagram',
    storyTitle: 'Ramadan Gift — alohida dastur shaklidagi minnatdorchilik.',
    storyText: 'Auto Sale Umar mijozlari uchun yillik premium minnatdorchilik dasturi. Ishtirok rasmiy shartlar asosida belgilanadi, sovg‘a avtomobil esa shu sahifada taqdim etiladi.',
    rulesTitle: 'Ramadan Gift qanday ishlaydi',
    rule1: 'Belgilangan davrda xarid shartlarini bajargan mijozlar Auto Sale Umar rasmiy shartlariga muvofiq dasturda ishtirok etadi.',
    rule2: 'Ramazon oyida bitta ishtirokchi shu sahifada taqdim etilgan sovg‘a avtomobil egasiga aylanadi.',
    rule3: 'Ishtirok tartibi va dastur yakuni Ramadan Gift rasmiy shartlari bilan belgilanadi.',
    conditionLabel: 'Amaldagi ishtirok chegarasi',
    highlightsTitle: 'Sovg‘a avtomobil tafsilotlari',
    trim: 'Komplektatsiya',
    exterior: 'Kuzov rangi',
    interior: 'Salon rangi',
    galleryTitle: 'Avtomobil galereyasi',
    eligibilityTitle: 'Auto Sale Umar dasturi',
    eligibilityText: 'Bitta avtomobil. Bitta mijoz. Ishonch uchun minnatdorchilik. Ishtirokning amaldagi shartlari va sovg‘a avtomobil ma’lumotlari shu sahifada e’lon qilinadi.',
    updated: 'So‘nggi yangilanish',
    fallbackDate: '—',
    noGift: 'Hozircha Ramadan Gift sahifasi vaqtincha mavjud emas.',
  },
} as const;

function formatMoney(value: number | null, currency: Currency, locale: string): string {
  if (!value) return '—';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null, language: PublicLanguage): string {
  if (!value) return COPY[language].fallbackDate;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return COPY[language].fallbackDate;
  return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

export default function RamadanGiftPage() {
  const [language, setLanguage] = useState<PublicLanguage>('ru');
  const [themeMode, setThemeMode] = useState<PublicThemeMode>('light');
  const [resolvedTheme, setResolvedTheme] = useState<PublicResolvedTheme>('light');
  const [gift, setGift] = useState<GiftPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('asu-public-language');
      if (savedLanguage === 'uz' || savedLanguage === 'ru') setLanguage(savedLanguage);
      const savedTheme = localStorage.getItem('asu-public-theme') as PublicThemeMode | null;
      const nextTheme = savedTheme === 'dark' || savedTheme === 'system' ? savedTheme : 'light';
      setThemeMode(nextTheme);
    } catch {}
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const next = themeMode === 'system' ? (media.matches ? 'dark' : 'light') : themeMode;
      setResolvedTheme(next);
      document.documentElement.style.colorScheme = next;
      document.documentElement.dataset.publicTheme = next;
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [themeMode]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ramadan-gift', { cache: 'no-store', headers: { accept: 'application/json' } })
      .then((response) => response.json() as Promise<ApiResponse>)
      .then((data) => {
        if (!cancelled) setGift(data.success && data.gift ? data.gift : null);
      })
      .catch(() => {
        if (!cancelled) setGift(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const c = COPY[language];
  const media = gift?.media ?? [];
  const cover = useMemo(() => media.find((item) => item.isCover) ?? media[0] ?? null, [media]);

  useEffect(() => {
    if (!media.length) return;
    const coverIndex = media.findIndex((item) => item.isCover);
    setHeroIndex(coverIndex >= 0 ? coverIndex : 0);
  }, [media]);

  const activePhoto = media[heroIndex] ?? cover ?? null;

  function changeLanguage(next: PublicLanguage) {
    setLanguage(next);
    try { localStorage.setItem('asu-public-language', next); } catch {}
  }

  function changeTheme(next: PublicThemeMode) {
    setThemeMode(next);
    try { localStorage.setItem('asu-public-theme', next); } catch {}
  }

  return (
    <main className={styles.page} data-theme={resolvedTheme}>
      <PublicChrome
        language={language}
        themeMode={themeMode}
        resolvedTheme={resolvedTheme}
        backHref="/"
        onLanguageChange={changeLanguage}
        onThemeChange={changeTheme}
      />

      <section className={styles.shell}>
        {loading ? (
          <div className={styles.loadingCard}><Loader2 className={styles.spin} />Loading…</div>
        ) : !gift || !gift.isActive ? (
          <div className={styles.emptyCard}>{c.noGift}</div>
        ) : (
          <>
            <div className={styles.heroGrid}>
              <section className={styles.heroVisual}>
                {activePhoto ? <img src={activePhoto.publicUrl} alt={language === 'ru' ? gift.subtitleRu : gift.subtitleUz} /> : null}
                <div className={styles.heroShade} />
                <div className={styles.heroCaption}>
                  <span>{c.badge}</span>
                  <strong>{language === 'ru' ? gift.titleRu : gift.titleUz}</strong>
                </div>
              </section>

              <section className={styles.heroCard}>
                <p className={styles.eyebrow}>{c.eyebrow}</p>
                <h1>{language === 'ru' ? gift.subtitleRu : gift.subtitleUz}</h1>
                <p className={styles.lead}>{language === 'ru' ? gift.shortPhraseRu : gift.shortPhraseUz}</p>
                <p className={styles.story}>{language === 'ru' ? gift.descriptionRu : gift.descriptionUz}</p>

                <div className={styles.heroActions}>
                  <a className={styles.primaryButton} href="#rules"><Gift />{c.becomeParticipant}</a>
                  <a className={styles.secondaryButton} href="/booking/"><CalendarDays />{c.bookVisit}</a>
                  <a className={styles.secondaryButton} href={gift.orderHref || '/compare/'}><ArrowRight />{c.orderCar}</a>
                  <a className={styles.secondaryButton} href={gift.instagramUrl || 'https://www.instagram.com/auto_sale_umar/'} target="_blank" rel="noreferrer"><Instagram />{c.instagram}</a>
                </div>


              </section>
            </div>

            <section className={styles.storyGrid}>
              <article className={styles.storyCard} id="rules">
                <div className={styles.cardHead}><Sparkles /><h2>{c.storyTitle}</h2></div>
                <p>{c.storyText}</p>
                <div className={styles.notePill}><ShieldCheck />{c.eligibilityText}</div>
              </article>

              <article className={styles.rulesCard}>
                <div className={styles.cardHead}><Trophy /><h2>{c.rulesTitle}</h2></div>
                <ol>
                  <li>{c.rule1}</li>
                  <li>{c.rule2}</li>
                  <li>{c.rule3}</li>
                </ol>
                <div className={styles.conditionLine}>
                  <span>{c.conditionLabel}</span>
                  <strong>{formatMoney(gift.minPurchaseAmount, gift.currency, language === 'ru' ? 'ru-RU' : 'uz-UZ')}</strong>
                </div>
              </article>
            </section>

            <section className={styles.detailsGrid}>
              <article className={styles.detailCard}>
                <div className={styles.cardHead}><Stars /><h2>{c.highlightsTitle}</h2></div>
                <div className={styles.detailRows}>
                  <div><span>{c.trim}</span><strong>{gift.trim || '—'}</strong></div>
                  <div><span>{c.exterior}</span><strong>{gift.exteriorColor || '—'}</strong></div>
                  <div><span>{c.interior}</span><strong>{gift.interiorColor || '—'}</strong></div>
                  <div><span>{c.updated}</span><strong>{formatDate(gift.updatedAt, language)}</strong></div>
                </div>
              </article>

              <article className={styles.detailCard}>
                <div className={styles.cardHead}><Gift /><h2>{c.eligibilityTitle}</h2></div>
                <p className={styles.detailText}>{c.eligibilityText}</p>
                <div className={styles.inlineActions}>
                  <a href="#gallery">{c.galleryTitle}<ChevronRight /></a>
                  <a href="/booking/">{c.bookVisit}<ChevronRight /></a>
                </div>
              </article>
            </section>

            <section className={styles.gallerySection} id="gallery">
              <div className={styles.galleryHead}>
                <h2>{c.galleryTitle}</h2>
                <p>{gift.brand} {gift.model}{gift.year ? ` · ${gift.year}` : ''}</p>
              </div>
              <div className={styles.thumbRail}>
                {media.map((item, index) => (
                  <button key={item.id} className={styles.thumbButton} data-active={index === heroIndex} type="button" onClick={() => setHeroIndex(index)}>
                    <img src={item.publicUrl} alt={`${gift.brand} ${gift.model}`} />
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
