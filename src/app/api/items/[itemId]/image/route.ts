import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type ItemImageRouteContext = {
  params: Promise<{
    itemId: string;
  }>;
};

export async function GET(request: Request, context: ItemImageRouteContext) {
  const { itemId } = await context.params;

  let item:
    | {
        imageUrl: string;
        imageData: Uint8Array<ArrayBufferLike> | null;
        imageMimeType: string | null;
      }
    | null = null;

  try {
    item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        imageUrl: true,
        imageData: true,
        imageMimeType: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
      const legacyItem = await prisma.item.findUnique({
        where: { id: itemId },
        select: {
          imageUrl: true,
        },
      });

      item = legacyItem
        ? {
            imageUrl: legacyItem.imageUrl,
            imageData: null,
            imageMimeType: null,
          }
        : null;
    } else {
      throw error;
    }
  }

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

  if (item.imageUrl?.startsWith("/uploads/")) {
    const localImagePath = path.join(process.cwd(), "public", item.imageUrl.replace(/^\//, ""));
    const extension = path.extname(localImagePath).toLowerCase();
    const mimeTypeByExtension: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".avif": "image/avif",
      ".svg": "image/svg+xml",
    };

    try {
      const fileBuffer = await readFile(localImagePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": mimeTypeByExtension[extension] ?? "application/octet-stream",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // Falls through to placeholder response below.
    }
  }

  const selfImagePath = `/api/items/${itemId}/image`;
  if (item.imageUrl && item.imageUrl !== selfImagePath) {
    return NextResponse.redirect(new URL(item.imageUrl, request.url));
  }

  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 800"><rect width="640" height="800" fill="#f2f2f2"/><g fill="#666" font-family="Arial, sans-serif" text-anchor="middle"><text x="320" y="390" font-size="30" font-weight="700">Imagem indisponível</text><text x="320" y="430" font-size="20">Atualize a foto desta peça</text></g></svg>`;

  return new NextResponse(placeholderSvg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
