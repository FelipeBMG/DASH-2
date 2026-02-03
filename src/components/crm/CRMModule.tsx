import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreHorizontal, 
  Mail,
  Phone,
  Building2,
  UserPlus,
  Trash2,
  DollarSign,
  Edit3
} from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LeadForm } from './LeadForm';
import { ClientForm } from './ClientForm';
import type { Lead, Client } from '@/types/axion';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

type LeadStage = 'prospecting' | 'proposal' | 'won' | 'lost';

const pipelineColumns: { id: LeadStage; title: string; color: string }[] = [
  { id: 'prospecting', title: 'Prospecção', color: 'bg-info' },
  { id: 'proposal', title: 'Proposta Enviada', color: 'bg-warning' },
  { id: 'won', title: 'Ganho', color: 'bg-success' },
  { id: 'lost', title: 'Perdido', color: 'bg-destructive' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function CRMModule() {
  const { leads, setLeads, clients, setClients, openModal } = useAxion();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    | { type: 'lead'; id: string }
    | { type: 'client'; id: string }
    | null
  >(null);

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stage: LeadStage) => {
    if (draggedLead) {
      // If moved to 'won', convert to client
      if (stage === 'won' && draggedLead.stage !== 'won') {
        const newClient: Client = {
          id: crypto.randomUUID(),
          name: draggedLead.name,
          email: draggedLead.email,
          phone: draggedLead.phone,
          company: draggedLead.company,
          source: draggedLead.source,
          status: 'active',
          totalSpent: draggedLead.value,
          projectsCount: 0,
          createdAt: new Date().toISOString(),
        };
        setClients(prev => [...prev, newClient]);
      }

      setLeads(prev =>
        prev.map(l =>
          l.id === draggedLead.id
            ? { ...l, stage, updatedAt: new Date().toISOString() }
            : l
        )
      );
      setDraggedLead(null);
    }
  };

  const handleNewLead = () => {
    openModal(<LeadForm />);
  };

  const handleEditLead = (lead: Lead) => {
    openModal(<LeadForm lead={lead} />);
  };

  const handleNewClient = () => {
    openModal(<ClientForm />);
  };

  const handleEditClient = (client: Client) => {
    openModal(<ClientForm client={client} />);
  };

  const handleDeleteLead = (leadId: string) => {
    setPendingDelete({ type: 'lead', id: leadId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteClient = (clientId: string) => {
    setPendingDelete({ type: 'client', id: clientId });
    setDeleteDialogOpen(true);
  };

  const getLeadsByStage = (stage: LeadStage) => {
    return leads.filter(l => l.stage === stage);
  };

  const getStageTotal = (stage: LeadStage) => {
    return leads.filter(l => l.stage === stage).reduce((sum, l) => sum + l.value, 0);
  };

  return (
    <div className="h-full flex flex-col">
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setPendingDelete(null);
        }}
        title={pendingDelete?.type === 'client' ? 'Excluir cliente?' : 'Excluir lead?'}
        description="Essa ação não pode ser desfeita."
        cancelText="Cancelar"
        confirmText="Excluir"
        confirmVariant="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.type === 'lead') {
            setLeads((prev) => prev.filter((l) => l.id !== pendingDelete.id));
          } else {
            setClients((prev) => prev.filter((c) => c.id !== pendingDelete.id));
          }
          setDeleteDialogOpen(false);
          setPendingDelete(null);
        }}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="pipeline">Pipeline de Vendas</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {activeTab === 'pipeline' ? (
              <Button onClick={handleNewLead} className="btn-primary gap-2">
                <Plus className="w-4 h-4" />
                Novo Lead
              </Button>
            ) : (
              <Button onClick={handleNewClient} className="btn-primary gap-2">
                <UserPlus className="w-4 h-4" />
                Novo Cliente
              </Button>
            )}
          </div>
        </div>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="flex-1 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
            {pipelineColumns.map((column) => {
              const columnLeads = getLeadsByStage(column.id);
              const total = getStageTotal(column.id);
              
              return (
                <motion.div
                  key={column.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="kanban-column flex flex-col"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", column.color)} />
                      <h3 className="font-semibold text-foreground">{column.title}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {columnLeads.length}
                    </span>
                  </div>

                  {/* Total Value */}
                  <div className="mb-4 p-2 rounded-lg bg-secondary/50 text-center">
                    <span className="text-xs text-muted-foreground">Total: </span>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(total)}</span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    <AnimatePresence mode="popLayout">
                      {columnLeads.map((lead) => (
                        <motion.div
                          key={lead.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          draggable
                          onDragStart={() => handleDragStart(lead)}
                          className={cn(
                            "kanban-card",
                            draggedLead?.id === lead.id && "opacity-50"
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-foreground">{lead.name}</h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {lead.company && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Building2 className="w-3.5 h-3.5" />
                              <span className="truncate">{lead.company}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">{lead.email}</span>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {lead.source}
                            </span>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-success" />
                              <span className="text-sm font-medium text-foreground">
                                {formatCurrency(lead.value)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {columnLeads.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-8">
                        Arraste leads aqui
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="flex-1 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {clients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card-hover p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary-foreground">
                          {client.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{client.name}</h4>
                        {client.company && (
                          <p className="text-sm text-muted-foreground">{client.company}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClient(client)}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{client.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Gasto</p>
                      <p className="font-semibold text-foreground">{formatCurrency(client.totalSpent)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Projetos</p>
                      <p className="font-semibold text-foreground">{client.projectsCount}</p>
                    </div>
                    <span className={cn(
                      "status-badge",
                      client.status === 'active' ? 'success' : 'warning'
                    )}>
                      {client.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {clients.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum cliente cadastrado</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

