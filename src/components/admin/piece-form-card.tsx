"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const pieceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome válido para a peça."),
  originalPrice: z
    .string()
    .trim()
    .min(1, "Informe o preço original.")
    .refine((value) => {
      const parsed = Number(value.replace(",", "."));
      return Number.isFinite(parsed) && parsed > 0;
    }, "Preço inválido."),
  isActive: z.boolean(),
});

type PieceFormValues = z.infer<typeof pieceSchema>;

type FormStatus =
  | {
      type: "idle";
      message?: undefined;
    }
  | {
      type: "loading" | "error" | "success";
      message: string;
    };

type CreateItemResponse = {
  ok?: boolean;
  error?: string;
  data?: {
    id?: string;
  };
};

function formatPriceInput(raw: string) {
  return raw.replace(/[^\d,.\s]/g, "");
}

export function PieceFormCard() {
  const router = useRouter();
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const form = useForm<PieceFormValues>({
    resolver: zodResolver(pieceSchema),
    defaultValues: {
      name: "",
      originalPrice: "",
      isActive: true,
    },
    mode: "onBlur",
  });

  const isBusy = form.formState.isSubmitting || status.type === "loading";

  const previewUrl = useMemo(() => {
    if (!selectedImage) return null;
    return URL.createObjectURL(selectedImage);
  }, [selectedImage]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!selectedImage) {
      setStatus({
        type: "error",
        message: "Selecione uma imagem da peça para continuar.",
      });
      return;
    }

    setStatus({
      type: "loading",
      message: "Cadastrando peça no catálogo da campanha...",
    });

    const formData = new FormData();
    formData.append("name", values.name.trim());
    formData.append("originalPrice", values.originalPrice.replace(",", ".").trim());
    formData.append("isActive", values.isActive ? "true" : "false");
    formData.append("image", selectedImage);

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as CreateItemResponse | null;

      if (!response.ok || !payload?.ok) {
        setStatus({
          type: "error",
          message: payload?.error ?? "Não foi possível cadastrar a peça.",
        });
        return;
      }

      setStatus({
        type: "success",
        message: "Peça cadastrada com sucesso. Redirecionando para a listagem...",
      });

      form.reset({
        name: "",
        originalPrice: "",
        isActive: true,
      });
      setSelectedImage(null);

      window.setTimeout(() => {
        router.push("/admin/pecas");
      }, 700);
    } catch {
      setStatus({
        type: "error",
        message: "Instabilidade ao cadastrar a peça. Tente novamente.",
      });
    }
  });

  return (
    <Card className="campaign-panel">
      <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
        <CardTitle className="text-2xl font-black">Nova peça</CardTitle>
        <CardDescription>
          Informe os dados da peça e publique no catálogo promocional da campanha.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nome da peça</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Legging Sculpt"
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
              name="originalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço original</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="decimal"
                      placeholder="129,90"
                      disabled={isBusy}
                      className="h-10 rounded-xl bg-background"
                      value={field.value}
                      onChange={(event) => field.onChange(formatPriceInput(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel htmlFor="pieceImage">Imagem</FormLabel>
              <Input
                id="pieceImage"
                type="file"
                accept="image/*"
                disabled={isBusy}
                className="h-10 rounded-xl bg-background"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedImage(file);
                }}
              />
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP ou AVIF com até 5MB.</p>
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
                    <div>
                      <FormLabel className="text-sm font-semibold">Status da peça</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Deixe ativa para aparecer no giro promocional.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        disabled={isBusy}
                        onCheckedChange={field.onChange}
                        aria-label="Ativar peça"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {previewUrl ? (
              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-medium">Pré-visualização</p>
                <div className="relative h-56 w-full overflow-hidden rounded-xl border border-border bg-muted sm:w-72">
                  <Image src={previewUrl} alt="Prévia da peça" fill unoptimized className="object-cover" />
                </div>
              </div>
            ) : null}

            <Button
              type="submit"
              className="h-12 rounded-xl sm:col-span-2"
              disabled={isBusy}
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando peça
                </>
              ) : (
                "Salvar peça"
              )}
            </Button>
          </form>
        </Form>

        {status.type === "loading" ? (
          <div className="campaign-status-info flex items-start gap-2 px-3 py-2 text-sm">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
            <span>{status.message}</span>
          </div>
        ) : null}

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
      </CardContent>
    </Card>
  );
}
