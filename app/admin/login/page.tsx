"use client";

import { useEffect } from "react";

export default function AdminHomePage() {
  useEffect(() => {
    window.location.replace("/admin/staff/");
  }, []);

  return (
    <main
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "#f5f5f3",
        color: "#111113",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
      }}
    >
      <span style={{ opacity: 0.55, fontSize: 13 }}>Открываем Control System…</span>
    </main>
  );
}
