"use client";

import { useEffect, useMemo, useState } from "react";

type PreviewItem = {
  id: string;
  name: string;
};

const SLOTS = 3;
const STEP_MS = 280;

export function useSpinPreview(items: PreviewItem[]) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLOTS);
      setSeed((prev) => prev + 1);
    }, STEP_MS);

    return () => window.clearInterval(timer);
  }, []);

  const frames = useMemo(() => {
    if (items.length === 0) {
      return Array.from({ length: SLOTS }, (_, index) => ({
        id: `empty-${index}`,
        name: "Peça em breve",
      }));
    }

    return Array.from({ length: SLOTS }, (_, index) => {
      const itemIndex = (seed + index) % items.length;
      return items[itemIndex];
    });
  }, [items, seed]);

  return { frames, activeIndex };
}
