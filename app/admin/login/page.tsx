"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../auth.module.css";

interface LoginResponse {
  success: boolean;
  error?: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.success) {
        setError(data.error ?? "Не удалось войти.");
        return;
      }

      router.replace("/admin/staff/");
      router.refresh();
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <strong>Auto Sale Umar</strong>
          <span>Private administration</span>
        </div>

        <p className={styles.kicker}>Закрытая система</p>
        <h1 className={styles.title}>Вход в панель управления</h1>
        <p className={styles.description}>
          Доступ разрешён только супер-администратору, администраторам и sales-менеджерам.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Электронная почта</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>

          <label className={styles.field}>
            <span>Пароль</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Входим…" : "Войти"}
          </button>
        </form>

        {error ? <p className={styles.error}>{error}</p> : null}
        <p className={styles.linkRow}>
          <a href="/">Вернуться на сайт</a>
        </p>
      </section>
    </main>
  );
}
