"use client";

import { useEffect } from "react";

export default function AdminPage() {
  useEffect(() => {
    window.location.replace("/admin/staff/");
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#f5f5f3",
        color: "#111113",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
      }}
    >
      <span style={{ opacity: 0.55, fontSize: 13 }}>
        Открываем Auto Sale Umar Control System…
      </span>
    </main>
  );
}
