"use client";

import { useEffect, useState } from "react";

type StaffRole = "super_admin" | "admin" | "sales_manager";

interface MeResponse {
  success?: boolean;
  user?: { role?: StaffRole };
}

export default function AdminPage() {
  const [message, setMessage] = useState("Открываем Auto Sale Umar Control System…");

  useEffect(() => {
    let cancelled = false;

    async function routeByRole() {
      try {
        const response = await fetch("/api/me", {
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (cancelled) return;
        if (response.status === 401) {
          window.location.replace("/admin/login/");
          return;
        }

        const data = (await response.json().catch(() => null)) as MeResponse | null;
        if (!response.ok || !data?.success || !data.user?.role) {
          setMessage("Не удалось определить роль сотрудника.");
          return;
        }

        window.location.replace(
          data.user.role === "sales_manager" ? "/admin/cars/" : "/admin/staff/",
        );
      } catch {
        if (!cancelled) setMessage("Нет связи с сервером. Обновите страницу.");
      }
    }

    void routeByRole();
    return () => { cancelled = true; };
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#f5f5f3",
        color: "#111113",
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
      }}
    >
      <span style={{ opacity: 0.55, fontSize: 13 }}>{message}</span>
    </main>
  );
}
