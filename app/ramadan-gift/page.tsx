"use client";

import { ArrowRight, CalendarDays, ChevronRight, Gift, Instagram, Loader2, ShieldCheck, Sparkles, Stars, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PublicChrome, { type PublicLanguage, type PublicResolvedTheme, type PublicThemeMode } from '../_components/PublicChrome';
import styles from './ramadan-gift.module.css';

type Currency = 'USD' | 'UZS' | 'EUR';
type PhotoGroup = 'exterior' | 'interior';

type CountdownPart = {
  key: 'days' | 'hours' | 'minutes' | 'seconds';
  value: string;
};

const RAMADAN_START_DATES = [
  '2027-02-09T00:00:00+05:00',
  '2028-01-29T00:00:00+05:00',
  '2029-01-17T00:00:00+05:00',
  '2030-01-06T00:00:00+05:00',
] as const;

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
    badge: 'Премиальная программа благодарности клиентам',
    bookVisit: 'Забронировать визит',
    becomeParticipant: 'Условия программы',
    orderCar: 'Заказать автомобиль',
    instagram: 'Instagram',
    heroTitle: 'Auto Sale Umar Ramadan Gift',
    storyTitle: 'Программа благодарности, поданная как главный подарок года.',
    storyText: 'Ramadan Gift — это премиальная программа благодарности для клиентов Auto Sale Umar. Она создаёт эмоциональную кульминацию года: реальный автомобиль, выразительная подача и один клиент, который получает главный подарок программы в Рамадан.',
    rulesTitle: 'Как работает программа',
    rule1: 'Каждый клиент, который в течение года приобрёл автомобиль у Auto Sale Umar на сумму от 88 000 USD, автоматически становится участником программы.',
    rule2: 'Во время Рамадана один из клиентов получает подарочный Mercedes-Benz E-Class как главный автомобиль программы благодарности.',
    rule3: 'На странице показан конкретный подарочный автомобиль, его визуальный образ, ключевые параметры и ориентир по рыночной стоимости.',
    highlightsTitle: 'Ключевые детали подарочного автомобиля',
    marketPrice: 'Ориентир по стоимости',
    minPurchase: 'Участие от',
    prizeCar: 'Подарочный автомобиль',
    winnerCount: 'Получатель',
    winnerValue: '1 клиент',
    trim: 'Комплектация',
    exterior: 'Цвет кузова',
    interior: 'Цвет салона',
    galleryTitle: 'Галерея автомобиля',
    eligibilityTitle: 'Для клиентов, которые выбирают Auto Sale Umar всерьёз',
    eligibilityText: 'Участвуют клиенты, которые в течение установленного периода приобрели автомобиль в Auto Sale Umar на сумму от 88 000 USD. Это не промо-баннер, а часть премиального клиентского опыта: один автомобиль, один обладатель и прозрачные условия программы.',
    updated: 'Последнее обновление',
    fallbackDate: '—',
    noGift: 'Сейчас страница Ramadan Gift временно недоступна.',
    countdownKicker: 'До следующего Рамадана',
    countdownTitle: 'Живой обратный отсчёт',
    countdownLive: 'Live countdown',
    countdownDays: 'дней',
    countdownHours: 'часов',
    countdownMinutes: 'минут',
    countdownSeconds: 'секунд',
    countdownDateLabel: 'Ориентировочный старт',
    galleryMeta: 'Подарочный автомобиль · визуальная подборка',
  },
  uz: {
    eyebrow: 'AUTO SALE UMAR · RAMADAN GIFT',
    badge: 'Mijozlar uchun premium minnatdorchilik dasturi',
    bookVisit: 'Tashrifni band qilish',
    becomeParticipant: 'Dastur shartlari',
    orderCar: 'Avtomobil buyurtma qilish',
    instagram: 'Instagram',
    heroTitle: 'Auto Sale Umar Ramadan Gift',
    storyTitle: 'Yilning asosiy sovg‘asi sifatida yaratilgan minnatdorchilik dasturi.',
    storyText: 'Ramadan Gift — Auto Sale Umar mijozlari uchun premium minnatdorchilik dasturi. U yilning hissiy kulminatsiyasini yaratadi: haqiqiy avtomobil, kuchli taqdimot va Ramazon oyida dastur bosh sovg‘asini oladigan bitta mijoz.',
    rulesTitle: 'Dastur qanday ishlaydi',
    rule1: 'Bir yil davomida Auto Sale Umar’dan 88 000 USD dan boshlab avtomobil xarid qilgan har bir mijoz avtomatik ravishda dastur ishtirokchisiga aylanadi.',
    rule2: 'Ramazon davrida mijozlardan biri dastur bosh sovg‘asi bo‘lgan Mercedes-Benz E-Class egasiga aylanadi.',
    rule3: 'Sahifada aynan sovg‘a avtomobil, uning vizual taqdimoti, asosiy parametrlar va bozor qiymatining yo‘nalishi ko‘rsatiladi.',
    highlightsTitle: 'Sovg‘a avtomobilning asosiy tafsilotlari',
    marketPrice: 'Taxminiy qiymat',
    minPurchase: 'Ishtirok boshlanishi',
    prizeCar: 'Sovg‘a avtomobil',
    winnerCount: 'Qabul qiluvchi',
    winnerValue: '1 mijoz',
    trim: 'Komplektatsiya',
    exterior: 'Kuzov rangi',
    interior: 'Salon rangi',
    galleryTitle: 'Avtomobil galereyasi',
    eligibilityTitle: 'Auto Sale Umar’ni jiddiy tanlaydigan mijozlar uchun',
    eligibilityText: 'Belgilangan davr ichida Auto Sale Umar’dan 88 000 USD dan boshlab avtomobil xarid qilgan mijozlar ishtirok etadi. Bu oddiy promo-banner emas, balki premium mijoz tajribasining bir qismi: bitta avtomobil, bitta egasi va aniq dastur shartlari.',
    updated: 'So‘nggi yangilanish',
    fallbackDate: '—',
    noGift: 'Hozircha Ramadan Gift sahifasi vaqtincha mavjud emas.',
    countdownKicker: 'Keyingi Ramazongacha',
    countdownTitle: 'Jonli ortga sanash',
    countdownLive: 'Live countdown',
    countdownDays: 'kun',
    countdownHours: 'soat',
    countdownMinutes: 'daqiqa',
    countdownSeconds: 'soniya',
    countdownDateLabel: 'Taxminiy boshlanish',
    galleryMeta: 'Sovg‘a avtomobil · vizual tanlov',
  },
} as const;

function getNextRamadanStart(now = new Date()): Date {
  for (const candidate of RAMADAN_START_DATES) {
    const parsed = new Date(candidate);
    if (parsed.getTime() > now.getTime()) return parsed;
  }
  return new Date(RAMADAN_START_DATES[RAMADAN_START_DATES.length - 1]);
}

function getCountdownParts(target: Date, now = new Date()): CountdownPart[] {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { key: 'days', value: String(days).padStart(2, '0') },
    { key: 'hours', value: String(hours).padStart(2, '0') },
    { key: 'minutes', value: String(minutes).padStart(2, '0') },
    { key: 'seconds', value: String(seconds).padStart(2, '0') },
  ];
}

function formatMoney(value: number | null, currency: Currency, locale: string): string {
  if (value == null) return '—';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | Date | null, language: PublicLanguage): string {
  if (!value) return COPY[language].fallbackDate;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return COPY[language].fallbackDate;
  return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'uz-UZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function RamadanGiftPage() {
  const [language, setLanguage] = useState<PublicLanguage>('ru');
  const [themeMode, setThemeMode] = useState<PublicThemeMode>('light');
  const [resolvedTheme, setResolvedTheme] = useState<PublicResolvedTheme>('light');
  const [gift, setGift] = useState<GiftPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [countdown, setCountdown] = useState<CountdownPart[]>(() => getCountdownParts(getNextRamadanStart()));
  const [countdownTarget, setCountdownTarget] = useState<Date>(() => getNextRamadanStart());

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

  useEffect(() => {
    const target = getNextRamadanStart();
    const updateCountdown = () => {
      setCountdownTarget(target);
      setCountdown(getCountdownParts(target));
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
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
  const countdownLabels: Record<CountdownPart['key'], string> = {
    days: c.countdownDays,
    hours: c.countdownHours,
    minutes: c.countdownMinutes,
    seconds: c.countdownSeconds,
  };

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
            <section className={styles.heroStage}>
              <div className={styles.heroGrid}>
                <section className={styles.heroVisual}>
                  {activePhoto ? <img src={activePhoto.publicUrl} alt={language === 'ru' ? gift.subtitleRu : gift.subtitleUz} /> : null}
                  <div className={styles.heroShade} />
                  <div className={styles.heroVisualGlass}>
                    <span>{c.badge}</span>
                    <strong>{language === 'ru' ? gift.subtitleRu : gift.subtitleUz}</strong>
                  </div>
                  <div className={styles.heroVisualBottom}>
                    <div>
                      <small>{c.prizeCar}</small>
                      <strong>{gift.brand} {gift.model}{gift.year ? ` · ${gift.year}` : ''}</strong>
                    </div>
                    <div>
                      <small>{c.marketPrice}</small>
                      <strong>{formatMoney(gift.marketPrice, gift.currency, language === 'ru' ? 'ru-RU' : 'uz-UZ')}</strong>
                    </div>
                  </div>
                </section>

                <section className={styles.heroCard}>
                  <div className={styles.heroTopline}>
                    <p className={styles.eyebrow}>{c.eyebrow}</p>
                    <span className={styles.livePill}><span />{c.countdownLive}</span>
                  </div>

                  <h1>{c.heroTitle}</h1>
                  <p className={styles.heroModel}>{language === 'ru' ? gift.subtitleRu : gift.subtitleUz}</p>
                  <p className={styles.lead}>{language === 'ru' ? gift.shortPhraseRu : gift.shortPhraseUz}</p>
                  <p className={styles.story}>{language === 'ru' ? gift.descriptionRu : gift.descriptionUz}</p>

                  <div className={styles.heroActions}>
                    <a className={styles.primaryButton} href="#rules"><Gift />{c.becomeParticipant}</a>
                    <a className={styles.secondaryButton} href="/booking/"><CalendarDays />{c.bookVisit}</a>
                    <a className={styles.secondaryButton} href={gift.orderHref || '/compare/'}><ArrowRight />{c.orderCar}</a>
                    <a className={styles.secondaryButton} href={gift.instagramUrl || 'https://www.instagram.com/auto_sale_umar/'} target="_blank" rel="noreferrer"><Instagram />{c.instagram}</a>
                  </div>

                  <div className={styles.metricGrid}>
                    <article>
                      <small>{c.marketPrice}</small>
                      <strong>{formatMoney(gift.marketPrice, gift.currency, language === 'ru' ? 'ru-RU' : 'uz-UZ')}</strong>
                    </article>
                    <article>
                      <small>{c.minPurchase}</small>
                      <strong>{formatMoney(gift.minPurchaseAmount, gift.currency, language === 'ru' ? 'ru-RU' : 'uz-UZ')}</strong>
                    </article>
                    <article>
                      <small>{c.winnerCount}</small>
                      <strong>{c.winnerValue}</strong>
                    </article>
                  </div>
                </section>
              </div>

              <section className={styles.countdownSection}>
                <div className={styles.countdownCopy}>
                  <span>{c.countdownKicker}</span>
                  <h2>{c.countdownTitle}</h2>
                  <p>{c.countdownDateLabel}: {formatDate(countdownTarget, language)}</p>
                </div>
                <div className={styles.countdownGrid} aria-label={c.countdownKicker}>
                  {countdown.map((item) => (
                    <article key={item.key} className={styles.countdownCard}>
                      <strong>{item.value}</strong>
                      <span>{countdownLabels[item.key]}</span>
                    </article>
                  ))}
                </div>
              </section>
            </section>

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
              </article>
            </section>

            <section className={styles.detailsGrid}>
              <article className={styles.detailCard}>
                <div className={styles.cardHead}><Stars /><h2>{c.highlightsTitle}</h2></div>
                <div className={styles.detailRows}>
                  <div><span>{c.prizeCar}</span><strong>{language === 'ru' ? gift.subtitleRu : gift.subtitleUz}</strong></div>
                  <div><span>{c.trim}</span><strong>{gift.trim || '—'}</strong></div>
                  <div><span>{c.exterior}</span><strong>{gift.exteriorColor || '—'}</strong></div>
                  <div><span>{c.interior}</span><strong>{gift.interiorColor || '—'}</strong></div>
                  <div><span>{c.minPurchase}</span><strong>{formatMoney(gift.minPurchaseAmount, gift.currency, language === 'ru' ? 'ru-RU' : 'uz-UZ')}</strong></div>
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
                <div>
                  <h2>{c.galleryTitle}</h2>
                  <p>{c.galleryMeta}</p>
                </div>
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
