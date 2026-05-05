"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift, Loader2, RotateCw, Send, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MAX_SPIN_ATTEMPTS_PER_CPF } from "@/lib/campaign-rules";
import { buildWhatsAppUrl } from "@/lib/contact";
import { formatCpf, isValidCpf, maskCpf, normalizeCpf } from "@/lib/cpf";
import { formatPhone, isValidPhone, normalizePhone } from "@/lib/phone";
import {
  PRESENTES_CAMPAIGN_NAME,
  cloneInitialCampaignPrizesStock,
  getRemainingSpinsForCpf,
  type CampaignParticipant,
  type CampaignPrizeStock,
} from "@/lib/presentes-campaign";
import {
  loadCampaignActiveCpf,
  loadCampaignParticipants,
  loadCampaignPrizesStock,
  saveCampaignActiveCpf,
  saveCampaignParticipants,
  saveCampaignPrizesStock,
} from "@/lib/presentes-campaign-storage";

const SPIN_REVEAL_DELAY_MS = 3400;
const CAMPAIGN_FLASH_NOTICE_KEY = "campaign_flash_notice";

const WHEEL_COLORS = [
  "oklch(0.93 0.022 83)",
  "oklch(0.98 0.003 90)",
  "oklch(0.89 0.036 82)",
  "oklch(0.95 0.01 86)",
  "oklch(0.84 0.05 78)",
  "oklch(0.99 0.006 88)",
];

type CampaignExperienceMode = "full" | "form" | "wheel";

type PresentesCampaignExperienceProps = {
  mode?: CampaignExperienceMode;
};

type FormValues = {
  name: string;
  phone: string;
  cpf: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type NoticeTone = "info" | "success" | "error";

type LatestSpinResult = {
  prize: CampaignPrizeStock;
  date: string;
};

function buildWheelBackground(prizes: CampaignPrizeStock[]) {
  const segmentSize = 100 / prizes.length;
  const colorStops = prizes.map((_, index) => {
    const start = Number((segmentSize * index).toFixed(3));
    const end = Number((segmentSize * (index + 1)).toFixed(3));
    const color = WHEEL_COLORS[index % WHEEL_COLORS.length];

    return `${color} ${start}% ${end}%`;
  });

  return `conic-gradient(from -90deg, ${colorStops.join(", ")})`;
}

function getNoticeClass(tone: NoticeTone) {
  if (tone === "success") return "campaign-status-success";
  if (tone === "error") return "campaign-status-error";
  return "campaign-status-info";
}

function formatPrizeQuantity(quantity: number | null) {
  if (quantity === null) return "Ilimitado";
  if (quantity <= 0) return "Esgotado";
  return `${quantity} restantes`;
}

function buildWhatsAppRescueMessage(participant: CampaignParticipant, prizeName: string) {
  return [
    "Olá, equipe GC Conceito!",
    `Meu nome é ${participant.name}, CPF ${formatCpf(participant.cpf)}.`,
    `Participei da campanha ${PRESENTES_CAMPAIGN_NAME} e no meu giro ganhei: ${prizeName}.`,
    "Quero resgatar meu presente.",
  ].join(" ");
}

function formatSpinDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Data não disponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
}

function getActiveParticipant(participants: CampaignParticipant[], cpf: string | null) {
  if (!cpf) return null;
  return participants.find((participant) => participant.cpf === cpf) ?? null;
}

function validateParticipantForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Informe seu nome completo.";
  }

  if (!isValidPhone(values.phone)) {
    errors.phone = "Informe um WhatsApp válido.";
  }

  if (!isValidCpf(values.cpf)) {
    errors.cpf = "Informe um CPF válido.";
  }

  return errors;
}

type DrawResult = {
  selectedPrize: CampaignPrizeStock;
  updatedStock: CampaignPrizeStock[];
};

function drawPrizeWithStockControl(prizesStock: CampaignPrizeStock[]): DrawResult | null {
  const availablePrizes = prizesStock.filter((prize) => prize.quantity === null || prize.quantity > 0);

  const fallbackPrize = prizesStock.find((prize) => prize.id === "tente-novamente") ?? null;
  const drawPool = availablePrizes.length > 0 ? availablePrizes : fallbackPrize ? [fallbackPrize] : [];

  if (drawPool.length === 0) {
    return null;
  }

  const selectedPrize = drawPool[Math.floor(Math.random() * drawPool.length)] as CampaignPrizeStock;

  const updatedStock = prizesStock.map((prize) => {
    if (prize.id !== selectedPrize.id || prize.quantity === null) {
      return prize;
    }

    return {
      ...prize,
      quantity: Math.max(0, prize.quantity - 1),
    };
  });

  return {
    selectedPrize,
    updatedStock,
  };
}

export function PresentesCampaignExperience({
  mode = "full",
}: PresentesCampaignExperienceProps) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [participants, setParticipants] = useState<CampaignParticipant[]>([]);
  const [prizesStock, setPrizesStock] = useState<CampaignPrizeStock[]>(() =>
    cloneInitialCampaignPrizesStock()
  );
  const [activeCpf, setActiveCpf] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<LatestSpinResult | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const [formValues, setFormValues] = useState<FormValues>({
    name: "",
    phone: "",
    cpf: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  useEffect(() => {
    const storedParticipants = loadCampaignParticipants();
    const storedPrizesStock = loadCampaignPrizesStock();
    const storedActiveCpf = loadCampaignActiveCpf();
    const storedActiveParticipant = storedActiveCpf
      ? storedParticipants.find((participant) => participant.cpf === storedActiveCpf) ?? null
      : null;

    const rafId = window.requestAnimationFrame(() => {
      setParticipants(storedParticipants);
      setPrizesStock(storedPrizesStock);

      if (storedActiveCpf) {
        setActiveCpf(storedActiveCpf);
      }

      if (storedActiveParticipant) {
        setFormValues({
          name: storedActiveParticipant.name,
          phone: formatPhone(storedActiveParticipant.phone),
          cpf: formatCpf(storedActiveParticipant.cpf),
        });
      }

      try {
        const rawFlashNotice = window.sessionStorage.getItem(CAMPAIGN_FLASH_NOTICE_KEY);
        if (rawFlashNotice) {
          const parsed = JSON.parse(rawFlashNotice) as { tone?: NoticeTone; message?: string };
          if (parsed?.tone && parsed?.message) {
            setNotice({ tone: parsed.tone, message: parsed.message });
          }
          window.sessionStorage.removeItem(CAMPAIGN_FLASH_NOTICE_KEY);
        }
      } catch {
        // Sem flash notice disponível.
      }
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    if (notice.tone === "info" && isSpinning) return;

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 4200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notice, isSpinning]);

  const activeParticipant = useMemo(
    () => getActiveParticipant(participants, activeCpf),
    [participants, activeCpf]
  );

  const spinsUsed = activeParticipant?.spins.length ?? 0;
  const remainingSpins = getRemainingSpinsForCpf(spinsUsed);
  const wheelBackground = useMemo(() => buildWheelBackground(prizesStock), [prizesStock]);

  const whatsappRescueUrl = useMemo(() => {
    if (!activeParticipant || !latestResult) return null;

    const message = buildWhatsAppRescueMessage(activeParticipant, latestResult.prize.name);
    return buildWhatsAppUrl(message);
  }, [activeParticipant, latestResult]);

  const handleFieldChange = useCallback((field: keyof FormValues, value: string) => {
    if (field === "phone") {
      setFormValues((current) => ({ ...current, phone: formatPhone(value) }));
    } else if (field === "cpf") {
      setFormValues((current) => ({ ...current, cpf: maskCpf(value) }));
    } else {
      setFormValues((current) => ({ ...current, [field]: value }));
    }

    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }, []);

  const handleRegisterParticipant = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const nextErrors = validateParticipantForm(formValues);
      setFormErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        setNotice({
          tone: "error",
          message: "Revise os dados do formulário para continuar.",
        });
        return;
      }

      const normalizedCpf = normalizeCpf(formValues.cpf);
      const normalizedPhone = normalizePhone(formValues.phone);
      const normalizedName = formValues.name.trim();

      const existingParticipant = participants.find((participant) => participant.cpf === normalizedCpf);

      const nextParticipant: CampaignParticipant = existingParticipant
        ? {
            ...existingParticipant,
            name: normalizedName,
            phone: normalizedPhone,
          }
        : {
            name: normalizedName,
            phone: normalizedPhone,
            cpf: normalizedCpf,
            spins: [],
          };

      const nextParticipants = existingParticipant
        ? participants.map((participant) =>
            participant.cpf === normalizedCpf ? nextParticipant : participant
          )
        : [...participants, nextParticipant];

      saveCampaignParticipants(nextParticipants);
      saveCampaignActiveCpf(normalizedCpf);

      setParticipants(nextParticipants);
      setActiveCpf(normalizedCpf);
      setLatestResult(null);

      const availableSpins = getRemainingSpinsForCpf(nextParticipant.spins.length);

      if (availableSpins <= 0) {
        setNotice({
          tone: "error",
          message: "Você já utilizou suas 3 chances nesta campanha.",
        });
        return;
      }

      const successMessage = `Cadastro confirmado. Giros restantes: ${availableSpins} de ${MAX_SPIN_ATTEMPTS_PER_CPF}. Agora você pode seguir para a roleta.`;

      if (mode === "form") {
        try {
          window.sessionStorage.setItem(
            CAMPAIGN_FLASH_NOTICE_KEY,
            JSON.stringify({
              tone: "success" as NoticeTone,
              message: successMessage,
            })
          );
        } catch {
          // Segue o fluxo mesmo sem persistir o alerta.
        }
        router.push("/giro");
        return;
      }

      setNotice({
        tone: "success",
        message: successMessage,
      });
    },
    [formValues, mode, participants, router]
  );

  const handleSpin = useCallback(() => {
    if (isSpinning) return;

    if (!activeParticipant) {
      setNotice({
        tone: "error",
        message: "Valide seu CPF antes de acessar a roleta.",
      });
      return;
    }

    if (activeParticipant.spins.length >= MAX_SPIN_ATTEMPTS_PER_CPF) {
      setNotice({
        tone: "error",
        message: "Você já utilizou suas 3 chances nesta campanha.",
      });
      return;
    }

    const drawResult = drawPrizeWithStockControl(prizesStock);

    if (!drawResult) {
      setNotice({
        tone: "error",
        message: "Não foi possível sortear um prêmio agora. Tente novamente.",
      });
      return;
    }

    const spinDate = new Date().toISOString();
    const nextSpin = {
      prize: drawResult.selectedPrize.name,
      prizeId: drawResult.selectedPrize.id,
      note: drawResult.selectedPrize.note,
      date: spinDate,
    };

    const updatedParticipant: CampaignParticipant = {
      ...activeParticipant,
      spins: [...activeParticipant.spins, nextSpin],
    };

    const nextParticipants = participants.map((participant) =>
      participant.cpf === activeParticipant.cpf ? updatedParticipant : participant
    );

    const nextPrizesStock = drawResult.updatedStock;

    saveCampaignParticipants(nextParticipants);
    saveCampaignPrizesStock(nextPrizesStock);

    setParticipants(nextParticipants);
    setPrizesStock(nextPrizesStock);
    setIsResultModalOpen(false);
    setIsSpinning(true);
    setNotice({ tone: "info", message: "Girando roleta..." });

    const selectedIndex = prizesStock.findIndex((prize) => prize.id === drawResult.selectedPrize.id);
    const safeSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;

    const segmentSize = 360 / Math.max(prizesStock.length, 1);
    const selectedCenter = safeSelectedIndex * segmentSize + segmentSize / 2;
    const targetRotation = wheelRotation + 6 * 360 + (360 - selectedCenter);

    setWheelRotation(targetRotation);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const remainingAfterSpin = getRemainingSpinsForCpf(updatedParticipant.spins.length);

      setLatestResult({
        prize: drawResult.selectedPrize,
        date: spinDate,
      });
      setIsResultModalOpen(true);
      setIsSpinning(false);

      if (remainingAfterSpin > 0) {
        setNotice({
          tone: "success",
          message: `Resultado registrado! Você ganhou "${drawResult.selectedPrize.name}". Giros restantes: ${remainingAfterSpin} de ${MAX_SPIN_ATTEMPTS_PER_CPF}.`,
        });
        return;
      }

      setNotice({
        tone: "success",
        message: `Resultado registrado! Você ganhou "${drawResult.selectedPrize.name}". Você já utilizou suas 3 chances nesta campanha.`,
      });
    }, SPIN_REVEAL_DELAY_MS);
  }, [activeParticipant, isSpinning, participants, prizesStock, wheelRotation]);

  const showForm = mode !== "wheel";
  const showWheel = mode !== "form";
  const showCombined = showForm && showWheel;
  const displayRemainingSpins = activeParticipant ? remainingSpins : MAX_SPIN_ATTEMPTS_PER_CPF;

  const formArticle = (
    <article className="campaign-panel p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-12 h-36 w-36 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-accent/45 blur-3xl" />

      <div className="relative space-y-5">
        <div className="space-y-2">
          <p className="campaign-chip">Formulário de participação</p>
          <h3 className="text-2xl font-black tracking-tight">Participar agora</h3>
          <p className="text-sm text-muted-foreground">
            Preencha nome completo, WhatsApp e CPF para liberar seus giros nesta campanha.
          </p>
        </div>

        <form onSubmit={handleRegisterParticipant} className="space-y-3.5">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Nome completo</span>
            <input
              type="text"
              value={formValues.name}
              onChange={(event) => handleFieldChange("name", event.target.value)}
              placeholder="Ex: Ana Carolina Lima"
              autoComplete="name"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/20"
            />
            {formErrors.name ? (
              <span className="text-xs font-medium text-foreground/80">{formErrors.name}</span>
            ) : null}
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold">WhatsApp</span>
            <input
              type="tel"
              value={formValues.phone}
              onChange={(event) => handleFieldChange("phone", event.target.value)}
              placeholder="(85) 99999-9999"
              autoComplete="tel"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/20"
            />
            {formErrors.phone ? (
              <span className="text-xs font-medium text-foreground/80">{formErrors.phone}</span>
            ) : null}
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold">CPF</span>
            <input
              type="text"
              value={formValues.cpf}
              onChange={(event) => handleFieldChange("cpf", event.target.value)}
              placeholder="000.000.000-00"
              inputMode="numeric"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/20"
            />
            {formErrors.cpf ? (
              <span className="text-xs font-medium text-foreground/80">{formErrors.cpf}</span>
            ) : null}
          </label>

          <button type="submit" className="campaign-cta w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Validar e confirmar cadastro
          </button>
        </form>

        <div className="campaign-highlight p-4">
          <p className="text-lg font-black tracking-tight text-primary">
            Giros restantes: {displayRemainingSpins} de {MAX_SPIN_ATTEMPTS_PER_CPF}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Regra da campanha: até 3 chances por CPF.</p>
        </div>

      </div>
    </article>
  );

  const wheelArticle = (
    <article className="campaign-panel p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-x-8 top-8 h-32 rounded-full bg-accent/35 blur-3xl" />

      <div className="relative space-y-5">
        <div className="space-y-2">
          <p className="campaign-chip">Roleta principal da campanha</p>
          <h3 className="text-2xl font-black tracking-tight">Gire e descubra seu presente</h3>
          <p className="text-sm text-muted-foreground">
            Cada giro entrega apenas 1 resultado e registra automaticamente no histórico do CPF.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[430px]">
          <div className="relative aspect-square">
            <div className="absolute left-1/2 top-2 z-20 h-0 w-0 -translate-x-1/2 border-x-[14px] border-b-[24px] border-x-transparent border-b-foreground" />

            <div className="absolute inset-0 rounded-full border border-primary/20 p-3 shadow-[0_28px_56px_-34px_rgba(0,0,0,0.6)]">
              <div
                className="relative h-full w-full rounded-full border border-primary/12"
                style={{
                  background: wheelBackground,
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isSpinning
                    ? "transform 3400ms cubic-bezier(0.22, 1, 0.36, 1)"
                    : "transform 240ms ease-out",
                }}
              >
                {prizesStock.map((prize, index) => {
                  const angle = (360 / prizesStock.length) * index;

                  return (
                    <div
                      key={prize.id}
                      className="absolute left-1/2 top-1/2 h-[44%] w-0 origin-bottom"
                      style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
                    >
                      <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full border border-black/10 bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {index + 1}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="absolute inset-[34%] grid place-items-center rounded-full border border-primary/20 bg-background/92 text-center shadow-[0_8px_24px_-18px_rgba(0,0,0,0.8)]">
                <p className="text-xs font-semibold tracking-[0.14em] uppercase text-muted-foreground">
                  Presentes
                </p>
                <p className="text-2xl font-black leading-none text-primary">5.5</p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSpin}
          disabled={isSpinning || !activeParticipant || remainingSpins <= 0}
          className="campaign-cta w-full gap-2 disabled:pointer-events-none disabled:opacity-60"
        >
          {isSpinning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          {isSpinning ? "Girando roleta..." : "Girar roleta"}
        </button>

        <div className="grid gap-2 sm:grid-cols-2">
          {prizesStock.map((prize, index) => (
            <div key={prize.id} className="campaign-card p-3">
              <p className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">
                Prêmio {index + 1}
              </p>
              <p className="mt-1 text-sm font-bold leading-snug">{prize.name}</p>
              {prize.note ? <p className="mt-1 text-xs text-muted-foreground">{prize.note}</p> : null}
              <p className="mt-1 text-xs font-semibold text-primary">{formatPrizeQuantity(prize.quantity)}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );

  return (
    <section id={showWheel ? "roleta-campanha" : undefined} className="space-y-5">
      {showCombined ? (
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          {formArticle}
          {wheelArticle}
        </div>
      ) : null}

      {!showCombined && showForm ? <div className="mx-auto w-full max-w-3xl">{formArticle}</div> : null}

      {!showCombined && showWheel ? (
        <div className="space-y-4">
          {!activeParticipant ? (
            <article className="campaign-panel-muted space-y-3 p-5">
              <p className="text-sm text-muted-foreground">
                Primeiro valide seu formulário de participação para liberar o giro da roleta.
              </p>
              <Link href="/participar" className="campaign-cta-outline h-10 w-full sm:w-fit">
                Ir para validação
              </Link>
            </article>
          ) : (
            <article className="campaign-panel-muted p-4">
              <p className="text-sm text-muted-foreground">
                Participante confirmado: <span className="font-semibold text-foreground">{activeParticipant.name}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                CPF: <span className="font-semibold text-foreground">{formatCpf(activeParticipant.cpf)}</span>
              </p>
              <p className="mt-1 text-sm font-semibold text-primary">
                Giros restantes: {remainingSpins} de {MAX_SPIN_ATTEMPTS_PER_CPF}
              </p>
            </article>
          )}

          {wheelArticle}
        </div>
      ) : null}

      {notice ? (
        <div
          className={`${getNoticeClass(notice.tone)} fixed top-4 right-4 z-50 w-[min(430px,calc(100vw-2rem))] rounded-xl px-3 py-2 text-sm shadow-[0_16px_36px_-24px_rgba(0,0,0,0.45)]`}
        >
          <div className="flex items-start gap-2">
            {notice.tone === "info" && isSpinning ? (
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Gift className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
        </div>
      ) : null}

      {latestResult ? (
        <article className="campaign-panel-muted space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] uppercase text-muted-foreground">
                Resultado do último giro
              </p>
              <p className="mt-1 text-xl font-black text-primary">{latestResult.prize.name}</p>
              {latestResult.prize.note ? (
                <p className="mt-1 text-sm text-muted-foreground">{latestResult.prize.note}</p>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">{formatSpinDate(latestResult.date)}</p>
          </div>

          {whatsappRescueUrl ? (
            <a
              href={whatsappRescueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="campaign-cta w-full gap-2 sm:w-fit"
            >
              <Send className="h-4 w-4" />
              Enviar resultado no WhatsApp
            </a>
          ) : null}
        </article>
      ) : null}

      {isResultModalOpen && latestResult ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <article className="campaign-panel w-full max-w-md p-5 sm:p-6">
            <button
              type="button"
              onClick={() => setIsResultModalOpen(false)}
              className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-background/90 text-muted-foreground transition hover:text-foreground"
              aria-label="Fechar resultado"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="campaign-chip">Resultado do giro</p>
                <h4 className="text-2xl font-black tracking-tight">Você ganhou:</h4>
                <p className="text-xl font-black text-primary">{latestResult.prize.name}</p>
                {latestResult.prize.note ? (
                  <p className="text-sm text-muted-foreground">{latestResult.prize.note}</p>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResultModalOpen(false);
                    if (remainingSpins > 0) {
                      handleSpin();
                    }
                  }}
                  disabled={remainingSpins <= 0 || isSpinning}
                  className="campaign-cta-outline h-11 w-full disabled:pointer-events-none disabled:opacity-60"
                >
                  {remainingSpins > 0 ? "Tentar novamente" : "Sem giros restantes"}
                </button>

                {whatsappRescueUrl ? (
                  <a
                    href={whatsappRescueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsResultModalOpen(false)}
                    className="campaign-cta h-11 w-full"
                  >
                    Resgatar presente
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
