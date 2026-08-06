"use client";

import { useEffect, useState } from "react";
import styles from "../auth.module.css";

interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: "super_admin" | "admin" | "sales_manager";
}

const roleNames: Record<User["role"], string> = {
  super_admin: "Супер-администратор",
  admin: "Администратор",
  sales_manager: "Sales-менеджер",
};

export default function AdminHomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/me", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { success: boolean; user?: User };
        if (!response.ok || !data.success || !data.user) throw new Error("unauthorized");
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (!active) return;
        setError("Сессия не найдена. Выполняется переход на страницу входа.");
        window.setTimeout(() => window.location.replace("/admin/login/"), 700);
      });

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.replace("/admin/login/");
  }

  return (
    <main className={styles.shell}>
      <div className={styles.dashboard}>
        <header className={styles.dashboardHeader}>
          <div>
            <p className={styles.kicker}>Auto Sale Umar</p>
            <h1>Панель управления</h1>
            {user ? <span className={styles.badge}>{roleNames[user.role]}</span> : null}
          </div>
          <button className={styles.secondaryButton} type="button" onClick={logout}>
            Выйти
          </button>
        </header>

        <section className={styles.panel}>
          <h2>{user ? `Добро пожаловать, ${user.fullName}` : "Проверяем доступ…"}</h2>
          <p>
            Защищённый вход подключён. Следующим этапом сюда будут добавлены управление
            сотрудниками, автомобили и забронированные визиты с разграничением ролей.
          </p>
          {user ? <p>{user.email}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
        </section>
      </div>
    </main>
  );
}
