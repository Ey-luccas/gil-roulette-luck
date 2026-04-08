"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { SpinFrame } from "@/types/spin";

type ThreeFrameShowcaseProps = {
  frames: SpinFrame[];
  activeSlot: number;
  revealed: boolean;
};

export function ThreeFrameShowcase({
  frames,
  activeSlot,
  revealed,
}: ThreeFrameShowcaseProps) {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {frames.map((frame, index) => {
        const isActive = index === activeSlot;
        const isHighlighted = revealed || isActive;

        return (
          <motion.article
            key={`slot-${index}`}
            animate={{
              scale: isHighlighted ? 1.03 : 0.96,
              opacity: isHighlighted ? 1 : 0.58,
              y: isHighlighted ? -8 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "relative overflow-hidden border bg-card/95 p-2 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.32)]",
              isHighlighted ? "border-primary/55" : "border-primary/16"
            )}
          >
            <div className="relative mb-2 aspect-[4/5] overflow-hidden border border-border/60 bg-muted/50">
              <motion.div
                key={`${frame.item.id}-${frame.token}`}
                initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={frame.item.imageUrl}
                  alt={frame.item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 28vw"
                />
              </motion.div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/22 to-transparent" />
            </div>

            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Look {index + 1}
            </p>
            <p
              className="mt-0.5 line-clamp-2 min-h-[2.2rem] max-w-full break-words text-[11px] font-bold leading-tight [overflow-wrap:anywhere] sm:min-h-[2.5rem] sm:text-sm"
              title={frame.item.name}
            >
              {frame.item.name}
            </p>

            {isActive && !revealed ? (
              <motion.span
                className="pointer-events-none absolute inset-0 border-2 border-primary shadow-[0_0_38px_rgba(177,138,74,0.48)]"
                animate={{ opacity: [0.3, 0.95, 0.3] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
            ) : null}
          </motion.article>
        );
      })}
    </div>
  );
}
