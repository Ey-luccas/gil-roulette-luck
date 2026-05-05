"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { ThreeFrameShowcase } from "@/components/public/giro/three-frame-showcase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MAX_SPIN_ATTEMPTS_PER_CPF } from "@/lib/campaign-rules";
import { formatBRL, formatPercent } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { usePromotionalSpin } from "@/hooks/use-promotional-spin";
import type { SpinItem } from "@/types/spin";

type PromotionalSpinExperienceProps = {
  items: SpinItem[];
  participantId?: string;
};

type PersistState = "idle" | "saving" | "saved" | "blocked" | "error";

type SpinApiResponse = {
  ok?: boolean;
  code?: string;
  error?: string;
  data?: {
    spinResultId?: string | null;
    remainingAttempts?: number;
    maxAttempts?: number;
    attemptsUsed?: number;
    attemptNumber?: number;
  };
};

type PricingMetric = {
  label: string;
  value: string;
  emphasize?: boolean;
};

function buildAttemptsMessage(remainingAttempts?: number | null, maxAttempts?: number | null) {
  const remaining = remainingAttempts ?? 0;
  const max = maxAttempts ?? MAX_SPIN_ATTEMPTS_PER_CPF;

  if (remaining <= 0) {
    return `Você já usou as ${max} chances desta promoção.`;
  }

  if (remaining === 1) {
    return `Você ainda tem 1 chance de ${max}.`;
  }

  return `Você ainda tem ${remaining} chances de ${max}.`;
}

export function PromotionalSpinExperience({
  items,
  participantId,
}: PromotionalSpinExperienceProps) {
  const submittedCycleRef = useRef<number | null>(null);
  const [persistState, setPersistState] = useState<PersistState>("idle");
  const [persistMessage, setPersistMessage] = useState("");
  const [spinResultId, setSpinResultId] = useState<string | null>(null);
  const [spinCycle, setSpinCycle] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [maxAttempts, setMaxAttempts] = useState(MAX_SPIN_ATTEMPTS_PER_CPF);
  const [attemptsUsed, setAttemptsUsed] = useState<number | null>(null);
  const [latestSelection, setLatestSelection] = useState<SpinItem[]>([]);

  const persistSpinResult = useCallback(
    async (selectedItems: SpinItem[], cycle: number) => {
      if (!participantId || submittedCycleRef.current === cycle) {
        return;
      }

      submittedCycleRef.current = cycle;
      setPersistState("saving");
      setPersistMessage("Registrando resultado da sua campanha...");

      try {
        const response = await fetch("/api/spin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId,
            itemIds: selectedItems.map((item) => item.id),
          }),
        });

        const payload = (await response.json().catch(() => null)) as SpinApiResponse | null;

        if (response.ok && payload?.ok) {
          setPersistState("saved");
          const nextRemaining = payload.data?.remainingAttempts ?? null;
          const nextMax = payload.data?.maxAttempts ?? MAX_SPIN_ATTEMPTS_PER_CPF;
          setRemainingAttempts(nextRemaining);
          setMaxAttempts(nextMax);
          setAttemptsUsed(payload.data?.attemptsUsed ?? null);
          setPersistMessage(
            `Resultado registrado com sucesso. ${buildAttemptsMessage(nextRemaining, nextMax)}`
          );
          setSpinResultId(payload.data?.spinResultId ?? null);
          return;
        }

        if (
          response.status === 409 &&
          (payload?.code === "ALREADY_SPUN" || payload?.code === "SPIN_CONFLICT")
        ) {
          setPersistState("blocked");
          const nextRemaining = payload.data?.remainingAttempts ?? null;
          const nextMax = payload.data?.maxAttempts ?? MAX_SPIN_ATTEMPTS_PER_CPF;
          setRemainingAttempts(nextRemaining);
          setMaxAttempts(nextMax);
          setAttemptsUsed(payload.data?.attemptsUsed ?? null);
          setPersistMessage(
            payload?.error ??
              `Este CPF já utilizou as ${nextMax} chances da promoção.`
          );
          setSpinResultId(payload.data?.spinResultId ?? null);
          return;
        }

        setPersistState("error");
        setPersistMessage(payload?.error ?? "Não foi possível registrar seu resultado agora.");
        submittedCycleRef.current = null;
      } catch {
        setPersistState("error");
        setPersistMessage("Tivemos uma instabilidade ao salvar seu resultado.");
        submittedCycleRef.current = null;
      }
    },
    [participantId]
  );

  const handleRevealed = useCallback(
    (selection: SpinItem[]) => {
      setLatestSelection(selection);
      if (!participantId) return;
      void persistSpinResult(selection, spinCycle);
    },
    [participantId, persistSpinResult, spinCycle]
  );

  const { frames, activeSlot, revealed, progress, phaseText, priceSummary } =
    usePromotionalSpin({
      items,
      onRevealed: handleRevealed,
      cycleKey: spinCycle,
    });

  const retryPersist = useCallback(() => {
    if (!participantId || latestSelection.length === 0) return;
    void persistSpinResult(latestSelection, spinCycle);
  }, [latestSelection, participantId, persistSpinResult, spinCycle]);

  const spinAgainLabel = useMemo(() => {
    if (remainingAttempts == null) return "Girar novamente";
    if (remainingAttempts === 1) return "Girar novamente (1 chance restante)";
    return `Girar novamente (${remainingAttempts} chances restantes)`;
  }, [remainingAttempts]);

  const canSpinAgain =
    revealed &&
    persistState !== "saving" &&
    (!participantId || persistState === "saved" || persistState === "blocked") &&
    (!participantId || remainingAttempts == null || remainingAttempts > 0);

  const startAnotherSpin = useCallback(() => {
    if (!canSpinAgain) return;
    submittedCycleRef.current = null;
    setPersistState("idle");
    setPersistMessage("");
    setSpinResultId(null);
    setAttemptsUsed(null);
    setLatestSelection([]);
    setSpinCycle((previous) => previous + 1);
  }, [canSpinAgain]);

  const continueHref = useMemo(() => {
    if (spinResultId) {
      return `/resultado?spinResultId=${encodeURIComponent(spinResultId)}`;
    }
    if (participantId) {
      return `/resultado?participantId=${encodeURIComponent(participantId)}`;
    }
    return "/resultado";
  }, [participantId, spinResultId]);

  const canContinue =
    revealed && (!participantId || persistState === "saved" || persistState === "blocked");

  const pricingMetrics: PricingMetric[] = useMemo(
    () => [
      {
        label: "Valor original",
        value: formatBRL(priceSummary.originalTotal),
      },
      {
        label: "Valor final",
        value: formatBRL(priceSummary.finalPrice),
        emphasize: true,
      },
      {
        label: "Economia",
        value: formatBRL(priceSummary.savings),
        emphasize: true,
      },
      {
        label: "Desconto",
        value: formatPercent(priceSummary.savingsPercent),
        emphasize: true,
      },
    ],
    [
      priceSummary.finalPrice,
      priceSummary.originalTotal,
      priceSummary.savings,
      priceSummary.savingsPercent,
    ]
  );

  return (
    <Card className="campaign-panel">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(177,138,74,0.2),_transparent_45%)]" />

      <CardHeader className="relative space-y-2 px-5 pt-5 sm:px-6 sm:pt-6">
        <CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">
          Vitrine Promocional Inteligente
        </CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">{phaseText}</p>
      </CardHeader>

      <CardContent className="relative space-y-6 px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="h-2 overflow-hidden rounded-full bg-primary/12">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-300"
            style={{ width: `${revealed ? 100 : progress}%` }}
          />
        </div>

        <ThreeFrameShowcase frames={frames} activeSlot={activeSlot} revealed={revealed} />

        <div className="campaign-highlight grid gap-3 p-4 sm:grid-cols-2">
          {pricingMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={false}
              animate={
                revealed
                  ? { opacity: 1, y: 0, filter: "blur(0px)" }
                  : { opacity: 0.92, y: 0, filter: "blur(0px)" }
              }
              transition={{
                duration: 0.3,
                delay: revealed ? index * 0.06 : 0,
                ease: "easeOut",
              }}
            >
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {metric.label}
              </p>

              {revealed ? (
                <motion.p
                  initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.36, delay: index * 0.06, ease: "easeOut" }}
                  className={cn(
                    "text-lg font-bold",
                    metric.emphasize ? "text-primary font-black" : "text-foreground"
                  )}
                >
                  {metric.value}
                </motion.p>
              ) : (
                <motion.div
                  className="mt-2 h-6 rounded bg-muted/70"
                  style={{ width: index === 3 ? "45%" : "65%" }}
                  animate={{ opacity: [0.35, 0.9, 0.35] }}
                  transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {persistState === "saving" ? (
          <div className="campaign-status-info flex items-start gap-2 px-3 py-2 text-sm">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
            <span>{persistMessage}</span>
          </div>
        ) : null}

        {persistState === "saved" ? (
          <div className="campaign-status-success space-y-1 px-3 py-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{persistMessage}</span>
            </div>
            {attemptsUsed != null ? (
              <p className="pl-6 text-xs text-muted-foreground">
                Tentativa {attemptsUsed} de {maxAttempts}.
              </p>
            ) : null}
          </div>
        ) : null}

        {persistState === "blocked" ? (
          <div className="campaign-status-warning space-y-1 px-3 py-2 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{persistMessage}</span>
            </div>
            {attemptsUsed != null ? (
              <p className="pl-6 text-xs text-muted-foreground">
                Tentativa {attemptsUsed} de {maxAttempts}.
              </p>
            ) : null}
          </div>
        ) : null}

        {persistState === "error" ? (
          <div className="campaign-status-error space-y-2 px-3 py-2">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{persistMessage}</span>
            </div>

            <button
              type="button"
              onClick={retryPersist}
              className="text-sm font-semibold text-foreground underline underline-offset-4"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={startAnotherSpin}
            disabled={!canSpinAgain}
            className={cn(
              "inline-flex h-12 items-center justify-center rounded-xl text-base font-semibold transition",
              canSpinAgain
                ? "campaign-cta-outline"
                : "pointer-events-none bg-muted text-muted-foreground"
            )}
          >
            {spinAgainLabel}
          </button>

          <Link
            href={canContinue ? continueHref : "#"}
            aria-disabled={!canContinue}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold transition",
              canContinue
                ? "bg-primary text-primary-foreground shadow-[0_16px_34px_-18px_rgba(10,10,10,0.55)] hover:-translate-y-0.5 hover:opacity-95"
                : "pointer-events-none bg-muted text-muted-foreground"
            )}
          >
            Ir para oferta de compra
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
