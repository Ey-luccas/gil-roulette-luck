import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SACOLA_FINAL_PRICE, calculatePricingSummary, formatBRL, formatPercent } from "@/lib/pricing";

const previewPrices = [89.9, 109.9, 129.9];

export function ResultBreakdown() {
  const summary = calculatePricingSummary(previewPrices, SACOLA_FINAL_PRICE);

  return (
    <Card className="campaign-panel">
      <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
        <CardTitle className="text-2xl font-black">Resumo promocional</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6">
        <div>
          <p className="text-sm text-muted-foreground">Total original</p>
          <p className="text-xl font-bold">{formatBRL(summary.originalTotal)}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Valor final da campanha</p>
          <p className="text-xl font-bold text-primary">{formatBRL(summary.finalPrice)}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Economia em reais</p>
          <p className="text-lg font-semibold text-primary">{formatBRL(summary.savings)}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Economia em porcentagem</p>
          <p className="text-lg font-semibold text-primary">
            {formatPercent(summary.savingsPercent)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
