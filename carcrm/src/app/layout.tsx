import type { Metadata } from "next";
import "./globals.css";
import "./client.css";

export const metadata: Metadata = {
  title: "Car CRM - VIP Transfer",
  description: "Оренда VIP авто та трансфери",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AutoRental",
              "name": "First Line Transfer",
              "description": "Преміум трансфер на авто VIP-класу",
              "url": "https://first-line-transfer.com",
              "telephone": "+380000000000",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Kyiv",
                "addressCountry": "UA"
              }
            })
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
