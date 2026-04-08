import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  MAX_SPIN_ATTEMPTS_PER_CPF,
  getRemainingSpinAttempts,
  hasAvailableSpinAttempts,
} from "@/lib/campaign-rules";
import { SACOLA_ITEM_COUNT } from "@/lib/pricing";
import { calculatePricingSummaryDecimal, decimalToNumber } from "@/lib/pricing-server";
import { prisma } from "@/lib/prisma";
import { getUniqueItemIds, hasValidFinalSelection } from "@/lib/spin-selection";

const createSpinSchema = z.object({
  participantId: z.string().min(1, "Participante inválido."),
  itemIds: z
    .array(z.string().min(1))
    .length(SACOLA_ITEM_COUNT, `Envie exatamente ${SACOLA_ITEM_COUNT} peças.`),
});

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

  const { participantId, itemIds } = parsedBody.data;
  const uniqueItemIds = getUniqueItemIds(itemIds);

  if (!hasValidFinalSelection(uniqueItemIds)) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_ITEMS",
        error: `A seleção final deve conter ${SACOLA_ITEM_COUNT} peças diferentes.`,
      },
      { status: 400 }
    );
  }

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      spinAttempts: true,
      spinResults: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
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

  if (!hasAvailableSpinAttempts(participant.spinAttempts)) {
    return NextResponse.json(
      {
        ok: false,
        code: "ALREADY_SPUN",
        error: `Este CPF já utilizou as ${MAX_SPIN_ATTEMPTS_PER_CPF} chances da promoção.`,
        data: {
          spinResultId: participant.spinResults[0]?.id ?? null,
          attemptsUsed: participant.spinAttempts,
          remainingAttempts: getRemainingSpinAttempts(participant.spinAttempts),
          maxAttempts: MAX_SPIN_ATTEMPTS_PER_CPF,
        },
      },
      { status: 409 }
    );
  }

  const selectedItems = await prisma.item.findMany({
    where: {
      id: { in: uniqueItemIds },
      isActive: true,
    },
    select: {
      id: true,
      originalPrice: true,
    },
  });

  if (selectedItems.length !== SACOLA_ITEM_COUNT) {
    return NextResponse.json(
      {
        ok: false,
        code: "ITEMS_NOT_AVAILABLE",
        error: "Não foi possível validar as peças selecionadas.",
      },
      { status: 400 }
    );
  }

  const pricingSummary = calculatePricingSummaryDecimal(
    selectedItems.map((item) => item.originalPrice)
  );

  const nextAttempt = participant.spinAttempts + 1;

  let createdSpin:
    | {
        id: string;
        finalPrice: Prisma.Decimal;
        originalTotal: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        discountPercent: Prisma.Decimal;
      }
    | undefined;

  try {
    createdSpin = await prisma.$transaction(async (transaction) => {
      const updatedParticipant = await transaction.participant.updateMany({
        where: {
          id: participantId,
          spinAttempts: participant.spinAttempts,
        },
        data: {
          spinAttempts: {
            increment: 1,
          },
        },
      });

      if (updatedParticipant.count !== 1) {
        throw new Error("SPIN_ATTEMPT_CONFLICT");
      }

      const spinResult = await transaction.spinResult.create({
        data: {
          participantId,
          attemptNumber: nextAttempt,
          finalPrice: pricingSummary.finalPrice,
          originalTotal: pricingSummary.originalTotal,
          discountAmount: pricingSummary.discountAmount,
          discountPercent: pricingSummary.discountPercent,
          items: {
            create: uniqueItemIds.map((itemId) => ({
              itemId,
            })),
          },
        },
        select: {
          id: true,
          finalPrice: true,
          originalTotal: true,
          discountAmount: true,
          discountPercent: true,
        },
      });

      return spinResult;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const [existingSpin, refreshedParticipant] = await Promise.all([
        prisma.spinResult.findFirst({
          where: { participantId },
          orderBy: [{ attemptNumber: "desc" }, { createdAt: "desc" }],
          select: { id: true },
        }),
        prisma.participant.findUnique({
          where: { id: participantId },
          select: { spinAttempts: true },
        }),
      ]);

      const attemptsUsed = refreshedParticipant?.spinAttempts ?? participant.spinAttempts;

      return NextResponse.json(
        {
          ok: false,
          code: "ALREADY_SPUN",
          error:
            attemptsUsed >= MAX_SPIN_ATTEMPTS_PER_CPF
              ? `Este CPF já utilizou as ${MAX_SPIN_ATTEMPTS_PER_CPF} chances da promoção.`
              : "Sua tentativa já foi registrada. Confira seu resultado.",
          data: {
            spinResultId: existingSpin?.id ?? null,
            attemptsUsed,
            remainingAttempts: getRemainingSpinAttempts(attemptsUsed),
            maxAttempts: MAX_SPIN_ATTEMPTS_PER_CPF,
          },
        },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "SPIN_ATTEMPT_CONFLICT") {
      const [latestSpin, refreshedParticipant] = await Promise.all([
        prisma.spinResult.findFirst({
          where: { participantId },
          orderBy: [{ attemptNumber: "desc" }, { createdAt: "desc" }],
          select: { id: true },
        }),
        prisma.participant.findUnique({
          where: { id: participantId },
          select: { spinAttempts: true },
        }),
      ]);

      const attemptsUsed = refreshedParticipant?.spinAttempts ?? participant.spinAttempts;

      return NextResponse.json(
        {
          ok: false,
          code: "SPIN_CONFLICT",
          error: "Seu giro foi processado em outra tentativa. Atualize para continuar.",
          data: {
            spinResultId: latestSpin?.id ?? null,
            attemptsUsed,
            remainingAttempts: getRemainingSpinAttempts(attemptsUsed),
            maxAttempts: MAX_SPIN_ATTEMPTS_PER_CPF,
          },
        },
        { status: 409 }
      );
    }

    throw error;
  }

  if (!createdSpin) {
    return NextResponse.json(
      {
        ok: false,
        code: "SPIN_NOT_CREATED",
        error: "Não foi possível registrar o resultado da promoção.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      spinResultId: createdSpin.id,
      participantId,
      attemptNumber: nextAttempt,
      attemptsUsed: nextAttempt,
      remainingAttempts: getRemainingSpinAttempts(nextAttempt),
      maxAttempts: MAX_SPIN_ATTEMPTS_PER_CPF,
      finalPrice: decimalToNumber(createdSpin.finalPrice),
      originalTotal: decimalToNumber(createdSpin.originalTotal),
      discountAmount: decimalToNumber(createdSpin.discountAmount),
      discountPercent: decimalToNumber(createdSpin.discountPercent),
      itemIds: uniqueItemIds,
    },
  });
}
