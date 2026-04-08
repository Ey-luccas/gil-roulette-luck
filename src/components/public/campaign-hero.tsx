import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MAX_SPIN_ATTEMPTS_PER_CPF } from "@/lib/campaign-rules";
import { SACOLA_FINAL_PRICE, SACOLA_ITEM_COUNT, formatBRL } from "@/lib/pricing";

export function CampaignHero() {
  return (
    <section className="campaign-panel p-6 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/22 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="space-y-5">
          <Badge className="bg-primary text-primary-foreground">Campanha promocional exclusiva</Badge>

          <h2 className="max-w-2xl text-balance text-4xl leading-tight font-black tracking-tight sm:text-5xl lg:text-6xl">
            Seu look fitness premium por{" "}
            <span className="text-primary">{formatBRL(SACOLA_FINAL_PRICE)}</span>.
          </h2>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Participe da vitrine inteligente, revele {SACOLA_ITEM_COUNT} peças e aproveite uma
            oferta com estética de coleção especial da GC Conceito.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/participar" className="campaign-cta gap-2">
              Quero minha sacola
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link href="/admin/login" className="campaign-cta-outline">
              Área administrativa
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <article className="campaign-card p-4">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Sparkles className="h-4 w-4" />
            </p>
            <h3 className="mt-3 text-sm font-semibold">Revelação com suspense</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Animação em 3 quadros com ritmo premium e conclusão objetiva.
            </p>
          </article>

          <article className="campaign-card p-4">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Tag className="h-4 w-4" />
            </p>
            <h3 className="mt-3 text-sm font-semibold">Preço fixo especial</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Oferta fechada da campanha com cálculo de economia automático.
            </p>
          </article>

          <article className="campaign-card p-4">
            <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </p>
            <h3 className="mt-3 text-sm font-semibold">Controle por CPF</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Até {MAX_SPIN_ATTEMPTS_PER_CPF} tentativas com validação segura e experiência
              confiável.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
