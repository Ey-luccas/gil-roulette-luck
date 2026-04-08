import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const createItemSchema = z.object({
  name: z.string().trim().min(2, "Nome inválido."),
  imageUrl: z.string().trim().optional().default(""),
  originalPrice: z.number().positive("Preço inválido."),
  isActive: z.boolean().optional(),
});

function toNumber(value: { toString(): string }) {
  return Number(value.toString());
}

function parsePriceValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function parseBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true" || value === "1" || value.toLowerCase() === "on") return true;
    if (value === "false" || value === "0" || value.toLowerCase() === "off") return false;
  }
  return fallback;
}

type UploadedImagePayload = {
  data: Buffer;
  mimeType: string;
};

async function readUploadedImage(file: File): Promise<UploadedImagePayload> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Arquivo de imagem inválido.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Imagem muito grande. Limite de 5MB.");
  }

  if (!ACCEPTED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Formato inválido. Use JPG, PNG, WEBP ou AVIF.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return {
    data: buffer,
    mimeType: file.type,
  };
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const onlyActive = searchParams.get("active") === "1";

  if (!onlyActive) {
    const session = await getAdminSession();
    if (!session) {
      return unauthorizedResponse();
    }
  }

  const items = await prisma.item.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      originalPrice: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      items: items.map((item) => ({
        ...item,
        imageUrl: `/api/items/${encodeURIComponent(item.id)}/image`,
        originalPrice: toNumber(item.originalPrice),
      })),
    },
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const contentType = request.headers.get("content-type") ?? "";

  let payload:
    | {
        name: string;
        imageUrl: string;
        originalPrice: number;
        isActive?: boolean;
      }
    | null = null;
  let uploadedImage: UploadedImagePayload | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const originalPrice = parsePriceValue(formData.get("originalPrice"));
    const isActive = parseBoolean(formData.get("isActive"), true);
    const imageField = formData.get("image");
    const imageUrlField = String(formData.get("imageUrl") ?? "").trim();

    const imageUrl = imageUrlField;

    if (imageField instanceof File && imageField.size > 0) {
      try {
        uploadedImage = await readUploadedImage(imageField);
      } catch (error) {
        return NextResponse.json(
          {
            ok: false,
            code: "INVALID_IMAGE",
            error: error instanceof Error ? error.message : "Falha ao processar imagem.",
          },
          { status: 400 }
        );
      }
    }

    payload = {
      name,
      imageUrl,
      originalPrice: originalPrice ?? Number.NaN,
      isActive,
    };
  } else {
    const rawBody = await request.json().catch(() => null);
    const originalPrice = parsePriceValue(rawBody?.originalPrice);
    payload = {
      name: String(rawBody?.name ?? "").trim(),
      imageUrl: String(rawBody?.imageUrl ?? "").trim(),
      originalPrice: originalPrice ?? Number.NaN,
      isActive: parseBoolean(rawBody?.isActive, true),
    };
  }

  const parsedBody = createItemSchema.safeParse(payload);

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

  if (!uploadedImage && !parsedBody.data.imageUrl) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        error: "Envie uma imagem da peça ou uma URL válida.",
      },
      { status: 400 }
    );
  }

  const itemId = randomUUID();
  const imageUrl = uploadedImage
    ? `/api/items/${encodeURIComponent(itemId)}/image`
    : parsedBody.data.imageUrl;

  const createdItem = await prisma.item.create({
    data: {
      id: itemId,
      name: parsedBody.data.name,
      imageUrl,
      imageData: uploadedImage?.data,
      imageMimeType: uploadedImage?.mimeType,
      originalPrice: parsedBody.data.originalPrice,
      isActive: parsedBody.data.isActive ?? true,
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      originalPrice: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        ...createdItem,
        originalPrice: toNumber(createdItem.originalPrice),
      },
    },
    { status: 201 }
  );
}
