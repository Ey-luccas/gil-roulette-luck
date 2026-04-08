import { Prisma } from "@prisma/client";
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

function toNumber(value: { toString(): string }) {
  return Number(value.toString());
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const cpfDigits = query.replace(/\D/g, "");

  const where: Prisma.ParticipantWhereInput | undefined = query
    ? {
        OR: [
          { name: { contains: query } },
          ...(cpfDigits
            ? [
                {
                  cpf: {
                    contains: cpfDigits,
                  },
                },
              ]
            : []),
        ],
      }
    : undefined;

  const participants = await prisma.participant.findMany({
    where,
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

  return NextResponse.json({
    ok: true,
    data: {
      customers: participants.map((participant) => {
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
                  imageUrl: `/api/items/${encodeURIComponent(entry.item.id)}/image`,
                  originalPrice: toNumber(entry.item.originalPrice),
                  isActive: entry.item.isActive,
                })),
              }
            : null,
        };
      }),
    },
  });
}
