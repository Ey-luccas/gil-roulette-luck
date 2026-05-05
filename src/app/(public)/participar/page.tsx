import { PresentesCampaignExperience } from "@/components/public/presentes-campaign-experience";
import { CampaignShell } from "@/components/shared/campaign-shell";
import { SectionHeading } from "@/components/shared/section-heading";

export default function ParticiparPage() {
  return (
    <CampaignShell>
      <SectionHeading
        kicker="Etapa 2"
        title="Validação e confirmação"
        description="Preencha e confirme seus dados para liberar sua participação na roleta."
      />

      <section className="space-y-4">
        <PresentesCampaignExperience mode="form" />

        <p className="text-sm text-muted-foreground">
          Campanha válida enquanto durarem os estoques dos presentes. Cada CPF possui até 3 chances
          de participação. Prêmios sujeitos às regras da campanha.
        </p>
      </section>
    </CampaignShell>
  );
}
