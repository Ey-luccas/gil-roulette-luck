"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Informe seu usuário."),
  password: z.string().min(4, "Informe sua senha."),
});

type LoginValues = z.infer<typeof loginSchema>;

type LoginStatus =
  | {
      type: "idle";
      message?: undefined;
    }
  | {
      type: "loading" | "error" | "success";
      message: string;
    };

const initialStatus: LoginStatus = { type: "idle" };

type LoginResponse = {
  ok?: boolean;
  code?: string;
  error?: string;
};

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<LoginStatus>(initialStatus);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onBlur",
  });

  const isBusy = form.formState.isSubmitting || status.type === "loading";

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus({
      type: "loading",
      message: "Validando credenciais administrativas...",
    });

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username.trim().toLowerCase(),
          password: values.password,
        }),
      });

      const payload = (await response.json().catch(() => null)) as LoginResponse | null;

      if (!response.ok || !payload?.ok) {
        const message = payload?.error ?? "Não foi possível autenticar.";
        if (payload?.code === "INVALID_CREDENTIALS") {
          form.setError("password", {
            type: "server",
            message: "Credenciais inválidas.",
          });
        }

        setStatus({
          type: "error",
          message,
        });
        return;
      }

      setStatus({
        type: "success",
        message: "Acesso autorizado. Redirecionando para o dashboard...",
      });

      const nextPath = searchParams.get("next");
      const redirectTarget =
        nextPath && nextPath.startsWith("/admin") ? nextPath : "/admin/dashboard";

      window.setTimeout(() => {
        router.replace(redirectTarget);
      }, 500);
    } catch {
      setStatus({
        type: "error",
        message: "Instabilidade ao autenticar. Tente novamente.",
      });
    }
  });

  return (
    <Card className="campaign-panel mx-auto w-full max-w-xl">
      <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
        <CardTitle className="text-2xl font-black">Entrar no painel</CardTitle>
        <CardDescription>Use usuário e senha para gerenciar as peças da campanha.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuário</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="username"
                      placeholder="admin"
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      disabled={isBusy}
                      className="h-10 rounded-xl bg-background"
                      {...field}
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
                  Validando acesso
                </>
              ) : (
                "Acessar dashboard"
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
