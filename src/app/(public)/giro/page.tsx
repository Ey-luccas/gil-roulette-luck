import { PromotionalSpinExperience } from "@/components/public/giro/promotional-spin-experience";
import { CampaignShell } from "@/components/shared/campaign-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MAX_SPIN_ATTEMPTS_PER_CPF } from "@/lib/campaign-rules";
import { SACOLA_ITEM_COUNT } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type GiroPageProps = {
  searchParams: Promise<{
    participantId?: string;
  }>;
};

export default async function GiroPage({ searchParams }: GiroPageProps) {
  const { participantId } = await searchParams;
  const activeItems = await prisma.item.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      originalPrice: true,
    },
  });

  const items = activeItems.map((item) => ({
    id: item.id,
    name: item.name,
    imageUrl: `/api/items/${encodeURIComponent(item.id)}/image`,
    originalPrice: Number(item.originalPrice.toString()),
  }));

  const hasItemsForSpin = items.length >= SACOLA_ITEM_COUNT;

  return (
    <CampaignShell>
      <SectionHeading
        kicker="Etapa 2"
        title="Vitrine de Seleção Promocional"
        description={`Três quadros inteligentes alternam destaque e revelam peças com suspense até sua recompensa final. Você pode tentar até ${MAX_SPIN_ATTEMPTS_PER_CPF} vezes por CPF.`}
      />

      {hasItemsForSpin ? (
        <PromotionalSpinExperience items={items} participantId={participantId} />
      ) : (
        <Card className="campaign-panel">
          <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="text-2xl font-black">
              Preparando sua vitrine promocional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-5 pb-5 text-sm text-muted-foreground sm:px-6 sm:pb-6">
            <p>Estamos preparando sua vitrine com carinho para liberar o giro.</p>
            <p>Volte em instantes para descobrir sua Sacola Fitness promocional.</p>
          </CardContent>
        </Card>
      )}
    </CampaignShell>
  );
}
