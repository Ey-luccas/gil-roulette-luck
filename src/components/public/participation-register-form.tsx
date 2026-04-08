"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MAX_SPIN_ATTEMPTS_PER_CPF } from "@/lib/campaign-rules";
import { isValidCpf, maskCpf, normalizeCpf } from "@/lib/cpf";
import { formatPhone, isValidPhone, normalizePhone } from "@/lib/phone";

const participationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo.")
    .max(120, "Nome muito longo."),
  phone: z.string().refine(isValidPhone, "Telefone inválido."),
  cpf: z.string().refine(isValidCpf, "CPF inválido."),
});

type ParticipationValues = z.infer<typeof participationSchema>;

type SubmissionStatus =
  | { type: "idle"; message?: undefined }
  | { type: "loading"; message: string }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

const initialStatus: SubmissionStatus = { type: "idle" };

function formatRemainingAttempts(remaining: number, max: number) {
  if (remaining <= 0) {
    return `Você já utilizou as ${max} chances desta promoção.`;
  }

  if (remaining === 1) {
    return `Você ainda tem 1 chance de ${max}.`;
  }

  return `Você ainda tem ${remaining} chances de ${max}.`;
}

export function ParticipationRegisterForm() {
  const router = useRouter();
  const [status, setStatus] = useState<SubmissionStatus>(initialStatus);

  const form = useForm<ParticipationValues>({
    resolver: zodResolver(participationSchema),
    defaultValues: {
      name: "",
      phone: "",
      cpf: "",
    },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus({
      type: "loading",
      message: "Validando seus dados e liberando suas chances de giro...",
    });

    try {
      const response = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          phone: normalizePhone(values.phone),
          cpf: normalizeCpf(values.cpf),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            code?: string;
            data?: {
              participantId?: string;
              remainingAttempts?: number;
              maxAttempts?: number;
            };
          }
        | null;

      if (!response.ok || !payload?.ok || !payload?.data?.participantId) {
        const message = payload?.error ?? "Não foi possível concluir seu cadastro.";

        if (payload?.code === "CPF_ALREADY_SPUN") {
          form.setError("cpf", {
            type: "server",
            message: `Este CPF já utilizou as ${MAX_SPIN_ATTEMPTS_PER_CPF} chances da promoção.`,
          });
        }

        setStatus({ type: "error", message });
        return;
      }

      setStatus({
        type: "success",
        message: `Cadastro concluído! ${formatRemainingAttempts(
          payload.data?.remainingAttempts ?? 0,
          payload.data?.maxAttempts ?? MAX_SPIN_ATTEMPTS_PER_CPF
        )} Preparando sua tela de giro...`,
      });

      window.setTimeout(() => {
        router.push(`/giro?participantId=${payload.data?.participantId ?? ""}`);
      }, 700);
    } catch {
      setStatus({
        type: "error",
        message: "Tivemos uma instabilidade. Tente novamente em instantes.",
      });
    }
  });

  const isBusy = form.formState.isSubmitting || status.type === "loading";

  return (
    <Card className="campaign-panel w-full max-w-xl">
      <CardHeader className="space-y-2 px-5 pt-5 sm:px-6 sm:pt-6">
        <CardTitle className="text-2xl font-black tracking-tight">Entrar na promoção</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Preencha seus dados para liberar sua participação e seguir para o giro promocional. São
          {MAX_SPIN_ATTEMPTS_PER_CPF} chances por CPF.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Mariana Santos"
                      autoComplete="name"
                      disabled={isBusy}
                      className="h-10 rounded-xl bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(85) 99999-9999"
                      inputMode="tel"
                      autoComplete="tel"
                      disabled={isBusy}
                      className="h-10 rounded-xl bg-background"
                      value={field.value}
                      onChange={(event) => field.onChange(formatPhone(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      autoComplete="off"
                      disabled={isBusy}
                      className="h-10 rounded-xl bg-background"
                      value={field.value}
                      onChange={(event) => field.onChange(maskCpf(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isBusy}
              className="h-12 w-full rounded-xl text-base font-semibold shadow-[0_14px_32px_-20px_rgba(10,10,10,0.5)]"
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando participação
                </>
              ) : (
                "Quero continuar para o giro"
              )}
            </Button>
          </form>
        </Form>

        <motion.div layout className="min-h-10">
          {status.type === "error" ? (
            <div className="campaign-status-error flex items-start gap-2 px-3 py-2 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{status.message}</span>
            </div>
          ) : null}

          {status.type === "success" ? (
            <div className="campaign-status-success flex items-start gap-2 px-3 py-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{status.message}</span>
            </div>
          ) : null}

          {status.type === "loading" ? (
            <div className="campaign-status-info flex items-start gap-2 px-3 py-2 text-sm">
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
              <span>{status.message}</span>
            </div>
          ) : null}
        </motion.div>
      </CardContent>
    </Card>
  );
}
