import { AdminHeader } from "@/components/admin/admin-header";
import { PieceFormCard } from "@/components/admin/piece-form-card";
import { CampaignShell } from "@/components/shared/campaign-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { requireAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminNovaPecaPage() {
  const session = await requireAdminSession();

  return (
    <CampaignShell>
      <SectionHeading
        kicker="Admin"
        title="Cadastrar nova peça"
        description="Adicione peças com imagem, preço e status para alimentar a campanha promocional."
      />

      <AdminHeader pathname="/admin/pecas/new" username={session.username} />
      <PieceFormCard />
    </CampaignShell>
  );
}
