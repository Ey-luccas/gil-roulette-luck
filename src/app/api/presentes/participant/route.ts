import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { MAX_SPIN_ATTEMPTS_PER_CPF, getRemainingSpinAttempts } from "@/lib/campaign-rules";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { normalizeAndValidateCpf } from "@/lib/participant-rules";
import { ensureCampaignPrizes } from "@/lib/presentes-campaign-server";
import { prisma } from "@/lib/prisma";

const participantInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo.")
    .max(120, "Nome muito longo."),
  phone: z.string().min(1, "Informe seu WhatsApp."),
  cpf: z.string().min(1, "Informe seu CPF."),
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCpf = searchParams.get("cpf") ?? "";

  if (!rawCpf.trim()) {
    return NextResponse.json(
      {
        ok: false,
        code: "MISSING_CPF",
        error: "Informe o CPF para consultar participação.",
      },
      { status: 400 }
    );
  }

  const cpfValidation = normalizeAndValidateCpf(rawCpf);
  if (!cpfValidation) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_CPF",
        error: "CPF inválido.",
      },
      { status: 400 }
    );
  }

  const { cpfHash } = cpfValidation;

  const [participant, prizesStock] = await Promise.all([
    prisma.campaignParticipant.findUnique({
      where: { cpfHash },
      select: {
        id: true,
        name: true,
        phone: true,
        cpf: true,
        spinAttempts: true,
        whatsappClickedAt: true,
      },
    }),
    ensureCampaignPrizes(prisma),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      participant: participant ? serializeParticipant(participant) : null,
      prizesStock,
    },
  });
}

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);
  const parsedInput = participantInputSchema.safeParse(rawBody);

  if (!parsedInput.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        error: parsedInput.error.issues[0]?.message ?? "Dados inválidos.",
      },
      { status: 400 }
    );
  }

  const normalizedPhone = normalizePhone(parsedInput.data.phone);
  if (!isValidPhone(normalizedPhone)) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_PHONE",
        error: "WhatsApp inválido.",
      },
      { status: 400 }
    );
  }

  const cpfValidation = normalizeAndValidateCpf(parsedInput.data.cpf);
  if (!cpfValidation) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_CPF",
        error: "CPF inválido.",
      },
      { status: 400 }
    );
  }

  const normalizedName = parsedInput.data.name.trim();
  const { normalizedCpf, cpfHash } = cpfValidation;

  try {
    const [participant, prizesStock] = await prisma.$transaction(async (transaction) => {
      await ensureCampaignPrizes(transaction);

      const existing = await transaction.campaignParticipant.findUnique({
        where: { cpfHash },
        select: { id: true },
      });

      const participantRecord = existing
        ? await transaction.campaignParticipant.update({
            where: { id: existing.id },
            data: {
              name: normalizedName,
              phone: normalizedPhone,
              cpf: normalizedCpf,
            },
            select: {
              id: true,
              name: true,
              phone: true,
              cpf: true,
              spinAttempts: true,
              whatsappClickedAt: true,
            },
          })
        : await transaction.campaignParticipant.create({
            data: {
              name: normalizedName,
              phone: normalizedPhone,
              cpf: normalizedCpf,
              cpfHash,
            },
            select: {
              id: true,
              name: true,
              phone: true,
              cpf: true,
              spinAttempts: true,
              whatsappClickedAt: true,
            },
          });

      const stock = await ensureCampaignPrizes(transaction);

      return [participantRecord, stock] as const;
    });

    return NextResponse.json({
      ok: true,
      data: {
        participant: serializeParticipant(participant),
        prizesStock,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const participant = await prisma.campaignParticipant.findUnique({
        where: { cpfHash },
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
        throw error;
      }

      const prizesStock = await ensureCampaignPrizes(prisma);

      return NextResponse.json({
        ok: true,
        data: {
          participant: serializeParticipant(participant),
          prizesStock,
        },
      });
    }

    throw error;
  }
}
