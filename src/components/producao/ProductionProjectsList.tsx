import { Eye, Pencil } from "lucide-react";

import { useAxion } from "@/contexts/AxionContext";
import type { Project } from "@/types/axion";
import { Button } from "@/components/ui/button";
import { ProjectDetails } from "@/components/projects/ProjectDetails";
import { ProjectStatusDeadlineForm } from "@/components/producao/ProjectStatusDeadlineForm";
import { cn } from "@/lib/utils";

const statusLabel: Record<Project["status"], string> = {
  backlog: "Backlog",
  production: "Em Produção",
  review: "Revisão",
  completed: "Concluído",
};

const statusBadgeClass: Record<Project["status"], string> = {
  backlog: "bg-muted text-muted-foreground",
  production: "bg-info/20 text-info",
  review: "bg-warning/20 text-warning",
  completed: "bg-success/20 text-success",
};

export function ProductionProjectsList() {
  const { projects, openModal } = useAxion();

  const viewProject = (project: Project) => openModal(<ProjectDetails project={project} />);
  const editProject = (project: Project) => openModal(<ProjectStatusDeadlineForm project={project} />);

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold text-foreground">Projetos</h2>
        <p className="text-muted-foreground">Visualize e edite status/prazo.</p>
      </header>

      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Projeto</th>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Deadline</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum projeto cadastrado.
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.title}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.client}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", statusBadgeClass[p.status])}>
                        {statusLabel[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.deadline ? p.deadline : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => viewProject(p)} className="gap-2">
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => editProject(p)} className="gap-2">
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
