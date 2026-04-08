import Image from "next/image";
import { redirect } from "next/navigation";

import { CampaignShell } from "@/components/shared/campaign-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildWhatsAppUrl } from "@/lib/contact";
import { formatCpf } from "@/lib/cpf";
import { formatPhone } from "@/lib/phone";
import { SACOLA_ITEM_COUNT, formatBRL, formatPercent } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ResultadoPageProps = {
  searchParams: Promise<{
    spinResultId?: string;
    participantId?: string;
  }>;
};

function decimalToNumber(value: { toString(): string }) {
  return Number(value.toString());
}

async function getSpinResult({
  spinResultId,
  participantId,
}: {
  spinResultId?: string;
  participantId?: string;
}) {
  if (spinResultId) {
    const resultById = await prisma.spinResult.findUnique({
      where: { id: spinResultId },
      include: {
        participant: {
          select: { id: true, name: true, phone: true, cpf: true, spinAttempts: true },
        },
        items: {
          orderBy: { id: "asc" },
          include: {
            item: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                originalPrice: true,
              },
            },
          },
        },
      },
    });

    if (resultById) return resultById;
  }

  if (participantId) {
    const resultByParticipant = await prisma.spinResult.findFirst({
      where: { participantId },
      orderBy: [{ attemptNumber: "desc" }, { createdAt: "desc" }],
      include: {
        participant: {
          select: { id: true, name: true, phone: true, cpf: true, spinAttempts: true },
        },
        items: {
          orderBy: { id: "asc" },
          include: {
            item: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                originalPrice: true,
              },
            },
          },
        },
      },
    });

    if (resultByParticipant) return resultByParticipant;
  }

  return null;
}

export default async function ResultadoPage({ searchParams }: ResultadoPageProps) {
  const { spinResultId, participantId } = await searchParams;

  if (!spinResultId && !participantId) {
    redirect("/participar");
  }

  const spinResult = await getSpinResult({ spinResultId, participantId });

  if (!spinResult) {
    if (participantId) {
      const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        select: { spinAttempts: true },
      });

      if (participant && participant.spinAttempts === 0) {
        redirect(`/giro?participantId=${encodeURIComponent(participantId)}`);
      }
    }

    redirect("/participar");
  }

  const selectedItems = spinResult.items.map((entry) => entry.item);
  if (selectedItems.length !== SACOLA_ITEM_COUNT) {
    redirect("/participar");
  }

  const originalTotal = decimalToNumber(spinResult.originalTotal);
  const finalPrice = decimalToNumber(spinResult.finalPrice);
  const discountAmount = decimalToNumber(spinResult.discountAmount);
  const discountPercent = decimalToNumber(spinResult.discountPercent);
  const selectedNames = selectedItems.map((item) => item.name).slice(0, SACOLA_ITEM_COUNT);
  const formattedCpf = formatCpf(spinResult.participant.cpf);
  const formattedPhone = formatPhone(spinResult.participant.phone);

  const whatsappText =
    [
      "Olá, GC Conceito! Quero adquirir minha Sacola Fitness promocional.",
      `Nome: ${spinResult.participant.name}`,
      `CPF: ${formattedCpf}`,
      `Telefone: ${formattedPhone}`,
      "Peças selecionadas:",
      ...selectedNames.map((name, index) => `${index + 1}. ${name}`),
      `Valor promocional: ${formatBRL(finalPrice)}`,
      `Total original: ${formatBRL(originalTotal)}`,
      `Economia: ${formatBRL(discountAmount)} (${formatPercent(discountPercent)})`,
    ].join("\n");
  const whatsappUrl = buildWhatsAppUrl(whatsappText);

  return (
    <CampaignShell>
      <SectionHeading
        kicker="Oferta exclusiva revelada"
        title="Sua Sacola Fitness está pronta"
        description={`Parabéns! Estas são as ${SACOLA_ITEM_COUNT} peças selecionadas na sua vitrine promocional.`}
      />

      <section className="space-y-6">
        <div className="campaign-panel p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-accent/35 blur-3xl" />

          <div className="relative space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">Sacola Fitness</Badge>
              <Badge variant="secondary">Seleção confirmada</Badge>
            </div>
            <h2 className="max-w-3xl text-balance text-3xl font-black tracking-tight sm:text-4xl">
              Uma combinação premium pensada para você economizar com estilo.
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              {spinResult.participant.name}, esta é a sua oferta exclusiva desta campanha.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {selectedItems.map((item) => (
            <Card key={item.id} className="campaign-card">
              <div className="relative aspect-[4/5] bg-muted/50">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              <CardContent className="space-y-2 p-4 sm:p-5">
                <p className="text-base font-bold leading-tight">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Valor original: {formatBRL(decimalToNumber(item.originalPrice))}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="campaign-panel">
          <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="text-2xl font-black">Resumo da sua oferta</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="campaign-highlight grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Total original
                </p>
                <p className="text-lg font-bold">{formatBRL(originalTotal)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Valor promocional
                </p>
                <p className="text-2xl font-black text-primary">{formatBRL(finalPrice)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Economizado
                </p>
                <p className="text-xl font-black text-primary">{formatBRL(discountAmount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Desconto
                </p>
                <p className="text-xl font-black text-primary">{formatPercent(discountPercent)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="campaign-cta w-full text-base"
              >
                Adquirir agora
              </a>

              <p className="text-center text-sm text-muted-foreground">
                Ao clicar, vamos abrir o WhatsApp com sua mensagem pronta para atendimento.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </CampaignShell>
  );
}
