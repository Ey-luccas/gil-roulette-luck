import Image from "next/image";
import Link from "next/link";

import { GC_INSTAGRAM_URL, buildWhatsAppUrl } from "@/lib/contact";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GC_WHATSAPP_URL = buildWhatsAppUrl(
    "Olá, vim pela campanha Sacola Fitness e quero atendimento."
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center" aria-label="GC Conceito">
            <Image
              src="/GC_CONCEITO_kaka.svg"
              alt="GC Conceito"
              width={2787}
              height={903}
              className="h-6 w-auto sm:h-7"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <a
              href={GC_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_26px_-16px_rgba(0,0,0,0.75)] transition hover:-translate-y-0.5 hover:bg-[#22c35e] sm:w-auto sm:gap-2 sm:px-3"
              aria-label="Entrar em contato no WhatsApp"
            >
              <Image
                src="/social/whatsapp.svg"
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 invert"
              />
              <span className="hidden text-xs font-semibold sm:inline">WhatsApp</span>
            </a>

            <a
              href={GC_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(45deg,#f58529_0%,#feda77_24%,#dd2a7b_55%,#8134af_78%,#515bd4_100%)] text-white shadow-[0_10px_26px_-16px_rgba(0,0,0,0.75)] transition hover:-translate-y-0.5 hover:opacity-95 sm:w-auto sm:gap-2 sm:px-3"
              aria-label="Seguir no Instagram"
            >
              <Image
                src="/social/instagram.svg"
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 invert"
              />
              <span className="hidden text-xs font-semibold sm:inline">@gc.conceito</span>
            </a>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
