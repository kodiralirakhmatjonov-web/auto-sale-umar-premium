"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import styles from "./staff.module.css";

type StaffRole = "super_admin" | "admin" | "sales_manager";
type StaffStatus = "active" | "blocked" | string;
type CreatableStaffRole = "admin" | "sales_manager";
type Theme = "light" | "dark";
type Language = "ru" | "uz";

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

type StaffMember = {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: StaffRole;
  status: StaffStatus;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  isCurrentUser: boolean;
};

type StaffSummary = {
  total: number;
  active: number;
  blocked: number;
  admins: number;
  managers: number;
};

type StaffResponse = {
  success: boolean;
  viewer?: {
    id: number;
    role: StaffRole;
  };
  scope?: "all_staff" | "sales_managers";
  summary?: StaffSummary;
  staff?: StaffMember[];
  error?: string;
};

type CreateStaffResponse = {
  success: boolean;
  message?: string;
  staff?: StaffMember;
  temporaryPassword?: string;
  error?: string;
};

type UpdateStaffResponse = {
  success: boolean;
  message?: string;
  staff?: StaffMember;
  error?: string;
};

type StaffForm = {
  fullName: string;
  email: string;
  phone: string;
  role: CreatableStaffRole;
};

const EMPTY_SUMMARY: StaffSummary = {
  total: 0,
  active: 0,
  blocked: 0,
  admins: 0,
  managers: 0,
};

const EMPTY_FORM: StaffForm = {
  fullName: "",
  email: "",
  phone: "",
  role: "sales_manager",
};

const ROLE_LABELS: Record<Language, Record<StaffRole, string>> = {
  ru: {
    super_admin: "Супер-администратор",
    admin: "Администратор",
    sales_manager: "Менеджер",
  },
  uz: {
    super_admin: "Super administrator",
    admin: "Administrator",
    sales_manager: "Menejer",
  },
};

const UZ_COPY: Record<string, string> = {
  "Вернуться на сайт": "Saytga qaytish",
  "Открыть настройки": "Sozlamalarni ochish",
  "Закрыть настройки": "Sozlamalarni yopish",
  "Настройки": "Sozlamalar",
  "Выберите оформление и язык": "Ko‘rinish va tilni tanlang",
  "Оформление": "Ko‘rinish",
  "Светлая": "Yorug‘",
  "Тёмная": "Tungi",
  "Язык": "Til",
  "Настройки сохраняются автоматически": "Sozlamalar avtomatik saqlanadi",
  "Разделы Control System": "Control System bo‘limlari",
  "Команда": "Jamoa",
  "Автомобили": "Avtomobillar",
  "Управление менеджерами и их доступом к экосистеме Auto Sale Umar":
    "Menejerlar va ularning Auto Sale Umar tizimiga kirishini boshqarish",
  "Управление всей командой Auto Sale Umar, ролями и доступом к системе":
    "Auto Sale Umar jamoasi, rollar va tizimga kirishni boshqarish",
  "Добавить сотрудника": "Xodim qo‘shish",
  "Загрузка сотрудников": "Xodimlar yuklanmoqda",
  "Не удалось загрузить данные": "Ma’lumotlarni yuklab bo‘lmadi",
  "Повторить": "Qayta urinish",
  "Обзор доступа": "Kirish nazorati",
  "Обновляется из D1": "D1 orqali yangilanadi",
  "Статистика сотрудников": "Xodimlar statistikasi",
  "Всего": "Jami",
  "активных": "faol",
  "Администраторы": "Administratorlar",
  "доступ к управлению": "boshqaruv huquqi",
  "Менеджеры": "Menejerlar",
  "работа с клиентами": "mijozlar bilan ishlaydi",
  "Заблокированы": "Bloklangan",
  "без доступа": "kirish huquqisiz",
  "Сотрудники": "Xodimlar",
  "профиль": "profil",
  "профилей": "profil",
  "Сотрудников пока нет": "Hozircha xodimlar yo‘q",
  "После создания они появятся здесь автоматически.":
    "Yaratilgandan keyin ular bu yerda avtomatik ko‘rinadi.",
  "Вы": "Siz",
  "Супер-администратор защищён": "Super administrator himoyalangan",
  "Управление сотрудником": "Xodimni boshqarish",
  "Активен": "Faol",
  "Заблокирован": "Bloklangan",
  "Телефон": "Telefon",
  "Не указан": "Ko‘rsatilmagan",
  "Последний вход": "Oxirgi kirish",
  "ПРОФИЛЬ СОТРУДНИКА": "XODIM PROFILI",
  "Закрыть": "Yopish",
  "Роль в системе": "Tizimdagi rol",
  "Изменение применяется сразу": "O‘zgarish darhol qo‘llanadi",
  "Менеджер": "Menejer",
  "Автомобили, клиенты и визиты": "Avtomobillar, mijozlar va tashriflar",
  "Администратор": "Administrator",
  "Управление системой и менеджерами": "Tizim va menejerlarni boshqarish",
  "Доступ": "Kirish huquqi",
  "Блокировка прекращает доступ к системе": "Bloklash tizimga kirishni to‘xtatadi",
  "Заблокировать доступ": "Kirishni bloklash",
  "Восстановить доступ": "Kirishni tiklash",
  "ДОСТУП СОЗДАН": "KIRISH YARATILDI",
  "Профиль добавлен в Auto Sale Umar Control System. Передайте сотруднику логин и временный пароль.":
    "Profil Auto Sale Umar Control System tizimiga qo‘shildi. Xodimga login va vaqtinchalik parolni bering.",
  "Логин": "Login",
  "Временный пароль": "Vaqtinchalik parol",
  "Пароль показывается здесь для передачи сотруднику. Не публикуйте его и не отправляйте в общий чат.":
    "Parol xodimga berish uchun shu yerda ko‘rsatiladi. Uni e’lon qilmang va umumiy chatga yubormang.",
  "Скопировано": "Nusxalandi",
  "Скопировать пароль": "Parolni nusxalash",
  "Готово": "Tayyor",
  "НОВЫЙ ДОСТУП": "YANGI KIRISH",
  "Создайте защищённый профиль для команды Auto Sale Umar.":
    "Auto Sale Umar jamoasi uchun himoyalangan profil yarating.",
  "Имя и фамилия": "Ism va familiya",
  "Например, Akmal Karimov": "Masalan, Akmal Karimov",
  "Электронная почта": "Elektron pochta",
  "Работа с автомобилями, клиентами и визитами":
    "Avtomobillar, mijozlar va tashriflar bilan ishlash",
  "Отмена": "Bekor qilish",
  "Создаём профиль…": "Profil yaratilmoqda…",
  "Создать сотрудника": "Xodim yaratish",
};

function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "AS";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatLastLogin(value: string | null, language: Language): string {
  if (!value) return language === "uz" ? "Hali tizimga kirmagan" : "Ещё не входил";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === "uz" ? "Ma’lumot yo‘q" : "Нет данных";

  return new Intl.DateTimeFormat(language === "uz" ? "uz-UZ" : "ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeClientEmail(value: string): string {
  return value.trim().toLowerCase();
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

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9c0-.5-.04-1-.12-1.47A7 7 0 0 1 12 3Z" />
    </svg>
  );
}

export default function StaffPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("ru");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [summary, setSummary] = useState<StaffSummary>(EMPTY_SUMMARY);
  const [viewerRole, setViewerRole] = useState<StaffRole | null>(null);
  const [scope, setScope] = useState<StaffResponse["scope"]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createdMember, setCreatedMember] = useState<StaffMember | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [updatingMember, setUpdatingMember] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const t = useCallback(
    (russian: string) => (language === "uz" ? (UZ_COPY[russian] ?? russian) : russian),
    [language],
  );

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/staff", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.status === 401) {
        window.location.replace("/admin/login/");
        return;
      }

      const data = (await response.json()) as StaffResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          document.documentElement.lang === "uz"
            ? "Xodimlarni yuklab bo‘lmadi."
            : (data.error || "Не удалось загрузить сотрудников."),
        );
      }

      setStaff(Array.isArray(data.staff) ? data.staff : []);
      setSummary(data.summary ?? EMPTY_SUMMARY);
      setScope(data.scope);
      setViewerRole(data.viewer?.role ?? null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : document.documentElement.lang === "uz"
            ? "Xodimlarni yuklab bo‘lmadi. Qayta urinib ko‘ring."
            : "Не удалось загрузить сотрудников. Попробуйте ещё раз.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const applyTheme = useCallback((nextTheme: Theme) => {
    setTheme(nextTheme);

    try {
      window.localStorage.setItem("asu-theme", nextTheme);
    } catch {
      // Persistence is optional. The visual theme still works.
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
    try {
      const rootTheme = document.documentElement.dataset.asuTheme;
      if (rootTheme === "light" || rootTheme === "dark") {
        applyTheme(rootTheme);
        return;
      }

      const stored = window.localStorage.getItem("asu-theme");
      if (stored === "light" || stored === "dark") {
        applyTheme(stored);
        return;
      }

      applyTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch {
      applyTheme("light");
    }
  }, [applyTheme]);

  const changeTheme = (nextTheme: Theme) => {
    if (nextTheme === theme) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const transitionDocument = document as ViewTransitionDocument;

    if (!reducedMotion && transitionDocument.startViewTransition) {
      transitionDocument.startViewTransition(() => {
        applyTheme(nextTheme);
      });
      return;
    }

    applyTheme(nextTheme);
  };

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
    if (!settingsOpen && !createOpen && !selectedMember) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || creating || updatingMember) return;
      setSettingsOpen(false);
      setCreateOpen(false);
      setSelectedMember(null);
      setActionError(null);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen, createOpen, selectedMember, creating, updatingMember]);

  const subtitle = useMemo(() => {
    if (scope === "sales_managers") {
      return t("Управление менеджерами и их доступом к экосистеме Auto Sale Umar");
    }
    return t("Управление всей командой Auto Sale Umar, ролями и доступом к системе");
  }, [scope, t]);

  const roleOptions = useMemo(() => {
    if (viewerRole === "super_admin") {
      return [
        { value: "sales_manager" as const, label: t("Менеджер") },
        { value: "admin" as const, label: t("Администратор") },
      ];
    }

    return [{ value: "sales_manager" as const, label: t("Менеджер") }];
  }, [viewerRole, t]);

  const openCreate = () => {
    setSettingsOpen(false);
    setForm({
      ...EMPTY_FORM,
      role: viewerRole === "admin" ? "sales_manager" : EMPTY_FORM.role,
    });
    setFormError(null);
    setCreatedMember(null);
    setTemporaryPassword(null);
    setCopied(false);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (creating) return;
    setCreateOpen(false);
  };

  const openMemberActions = (member: StaffMember) => {
    if (member.role === "super_admin") return;
    setSettingsOpen(false);
    setActionError(null);
    setSelectedMember(member);
  };

  const closeMemberActions = () => {
    if (updatingMember) return;
    setSelectedMember(null);
    setActionError(null);
  };

  const updateMember = async (changes: { role?: CreatableStaffRole; status?: "active" | "blocked" }) => {
    if (!selectedMember || updatingMember) return;

    setUpdatingMember(true);
    setActionError(null);

    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          id: selectedMember.id,
          ...changes,
        }),
      });

      if (response.status === 401) {
        window.location.replace("/admin/login/");
        return;
      }

      const responseText = await response.text();
      let data: UpdateStaffResponse;

      try {
        data = JSON.parse(responseText) as UpdateStaffResponse;
      } catch {
        throw new Error(
          language === "uz"
            ? `Server noto‘g‘ri javob qaytardi (${response.status}).`
            : `Сервер вернул некорректный ответ (${response.status}).`,
        );
      }

      if (!response.ok || !data.success || !data.staff) {
        throw new Error(
          language === "uz"
            ? "Xodimni yangilab bo‘lmadi."
            : (data.error || "Не удалось обновить сотрудника."),
        );
      }

      setSelectedMember(data.staff);
      await loadStaff();
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : language === "uz"
            ? "Xodimni yangilab bo‘lmadi. Qayta urinib ko‘ring."
            : "Не удалось обновить сотрудника. Попробуйте ещё раз.",
      );
    } finally {
      setUpdatingMember(false);
    }
  };

  const createStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creating) return;

    const fullName = form.fullName.trim();
    const email = normalizeClientEmail(form.email);
    const phone = form.phone.trim();

    if (fullName.length < 2) {
      setFormError(language === "uz" ? "Xodim ismini kiriting." : "Введите имя сотрудника.");
      return;
    }

    if (!email || !email.includes("@")) {
      setFormError(
        language === "uz"
          ? "To‘g‘ri elektron pochta manzilini kiriting."
          : "Введите корректную электронную почту.",
      );
      return;
    }

    setCreating(true);
    setFormError(null);

    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          role: form.role,
        }),
      });

      if (response.status === 401) {
        window.location.replace("/admin/login/");
        return;
      }

      const data = (await response.json()) as CreateStaffResponse;

      if (!response.ok || !data.success || !data.staff || !data.temporaryPassword) {
        throw new Error(
          language === "uz"
            ? "Xodimni yaratib bo‘lmadi."
            : (data.error || "Не удалось создать сотрудника."),
        );
      }

      setCreatedMember(data.staff);
      setTemporaryPassword(data.temporaryPassword);
      setCopied(false);
      await loadStaff();
    } catch (caught) {
      setFormError(
        caught instanceof Error
          ? caught.message
          : language === "uz"
            ? "Xodimni yaratib bo‘lmadi. Qayta urinib ko‘ring."
            : "Не удалось создать сотрудника. Попробуйте ещё раз.",
      );
    } finally {
      setCreating(false);
    }
  };

  const copyPassword = async () => {
    if (!temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className={styles.page} data-theme={theme}>
      <div className={styles.ambient} aria-hidden="true" />
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <a className={styles.backButton} href="/" aria-label={t("Вернуться на сайт")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </a>

          <a className={styles.brand} href="/admin/staff/" aria-label="Auto Sale Umar Control System">
            <span className={styles.logoStack} aria-hidden="true">
              <img
                className={`${styles.logoImage} ${styles.logoLight}`}
                src="/brand/asu-wordmark-black.png"
                alt=""
              />
              <img
                className={`${styles.logoImage} ${styles.logoDark}`}
                src="/brand/asu-wordmark-white.png"
                alt=""
              />
            </span>
            <span className={styles.brandSystem}>CONTROL SYSTEM</span>
          </a>

          <button
            className={styles.themeButton}
            type="button"
            data-active={settingsOpen}
            onClick={() => setSettingsOpen((current) => !current)}
            aria-label={settingsOpen ? t("Закрыть настройки") : t("Открыть настройки")}
            aria-expanded={settingsOpen}
            aria-controls="staff-interface-options"
          >
            <MenuIcon open={settingsOpen} />
          </button>
        </div>

        <section
          className={styles.settingsMenu}
          id="staff-interface-options"
          data-open={settingsOpen}
          aria-hidden={!settingsOpen}
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-options-title"
        >
          <header className={styles.settingsHeader}>
            <p>CONTROL SYSTEM</p>
            <h2 id="staff-options-title">{t("Настройки")}</h2>
            <span>{t("Выберите оформление и язык")}</span>
          </header>

          <div className={styles.settingsContent}>
            <div className={styles.settingsBlock}>
              <span className={styles.settingsLabel}>{t("Оформление")}</span>
              <div className={styles.settingsSegments}>
                <button
                  type="button"
                  data-selected={theme === "light"}
                  onClick={() => changeTheme("light")}
                  aria-pressed={theme === "light"}
                  tabIndex={settingsOpen ? 0 : -1}
                >
                  <SunIcon />
                  <span>{t("Светлая")}</span>
                </button>
                <button
                  type="button"
                  data-selected={theme === "dark"}
                  onClick={() => changeTheme("dark")}
                  aria-pressed={theme === "dark"}
                  tabIndex={settingsOpen ? 0 : -1}
                >
                  <MoonIcon />
                  <span>{t("Тёмная")}</span>
                </button>
              </div>
            </div>

            <div className={styles.settingsBlock}>
              <span className={styles.settingsLabel}>{t("Язык")}</span>
              <div className={styles.settingsSegments}>
                <button
                  type="button"
                  data-selected={language === "ru"}
                  onClick={() => applyLanguage("ru")}
                  aria-pressed={language === "ru"}
                  tabIndex={settingsOpen ? 0 : -1}
                >
                  Русский
                </button>
                <button
                  type="button"
                  data-selected={language === "uz"}
                  onClick={() => applyLanguage("uz")}
                  aria-pressed={language === "uz"}
                  tabIndex={settingsOpen ? 0 : -1}
                >
                  O‘zbekcha
                </button>
              </div>
            </div>
          </div>

          <footer className={styles.settingsFooter}>
            {t("Настройки сохраняются автоматически")}
          </footer>
        </section>
      </header>

      <button
        className={styles.settingsBackdrop}
        data-open={settingsOpen}
        type="button"
        onClick={() => setSettingsOpen(false)}
        tabIndex={-1}
        aria-hidden="true"
      />

      <nav className={styles.sectionNav} aria-label={t("Разделы Control System")}>
        <a
          className={`${styles.sectionNavItem} ${styles.sectionNavItemActive}`}
          href="/admin/staff/"
          aria-current="page"
        >
          {t("Команда")}
        </a>
        <a className={styles.sectionNavItem} href="/admin/cars/">
          {t("Автомобили")}
        </a>
      </nav>

      <section className={styles.content}>
        <div className={styles.heroRow}>
          <div className={styles.heroCopy}>
            <div className={styles.heroMeta}>
              <span className={styles.systemPill}>CONTROL SYSTEM</span>
              <span className={styles.livePill}><i aria-hidden="true" />D1 ONLINE</span>
            </div>
            <p className={styles.eyebrow}>AUTO SALE UMAR</p>
            <h1>{t("Команда")}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>

          <button className={styles.addButton} type="button" onClick={openCreate}>
            <span className={styles.addIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            </span>
            <span>{t("Добавить сотрудника")}</span>
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingGrid} aria-label={t("Загрузка сотрудников")}>
            <div className={styles.skeletonMetric} />
            <div className={styles.skeletonMetric} />
            <div className={styles.skeletonMetric} />
            <div className={styles.skeletonMetric} />
          </div>
        ) : error ? (
          <section className={styles.errorCard} role="alert">
            <div>
              <p>{t("Не удалось загрузить данные")}</p>
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => void loadStaff()}>
              {t("Повторить")}
            </button>
          </section>
        ) : (
          <>
            <div className={styles.dashboardLabel}>
              <span>{t("Обзор доступа")}</span>
              <small>{t("Обновляется из D1")}</small>
            </div>
            <section className={styles.metrics} aria-label={t("Статистика сотрудников")}>
              <article className={styles.metricCard}>
                <span>{t("Всего")}</span>
                <strong>{summary.total}</strong>
                <small>{summary.active} {t("активных")}</small>
              </article>
              <article className={styles.metricCard}>
                <span>{t("Администраторы")}</span>
                <strong>{summary.admins}</strong>
                <small>{t("доступ к управлению")}</small>
              </article>
              <article className={styles.metricCard}>
                <span>{t("Менеджеры")}</span>
                <strong>{summary.managers}</strong>
                <small>{t("работа с клиентами")}</small>
              </article>
              <article className={styles.metricCard}>
                <span>{t("Заблокированы")}</span>
                <strong>{summary.blocked}</strong>
                <small>{t("без доступа")}</small>
              </article>
            </section>

            <section className={styles.staffSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <p>{t("Сотрудники")}</p>
                  <span>
                    {summary.total} {summary.total === 1 ? t("профиль") : t("профилей")}
                  </span>
                </div>
                <span className={styles.liveBadge}>
                  <i aria-hidden="true" />
                  D1 LIVE
                </span>
              </div>

              {staff.length === 0 ? (
                <div className={styles.emptyState}>
                  <strong>{t("Сотрудников пока нет")}</strong>
                  <span>{t("После создания они появятся здесь автоматически.")}</span>
                </div>
              ) : (
                <div className={styles.staffList}>
                  {staff.map((member, index) => {
                    const active = member.status === "active";
                    const roleLabel = ROLE_LABELS[language][member.role] ?? member.role;

                    return (
                      <article
                        className={styles.staffCard}
                        key={member.id}
                        style={{ "--staff-index": index } as CSSProperties}
                      >
                        <div className={styles.avatar} aria-hidden="true">
                          {initials(member.fullName)}
                        </div>

                        <div className={styles.memberMain}>
                          <div className={styles.memberHeading}>
                            <div>
                              <div className={styles.nameLine}>
                                <h2>{member.fullName}</h2>
                                {member.isCurrentUser ? <span className={styles.youBadge}>{t("Вы")}</span> : null}
                              </div>
                              <p>{member.email}</p>
                            </div>
                            <button
                              className={styles.moreButton}
                              type="button"
                              disabled={member.role === "super_admin"}
                              aria-label={`${language === "uz" ? "Amallar" : "Действия для"} ${member.fullName}`}
                              title={
                                member.role === "super_admin"
                                  ? t("Супер-администратор защищён")
                                  : t("Управление сотрудником")
                              }
                              onClick={() => openMemberActions(member)}
                            >
                              •••
                            </button>
                          </div>

                          <div className={styles.badgeRow}>
                            <span className={styles.roleBadge}>{roleLabel}</span>
                            <span className={active ? styles.activeBadge : styles.blockedBadge}>
                              <i aria-hidden="true" />
                              {active ? t("Активен") : t("Заблокирован")}
                            </span>
                          </div>

                          <div className={styles.memberMeta}>
                            <div>
                              <span>{t("Телефон")}</span>
                              <strong>{member.phone || t("Не указан")}</strong>
                            </div>
                            <div>
                              <span>{t("Последний вход")}</span>
                              <strong>{formatLastLogin(member.lastLoginAt, language)}</strong>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </section>

      {selectedMember ? (
        <div className={styles.actionLayer} role="presentation" onMouseDown={closeMemberActions}>
          <div className={styles.actionFade} aria-hidden="true" />
          <section
            className={styles.actionSheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-actions-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHandle} aria-hidden="true" />

            <div className={styles.actionHeader}>
              <div className={styles.actionIdentity}>
                <div className={styles.actionAvatar} aria-hidden="true">
                  {initials(selectedMember.fullName)}
                </div>
                <div>
                  <p className={styles.modalEyebrow}>{t("ПРОФИЛЬ СОТРУДНИКА")}</p>
                  <h2 id="staff-actions-title">{selectedMember.fullName}</h2>
                  <span>{selectedMember.email}</span>
                </div>
              </div>
              <button
                className={styles.closeButton}
                type="button"
                onClick={closeMemberActions}
                disabled={updatingMember}
                aria-label={t("Закрыть")}
              >
                ×
              </button>
            </div>

            <div className={styles.actionFacts}>
              <div>
                <span>{t("Телефон")}</span>
                <strong>{selectedMember.phone || t("Не указан")}</strong>
              </div>
              <div>
                <span>{t("Последний вход")}</span>
                <strong>{formatLastLogin(selectedMember.lastLoginAt, language)}</strong>
              </div>
            </div>

            {viewerRole === "super_admin" ? (
              <div className={styles.actionBlock}>
                <div className={styles.actionBlockTitle}>
                  <span>{t("Роль в системе")}</span>
                  <small>{t("Изменение применяется сразу")}</small>
                </div>
                <div className={styles.actionChoices}>
                  <button
                    type="button"
                    className={selectedMember.role === "sales_manager" ? styles.actionChoiceActive : styles.actionChoice}
                    disabled={updatingMember}
                    onClick={() => void updateMember({ role: "sales_manager" })}
                  >
                    <strong>{t("Менеджер")}</strong>
                    <span>{t("Автомобили, клиенты и визиты")}</span>
                  </button>
                  <button
                    type="button"
                    className={selectedMember.role === "admin" ? styles.actionChoiceActive : styles.actionChoice}
                    disabled={updatingMember}
                    onClick={() => void updateMember({ role: "admin" })}
                  >
                    <strong>{t("Администратор")}</strong>
                    <span>{t("Управление системой и менеджерами")}</span>
                  </button>
                </div>
              </div>
            ) : null}

            <div className={styles.actionBlock}>
              <div className={styles.actionBlockTitle}>
                <span>{t("Доступ")}</span>
                <small>{t("Блокировка прекращает доступ к системе")}</small>
              </div>
              <button
                className={selectedMember.status === "active" ? styles.blockButton : styles.restoreButton}
                type="button"
                disabled={updatingMember}
                onClick={() =>
                  void updateMember({
                    status: selectedMember.status === "active" ? "blocked" : "active",
                  })
                }
              >
                {updatingMember ? (
                  <span className={styles.spinner} aria-hidden="true" />
                ) : null}
                {selectedMember.status === "active"
                  ? t("Заблокировать доступ")
                  : t("Восстановить доступ")}
              </button>
            </div>

            {actionError ? <div className={styles.formError} role="alert">{actionError}</div> : null}
          </section>
        </div>
      ) : null}

      {createOpen ? (
        <div className={styles.modalLayer} role="presentation" onMouseDown={closeCreate}>
          <div className={styles.modalGlow} aria-hidden="true" />
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-staff-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHandle} aria-hidden="true" />

            {createdMember && temporaryPassword ? (
              <div className={styles.successView}>
                <div className={styles.successIcon} aria-hidden="true">✓</div>
                <p className={styles.modalEyebrow}>{t("ДОСТУП СОЗДАН")}</p>
                <h2 id="create-staff-title">{createdMember.fullName}</h2>
                <p className={styles.modalLead}>
                  {t("Профиль добавлен в Auto Sale Umar Control System. Передайте сотруднику логин и временный пароль.")}
                </p>

                <div className={styles.credentialCard}>
                  <div>
                    <span>{t("Логин")}</span>
                    <strong>{createdMember.email}</strong>
                  </div>
                  <div>
                    <span>{t("Временный пароль")}</span>
                    <strong className={styles.passwordValue}>{temporaryPassword}</strong>
                  </div>
                </div>

                <p className={styles.securityNote}>
                  {t("Пароль показывается здесь для передачи сотруднику. Не публикуйте его и не отправляйте в общий чат.")}
                </p>

                <div className={styles.successActions}>
                  <button className={styles.secondaryButton} type="button" onClick={() => void copyPassword()}>
                    {copied ? t("Скопировано") : t("Скопировать пароль")}
                  </button>
                  <button className={styles.primaryButton} type="button" onClick={closeCreate}>
                    {t("Готово")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <p className={styles.modalEyebrow}>{t("НОВЫЙ ДОСТУП")}</p>
                    <h2 id="create-staff-title">{t("Добавить сотрудника")}</h2>
                    <p>{t("Создайте защищённый профиль для команды Auto Sale Umar.")}</p>
                  </div>
                  <button
                    className={styles.closeButton}
                    type="button"
                    onClick={closeCreate}
                    disabled={creating}
                    aria-label={t("Закрыть")}
                  >
                    ×
                  </button>
                </div>

                <form className={styles.staffForm} onSubmit={(event) => void createStaff(event)}>
                  <label className={styles.field}>
                    <span>{t("Имя и фамилия")}</span>
                    <input
                      type="text"
                      autoComplete="name"
                      maxLength={100}
                      placeholder={t("Например, Akmal Karimov")}
                      value={form.fullName}
                      onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                      disabled={creating}
                    />
                  </label>

                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>{t("Электронная почта")}</span>
                      <input
                        type="email"
                        inputMode="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        maxLength={254}
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                        disabled={creating}
                      />
                    </label>

                    <label className={styles.field}>
                      <span>{t("Телефон")}</span>
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={40}
                        placeholder="+998 90 123 45 67"
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        disabled={creating}
                      />
                    </label>
                  </div>

                  <fieldset className={styles.rolePicker}>
                    <legend>{t("Роль в системе")}</legend>
                    <div>
                      {roleOptions.map((option) => (
                        <label
                          className={`${styles.roleOption} ${
                            form.role === option.value ? styles.roleOptionActive : ""
                          }`}
                          key={option.value}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={option.value}
                            checked={form.role === option.value}
                            onChange={() => setForm((current) => ({ ...current, role: option.value }))}
                            disabled={creating}
                          />
                          <span>
                            <strong>{option.label}</strong>
                            <small>
                              {option.value === "admin"
                                ? t("Управление системой и менеджерами")
                                : t("Работа с автомобилями, клиентами и визитами")}
                            </small>
                          </span>
                          <i aria-hidden="true" />
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {formError ? <div className={styles.formError} role="alert">{formError}</div> : null}

                  <div className={styles.modalActions}>
                    <button className={styles.secondaryButton} type="button" onClick={closeCreate} disabled={creating}>
                      {t("Отмена")}
                    </button>
                    <button className={styles.primaryButton} type="submit" disabled={creating}>
                      {creating ? <span className={styles.spinner} aria-hidden="true" /> : null}
                      {creating ? t("Создаём профиль…") : t("Создать сотрудника")}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
