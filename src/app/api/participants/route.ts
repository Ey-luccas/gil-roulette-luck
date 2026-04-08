import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { MAX_SPIN_ATTEMPTS_PER_CPF, getRemainingSpinAttempts } from "@/lib/campaign-rules";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { normalizeAndValidateCpf } from "@/lib/participant-rules";
import { prisma } from "@/lib/prisma";

const participantInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo.")
    .max(120, "Nome muito longo."),
  phone: z.string().min(1, "Informe seu telefone."),
  cpf: z.string().min(1, "Informe seu CPF."),
});

type ParticipantPayload = z.infer<typeof participantInputSchema>;

async function upsertParticipant(payload: ParticipantPayload) {
  const normalizedPhone = normalizePhone(payload.phone);
  const cpfValidation = normalizeAndValidateCpf(payload.cpf);

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

  const { normalizedCpf, cpfHash } = cpfValidation;

  if (!isValidPhone(normalizedPhone)) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_PHONE",
        error: "Telefone inválido.",
      },
      { status: 400 }
    );
  }

  const existingParticipant = await prisma.participant.findUnique({
    where: { cpfHash },
    select: { id: true, spinAttempts: true },
  });

  if (
    existingParticipant &&
    existingParticipant.spinAttempts >= MAX_SPIN_ATTEMPTS_PER_CPF
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: "CPF_ALREADY_SPUN",
        error: `Este CPF já utilizou as ${MAX_SPIN_ATTEMPTS_PER_CPF} chances da promoção.`,
      },
      { status: 409 }
    );
  }

  if (existingParticipant) {
    const updatedParticipant = await prisma.participant.update({
      where: { id: existingParticipant.id },
      data: {
        name: payload.name,
        phone: normalizedPhone,
        cpf: normalizedCpf,
      },
      select: { id: true, spinAttempts: true },
    });

    return NextResponse.json({
      ok: true,
      data: {
        participantId: updatedParticipant.id,
        status: "ready_to_spin",
        attemptsUsed: updatedParticipant.spinAttempts,
        remainingAttempts: getRemainingSpinAttempts(updatedParticipant.spinAttempts),
        maxAttempts: MAX_SPIN_ATTEMPTS_PER_CPF,
      },
    });
  }

  try {
    const createdParticipant = await prisma.participant.create({
      data: {
        name: payload.name,
        phone: normalizedPhone,
        cpf: normalizedCpf,
        cpfHash,
        spinAttempts: 0,
      },
      select: { id: true, spinAttempts: true },
    });

    return NextResponse.json({
      ok: true,
      data: {
        participantId: createdParticipant.id,
        status: "ready_to_spin",
        attemptsUsed: createdParticipant.spinAttempts,
        remainingAttempts: getRemainingSpinAttempts(createdParticipant.spinAttempts),
        maxAttempts: MAX_SPIN_ATTEMPTS_PER_CPF,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const duplicatedParticipant = await prisma.participant.findUnique({
        where: { cpfHash },
        select: { id: true, spinAttempts: true },
      });

      if (
        duplicatedParticipant &&
        duplicatedParticipant.spinAttempts >= MAX_SPIN_ATTEMPTS_PER_CPF
      ) {
        return NextResponse.json(
          {
            ok: false,
            code: "CPF_ALREADY_SPUN",
            error: `Este CPF já utilizou as ${MAX_SPIN_ATTEMPTS_PER_CPF} chances da promoção.`,
          },
          { status: 409 }
        );
      }

      if (duplicatedParticipant) {
        return NextResponse.json({
          ok: true,
          data: {
            participantId: duplicatedParticipant.id,
            status: "ready_to_spin",
            attemptsUsed: duplicatedParticipant.spinAttempts,
            remainingAttempts: getRemainingSpinAttempts(duplicatedParticipant.spinAttempts),
            maxAttempts: MAX_SPIN_ATTEMPTS_PER_CPF,
          },
        });
      }
    }

    throw error;
  }
}

export async function GET() {
  const totalParticipants = await prisma.participant.count();

  return NextResponse.json({
    ok: true,
    data: {
      totalParticipants,
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

  return upsertParticipant(parsedInput.data);
}
