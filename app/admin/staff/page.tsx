"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./staff.module.css";

type StaffRole = "super_admin" | "admin" | "sales_manager";
type StaffStatus = "active" | "blocked" | string;

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

const EMPTY_SUMMARY: StaffSummary = {
  total: 0,
  active: 0,
  blocked: 0,
  admins: 0,
  managers: 0,
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

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [summary, setSummary] = useState<StaffSummary>(EMPTY_SUMMARY);
  const [scope, setScope] = useState<StaffResponse["scope"]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const subtitle = useMemo(() => {
    if (scope === "sales_managers") {
      return "Управление менеджерами и их доступом к системе";
    }
    return "Управление командой, ролями и доступом к системе";
  }, [scope]);

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />

      <header className={styles.topbar}>
        <a className={styles.backButton} href="/admin/" aria-label="Назад в панель управления">
          <span aria-hidden="true">←</span>
        </a>
        <div className={styles.brand}>
          <span>AUTO SALE UMAR</span>
          <small>CONTROL SYSTEM</small>
        </div>
        <div className={styles.topbarSpacer} aria-hidden="true" />
      </header>

      <section className={styles.content}>
        <div className={styles.heroRow}>
          <div>
            <p className={styles.eyebrow}>КОМАНДА ШОУРУМА</p>
            <h1>Сотрудники</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>

          <button className={styles.addButton} type="button" disabled title="Подключим на следующем этапе">
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
                <small>отдел продаж</small>
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
                  <p>Список команды</p>
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
                  {staff.map((member) => {
                    const active = member.status === "active";
                    const roleLabel = ROLE_LABELS[member.role] ?? member.role;

                    return (
                      <article className={styles.staffCard} key={member.id}>
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
                              title="Действия подключим на следующем этапе"
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
    </main>
  );
}
