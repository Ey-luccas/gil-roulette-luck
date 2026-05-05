import { NextResponse } from "next/server";
import { z } from "zod";

import {
  MAX_SPIN_ATTEMPTS_PER_CPF,
  getRemainingSpinAttempts,
  hasAvailableSpinAttempts,
} from "@/lib/campaign-rules";
import {
  drawCampaignPrizeWithStockControl,
  ensureCampaignPrizes,
} from "@/lib/presentes-campaign-server";
import { prisma } from "@/lib/prisma";

const createSpinSchema = z.object({
  participantId: z.string().min(1, "Participante inválido."),
});

type SerializedParticipant = {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  attemptsUsed: number;
  remainingAttempts: number;
  maxAttempts: number;
  whatsappClickedAt: string | null;
};

class ApiError extends Error {
  status: number;
  code: string;
  data?: Record<string, unknown>;

  constructor({
    status,
    code,
    message,
    data,
  }: {
    status: number;
    code: string;
    message: string;
    data?: Record<string, unknown>;
  }) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function serializeParticipant(participant: {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  spinAttempts: number;
  whatsappClickedAt: Date | null;
}): SerializedParticipant {
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

async function loadParticipantById(participantId: string) {
  return prisma.campaignParticipant.findUnique({
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
}

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);
  const parsedBody = createSpinSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        error: parsedBody.error.issues[0]?.message ?? "Dados inválidos para o giro.",
      },
      { status: 400 }
    );
  }

  const { participantId } = parsedBody.data;

  try {
    const result = await prisma.$transaction(async (transaction) => {
      await ensureCampaignPrizes(transaction);

      const participant = await transaction.campaignParticipant.findUnique({
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

      if (!participant) {
        throw new ApiError({
          status: 404,
          code: "PARTICIPANT_NOT_FOUND",
          message: "Participante não encontrado.",
        });
      }

      if (participant.whatsappClickedAt) {
        throw new ApiError({
          status: 409,
          code: "WHATSAPP_ALREADY_CLICKED",
          message: "Este CPF já iniciou resgate no WhatsApp e não pode realizar novos giros.",
          data: {
            participant: serializeParticipant(participant),
          },
        });
      }

      if (!hasAvailableSpinAttempts(participant.spinAttempts)) {
        throw new ApiError({
          status: 409,
          code: "MAX_ATTEMPTS_REACHED",
          message: `Este CPF já utilizou as ${MAX_SPIN_ATTEMPTS_PER_CPF} chances da campanha.`,
          data: {
            participant: serializeParticipant(participant),
          },
        });
      }

      const drawResult = await drawCampaignPrizeWithStockControl(transaction);

      if (!drawResult) {
        throw new ApiError({
          status: 409,
          code: "NO_AVAILABLE_PRIZES",
          message: "Não há prêmios disponíveis no momento.",
          data: {
            participant: serializeParticipant(participant),
          },
        });
      }

      const nextAttempt = participant.spinAttempts + 1;

      const updatedParticipantState = await transaction.campaignParticipant.updateMany({
        where: {
          id: participant.id,
          spinAttempts: participant.spinAttempts,
          whatsappClickedAt: null,
        },
        data: {
          spinAttempts: {
            increment: 1,
          },
        },
      });

      if (updatedParticipantState.count !== 1) {
        throw new ApiError({
          status: 409,
          code: "SPIN_CONFLICT",
          message: "Seu giro foi processado em outra tentativa. Atualize para continuar.",
        });
      }

      const createdSpin = await transaction.campaignSpin.create({
        data: {
          participantId: participant.id,
          prizeId: drawResult.selectedPrize.id,
          attemptNumber: nextAttempt,
          prizeName: drawResult.selectedPrize.name,
          prizeNote: drawResult.selectedPrize.note,
        },
        select: {
          id: true,
          prizeId: true,
          prizeName: true,
          prizeNote: true,
          attemptNumber: true,
          createdAt: true,
        },
      });

      const updatedParticipant = await transaction.campaignParticipant.findUnique({
        where: { id: participant.id },
        select: {
          id: true,
          name: true,
          phone: true,
          cpf: true,
          spinAttempts: true,
          whatsappClickedAt: true,
        },
      });

      if (!updatedParticipant) {
        throw new ApiError({
          status: 404,
          code: "PARTICIPANT_NOT_FOUND",
          message: "Participante não encontrado após o giro.",
        });
      }

      return {
        participant: serializeParticipant(updatedParticipant),
        spin: {
          id: createdSpin.id,
          prizeId: createdSpin.prizeId,
          prizeName: createdSpin.prizeName,
          prizeNote: createdSpin.prizeNote,
          attemptNumber: createdSpin.attemptNumber,
          createdAt: createdSpin.createdAt.toISOString(),
        },
        prizesStock: drawResult.updatedStock,
      };
    });

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      const fallbackParticipant = await loadParticipantById(participantId);
      const fallbackStock = await ensureCampaignPrizes(prisma);

      return NextResponse.json(
        {
          ok: false,
          code: error.code,
          error: error.message,
          data: {
            ...(error.data ?? {}),
            participant: error.data?.participant ??
              (fallbackParticipant ? serializeParticipant(fallbackParticipant) : null),
            prizesStock: fallbackStock,
          },
        },
        { status: error.status }
      );
    }

    throw error;
  }
}
