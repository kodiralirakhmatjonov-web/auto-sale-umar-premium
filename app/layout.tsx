import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto Sale Umar — Premium Showroom",
  description: "Новые премиальные автомобили в наличии и под заказ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
