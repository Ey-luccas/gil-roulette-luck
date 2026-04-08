import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  await prisma.spinResultItem.deleteMany();
  await prisma.spinResult.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.item.deleteMany();

  await prisma.item.createMany({
    data: [
      {
        name: "Top Energy",
        imageUrl: "/seed/top-energy-pulse.svg",
        originalPrice: "89.90",
        isActive: true,
      },
      {
        name: "Legging Urban",
        imageUrl: "/seed/legging-urban-move.svg",
        originalPrice: "129.90",
        isActive: true,
      },
      {
        name: "Jaqueta Light",
        imageUrl: "/seed/jaqueta-light-run.svg",
        originalPrice: "159.90",
        isActive: true,
      },
      {
        name: "Short Sculpt",
        imageUrl: "/seed/short-sculpt-fit.svg",
        originalPrice: "75.90",
        isActive: true,
      },
    ],
  });

  const defaultPasswordHash = createHash("sha256")
    .update("admin123")
    .digest("hex");

  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {
      passwordHash: defaultPasswordHash,
    },
    create: {
      username: "admin",
      passwordHash: defaultPasswordHash,
    },
  });

  console.log("Seed concluido: itens de exemplo e admin inicial criados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
