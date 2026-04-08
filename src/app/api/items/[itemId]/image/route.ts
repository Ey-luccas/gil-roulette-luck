import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type ItemImageRouteContext = {
  params: Promise<{
    itemId: string;
  }>;
};

export async function GET(request: Request, context: ItemImageRouteContext) {
  const { itemId } = await context.params;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: {
      imageUrl: true,
      imageData: true,
      imageMimeType: true,
    },
  });

  if (!item) {
    return NextResponse.json(
      {
        ok: false,
        code: "ITEM_NOT_FOUND",
        error: "Imagem da peça não encontrada.",
      },
      { status: 404 }
    );
  }

  if (item.imageData && item.imageMimeType) {
    const bytes = new Uint8Array(item.imageData.byteLength);
    bytes.set(item.imageData);

    return new NextResponse(bytes.buffer, {
      headers: {
        "Content-Type": item.imageMimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const selfImagePath = `/api/items/${itemId}/image`;
  if (item.imageUrl && item.imageUrl !== selfImagePath) {
    return NextResponse.redirect(new URL(item.imageUrl, request.url));
  }

  return NextResponse.json(
    {
      ok: false,
      code: "IMAGE_NOT_AVAILABLE",
      error: "Imagem não disponível para esta peça.",
    },
    { status: 404 }
  );
}
