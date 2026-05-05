import { AdminHeader } from "@/components/admin/admin-header";
import { CustomersTableCard } from "@/components/admin/customers-table-card";
import { CampaignShell } from "@/components/shared/campaign-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  MAX_SPIN_ATTEMPTS_PER_CPF,
  getRemainingSpinAttempts,
} from "@/lib/campaign-rules";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminCustomerRow } from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function AdminClientesPage() {
  const session = await requireAdminSession();

  const participants = await prisma.campaignParticipant.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      phone: true,
      cpf: true,
      spinAttempts: true,
      whatsappClickedAt: true,
      createdAt: true,
      updatedAt: true,
      spins: {
        orderBy: [{ attemptNumber: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          attemptNumber: true,
          prizeId: true,
          prizeName: true,
          prizeNote: true,
          createdAt: true,
        },
      },
    },
  });

  const customers: AdminCustomerRow[] = participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    phone: participant.phone,
    cpf: participant.cpf,
    spinAttempts: participant.spinAttempts,
    remainingAttempts: getRemainingSpinAttempts(participant.spinAttempts),
    maxAttempts: MAX_SPIN_ATTEMPTS_PER_CPF,
    whatsappClickedAt: participant.whatsappClickedAt
      ? participant.whatsappClickedAt.toISOString()
      : null,
    createdAt: participant.createdAt.toISOString(),
    updatedAt: participant.updatedAt.toISOString(),
    spins: participant.spins.map((spin) => ({
      id: spin.id,
      attemptNumber: spin.attemptNumber,
      prizeId: spin.prizeId,
      prizeName: spin.prizeName,
      prizeNote: spin.prizeNote,
      createdAt: spin.createdAt.toISOString(),
    })),
  }));

  return (
    <CampaignShell>
      <SectionHeading
        kicker="Admin"
        title="Painel de participantes"
        description="Consulte quem participou da campanha Presentes do 5.5 e veja o prêmio de cada giro por CPF."
      />

      <AdminHeader pathname="/admin/clientes" username={session.username} />
      <CustomersTableCard initialCustomers={customers} />
    </CampaignShell>
  );
}
