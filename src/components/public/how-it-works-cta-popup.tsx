"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type HowItWorksCtaPopupProps = {
  targetId: string;
};

export function HowItWorksCtaPopup({ targetId }: HowItWorksCtaPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || hasTriggered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || hasTriggered) return;
        setHasTriggered(true);
        setIsVisible(true);
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasTriggered, targetId]);

  useEffect(() => {
    if (!isVisible) return;

    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed right-4 bottom-4 left-4 z-40 sm:left-auto sm:w-[360px] lg:right-6"
          aria-live="polite"
        >
          <div className="relative space-y-3 rounded-2xl border border-border bg-background p-4 pr-12 shadow-[0_16px_40px_-26px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-background/90 text-muted-foreground transition hover:text-foreground"
              aria-label="Fechar aviso"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Pronto para descobrir sua seleção? Entre agora na campanha e desbloqueie sua oferta
              promocional.
            </p>

            <Link href="/participar" className="campaign-cta h-10 w-full rounded-lg">
              Participar agora
            </Link>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
