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
  const { flowCards, setFlowCards, openModal, closeModal } = useAxion();
  const [draggedCard, setDraggedCard] = useState<FlowCard | null>(null);

  const handleDragStart = (card: FlowCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: FlowCardStatus) => {
    if (draggedCard && draggedCard.status !== status) {
      setFlowCards(prev => prev.map(card => 
        card.id === draggedCard.id 
          ? { ...card, status, updatedAt: new Date().toISOString() }
          : card
      ));
    }
    setDraggedCard(null);
  };

  const handleNewCard = () => {
    openModal(
      <FlowCardForm
        onSubmit={(card) => {
          setFlowCards(prev => [...prev, { ...card, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
          closeModal();
        }}
        onCancel={closeModal}
      />
    );
  };

  const handleEditCard = (card: FlowCard) => {
    openModal(
      <FlowCardForm
        card={card}
        onSubmit={(updatedCard) => {
          setFlowCards(prev => prev.map(c => c.id === card.id ? { ...updatedCard, id: card.id, createdAt: card.createdAt, updatedAt: new Date().toISOString() } : c));
          closeModal();
        }}
        onCancel={closeModal}
      />
    );
  };

  const handleDeleteCard = (cardId: string) => {
    setFlowCards(prev => prev.filter(c => c.id !== cardId));
  };

  const getCardsByStatus = (status: FlowCardStatus) => 
    flowCards.filter(card => card.status === status);

  return (
    <div className="space-y-6 h-full">
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
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCard(card)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCard(card.id)}
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
