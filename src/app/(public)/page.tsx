import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shirt, Sparkles, TicketPercent } from "lucide-react";

import { HowItWorksCtaPopup } from "@/components/public/how-it-works-cta-popup";
import { CampaignShell } from "@/components/shared/campaign-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { MAX_SPIN_ATTEMPTS_PER_CPF } from "@/lib/campaign-rules";
import { SACOLA_FINAL_PRICE, SACOLA_ITEM_COUNT, formatBRL } from "@/lib/pricing";

export default function PublicHomePage() {
  return (
    <CampaignShell>
      <section className="campaign-panel p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-secondary/18 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="space-y-5">
            <h1 className="text-balance text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Descubra sua <span className="text-primary">Sacola Fitness</span> e leve mais por
              menos.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Participe agora, veja seu desconto ao vivo e tente até{" "}
              {MAX_SPIN_ATTEMPTS_PER_CPF} vezes para encontrar sua Sacola Fitness perfeita.
            </p>

            <div className="campaign-highlight inline-flex items-center gap-2 px-4 py-3">
              <TicketPercent className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold tracking-wide sm:text-base">
                {SACOLA_ITEM_COUNT} roupas por {formatBRL(SACOLA_FINAL_PRICE)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/participar" className="campaign-cta gap-2">
                Quero participar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative aspect-square overflow-hidden p-3 sm:aspect-[4/3] sm:p-4 lg:aspect-square">
            <div className="relative h-full w-full">
              <Image
                src="/f8abb0ed-14af-4b79-81f7-2869a90f371c.png"
                alt="Destaque feminino da campanha Sacola Fitness"
                fill
                priority
                className="object-contain object-center scale-[1.04] sm:scale-[1.08]"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona-section" className="space-y-4">
        <SectionHeading
          kicker="Como funciona"
          title="Simples, rápido e transparente"
          description="É rápido: faça seu cadastro, veja sua sacola e aproveite o preço promocional."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <article className="campaign-card p-5">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Shirt className="h-4 w-4" />
            </p>
            <h3 className="mt-3 text-lg font-bold">1. Preencha seus dados</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Digite seus dados e ative até {MAX_SPIN_ATTEMPTS_PER_CPF} chances na promoção.
            </p>
          </article>

          <article className="campaign-card p-5">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Sparkles className="h-4 w-4" />
            </p>
            <h3 className="mt-3 text-lg font-bold">2. Veja sua sacola</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A vitrine escolhe as peças e mostra sua oferta em poucos segundos.
            </p>
          </article>

          <article className="campaign-card p-5">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <TicketPercent className="h-4 w-4" />
            </p>
            <h3 className="mt-3 text-lg font-bold">3. Garanta sua oferta</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Confira sua economia e finalize pelo canal de pagamento.
            </p>
          </article>
        </div>

        <div className="overflow-hidden rounded-3xl bg-black text-white">
          <div className="grid md:grid-cols-[1.15fr_0.85fr]">
            <div className="relative z-10 flex flex-col gap-4 px-5 py-6 sm:px-7 sm:py-7">
              <div className="space-y-2">
                <p className="inline-flex w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase">
                  Desconto extra
                </p>
                <h3 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Quer outros looks além da oferta?
                </h3>
                <p className="max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
                  Acesse o site da GC Conceito e ganhe 10% OFF na primeira compra com o cupom{" "}
                  <span className="font-bold text-white">#sounovoaqui</span>.
                </p>
              </div>

              <a
                href="https://www.gcconceito.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/35 bg-white px-5 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white/90 sm:w-fit"
              >
                Acessar site da GC Conceito
              </a>
            </div>

            <div className="relative hidden min-h-[250px] md:block">
              <Image
                src="/mulhernapraia2.png"
                alt="Banner lateral da campanha GC Conceito"
                fill
                className="object-cover object-[96%_70%]"
                sizes="32vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/48 to-black/8" />
              <div className="absolute inset-0 bg-black/12" />
            </div>
          </div>
        </div>

      </section>

      <HowItWorksCtaPopup targetId="como-funciona-section" />
    </CampaignShell>
  );
}
