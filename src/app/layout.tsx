import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { SACOLA_FINAL_PRICE, SACOLA_ITEM_COUNT, formatBRL } from "@/lib/pricing";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sacola Fitness | GC Conceito",
  description:
    `Campanha promocional Sacola Fitness: gire e descubra ${SACOLA_ITEM_COUNT} peças com valor fixo de ${formatBRL(SACOLA_FINAL_PRICE)}.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${sora.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
