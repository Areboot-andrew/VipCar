import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { withContentDefaults } from "@/lib/contentDefaults";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

async function getLayoutContent() {
  try {
    const rows = await prisma.siteContent.findMany();
    return withContentDefaults(rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>));
  } catch {
    return withContentDefaults();
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const c = await getLayoutContent();

  return {
    title: c['site_meta_title'],
    description: c['site_meta_description'],
    keywords: c['site_meta_keywords'],
    openGraph: {
      title: c['site_og_title'],
      description: c['site_og_description'],
      type: "website",
      url: c['site_url'],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const c = await getLayoutContent();

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
              "name": c['brand_name'],
              "description": c['schema_description'],
              "url": c['site_url'],
              "telephone": c['contact_phone'],
              "priceRange": c['schema_price_range'],
              "address": {
                "@type": "PostalAddress",
                "addressLocality": c['schema_address_city'],
                "addressCountry": c['schema_address_country']
              },
              "sameAs": [],
              "areaServed": c['schema_area_served'].split(',').map((country) => country.trim()).filter(Boolean)
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {c['google_analytics_id'] && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${c['google_analytics_id']}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${c['google_analytics_id']}');`,
              }}
            />
          </>
        )}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
