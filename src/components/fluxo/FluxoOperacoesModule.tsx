import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  GripVertical, 
  MoreHorizontal,
  Calendar,
  User,
  DollarSign,
  Pencil,
  Trash2
} from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { FlowCardForm } from './FlowCardForm';
import type { FlowCard, FlowCardStatus } from '@/types/axion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useFlowCards } from '@/hooks/useFlowCards';
import { uploadFlowCardFile } from '@/lib/flowCardStorage';
import { createFlowCardAttachment, listFlowCardAttachmentsByCard } from '@/lib/flowCardAttachmentsApi';
import { FlowCardViewer } from './FlowCardViewer';
import { isDefaultDateRange, shouldShowByDateRange, shouldShowConcludedCard } from './flowVisibility';

const columns: { id: FlowCardStatus; title: string; color: string }[] = [
  { id: 'leads', title: 'Leads (Entrada)', color: 'bg-blue-500' },
  { id: 'negociacao', title: 'Negociação (X1)', color: 'bg-purple-500' },
  { id: 'aguardando_pagamento', title: 'Aguardando Pagamento', color: 'bg-yellow-500' },
  { id: 'em_producao', title: 'Em Produção', color: 'bg-orange-500' },
  { id: 'revisao', title: 'Revisão', color: 'bg-cyan-500' },
  { id: 'concluido', title: 'Concluído', color: 'bg-green-500' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function FluxoOperacoesModule() {
  const { openModal, closeModal, dateRange } = useAxion();
  const {
    data: flowCards = [],
    isLoading,
    isError,
    error,
    createFlowCard,
    updateFlowCard,
    deleteFlowCard,
  } = useFlowCards();
  const [draggedCard, setDraggedCard] = useState<FlowCard | null>(null);
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === 'admin';
  const isCustomDateRange = !isDefaultDateRange(dateRange);

  const handleDragStart = (card: FlowCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: FlowCardStatus) => {
    if (draggedCard && draggedCard.status !== status) {
      const before = draggedCard;
      await updateFlowCard({
        id: draggedCard.id,
        patch: { status },
        before,
        action: 'moved',
      });
    }
    setDraggedCard(null);
  };

  const handleNewCard = () => {
    openModal(
      <FlowCardForm
        onSubmit={async (card, files) => {
          const createdById = card.createdById || authUser?.id || '';
          const createdByName = card.createdByName || authUser?.name || authUser?.email || '';
          const created = await createFlowCard({
            ...card,
            createdById,
            createdByName,
          });

          const uploadQueue = [...files.images, ...files.audios, ...files.others].map((file) => ({ file }));

          for (const item of uploadQueue) {
            const uploaded = await uploadFlowCardFile({ flowCardId: created.id, file: item.file });
            await createFlowCardAttachment({
              flowCardId: created.id,
              uploadedById: authUser?.id,
              fileName: item.file.name,
              mimeType: item.file.type || 'application/octet-stream',
              bucketId: uploaded.bucketId,
              objectPath: uploaded.objectPath,
              publicUrl: uploaded.publicUrl,
            });
          }

          closeModal();
        }}
        onCancel={closeModal}
      />
    );
  };

  const handleEditCard = (card: FlowCard) => {
    (async () => {
      const attachments = await listFlowCardAttachmentsByCard(card.id).catch(() => []);

      openModal(
        <FlowCardForm
          card={card}
          attachments={attachments}
          onSubmit={async (updatedCard, files) => {
            await updateFlowCard({
              id: card.id,
              patch: {
                date: updatedCard.date,
                clientName: updatedCard.clientName,
                  whatsapp: updatedCard.whatsapp,
                leadsCount: updatedCard.leadsCount,
                quantity: updatedCard.quantity,
                entryValue: updatedCard.entryValue,
                  receivedValue: updatedCard.receivedValue,
                  productId: updatedCard.productId,
                category: updatedCard.category,
                status: updatedCard.status,
                attendantId: updatedCard.attendantId,
                attendantName: updatedCard.attendantName,
                productionResponsibleId: updatedCard.productionResponsibleId,
                productionResponsibleName: updatedCard.productionResponsibleName,
                deadline: updatedCard.deadline,
                notes: updatedCard.notes,
              },
              before: card,
              action: 'updated',
            });

            const uploadQueue = [...files.images, ...files.audios, ...files.others].map((file) => ({ file }));

            for (const item of uploadQueue) {
              const uploaded = await uploadFlowCardFile({ flowCardId: card.id, file: item.file });
              await createFlowCardAttachment({
                flowCardId: card.id,
                uploadedById: authUser?.id,
                fileName: item.file.name,
                mimeType: item.file.type || 'application/octet-stream',
                bucketId: uploaded.bucketId,
                objectPath: uploaded.objectPath,
                publicUrl: uploaded.publicUrl,
              });
            }

            closeModal();
          }}
          onCancel={closeModal}
        />
      );
    })();
  };

  const handleViewCard = (card: FlowCard) => {
    (async () => {
      const attachments = await listFlowCardAttachmentsByCard(card.id).catch(() => []);
      openModal(
        <FlowCardViewer
          card={card}
          attachments={attachments}
          onEdit={() => {
            closeModal();
            handleEditCard(card);
          }}
        />
      );
    })();
  };

  const handleDeleteCard = async (cardId: string) => {
    const before = flowCards.find((c) => c.id === cardId) ?? null;
    await deleteFlowCard({ id: cardId, before });
  };

  const canSeeCard = (card: FlowCard) => {
    if (isAdmin) return true;
    if (!authUser) return false;
    // Regras de visibilidade:
    // - Admin: tudo
    // - Vendedor: cards atribuídos (atendente) OU criados por ele
    // - Produção: cards atribuídos (responsável técnico) OU criados por ele
    if (authUser.role === 'production') {
      return card.productionResponsibleId === authUser.id || card.createdById === authUser.id;
    }
    return card.attendantId === authUser.id || card.createdById === authUser.id;
  };

  const getCardsByStatus = (status: FlowCardStatus) =>
    flowCards
      .filter((card) => card.status === status)
      .filter(canSeeCard)
      .filter((card) => shouldShowByDateRange(card, dateRange, { isCustomDateRange }))
      .filter((card) => {
        if (card.status !== 'concluido') return true;
        return shouldShowConcludedCard(card, { isCustomDateRange });
      });

  return (
    <div className="space-y-6 h-full">
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando cards…</div>
      ) : null}
      {isError ? (
        <div className="text-sm text-destructive">
          Falha ao carregar cards: {(error as Error | null)?.message ?? 'erro desconhecido'}
        </div>
      ) : null}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Fluxo de Operações</h2>
          <p className="text-muted-foreground">Gerencie todo o ciclo de vida do cliente</p>
        </div>
        <Button onClick={handleNewCard} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Novo Card
        </Button>
      </motion.div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)]">
        {columns.map((column, index) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-semibold text-foreground text-sm">{column.title}</h3>
              <span className="ml-auto text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {getCardsByStatus(column.id).length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="glass-card p-2 min-h-[400px] space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
              {getCardsByStatus(column.id).map((card) => (
                <motion.div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card)}
                  onClick={() => handleViewCard(card)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative cursor-grab active:cursor-grabbing rounded-xl border border-border/60 bg-card/70 p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card/80 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 transition-opacity hover:bg-secondary/60 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCard(card);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(card.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Card Content */}
                  <div className="mt-2 space-y-2">
                    <h4 className="text-sm font-semibold leading-snug text-foreground truncate">
                      {card.clientName}
                    </h4>
                    
                    <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatCurrency(card.entryValue)}
                    </div>

                    <div className="grid gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span className="truncate">{card.attendantName}</span>
                      </div>

                      {card.deadline && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(parseISO(card.deadline), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {getCardsByStatus(column.id).length === 0 && (
                <div className="h-24 rounded-xl border border-dashed border-border/70 bg-secondary/20 flex items-center justify-center text-muted-foreground text-sm">
                  Arraste cards aqui
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
