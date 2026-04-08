import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ParticipationFormCard() {
  return (
    <Card className="border-primary/20 bg-card/90 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-black">Participar da campanha</CardTitle>
        <CardDescription>
          Estrutura preparada para validação de nome, telefone e CPF com até 3 giros por
          documento.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" placeholder="Ex: Camila Nogueira" disabled />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" placeholder="(85) 99999-9999" disabled />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" placeholder="000.000.000-00" disabled />
          </div>

          <p className="rounded-md border border-accent/60 bg-accent/40 px-3 py-2 text-xs text-foreground sm:col-span-2">
            Base inicial: conecte este formulário à action/API de participantes.
          </p>

          <Button disabled className="h-11 sm:col-span-2">
            Iniciar giro
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
