import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileAudio, FileText, Image as ImageIcon, Download } from "lucide-react";

import type { FlowCard, FlowCardAttachment } from "@/types/axion";
import { listFlowCardAttachmentsByCard } from "@/lib/flowCardAttachmentsApi";
import { downloadDriveFile } from "@/lib/driveDownload";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDateTime(iso?: string): { date: string; time: string } {
  if (!iso) return { date: "-", time: "-" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "-", time: "-" };
  return {
    date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }),
    time: `${String(d.getHours()).padStart(2, "0")}h`,
  };
}

function AttachmentPreview({
  attachment,
  accessToken,
  onDownloadDrive,
}: {
  attachment: FlowCardAttachment;
  accessToken: string;
  onDownloadDrive: (fileId: string, fileName: string, mimeType: string) => Promise<void>;
}) {
  const Icon = attachment.kind === "image" ? ImageIcon : attachment.kind === "audio" ? FileAudio : FileText;
  const isDrive = attachment.bucketId === "google-drive";

  return (
    <Card className="bg-card/40 border-border/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground truncate">{attachment.fileName}</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">{attachment.mimeType}</p>
        </div>

        {isDrive ? (
          <button
            type="button"
            onClick={() => onDownloadDrive(attachment.objectPath, attachment.fileName, attachment.mimeType)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs",
              "bg-background/40 hover:bg-secondary/40 transition-colors"
            )}
            aria-label="Baixar arquivo do Google Drive"
            disabled={!accessToken}
          >
            Baixar <Download className="h-3.5 w-3.5" />
          </button>
        ) : (
          <a
            href={attachment.publicUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs",
              "bg-background/40 hover:bg-secondary/40 transition-colors"
            )}
          >
            Abrir <Download className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Preview inline só para URLs que não sejam do Google Drive (Drive bloqueia em iframe) */}
      {!isDrive && attachment.kind === "image" ? (
        <div className="mt-3 overflow-hidden rounded-md border border-border/60 bg-background/40">
          <img
            src={attachment.publicUrl}
            alt={`Preview do arquivo ${attachment.fileName}`}
            loading="lazy"
            className="h-40 w-full object-cover"
          />
        </div>
      ) : null}

      {!isDrive && attachment.kind === "audio" ? (
        <div className="mt-3">
          <audio controls className="w-full">
            <source src={attachment.publicUrl} type={attachment.mimeType} />
          </audio>
        </div>
      ) : null}
    </Card>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: FlowCard | null;
};

export function SaleDetailsDialog({ open, onOpenChange, card }: Props) {
  const { session } = useAuth();
  const { toast } = useToast();
  const cardId = card?.id ?? "";

  const { data: attachments = [], isLoading, isError, error } = useQuery({
    queryKey: ["flow_card_attachments", cardId],
    queryFn: () => listFlowCardAttachmentsByCard(cardId),
    enabled: open && Boolean(cardId),
  });

  const occurredAt = useMemo(() => {
    return formatDateTime(card?.updatedAt || card?.createdAt);
  }, [card?.createdAt, card?.updatedAt]);

  const handleDownloadDrive = async (fileId: string, fileName: string, mimeType: string) => {
    const accessToken = session?.access_token ?? "";
    if (!accessToken) {
      toast({
        title: "Você precisa estar logado",
        description: "Entre novamente para baixar arquivos do Drive.",
        variant: "destructive",
      });
      return;
    }

    try {
      await downloadDriveFile({
        accessToken,
        fileId,
        fileName,
        mimeType,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao baixar";
      toast({
        title: "Erro ao baixar",
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {card?.clientName ? `Venda — ${card.clientName}` : "Detalhes da venda"}
          </DialogTitle>
          <DialogDescription>
            Detalhes da venda e anexos. Para arquivos do Google Drive, use o botão “Baixar”.
          </DialogDescription>
        </DialogHeader>

        {!card ? (
          <p className="text-sm text-muted-foreground">Nenhuma venda selecionada.</p>
        ) : (
          <ScrollArea className="max-h-[75vh] pr-2">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="bg-card/40 border-border/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{card.status}</Badge>
                  {card.paymentMethod ? <Badge variant="outline">{card.paymentMethod}</Badge> : null}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="font-medium">{occurredAt.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hora</p>
                    <p className="font-medium">{occurredAt.time}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Produto</p>
                    <p className="font-medium">{card.productName ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entrada</p>
                    <p className="font-medium">{formatCurrencyBRL(Number(card.entryValue) || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recebido</p>
                    <p className="font-medium">{formatCurrencyBRL(Number(card.receivedValue) || 0)}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/40 border-border/60 p-4">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Vendedor</p>
                    <p className="font-medium">{card.attendantName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Criado por</p>
                    <p className="font-medium">{card.createdByName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Produção</p>
                    <p className="font-medium">{card.productionResponsibleName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                    <p className="font-medium">{card.whatsapp || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prazo</p>
                    <p className="font-medium">{card.deadline || "-"}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="mt-4 bg-card/40 border-border/60 p-4">
              <p className="text-sm font-semibold">Observações</p>
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{card.notes || "-"}</p>
            </Card>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Arquivos (uploads)</p>
                <p className="text-xs text-muted-foreground">Retenção automática: 15 dias</p>
              </div>

              {isLoading ? <p className="mt-2 text-sm text-muted-foreground">Carregando anexos…</p> : null}
              {isError ? (
                <p className="mt-2 text-sm text-destructive">Falha ao carregar anexos: {(error as Error | null)?.message ?? "erro"}</p>
              ) : null}

              {!isLoading && !isError ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum arquivo anexado.</p>
                  ) : (
                    attachments.map((a) => (
                      <AttachmentPreview
                        key={a.id}
                        attachment={a}
                        accessToken={session?.access_token ?? ""}
                        onDownloadDrive={handleDownloadDrive}
                      />
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
