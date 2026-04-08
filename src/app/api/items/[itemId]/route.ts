import { unlink } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

function toNumber(value: { toString(): string }) {
  return Number(value.toString());
}

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

type ItemRouteContext = {
  params: Promise<{
    itemId: string;
  }>;
};

export async function PATCH(request: Request, context: ItemRouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const { itemId } = await context.params;
  const rawBody = await request.json().catch(() => null);
  const parsedBody = updateStatusSchema.safeParse(rawBody);

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

  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: { isActive: parsedBody.data.isActive },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      originalPrice: true,
      isActive: true,
      createdAt: true,
    },
  }).catch(() => null);

  if (!updatedItem) {
    return NextResponse.json(
      {
        ok: false,
        code: "ITEM_NOT_FOUND",
        error: "Peça não encontrada.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      ...updatedItem,
      originalPrice: toNumber(updatedItem.originalPrice),
    },
  });
}

export async function DELETE(_request: Request, context: ItemRouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const { itemId } = await context.params;
  const existingItem = await prisma.item.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      imageUrl: true,
    },
  });

  if (!existingItem) {
    return NextResponse.json(
      {
        ok: false,
        code: "ITEM_NOT_FOUND",
        error: "Peça não encontrada.",
      },
      { status: 404 }
    );
  }

  try {
    await prisma.item.delete({
      where: { id: itemId },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        {
          ok: false,
          code: "ITEM_IN_USE",
          error: "Não é possível excluir uma peça já vinculada a giros.",
        },
        { status: 409 }
      );
    }

    throw error;
  }

  if (existingItem.imageUrl.startsWith("/uploads/items/")) {
    const localImagePath = path.join(process.cwd(), "public", existingItem.imageUrl.replace(/^\//, ""));
    await unlink(localImagePath).catch(() => {
      // Ignore cleanup errors to avoid blocking the API response.
    });
  }

  return NextResponse.json({
    ok: true,
    data: {
      deleted: true,
      itemId,
    },
  });
}
