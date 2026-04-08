"use client";

import { useEffect, useMemo, useState } from "react";

import { SACOLA_FINAL_PRICE, SACOLA_ITEM_COUNT, calculatePricingSummary } from "@/lib/pricing";
import type { SpinFrame, SpinItem } from "@/types/spin";

const SLOT_COUNT = SACOLA_ITEM_COUNT;

const STEP_DURATIONS_MS = [
  120, 120, 130, 130, 140, 145, 155, 170, 190, 220, 260, 320, 390, 480, 620,
];

const placeholderItem: SpinItem = {
  id: "placeholder",
  name: "Peça em preparação",
  imageUrl: "/seed/top-energy-pulse.svg",
  originalPrice: 0,
};

function randomFromPool(pool: SpinItem[], exceptId?: string) {
  if (pool.length === 0) {
    throw new Error("Pool de itens vazia.");
  }

  const candidates = exceptId ? pool.filter((item) => item.id !== exceptId) : pool;
  const source = candidates.length > 0 ? candidates : pool;
  const index = Math.floor(Math.random() * source.length);
  return source[index];
}

function pickUnique(pool: SpinItem[], count: number) {
  const shuffled = [...pool];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled.slice(0, count);
}

type UsePromotionalSpinParams = {
  items: SpinItem[];
  onRevealed?: (selection: SpinItem[]) => void;
  cycleKey?: number;
};

export function usePromotionalSpin({ items, onRevealed, cycleKey = 0 }: UsePromotionalSpinParams) {
  const [step, setStep] = useState(0);
  const [activeSlot, setActiveSlot] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const finalSelection = useMemo(() => {
    const selection = pickUnique(items, SLOT_COUNT);
    const offset = ((cycleKey % SLOT_COUNT) + SLOT_COUNT) % SLOT_COUNT;

    if (offset === 0) {
      return selection;
    }

    return [...selection.slice(offset), ...selection.slice(0, offset)];
  }, [items, cycleKey]);

  const [frames, setFrames] = useState<SpinFrame[]>(() =>
    Array.from({ length: SLOT_COUNT }, (_, slot) => ({
      slot,
      token: 0,
      item: items[slot] ?? items[0] ?? placeholderItem,
    }))
  );

  useEffect(() => {
    if (items.length < SLOT_COUNT || finalSelection.length < SLOT_COUNT) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const totalSteps = STEP_DURATIONS_MS.length;

    const runStep = (currentStep: number) => {
      if (cancelled) return;

      if (currentStep >= totalSteps) {
        setRevealed(true);
        setActiveSlot(1);
        onRevealed?.(finalSelection);
        return;
      }

      const slot = currentStep % SLOT_COUNT;

      timeoutId = setTimeout(() => {
        if (cancelled) return;

        setStep(currentStep + 1);
        setActiveSlot(slot);

        setFrames((previous) => {
          const next = [...previous];
          const isFinalLockStep = currentStep >= totalSteps - SLOT_COUNT;
          const nextItem = isFinalLockStep
            ? finalSelection[slot]
            : randomFromPool(items, previous[slot]?.item?.id);

          next[slot] = {
            slot,
            token: previous[slot].token + 1,
            item: nextItem,
          };

          return next;
        });

        runStep(currentStep + 1);
      }, STEP_DURATIONS_MS[currentStep]);
    };

    timeoutId = setTimeout(() => {
      if (cancelled) return;

      setStep(0);
      setActiveSlot(0);
      setRevealed(false);
      setFrames(
        Array.from({ length: SLOT_COUNT }, (_, slot) => ({
          slot,
          token: 0,
          item: items[slot] ?? items[0] ?? placeholderItem,
        }))
      );

      runStep(0);
    }, 0);

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [items, finalSelection, onRevealed, cycleKey]);

  const phaseText = useMemo(() => {
    if (revealed) return "Sua seleção final foi revelada.";
    if (step < 5) return "Preparando sua sacola...";
    if (step < 11) return "Selecionando peças...";
    return "Quase lá...";
  }, [step, revealed]);

  const progress = Math.min((step / STEP_DURATIONS_MS.length) * 100, 100);

  const priceSummary = useMemo(
    () => calculatePricingSummary(finalSelection.map((item) => item.originalPrice), SACOLA_FINAL_PRICE),
    [finalSelection]
  );

  return {
    frames,
    activeSlot,
    revealed,
    progress,
    phaseText,
    finalSelection,
    finalPrice: SACOLA_FINAL_PRICE,
    priceSummary,
  };
}
