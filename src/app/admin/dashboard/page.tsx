import { AdminHeader } from "@/components/admin/admin-header";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { CampaignShell } from "@/components/shared/campaign-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();

  const [totalItems, activeItems, totalParticipants, totalSpins, totalRedeems] = await prisma.$transaction([
    prisma.item.count(),
    prisma.item.count({ where: { isActive: true } }),
    prisma.campaignParticipant.count(),
    prisma.campaignSpin.count(),
    prisma.campaignParticipant.count({
      where: {
        whatsappClickedAt: {
          not: null,
        },
      },
    }),
  ]);

  return (
    <CampaignShell>
      <SectionHeading
        kicker="Admin"
        title="Dashboard da campanha"
        description="Visão geral do catálogo, participantes e giros realizados na campanha Presentes do 5.5."
      />

      <AdminHeader pathname="/admin/dashboard" username={session.username} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard
          label="Peças cadastradas"
          value={totalItems}
          description="Total de peças disponíveis no catálogo."
        />
        <AdminMetricCard
          label="Peças ativas"
          value={activeItems}
          description="Itens liberados para aparecer no giro."
        />
        <AdminMetricCard
          label="Participantes"
          value={totalParticipants}
          description="Cadastros realizados na página pública."
        />
        <AdminMetricCard
          label="Giros registrados"
          value={totalSpins}
          description="Resultados da campanha já confirmados no banco."
        />
        <AdminMetricCard
          label="Resgates iniciados"
          value={totalRedeems}
          description="Participantes que já clicaram para resgatar pelo WhatsApp."
        />
      </section>

      <Card className="campaign-panel-muted">
        <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Operação administrativa</p>
          <p>Use o menu para cadastrar novas peças, ativar/inativar e limpar itens quando necessário.</p>
        </CardContent>
      </Card>
    </CampaignShell>
  );
}
