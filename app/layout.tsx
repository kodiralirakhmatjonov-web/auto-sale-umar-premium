import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SEO } from "./seo-config";

export const metadata: Metadata = {
  metadataBase: new URL(SEO.siteUrl),
  title: {
    default: "Auto Sale Umar — премиальные автомобили и международная поставка",
    template: "%s | Auto Sale Umar",
  },
  description:
    "Auto Sale Umar — премиальный автомобильный шоурум в Ташкенте. Автомобили в наличии и под заказ, подбор и международная поставка из США, Канады, Кореи, ОАЭ, Европы и других рынков.",
  applicationName: SEO.siteName,
  category: "automotive",
  creator: SEO.siteName,
  publisher: SEO.siteName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: SEO.siteName,
    title: "Auto Sale Umar — автомобиль, выбранный точно",
    description:
      "Премиальные автомобили в наличии и под заказ. Международный подбор и поставка автомобилей в Узбекистан и страны СНГ.",
    url: SEO.siteUrl,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f5f3",
};

const themeBootstrap = `
(() => {
  const syncThemeColor = (color) => {
    const metas = Array.from(document.querySelectorAll('meta[name="theme-color"]'));
    let primary = metas.find((meta) => !meta.hasAttribute("media")) || metas[0];

    if (!primary) {
      primary = document.createElement("meta");
      primary.setAttribute("name", "theme-color");
      document.head.appendChild(primary);
    }

    primary.removeAttribute("media");
    primary.setAttribute("content", color);
    primary.setAttribute("data-asu-theme-color", "true");

    metas.forEach((meta) => {
      if (meta !== primary) meta.setAttribute("content", color);
    });
  };

  try {
    const stored = localStorage.getItem("asu-theme");
    const theme =
      stored === "light" || stored === "dark"
        ? stored
        : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    document.documentElement.dataset.asuTheme = theme;
    document.documentElement.style.colorScheme = theme;
    const color = theme === "light" ? "#f5f5f3" : "#0b0c0d";
    document.documentElement.style.backgroundColor = color;
    syncThemeColor(color);

    const syncBody = () => {
      if (document.body) {
        document.body.dataset.asuTheme = theme;
        document.body.style.backgroundColor = color;
      }
      syncThemeColor(color);
    };

    if (document.body) syncBody();
    else document.addEventListener("DOMContentLoaded", syncBody, { once: true });

    new MutationObserver(() => {
      const currentTheme = document.documentElement.dataset.asuTheme;
      syncThemeColor(currentTheme === "dark" ? "#0b0c0d" : "#f5f5f3");
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-asu-theme"],
    });
  } catch (_) {
    document.documentElement.dataset.asuTheme = "light";
    document.documentElement.style.backgroundColor = "#f5f5f3";
    syncThemeColor("#f5f5f3");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
