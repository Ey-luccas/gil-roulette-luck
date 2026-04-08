"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ShowcaseItem = {
  id: string;
  name: string;
  imageUrl: string;
  subtitle: string;
};

type FrameState = {
  item: ShowcaseItem;
  token: number;
};

type SpinPreviewProps = {
  participantId?: string;
};

const showcaseItems: ShowcaseItem[] = [
  {
    id: "top-energy",
    name: "Top Energy Pulse",
    imageUrl: "/seed/top-energy-pulse.svg",
    subtitle: "Alta sustentação e conforto",
  },
  {
    id: "legging-urban",
    name: "Legging Urban Move",
    imageUrl: "/seed/legging-urban-move.svg",
    subtitle: "Modelagem premium com elasticidade",
  },
  {
    id: "jaqueta-light",
    name: "Jaqueta Light Run",
    imageUrl: "/seed/jaqueta-light-run.svg",
    subtitle: "Camada leve para treinos externos",
  },
  {
    id: "short-sculpt",
    name: "Short Sculpt Fit",
    imageUrl: "/seed/short-sculpt-fit.svg",
    subtitle: "Leveza com visual esportivo moderno",
  },
];

const finalSelection: ShowcaseItem[] = [
  showcaseItems[1],
  showcaseItems[0],
  showcaseItems[3],
];

const suspenseSteps = [180, 190, 200, 210, 230, 260, 300, 360, 430, 520, 650];

export function SpinPreview({ participantId }: SpinPreviewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [frames, setFrames] = useState<FrameState[]>(() =>
    showcaseItems.slice(0, 3).map((item) => ({ item, token: 0 }))
  );

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const runStep = (step: number) => {
      if (step >= suspenseSteps.length) {
        setRevealed(true);
        setActiveIndex(1);
        setFrames(
          finalSelection.map((item, index) => ({
            item,
            token: step + index,
          }))
        );
        return;
      }

      timeoutId = setTimeout(() => {
        if (cancelled) return;

        const nextActiveIndex = (step + 1) % 3;
        setActiveIndex(nextActiveIndex);
        setCurrentStep(step + 1);

        setFrames((previousFrames) => {
          const nextFrames = [...previousFrames];
          const nextItem = showcaseItems[(step + nextActiveIndex + 1) % showcaseItems.length];
          nextFrames[nextActiveIndex] = {
            item: nextItem,
            token: previousFrames[nextActiveIndex].token + 1,
          };
          return nextFrames;
        });

        runStep(step + 1);
      }, suspenseSteps[step]);
    };

    runStep(0);

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const statusText = useMemo(() => {
    if (revealed) return "Sacola Fitness desbloqueada com sucesso.";
    if (currentStep < 4) return "Lendo seu perfil e avaliando estilos.";
    if (currentStep < 8) return "Comparando combinações da vitrine inteligente.";
    return "Finalizando seleção promocional exclusiva.";
  }, [currentStep, revealed]);

  const progress = Math.min((currentStep / suspenseSteps.length) * 100, 100);
  const nextRoute = participantId
    ? `/resultado?participantId=${encodeURIComponent(participantId)}`
    : "/resultado";

  return (
    <Card className="campaign-panel">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(177,138,74,0.2),_transparent_45%)]" />

      <CardHeader className="relative space-y-2">
        <CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">
          Vitrine Inteligente em Ação
        </CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">{statusText}</p>
      </CardHeader>

      <CardContent className="relative space-y-6">
        <div className="h-2 overflow-hidden rounded-full bg-primary/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary"
            animate={{ width: `${revealed ? 100 : progress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {frames.map((frame, index) => {
            const highlighted = index === activeIndex;
            const emphasized = revealed || highlighted;

            return (
              <motion.article
                key={`frame-${index}`}
                animate={{
                  scale: emphasized ? 1.02 : 0.96,
                  opacity: emphasized ? 1 : 0.55,
                  y: emphasized ? -6 : 0,
                }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className={cn(
                  "relative overflow-hidden rounded-2xl border bg-card/95 p-2 shadow-lg",
                  emphasized ? "border-primary/60" : "border-primary/20"
                )}
              >
                <div className="relative mb-2 aspect-[4/5] overflow-hidden rounded-xl border border-border/60 bg-muted/50">
                  <motion.div
                    key={`${frame.item.id}-${frame.token}`}
                    initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.32, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={frame.item.imageUrl}
                      alt={frame.item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 25vw"
                    />
                  </motion.div>
                </div>

                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Look {index + 1}
                </p>
                <p className="text-sm font-bold leading-tight">{frame.item.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{frame.item.subtitle}</p>

                {highlighted && !revealed ? (
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-primary"
                    animate={{ opacity: [0.35, 0.9, 0.35] }}
                    transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY }}
                  />
                ) : null}
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={false}
          animate={{ opacity: revealed ? 1 : 0.7, scale: revealed ? 1 : 0.98 }}
          className="campaign-highlight p-4"
        >
          <p className="text-sm text-muted-foreground">
            {revealed
              ? "Seleção concluída. Sua recompensa está pronta para ser revelada."
              : "Suspense ativo: a seleção ainda está sendo refinada para a sua oferta."}
          </p>

          <Link
            href={revealed ? nextRoute : "#"}
            aria-disabled={!revealed}
            className={cn(
              "mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold transition",
              revealed
                ? "bg-primary text-primary-foreground shadow-[0_16px_34px_-18px_rgba(10,10,10,0.55)] hover:-translate-y-0.5 hover:opacity-95"
                : "pointer-events-none bg-muted text-muted-foreground"
            )}
          >
            Ver minha recompensa
          </Link>
        </motion.div>
      </CardContent>
    </Card>
  );
}
