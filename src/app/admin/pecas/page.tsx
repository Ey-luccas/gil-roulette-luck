import { AdminHeader } from "@/components/admin/admin-header";
import { PiecesTableCard } from "@/components/admin/pieces-table-card";
import { CampaignShell } from "@/components/shared/campaign-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPecasPage() {
  const session = await requireAdminSession();

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      originalPrice: true,
      isActive: true,
      createdAt: true,
    },
  });

  const listItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl,
    originalPrice: Number(item.originalPrice.toString()),
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <CampaignShell>
      <SectionHeading
        kicker="Admin"
        title="Gestão de peças"
        description="Controle o catálogo da campanha, ative ou inative peças e mantenha a vitrine sempre atualizada."
      />

      <AdminHeader pathname="/admin/pecas" username={session.username} />
      <PiecesTableCard initialItems={listItems} />
    </CampaignShell>
  );
}
