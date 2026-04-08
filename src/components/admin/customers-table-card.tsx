"use client";

import Image from "next/image";
import { AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCpf } from "@/lib/cpf";
import { formatPhone } from "@/lib/phone";
import { formatBRL, formatPercent } from "@/lib/pricing";
import type { AdminCustomerRow } from "@/types/admin";

type CustomersTableCardProps = {
  initialCustomers: AdminCustomerRow[];
};

type FeedbackState =
  | {
      type: "idle";
      message?: undefined;
    }
  | {
      type: "success" | "error";
      message: string;
    };

type MarkSoldResponse = {
  ok?: boolean;
  error?: string;
  data?: {
    alreadySold?: boolean;
    soldAt?: string | null;
    relatedItemIds?: string[];
    deactivatedItemsCount?: number;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
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
  const [customers, setCustomers] = useState<AdminCustomerRow[]>(initialCustomers);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>({ type: "idle" });
  const [busyParticipantId, setBusyParticipantId] = useState<string | null>(null);

  const summary = useMemo(() => {
    const withSpin = customers.filter((customer) => customer.latestSpin !== null).length;
    const sold = customers.filter((customer) => customer.latestSpin?.isSold).length;

    return {
      total: customers.length,
      withSpin,
      sold,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) {
      return customers;
    }

    const normalizedTerm = normalizeText(trimmedTerm);
    const termDigits = normalizeDigits(trimmedTerm);

    return customers.filter((customer) => {
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
  }, [customers, searchTerm]);

  function toggleLatestItems(participantId: string) {
    setExpandedRows((current) => {
      if (current.includes(participantId)) {
        return current.filter((id) => id !== participantId);
      }

      return [...current, participantId];
    });
  }

  async function markLatestSpinAsSold(customer: AdminCustomerRow) {
    if (!customer.latestSpin) {
      return;
    }

    setBusyParticipantId(customer.id);
    setFeedback({ type: "idle" });

    try {
      const response = await fetch(`/api/admin/customers/${customer.id}/sold`, {
        method: "PATCH",
      });

      const payload = (await response.json().catch(() => null)) as MarkSoldResponse | null;

      if (!response.ok || !payload?.ok) {
        setFeedback({
          type: "error",
          message: payload?.error ?? "Não foi possível marcar a venda agora.",
        });
        return;
      }

      const soldAt = payload.data?.soldAt ?? new Date().toISOString();
      const relatedItemIds = payload.data?.relatedItemIds ?? [];
      const deactivatedItemsCount = payload.data?.deactivatedItemsCount ?? 0;
      const alreadySold = payload.data?.alreadySold ?? false;

      setCustomers((current) =>
        current.map((entry) => {
          if (entry.id !== customer.id || !entry.latestSpin) {
            return entry;
          }

          return {
            ...entry,
            latestSpin: {
              ...entry.latestSpin,
              isSold: true,
              soldAt,
              items: entry.latestSpin.items.map((item) =>
                relatedItemIds.includes(item.id)
                  ? {
                      ...item,
                      isActive: false,
                    }
                  : item
              ),
            },
          };
        })
      );

      setFeedback({
        type: "success",
        message: alreadySold
          ? `Venda de ${customer.name} já estava confirmada.`
          : `Venda confirmada para ${customer.name}. ${deactivatedItemsCount} peça(s) removida(s) do catálogo ativo.`,
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Instabilidade ao atualizar o status de venda.",
      });
    } finally {
      setBusyParticipantId(null);
    }
  }

  return (
    <Card className="campaign-panel">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-black">Clientes da campanha</CardTitle>
          <p className="text-sm text-muted-foreground">
            Busque por nome ou CPF, consulte os últimos looks girados e marque como vendida para
            retirar as peças do catálogo ativo.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="campaign-status-info rounded-xl px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Clientes</p>
            <p className="text-xl font-black text-foreground">{summary.total}</p>
          </div>
          <div className="campaign-status-info rounded-xl px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Com último giro
            </p>
            <p className="text-xl font-black text-foreground">{summary.withSpin}</p>
          </div>
          <div className="campaign-status-info rounded-xl px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Vendidas</p>
            <p className="text-xl font-black text-foreground">{summary.sold}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Pesquisar cliente por nome ou CPF..."
            className="h-10 rounded-xl bg-background pl-9"
          />
        </div>

        {feedback.type === "error" ? (
          <div className="campaign-status-error flex items-start gap-2 px-3 py-2 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        ) : null}

        {feedback.type === "success" ? (
          <div className="campaign-status-success flex items-start gap-2 px-3 py-2 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        ) : null}

        {filteredCustomers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado para esta busca.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-background/80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Último giro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredCustomers.map((customer) => {
                  const latestSpin = customer.latestSpin;
                  const isBusy = busyParticipantId === customer.id;
                  const isExpanded = expandedRows.includes(customer.id);

                  return (
                    <Fragment key={customer.id}>
                      <TableRow>
                        <TableCell>
                          <div>
                            <p className="max-w-[220px] truncate font-semibold">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Cadastro: {formatDate(customer.createdAt)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="whitespace-nowrap">{formatPhone(customer.phone)}</p>
                        </TableCell>
                        <TableCell>{formatCpf(customer.cpf)}</TableCell>
                        <TableCell>{customer.spinAttempts}/3</TableCell>
                        <TableCell className="text-muted-foreground">
                          {latestSpin ? formatDate(latestSpin.createdAt) : "Sem giro"}
                        </TableCell>
                        <TableCell>
                          {latestSpin ? (
                            latestSpin.isSold ? (
                              <Badge variant="secondary">Vendida</Badge>
                            ) : (
                              <Badge variant="outline">Pendente</Badge>
                            )
                          ) : (
                            <Badge variant="outline">Sem giro</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!latestSpin}
                              onClick={() => toggleLatestItems(customer.id)}
                            >
                              {isExpanded ? "Ocultar looks" : "Ver últimos looks"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={!latestSpin || latestSpin.isSold || isBusy}
                              onClick={() => {
                                void markLatestSpinAsSold(customer);
                              }}
                            >
                              {isBusy ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Salvando
                                </>
                              ) : (
                                "Vendidas"
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && latestSpin ? (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/35">
                            <div className="space-y-3 py-2">
                              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                                <p>
                                  Valor final:{" "}
                                  <span className="font-semibold text-foreground">
                                    {formatBRL(latestSpin.finalPrice)}
                                  </span>
                                </p>
                                <p>
                                  Total original:{" "}
                                  <span className="font-semibold text-foreground">
                                    {formatBRL(latestSpin.originalTotal)}
                                  </span>
                                </p>
                                <p>
                                  Economia:{" "}
                                  <span className="font-semibold text-foreground">
                                    {formatBRL(latestSpin.discountAmount)}
                                  </span>
                                </p>
                                <p>
                                  Desconto:{" "}
                                  <span className="font-semibold text-foreground">
                                    {formatPercent(latestSpin.discountPercent)}
                                  </span>
                                </p>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-3">
                                {latestSpin.items.map((item, index) => (
                                  <article
                                    key={item.id}
                                    className="overflow-hidden rounded-xl border border-border/80 bg-card"
                                  >
                                    <div className="relative aspect-[4/5] bg-muted/50">
                                      <Image
                                        src={item.imageUrl}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 20vw"
                                      />
                                    </div>
                                    <div className="space-y-1 p-3">
                                      <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                                        Look {index + 1}
                                      </p>
                                      <p className="line-clamp-2 min-h-9 text-sm font-semibold">
                                        {item.name}
                                      </p>
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-foreground">
                                          {formatBRL(item.originalPrice)}
                                        </span>
                                        <Badge variant={item.isActive ? "outline" : "secondary"}>
                                          {item.isActive ? "Ativa" : "Inativa"}
                                        </Badge>
                                      </div>
                                    </div>
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
