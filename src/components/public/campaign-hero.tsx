import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift, RotateCw, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MAX_SPIN_ATTEMPTS_PER_CPF } from "@/lib/campaign-rules";

export function CampaignHero() {
  return (
    <section className="campaign-panel p-6 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/22 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="space-y-5">
          <Badge className="bg-primary text-primary-foreground">Campanha promocional exclusiva</Badge>

          <h2 className="max-w-2xl text-balance text-4xl leading-tight font-black tracking-tight sm:text-5xl lg:text-6xl">
            Gire a roleta dos <span className="text-primary">Presentes do 5.5</span>
          </h2>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Preencha seus dados, gire a roleta e descubra seu presente especial com até 3 chances
            por CPF.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/participar" className="campaign-cta gap-2">
              Participar agora
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <article className="campaign-card p-4">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Gift className="h-4 w-4" />
            </p>
            <h3 className="mt-3 text-sm font-semibold">Prêmios especiais</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Roleta com presentes, vouchers e cupons da campanha 5.5.
            </p>
          </article>

          <article className="campaign-card p-4">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <RotateCw className="h-4 w-4" />
            </p>
            <h3 className="mt-3 text-sm font-semibold">Resultado imediato</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Cada giro gera um único resultado e salva o histórico do CPF.
            </p>
          </article>

          <article className="campaign-card p-4">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </p>
            <h3 className="mt-3 text-sm font-semibold">Controle por CPF</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Até {MAX_SPIN_ATTEMPTS_PER_CPF} tentativas por CPF com validação segura.
            </p>
          </article>
        </div>
      </div>

      <div className="pointer-events-none absolute right-8 bottom-8 hidden h-[190px] w-[190px] lg:block">
        <Image
          src="/f8abb0ed-14af-4b79-81f7-2869a90f371c.png"
          alt="Resumo visual da campanha Presentes do 5.5"
          fill
          className="object-contain"
        />
      </div>
    </section>
  );
}
