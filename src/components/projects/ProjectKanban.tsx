import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreHorizontal, 
  Clock, 
  DollarSign,
  User,
  Trash2,
  Eye,
  Edit3
} from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ProjectForm } from './ProjectForm';
import { ProjectDetails } from './ProjectDetails';
import type { Project } from '@/types/axion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

type ProjectStatus = 'backlog' | 'production' | 'review' | 'completed';

const columns: { id: ProjectStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-muted' },
  { id: 'production', title: 'Em Produção', color: 'bg-info' },
  { id: 'review', title: 'Revisão Cliente', color: 'bg-warning' },
  { id: 'completed', title: 'Concluído', color: 'bg-success' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function ProjectKanban() {
  const { projects, setProjects, openModal } = useAxion();
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null);

  const handleDragStart = (project: Project) => {
    setDraggedProject(project);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: ProjectStatus) => {
    if (draggedProject) {
      setProjects(prev =>
        prev.map(p =>
          p.id === draggedProject.id
            ? { ...p, status, updatedAt: new Date().toISOString() }
            : p
        )
      );
      setDraggedProject(null);
    }
  };

  const handleNewProject = () => {
    openModal(<ProjectForm />);
  };

  const handleEditProject = (project: Project) => {
    openModal(<ProjectForm project={project} />);
  };

  const handleViewProject = (project: Project) => {
    openModal(<ProjectDetails project={project} />);
  };

  const handleDeleteProject = (projectId: string) => {
    setPendingDeleteProjectId(projectId);
    setDeleteDialogOpen(true);
  };

  const getProjectsByStatus = (status: ProjectStatus) => {
    return projects.filter(p => p.status === status);
  };

  return (
    <div className="h-full flex flex-col">
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setPendingDeleteProjectId(null);
        }}
        title="Excluir projeto?"
        description="Essa ação não pode ser desfeita."
        cancelText="Cancelar"
        confirmText="Excluir"
        confirmVariant="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onConfirm={() => {
          if (!pendingDeleteProjectId) return;
          setProjects((prev) => prev.filter((p) => p.id !== pendingDeleteProjectId));
          setDeleteDialogOpen(false);
          setPendingDeleteProjectId(null);
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quadro Kanban</h2>
          <p className="text-muted-foreground">Arraste os projetos para atualizar o status</p>
        </div>
        <Button onClick={handleNewProject} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden">
        {columns.map((column) => {
          const columnProjects = getProjectsByStatus(column.id);
          
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
                  {columnProjects.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <AnimatePresence mode="popLayout">
                  {columnProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      draggable
                      onDragStart={() => handleDragStart(project)}
                      className={cn(
                        "kanban-card",
                        draggedProject?.id === project.id && "opacity-50"
                      )}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-foreground line-clamp-2">
                          {project.title}
                        </h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProject(project)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProject(project)}>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Client */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">{project.client}</span>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {project.deadline ? format(parseISO(project.deadline), 'dd/MM', { locale: ptBR }) : 'Sem prazo'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-success" />
                          <span className="text-xs font-medium text-foreground">
                            {formatCurrency(project.totalValue)}
                          </span>
                        </div>
                      </div>

                      {/* Payment Progress */}
                      {project.totalValue > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Pago</span>
                            <span>{Math.round((project.paidValue / project.totalValue) * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-success rounded-full transition-all duration-300"
                              style={{ width: `${(project.paidValue / project.totalValue) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {columnProjects.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-8">
                    Arraste projetos aqui
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

