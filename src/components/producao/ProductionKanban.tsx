import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Eye, MoreHorizontal, Pencil, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useAxion } from "@/contexts/AxionContext";
import type { Project } from "@/types/axion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProjectDetails } from "@/components/projects/ProjectDetails";
import { ProjectStatusDeadlineForm } from "@/components/producao/ProjectStatusDeadlineForm";

type ProjectStatus = "backlog" | "production" | "review" | "completed";

const columns: { id: ProjectStatus; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-muted" },
  { id: "production", title: "Em Produção", color: "bg-info" },
  { id: "review", title: "Revisão Cliente", color: "bg-warning" },
  { id: "completed", title: "Concluído", color: "bg-success" },
];

export function ProductionKanban() {
  const { projects, setProjects, openModal } = useAxion();
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);

  const handleDragStart = (project: Project) => {
    setDraggedProject(project);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: ProjectStatus) => {
    if (!draggedProject) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === draggedProject.id ? { ...p, status, updatedAt: new Date().toISOString() } : p))
    );
    setDraggedProject(null);
  };

  const handleViewProject = (project: Project) => {
    openModal(<ProjectDetails project={project} />);
  };

  const handleQuickEdit = (project: Project) => {
    openModal(<ProjectStatusDeadlineForm project={project} />);
  };

  const getProjectsByStatus = (status: ProjectStatus) => projects.filter((p) => p.status === status);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Kanban de Produção</h2>
        <p className="text-muted-foreground">Arraste para atualizar o status; edite prazo pelo menu.</p>
      </div>

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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", column.color)} />
                  <h3 className="font-semibold text-foreground">{column.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {columnProjects.length}
                </span>
              </div>

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
                      className={cn("kanban-card", draggedProject?.id === project.id && "opacity-50")}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-foreground line-clamp-2">{project.title}</h4>
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
                            <DropdownMenuItem onClick={() => handleQuickEdit(project)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar status/prazo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">{project.client}</span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {project.deadline ? format(parseISO(project.deadline), "dd/MM", { locale: ptBR }) : "Sem prazo"}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {columnProjects.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-8">Arraste projetos aqui</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
