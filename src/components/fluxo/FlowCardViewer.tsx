import { useCallback } from "react";
import type { FlowCard, FlowCardAttachment } from "@/types/axion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Download, DollarSign, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { downloadDriveFile } from "@/lib/driveDownload";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABEL: Record<string, string> = {
  leads: "Leads (Entrada)",
  negociacao: "Negociação (X1)",
  aguardando_pagamento: "Aguardando Pagamento",
  em_producao: "Em Produção",
  revisao: "Revisão",
  concluido: "Concluído",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function FlowCardViewer(props: {
  card: FlowCard;
  attachments: FlowCardAttachment[];
  onEdit?: () => void;
}) {
  const { session } = useAuth();
  const { toast } = useToast();

  const handleDownload = useCallback(
    async (a: FlowCardAttachment) => {
      if (!session?.access_token) throw new Error("Você precisa estar logado para baixar.");
      await downloadDriveFile({
        accessToken: session.access_token,
        fileId: a.objectPath,
        fileName: a.fileName,
      });
    },
    [session?.access_token],
  );

  const { card, attachments } = props;

  const legacyCategoryLabel: Record<string, string> = {
    produto_1: "Produto 1",
    produto_2: "Produto 2",
    produto_3: "Produto 3",
    produto_4: "Produto 4",
  };

  const productLabel =
    card.productName?.trim() || (card.category ? legacyCategoryLabel[card.category] ?? card.category : "—");

  return (
    <div className="p-6 space-y-5">
      <header className="space-y-1 pr-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate">{card.clientName}</h2>
            <p className="text-sm text-muted-foreground truncate">
              {STATUS_LABEL[card.status] ?? card.status}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {productLabel}
          </Badge>
        </div>
      </header>

      <section className="rounded-xl border border-border/60 bg-secondary/10 p-4 space-y-3">
        <div className="flex items-center gap-2 text-primary font-medium">
          <DollarSign className="h-4 w-4" />
          <span>
            {formatCurrency(card.entryValue)}
            {card.receivedValue > 0 ? ` (Recebido: ${formatCurrency(card.receivedValue)})` : null}
          </span>
        </div>

        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {card.date ? format(parseISO(card.date), "dd/MM/yyyy", { locale: ptBR }) : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="truncate">Atendente: {card.attendantName || "—"}</span>
          </div>
          <div className="text-muted-foreground truncate">
            Produção: {card.productionResponsibleName || "—"}
          </div>
          <div className="text-muted-foreground">
            Prazo: {card.deadline ? format(parseISO(card.deadline), "dd/MM/yyyy", { locale: ptBR }) : "—"}
          </div>
          <div className="text-muted-foreground">Quantidade: {card.quantity ?? 1}</div>
          {card.receivedValue > 0 && card.entryValue > 0 ? (
            <div className="text-muted-foreground">
              Falta receber: {formatCurrency(card.entryValue - card.receivedValue)}
            </div>
          ) : null}
          <div className="text-muted-foreground truncate">Criado por: {card.createdByName || "—"}</div>
        </div>
      </section>

      {card.notes ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Observações</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{card.notes}</p>
        </section>
      ) : null}

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">Anexos</h3>
          <span className="text-xs text-muted-foreground">{attachments.length}</span>
        </div>

        {attachments.length ? (
          <div className="space-y-2">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-2 rounded-lg border border-border/60 bg-secondary/20 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{a.fileName}</p>
                    <Badge variant="secondary" className="shrink-0">
                      {a.kind}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{a.mimeType}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void handleDownload(a).catch((err: unknown) => {
                      const msg = err instanceof Error ? err.message : "Erro ao baixar arquivo";
                      toast({
                        title: "Falha no download",
                        description: msg,
                        variant: "destructive",
                      });
                    });
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum anexo neste card.</p>
        )}
      </section>

      {props.onEdit ? (
        <div className="pt-2 flex justify-end">
          <Button onClick={props.onEdit} className="btn-primary">
            Editar
          </Button>
        </div>
      ) : null}
    </div>
  );
}

