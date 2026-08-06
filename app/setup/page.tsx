"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const passwordConfirmation = String(form.get("passwordConfirmation") ?? "");

    if (password !== passwordConfirmation) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: String(form.get("fullName") ?? ""),
          email: String(form.get("email") ?? ""),
          password,
          setupKey: String(form.get("setupKey") ?? ""),
        }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        setError(data.error ?? "Не удалось создать супер-администратора.");
        return;
      }

      setSuccess(data.message ?? "Супер-администратор создан.");
      window.setTimeout(() => router.replace("/admin/login/"), 1100);
    } catch {
      setError("Не удалось связаться с сервером. Проверьте последний Cloudflare-деплой.");
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

        <p className={styles.kicker}>Первичная настройка</p>
        <h1 className={styles.title}>Создание супер-администратора</h1>
        <p className={styles.description}>
          Эта форма работает только один раз. После создания первого пользователя повторная
          регистрация автоматически блокируется.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Ваше имя</span>
            <input name="fullName" autoComplete="name" required minLength={2} maxLength={120} />
          </label>

          <label className={styles.field}>
            <span>Электронная почта</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>

          <label className={styles.field}>
            <span>Новый пароль</span>
            <input name="password" type="password" autoComplete="new-password" required minLength={10} />
          </label>

          <label className={styles.field}>
            <span>Повторите пароль</span>
            <input
              name="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
            />
          </label>

          <label className={styles.field}>
            <span>Одноразовый ключ SETUP_KEY</span>
            <input name="setupKey" type="password" autoComplete="off" required />
          </label>

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Создаём…" : "Создать супер-администратора"}
          </button>
        </form>

        <p className={styles.message}>
          Пароль не записывается в открытом виде: в D1 сохраняется только защищённый хеш.
        </p>
        {error ? <p className={styles.error}>{error}</p> : null}
        {success ? <p className={styles.success}>{success}</p> : null}
      </section>
    </main>
  );
}
