import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { clearAdminSession, getAdminSession, setAdminSession, verifyAdminCredentials } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Informe o usuário."),
  password: z
    .string()
    .min(4, "Informe a senha."),
});

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        code: "UNAUTHORIZED",
        error: "Acesso não autorizado.",
      },
      { status: 401 }
    );
  }

  const [totalItems, activeItems, totalParticipants, totalSpins] = await prisma.$transaction([
    prisma.item.count(),
    prisma.item.count({ where: { isActive: true } }),
    prisma.participant.count(),
    prisma.spinResult.count(),
  ]);

  const soldSpins = await prisma.spinResult.count({ where: { isSold: true } }).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
      return 0;
    }

    throw error;
  });

  return NextResponse.json({
    ok: true,
    data: {
      session,
      stats: {
        totalItems,
        activeItems,
        totalParticipants,
        totalSpins,
        soldSpins,
      },
    },
  });
}

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);
  const parsedBody = loginSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        error: parsedBody.error.issues[0]?.message ?? "Dados inválidos.",
      },
      { status: 400 }
    );
  }

  const admin = await verifyAdminCredentials(parsedBody.data);

  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_CREDENTIALS",
        error: "Usuário ou senha inválidos.",
      },
      { status: 401 }
    );
  }

  await setAdminSession(admin);

  return NextResponse.json({
    ok: true,
    data: {
      username: admin.username,
    },
  });
}

export async function DELETE() {
  await clearAdminSession();

  return NextResponse.json({
    ok: true,
    data: {
      loggedOut: true,
    },
  });
}
