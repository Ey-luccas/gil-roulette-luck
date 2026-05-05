"use client";

import { Search } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCpf } from "@/lib/cpf";
import { formatPhone } from "@/lib/phone";
import type { AdminCustomerRow } from "@/types/admin";

type CustomersTableCardProps = {
  initialCustomers: AdminCustomerRow[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  }).format(new Date(value));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function CustomersTableCard({ initialCustomers }: CustomersTableCardProps) {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const summary = useMemo(() => {
    const withSpin = initialCustomers.filter((customer) => customer.spins.length > 0).length;
    const redeemed = initialCustomers.filter((customer) => Boolean(customer.whatsappClickedAt)).length;

    return {
      total: initialCustomers.length,
      withSpin,
      redeemed,
    };
  }, [initialCustomers]);

  const filteredCustomers = useMemo(() => {
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) {
      return initialCustomers;
    }

    const normalizedTerm = normalizeText(trimmedTerm);
    const termDigits = normalizeDigits(trimmedTerm);

    return initialCustomers.filter((customer) => {
      const customerName = normalizeText(customer.name);
      const customerCpf = normalizeDigits(customer.cpf);

      if (customerName.includes(normalizedTerm)) {
        return true;
      }

      if (termDigits.length > 0 && customerCpf.includes(termDigits)) {
        return true;
      }

      return false;
    });
  }, [initialCustomers, searchTerm]);

  function toggleSpins(participantId: string) {
    setExpandedRows((current) => {
      if (current.includes(participantId)) {
        return current.filter((id) => id !== participantId);
      }

      return [...current, participantId];
    });
  }

  return (
    <Card className="campaign-panel">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-black">Participantes da campanha</CardTitle>
          <p className="text-sm text-muted-foreground">
            Busque por nome ou CPF para ver os giros registrados e o prêmio sorteado em cada tentativa.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="campaign-status-info rounded-xl px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Participantes</p>
            <p className="text-xl font-black text-foreground">{summary.total}</p>
          </div>
          <div className="campaign-status-info rounded-xl px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Com giro</p>
            <p className="text-xl font-black text-foreground">{summary.withSpin}</p>
          </div>
          <div className="campaign-status-info rounded-xl px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Resgates iniciados</p>
            <p className="text-xl font-black text-foreground">{summary.redeemed}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Pesquisar participante por nome ou CPF..."
            className="h-10 rounded-xl bg-background pl-9"
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum participante encontrado para esta busca.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-background/80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Giros</TableHead>
                  <TableHead>Último giro</TableHead>
                  <TableHead>Resgate</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredCustomers.map((customer) => {
                  const latestSpin = customer.spins[customer.spins.length - 1] ?? null;
                  const isExpanded = expandedRows.includes(customer.id);

                  return (
                    <Fragment key={customer.id}>
                      <TableRow>
                        <TableCell>
                          <div>
                            <p className="max-w-[240px] truncate font-semibold">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Cadastro: {formatDate(customer.createdAt)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="whitespace-nowrap">{formatPhone(customer.phone)}</p>
                        </TableCell>
                        <TableCell>{formatCpf(customer.cpf)}</TableCell>
                        <TableCell>
                          {customer.spinAttempts}/{customer.maxAttempts}
                          <p className="text-xs text-muted-foreground">
                            Restantes: {customer.remainingAttempts}
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {latestSpin ? formatDate(latestSpin.createdAt) : "Sem giro"}
                        </TableCell>
                        <TableCell>
                          {customer.whatsappClickedAt ? (
                            <Badge variant="secondary">Iniciado</Badge>
                          ) : (
                            <Badge variant="outline">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={customer.spins.length === 0}
                              onClick={() => toggleSpins(customer.id)}
                            >
                              {isExpanded ? "Ocultar giros" : "Ver giros"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded ? (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/35">
                            <div className="space-y-3 py-2">
                              <p className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">
                                Histórico de resultados do CPF
                              </p>

                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {customer.spins.map((spin) => (
                                  <article
                                    key={spin.id}
                                    className="space-y-1 rounded-xl border border-border/80 bg-card p-3"
                                  >
                                    <p className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground">
                                      {spin.attemptNumber}º giro
                                    </p>
                                    <p className="text-sm font-bold leading-snug">{spin.prizeName}</p>
                                    {spin.prizeNote ? (
                                      <p className="text-xs text-muted-foreground">{spin.prizeNote}</p>
                                    ) : null}
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(spin.createdAt)}
                                    </p>
                                  </article>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
