import { PresentesCampaignExperience } from "@/components/public/presentes-campaign-experience";
import { CampaignShell } from "@/components/shared/campaign-shell";
import { SectionHeading } from "@/components/shared/section-heading";

export default function GiroPage() {
  return (
    <CampaignShell>
      <SectionHeading
        kicker="Etapa 3"
        title="Roleta de presentes"
        description="Agora é sua vez de girar e descobrir seu presente da campanha Presentes do 5.5."
      />

      <section className="space-y-4">
        <PresentesCampaignExperience mode="wheel" />

        <p className="text-sm text-muted-foreground">
          Campanha válida enquanto durarem os estoques dos presentes. Cada CPF possui até 3 chances
          de participação. Prêmios sujeitos às regras da campanha.
        </p>
      </section>
    </CampaignShell>
  );
}
