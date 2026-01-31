import { useMemo, useState } from "react";
import type { Project } from "@/types/axion";
import { useAxion } from "@/contexts/AxionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProjectStatus = Project["status"]; // 'backlog' | 'production' | 'review' | 'completed'

type Props = {
  project: Project;
};

const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: "backlog", label: "Backlog" },
  { value: "production", label: "Em Produção" },
  { value: "review", label: "Revisão Cliente" },
  { value: "completed", label: "Concluído" },
];

export function ProjectStatusDeadlineForm({ project }: Props) {
  const { setProjects, closeModal } = useAxion();

  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [deadline, setDeadline] = useState(project.deadline ?? "");

  const statusLabel = useMemo(() => {
    return statusOptions.find((s) => s.value === status)?.label ?? status;
  }, [status]);

  const onSave = () => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? {
              ...p,
              status,
              deadline,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
    closeModal();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-foreground">Editar projeto</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {project.title} • {statusLabel}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
            <SelectTrigger className="input-dark">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="input-dark"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={closeModal}>
          Cancelar
        </Button>
        <Button type="button" onClick={onSave}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
