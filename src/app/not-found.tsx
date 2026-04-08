import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
      <section className="w-full rounded-2xl border border-primary/20 bg-card/90 p-8 text-center shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">404</p>
        <h1 className="mt-2 text-3xl font-black">Conteúdo não encontrado</h1>
        <p className="mt-3 text-muted-foreground">
          O link pode estar inválido ou a participação não existe mais.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
        >
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
