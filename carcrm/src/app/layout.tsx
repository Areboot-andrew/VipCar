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
      <body>
        {children}
      </body>
    </html>
  );
}
