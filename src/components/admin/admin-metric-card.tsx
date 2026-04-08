import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminMetricCardProps = {
  label: string;
  value: number;
  description: string;
};

function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function AdminMetricCard({ label, value, description }: AdminMetricCardProps) {
  return (
    <Card className="campaign-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-3xl font-black leading-none text-foreground">{formatInteger(value)}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
