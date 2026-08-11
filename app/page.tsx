import type { Metadata } from "next";
import { SEO } from "./seo-config";
import HomeClient from "./home-client";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: "Auto Sale Umar — премиальные автомобили в Ташкенте" },
  description:
    "Новые премиальные автомобили в наличии и в пути. Международный подбор и поставка из США, Канады, Кореи, ОАЭ, Европы, Великобритании и Австралии.",
  alternates: { canonical: `${SEO.siteUrl}/` },
  openGraph: {
    title: "Auto Sale Umar — автомобиль, выбранный точно",
    description:
      "Премиальный автомобильный шоурум. Автомобили в наличии и в пути, международный подбор и поставка.",
    url: `${SEO.siteUrl}/`,
  },
};

const autoDealerJsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: "Auto Sale Umar",
  url: `${SEO.siteUrl}/`,
  logo: `${SEO.siteUrl}/brand/asu-wordmark-black.png`,
  telephone: "+998771155553",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tashkent",
    addressCountry: "UZ",
  },
  sameAs: [
    "https://www.instagram.com/auto_sale_umar/",
    "https://www.threads.net/@auto_sale_umar",
    "https://t.me/auto_sale_umar777",
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(autoDealerJsonLd) }}
      />
      <HomeClient />
    </>
  );
}
