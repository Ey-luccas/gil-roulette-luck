import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { PRESENTES_CAMPAIGN_NAME } from "@/lib/presentes-campaign";

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
  title: `${PRESENTES_CAMPAIGN_NAME} | GC Conceito`,
  description:
    "Participe da campanha Presentes do 5.5: preencha seus dados, gire a roleta e descubra seu presente especial com até 3 chances por CPF.",
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
