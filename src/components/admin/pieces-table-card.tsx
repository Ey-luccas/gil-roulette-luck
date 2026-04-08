"use client";

import Image from "next/image";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL } from "@/lib/pricing";
import type { AdminItemListRow } from "@/types/admin";

type PiecesTableCardProps = {
  initialItems: AdminItemListRow[];
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

type ActionResponse = {
  ok?: boolean;
  error?: string;
  data?: Partial<AdminItemListRow>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PiecesTableCard({ initialItems }: PiecesTableCardProps) {
  const [items, setItems] = useState<AdminItemListRow[]>(initialItems);
  const [feedback, setFeedback] = useState<FeedbackState>({ type: "idle" });
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) => {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
    [items]
  );

  async function toggleStatus(item: AdminItemListRow, checked: boolean) {
    setBusyRowId(item.id);
    setFeedback({ type: "idle" });

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: checked }),
      });

      const payload = (await response.json().catch(() => null)) as ActionResponse | null;

      if (!response.ok || !payload?.ok) {
        setFeedback({
          type: "error",
          message: payload?.error ?? "Não foi possível atualizar o status da peça.",
        });
        return;
      }

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                isActive: checked,
              }
            : entry
        )
      );

      setFeedback({
        type: "success",
        message: `Status de "${item.name}" atualizado com sucesso.`,
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Instabilidade ao atualizar o status da peça.",
      });
    } finally {
      setBusyRowId(null);
    }
  }

  async function deleteItem(item: AdminItemListRow) {
    const confirmed = window.confirm(
      `Deseja excluir a peça "${item.name}"? Essa ação não poderá ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    setBusyRowId(item.id);
    setFeedback({ type: "idle" });

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as ActionResponse | null;

      if (!response.ok || !payload?.ok) {
        setFeedback({
          type: "error",
          message: payload?.error ?? "Não foi possível excluir a peça.",
        });
        return;
      }

      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setFeedback({
        type: "success",
        message: `Peça "${item.name}" removida com sucesso.`,
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Instabilidade ao excluir a peça.",
      });
    } finally {
      setBusyRowId(null);
    }
  }

  return (
    <Card className="campaign-panel">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-black">Peças cadastradas</CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualize, altere o status e remova peças conforme necessidade da campanha.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback.type === "error" ? (
          <div className="campaign-status-error flex items-start gap-2 px-3 py-2 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        ) : null}

        {feedback.type === "success" ? (
          <div className="campaign-status-success px-3 py-2 text-sm">
            {feedback.message}
          </div>
        ) : null}

        {sortedItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma peça cadastrada ainda.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-background/80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Imagem</TableHead>
                  <TableHead>Peça</TableHead>
                  <TableHead>Preço original</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedItems.map((item) => {
                  const isRowBusy = busyRowId === item.id;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <a
                          href={item.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex"
                          title={`Abrir imagem de ${item.name}`}
                        >
                          <div className="relative h-16 w-12 overflow-hidden rounded-md border border-border bg-muted">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              unoptimized
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        </a>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{formatBRL(item.originalPrice)}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? "secondary" : "outline"}>
                          {item.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={item.isActive}
                            disabled={isRowBusy}
                            onCheckedChange={(checked) => {
                              void toggleStatus(item, checked);
                            }}
                            aria-label={`Alternar status da peça ${item.name}`}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            disabled={isRowBusy}
                            onClick={() => {
                              void deleteItem(item);
                            }}
                            aria-label={`Excluir peça ${item.name}`}
                          >
                            {isRowBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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
