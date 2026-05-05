import { NextResponse } from "next/server";
import { z } from "zod";

import { MAX_SPIN_ATTEMPTS_PER_CPF, getRemainingSpinAttempts } from "@/lib/campaign-rules";
import { ensureCampaignPrizes } from "@/lib/presentes-campaign-server";
import { prisma } from "@/lib/prisma";

const redeemSchema = z.object({
  participantId: z.string().min(1, "Participante inválido."),
});

function serializeParticipant(participant: {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  spinAttempts: number;
  whatsappClickedAt: Date | null;
}) {
  return {
    id: participant.id,
    name: participant.name,
    phone: participant.phone,
    cpf: participant.cpf,
    attemptsUsed: participant.spinAttempts,
    remainingAttempts: getRemainingSpinAttempts(participant.spinAttempts),
    maxAttempts: MAX_SPIN_ATTEMPTS_PER_CPF,
    whatsappClickedAt: participant.whatsappClickedAt
      ? participant.whatsappClickedAt.toISOString()
      : null,
  };
}

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);
  const parsedBody = redeemSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        error: parsedBody.error.issues[0]?.message ?? "Dados inválidos para resgate.",
      },
      { status: 400 }
    );
  }

  const { participantId } = parsedBody.data;

  const [updatedState, participant] = await prisma.$transaction(async (transaction) => {
    const updateResult = await transaction.campaignParticipant.updateMany({
      where: {
        id: participantId,
        whatsappClickedAt: null,
      },
      data: {
        whatsappClickedAt: new Date(),
      },
    });

    const participantRecord = await transaction.campaignParticipant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        name: true,
        phone: true,
        cpf: true,
        spinAttempts: true,
        whatsappClickedAt: true,
      },
    });

    return [updateResult, participantRecord] as const;
  });

  if (!participant) {
    return NextResponse.json(
      {
        ok: false,
        code: "PARTICIPANT_NOT_FOUND",
        error: "Participante não encontrado.",
      },
      { status: 404 }
    );
  }

  const prizesStock = await ensureCampaignPrizes(prisma);

  return NextResponse.json({
    ok: true,
    data: {
      alreadyRedeemed: updatedState.count === 0,
      participant: serializeParticipant(participant),
      prizesStock,
    },
  });
}
