import { Badge } from "@/components/ui/badge";
import { ParticipationRegisterForm } from "@/components/public/participation-register-form";
import { CampaignShell } from "@/components/shared/campaign-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { MAX_SPIN_ATTEMPTS_PER_CPF } from "@/lib/campaign-rules";

export default function ParticiparPage() {
  return (
    <CampaignShell>
      <SectionHeading
        kicker="Etapa 1"
        title="Sacola Fitness"
        description={`Cadastre-se e tenha até ${MAX_SPIN_ATTEMPTS_PER_CPF} chances de descobrir sua sacola promocional.`}
      />

      <section className="space-y-6">
        <div className="campaign-panel px-6 py-7 sm:px-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary/22 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-secondary/16 blur-3xl" />

          <div className="relative space-y-4">
            <Badge className="bg-primary text-primary-foreground">
              {MAX_SPIN_ATTEMPTS_PER_CPF} chances por CPF
            </Badge>
            <h2 className="max-w-3xl text-balance text-3xl font-black tracking-tight sm:text-4xl">
              Complete seu cadastro e avance para o giro promocional da campanha.
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Seus dados são usados para validar o acesso à promoção e garantir uma experiência
              justa para todos os participantes.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <ParticipationRegisterForm />
        </div>
      </section>
    </CampaignShell>
  );
}
