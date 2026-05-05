import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift, RotateCw, Send, TicketPercent } from "lucide-react";

import { HowItWorksCtaPopup } from "@/components/public/how-it-works-cta-popup";
import { CampaignShell } from "@/components/shared/campaign-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { MAX_SPIN_ATTEMPTS_PER_CPF } from "@/lib/campaign-rules";

export default function PublicHomePage() {
  return (
    <CampaignShell>
      <section className="campaign-panel p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-secondary/18 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="space-y-5">
            <h1 className="text-balance text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Gire a roleta dos <span className="text-primary">Presentes do 5.5</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Preencha seus dados, gire a roleta e descubra seu presente especial da GC Conceito.
              São até {MAX_SPIN_ATTEMPTS_PER_CPF} chances por CPF.
            </p>

            <div className="campaign-highlight inline-flex items-center gap-2 px-4 py-3">
              <TicketPercent className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold tracking-wide sm:text-base">3 chances por CPF</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/participar" className="campaign-cta gap-2">
                Participar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative aspect-square overflow-hidden p-3 sm:aspect-[4/3] sm:p-4 lg:aspect-square">
            <div className="relative h-full w-full">
              <Image
                src="/f8abb0ed-14af-4b79-81f7-2869a90f371c.png"
                alt="Elementos da campanha Presentes do 5.5 com roleta, presentes, cupom e confete"
                fill
                priority
                className="object-contain object-center scale-[1.02] sm:scale-[1.06]"
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
          description="Cadastre-se, gire a roleta e veja seu presente na hora."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <article className="campaign-card p-5">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Gift className="h-4 w-4" />
            </p>
            <h3 className="mt-3 text-lg font-bold">Preencha seus dados</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Informe nome, WhatsApp e CPF para participar da campanha.
            </p>
          </article>

          <article className="campaign-card p-5">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <RotateCw className="h-4 w-4" />
            </p>
            <h3 className="mt-3 text-lg font-bold">Gire a roleta</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Cada CPF tem até {MAX_SPIN_ATTEMPTS_PER_CPF} chances para descobrir seus presentes.
            </p>
          </article>

          <article className="campaign-card p-5">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Send className="h-4 w-4" />
            </p>
            <h3 className="mt-3 text-lg font-bold">Resgate pelo WhatsApp</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Após o giro, envie seu resultado para a equipe da GC Conceito e finalize seu resgate.
            </p>
          </article>
        </div>

        <div className="overflow-hidden rounded-3xl bg-black text-white">
          <div className="grid md:grid-cols-[1.15fr_0.85fr]">
            <div className="relative z-10 flex flex-col gap-4 px-5 py-6 sm:px-7 sm:py-7">
              <div className="space-y-2">
                <p className="inline-flex w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase">
                  Campanha 5.5
                </p>
                <h3 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Presentes limitados enquanto durar o estoque
                </h3>
                <p className="max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
                  Faça seu cadastro, gire a roleta e descubra condições e presentes especiais da GC
                  Conceito durante a campanha.
                </p>
              </div>

              <Link href="/participar" className="campaign-cta h-11 w-full sm:w-fit">
                Participar agora
              </Link>
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
