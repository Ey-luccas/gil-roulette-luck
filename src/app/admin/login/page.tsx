import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { isAdminLoggedIn } from "@/lib/auth";

export default async function AdminLoginPage() {
  const loggedIn = await isAdminLoggedIn();
  if (loggedIn) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="campaign-shell items-center justify-center">
      <section className="w-full max-w-xl space-y-4">
        <div className="campaign-panel p-5 text-center sm:p-6">
          <p className="campaign-kicker">GC Conceito</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Painel administrativo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso restrito para gestão da campanha.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <LockKeyhole className="h-3.5 w-3.5" />
            Área segura do administrador
          </div>
        </div>

        <AdminLoginForm />
      </section>
    </main>
  );
}
