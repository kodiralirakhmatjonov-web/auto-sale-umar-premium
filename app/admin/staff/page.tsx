"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import styles from "./staff.module.css";

type StaffRole = "super_admin" | "admin" | "sales_manager";
type StaffStatus = "active" | "blocked" | string;
type CreatableStaffRole = "admin" | "sales_manager";

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

const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "Супер-администратор",
  admin: "Администратор",
  sales_manager: "Менеджер",
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

function formatLastLogin(value: string | null): string {
  if (!value) return "Ещё не входил";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Нет данных";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeClientEmail(value: string): string {
  return value.trim().toLowerCase();
}

export default function StaffPage() {
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
        throw new Error(data.error || "Не удалось загрузить сотрудников.");
      }

      setStaff(Array.isArray(data.staff) ? data.staff : []);
      setSummary(data.summary ?? EMPTY_SUMMARY);
      setScope(data.scope);
      setViewerRole(data.viewer?.role ?? null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось загрузить сотрудников. Попробуйте ещё раз.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    if (!createOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !creating) {
        setCreateOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [createOpen, creating]);

  const subtitle = useMemo(() => {
    if (scope === "sales_managers") {
      return "Управление менеджерами и их доступом к экосистеме Auto Sale Umar";
    }
    return "Управление всей командой Auto Sale Umar, ролями и доступом к системе";
  }, [scope]);

  const roleOptions = useMemo(() => {
    if (viewerRole === "super_admin") {
      return [
        { value: "sales_manager" as const, label: "Менеджер" },
        { value: "admin" as const, label: "Администратор" },
      ];
    }

    return [{ value: "sales_manager" as const, label: "Менеджер" }];
  }, [viewerRole]);

  const openCreate = () => {
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

  const createStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creating) return;

    const fullName = form.fullName.trim();
    const email = normalizeClientEmail(form.email);
    const phone = form.phone.trim();

    if (fullName.length < 2) {
      setFormError("Введите имя сотрудника.");
      return;
    }

    if (!email || !email.includes("@")) {
      setFormError("Введите корректную электронную почту.");
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
        throw new Error(data.error || "Не удалось создать сотрудника.");
      }

      setCreatedMember(data.staff);
      setTemporaryPassword(data.temporaryPassword);
      setCopied(false);
      await loadStaff();
    } catch (caught) {
      setFormError(
        caught instanceof Error
          ? caught.message
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
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />

      <header className={styles.topbar}>
        <a className={styles.backButton} href="/admin/" aria-label="Назад в панель управления">
          <span aria-hidden="true">←</span>
        </a>

        <a className={styles.brand} href="/admin/" aria-label="Auto Sale Umar Control System">
          <span className={styles.brandWordmark}>Auto Sale Umar</span>
          <small className={styles.brandSystem}>CONTROL SYSTEM</small>
          <i className={styles.brandShine} aria-hidden="true" />
        </a>

        <div className={styles.topbarSpacer} aria-hidden="true" />
      </header>

      <section className={styles.content}>
        <div className={styles.heroRow}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>КОМАНДА AUTO SALE UMAR</p>
            <h1>Сотрудники</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>

          <button className={styles.addButton} type="button" onClick={openCreate}>
            <span className={styles.addIcon} aria-hidden="true">+</span>
            <span>Добавить сотрудника</span>
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingGrid} aria-label="Загрузка сотрудников">
            <div className={styles.skeletonMetric} />
            <div className={styles.skeletonMetric} />
            <div className={styles.skeletonMetric} />
            <div className={styles.skeletonMetric} />
          </div>
        ) : error ? (
          <section className={styles.errorCard} role="alert">
            <div>
              <p>Не удалось загрузить данные</p>
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => void loadStaff()}>
              Повторить
            </button>
          </section>
        ) : (
          <>
            <section className={styles.metrics} aria-label="Статистика сотрудников">
              <article className={styles.metricCard}>
                <span>Всего</span>
                <strong>{summary.total}</strong>
                <small>{summary.active} активных</small>
              </article>
              <article className={styles.metricCard}>
                <span>Администраторы</span>
                <strong>{summary.admins}</strong>
                <small>доступ к управлению</small>
              </article>
              <article className={styles.metricCard}>
                <span>Менеджеры</span>
                <strong>{summary.managers}</strong>
                <small>работа с клиентами</small>
              </article>
              <article className={styles.metricCard}>
                <span>Заблокированы</span>
                <strong>{summary.blocked}</strong>
                <small>без доступа</small>
              </article>
            </section>

            <section className={styles.staffSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <p>Команда Auto Sale Umar</p>
                  <span>{summary.total === 1 ? "1 профиль" : `${summary.total} профилей`}</span>
                </div>
                <span className={styles.liveBadge}>
                  <i aria-hidden="true" />
                  D1 LIVE
                </span>
              </div>

              {staff.length === 0 ? (
                <div className={styles.emptyState}>
                  <strong>Сотрудников пока нет</strong>
                  <span>После создания они появятся здесь автоматически.</span>
                </div>
              ) : (
                <div className={styles.staffList}>
                  {staff.map((member, index) => {
                    const active = member.status === "active";
                    const roleLabel = ROLE_LABELS[member.role] ?? member.role;

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
                                {member.isCurrentUser ? <span className={styles.youBadge}>Вы</span> : null}
                              </div>
                              <p>{member.email}</p>
                            </div>
                            <button
                              className={styles.moreButton}
                              type="button"
                              disabled
                              aria-label={`Действия для ${member.fullName}`}
                              title="Действия подключим следующим этапом"
                            >
                              •••
                            </button>
                          </div>

                          <div className={styles.badgeRow}>
                            <span className={styles.roleBadge}>{roleLabel}</span>
                            <span className={active ? styles.activeBadge : styles.blockedBadge}>
                              <i aria-hidden="true" />
                              {active ? "Активен" : "Заблокирован"}
                            </span>
                          </div>

                          <div className={styles.memberMeta}>
                            <div>
                              <span>Телефон</span>
                              <strong>{member.phone || "Не указан"}</strong>
                            </div>
                            <div>
                              <span>Последний вход</span>
                              <strong>{formatLastLogin(member.lastLoginAt)}</strong>
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
                <p className={styles.modalEyebrow}>ДОСТУП СОЗДАН</p>
                <h2 id="create-staff-title">{createdMember.fullName}</h2>
                <p className={styles.modalLead}>
                  Профиль добавлен в Auto Sale Umar Control System. Передайте сотруднику логин и временный пароль.
                </p>

                <div className={styles.credentialCard}>
                  <div>
                    <span>Логин</span>
                    <strong>{createdMember.email}</strong>
                  </div>
                  <div>
                    <span>Временный пароль</span>
                    <strong className={styles.passwordValue}>{temporaryPassword}</strong>
                  </div>
                </div>

                <p className={styles.securityNote}>
                  Пароль показывается здесь для передачи сотруднику. Не публикуйте его и не отправляйте в общий чат.
                </p>

                <div className={styles.successActions}>
                  <button className={styles.secondaryButton} type="button" onClick={() => void copyPassword()}>
                    {copied ? "Скопировано" : "Скопировать пароль"}
                  </button>
                  <button className={styles.primaryButton} type="button" onClick={closeCreate}>
                    Готово
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <p className={styles.modalEyebrow}>НОВЫЙ ДОСТУП</p>
                    <h2 id="create-staff-title">Добавить сотрудника</h2>
                    <p>Создайте защищённый профиль для команды Auto Sale Umar.</p>
                  </div>
                  <button
                    className={styles.closeButton}
                    type="button"
                    onClick={closeCreate}
                    disabled={creating}
                    aria-label="Закрыть"
                  >
                    ×
                  </button>
                </div>

                <form className={styles.staffForm} onSubmit={(event) => void createStaff(event)}>
                  <label className={styles.field}>
                    <span>Имя и фамилия</span>
                    <input
                      type="text"
                      autoComplete="name"
                      maxLength={100}
                      placeholder="Например, Akmal Karimov"
                      value={form.fullName}
                      onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                      disabled={creating}
                    />
                  </label>

                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>Электронная почта</span>
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
                      <span>Телефон</span>
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
                    <legend>Роль в системе</legend>
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
                                ? "Управление системой и менеджерами"
                                : "Работа с автомобилями, клиентами и визитами"}
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
                      Отмена
                    </button>
                    <button className={styles.primaryButton} type="submit" disabled={creating}>
                      {creating ? <span className={styles.spinner} aria-hidden="true" /> : null}
                      {creating ? "Создаём профиль…" : "Создать сотрудника"}
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
