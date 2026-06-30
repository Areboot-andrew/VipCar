import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "First Line Transfer — Преміум Трансфер Без Компромісів",
  description: "Преміальні трансфери Європою та Україною на автомобілях VIP-класу. Mercedes S-Class, BMW 7 Series, Audi A8. Онлайн бронювання.",
  keywords: "трансфер, VIP трансфер, оренда авто з водієм, преміум трансфер, Mercedes S-Class, Україна, Європа",
  openGraph: {
    title: "First Line Transfer — Преміум Трансфер",
    description: "Ваш час. Ваші правила. Ідеальний сервіс від дверей до дверей.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={inter.variable}>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AutoRental",
              "name": "First Line Transfer",
              "description": "Преміум трансфер на авто VIP-класу. Mercedes S-Class, BMW 7 Series, Audi A8.",
              "url": "https://first-line-transfer.com",
              "telephone": "+380000000000",
              "priceRange": "€€€",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Kyiv",
                "addressCountry": "UA"
              },
              "sameAs": [],
              "areaServed": ["UA", "PL", "DE", "CZ", "AT", "HU", "SK"]
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
