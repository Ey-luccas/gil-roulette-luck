import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function unauthorizedResponse() {
  return NextResponse.json(
    {
      ok: false,
      code: "UNAUTHORIZED",
      error: "Acesso administrativo necessário.",
    },
    { status: 401 }
  );
}

type CustomerSoldRouteContext = {
  params: Promise<{
    participantId: string;
  }>;
};

export async function PATCH(_request: Request, context: CustomerSoldRouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const { participantId } = await context.params;

  if (!participantId?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_PARTICIPANT",
        error: "Participante inválido.",
      },
      { status: 400 }
    );
  }

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      spinResults: {
        orderBy: [{ attemptNumber: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          id: true,
          isSold: true,
          soldAt: true,
          items: {
            select: {
              itemId: true,
            },
          },
        },
      },
    },
  });

  if (!participant) {
    return NextResponse.json(
      {
        ok: false,
        code: "PARTICIPANT_NOT_FOUND",
        error: "Cliente não encontrado.",
      },
      { status: 404 }
    );
  }

  const latestSpin = participant.spinResults[0];
  if (!latestSpin) {
    return NextResponse.json(
      {
        ok: false,
        code: "SPIN_NOT_FOUND",
        error: "Este cliente ainda não possui giro registrado.",
      },
      { status: 409 }
    );
  }

  const relatedItemIds = Array.from(new Set(latestSpin.items.map((item) => item.itemId)));

  if (latestSpin.isSold) {
    return NextResponse.json({
      ok: true,
      data: {
        participantId,
        spinResultId: latestSpin.id,
        alreadySold: true,
        soldAt: latestSpin.soldAt?.toISOString() ?? null,
        relatedItemIds,
        deactivatedItemsCount: 0,
      },
    });
  }

  const soldAt = new Date();

  const { deactivatedItemsCount } = await prisma.$transaction(async (transaction) => {
    await transaction.spinResult.update({
      where: { id: latestSpin.id },
      data: {
        isSold: true,
        soldAt,
      },
    });

    if (relatedItemIds.length === 0) {
      return { deactivatedItemsCount: 0 };
    }

    const deactivatedItems = await transaction.item.updateMany({
      where: {
        id: { in: relatedItemIds },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    return { deactivatedItemsCount: deactivatedItems.count };
  });

  return NextResponse.json({
    ok: true,
    data: {
      participantId,
      spinResultId: latestSpin.id,
      alreadySold: false,
      soldAt: soldAt.toISOString(),
      relatedItemIds,
      deactivatedItemsCount,
    },
  });
}
