import { AdminHeader } from "@/components/admin/admin-header";
import { CustomersTableCard } from "@/components/admin/customers-table-card";
import { CampaignShell } from "@/components/shared/campaign-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminCustomerRow } from "@/types/admin";

export const dynamic = "force-dynamic";

function toNumber(value: { toString(): string }) {
  return Number(value.toString());
}

export default async function AdminClientesPage() {
  const session = await requireAdminSession();

  const participants = await prisma.participant.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      phone: true,
      cpf: true,
      spinAttempts: true,
      createdAt: true,
      spinResults: {
        orderBy: [{ attemptNumber: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          id: true,
          attemptNumber: true,
          finalPrice: true,
          originalTotal: true,
          discountAmount: true,
          discountPercent: true,
          createdAt: true,
          isSold: true,
          soldAt: true,
          items: {
            select: {
              item: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  originalPrice: true,
                  isActive: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const customers: AdminCustomerRow[] = participants.map((participant) => {
    const latestSpin = participant.spinResults[0];

    return {
      id: participant.id,
      name: participant.name,
      phone: participant.phone,
      cpf: participant.cpf,
      spinAttempts: participant.spinAttempts,
      createdAt: participant.createdAt.toISOString(),
      latestSpin: latestSpin
        ? {
            id: latestSpin.id,
            attemptNumber: latestSpin.attemptNumber,
            finalPrice: toNumber(latestSpin.finalPrice),
            originalTotal: toNumber(latestSpin.originalTotal),
            discountAmount: toNumber(latestSpin.discountAmount),
            discountPercent: toNumber(latestSpin.discountPercent),
            createdAt: latestSpin.createdAt.toISOString(),
            isSold: latestSpin.isSold,
            soldAt: latestSpin.soldAt?.toISOString() ?? null,
            items: latestSpin.items.map((entry) => ({
              id: entry.item.id,
              name: entry.item.name,
              imageUrl: entry.item.imageUrl,
              originalPrice: toNumber(entry.item.originalPrice),
              isActive: entry.item.isActive,
            })),
          }
        : null,
    };
  });

  return (
    <CampaignShell>
      <SectionHeading
        kicker="Admin"
        title="Painel de clientes"
        description="Acompanhe participantes, consulte os últimos looks girados e finalize vendas para retirar peças do catálogo ativo."
      />

      <AdminHeader pathname="/admin/clientes" username={session.username} />
      <CustomersTableCard initialCustomers={customers} />
    </CampaignShell>
  );
}
