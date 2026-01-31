import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Step = {
  id: string;
  label: string;
  description: string;
};

type Props = {
  activeIndex: number;
  steps: Step[];
  onChange: (nextIndex: number) => void;
};

export function VendedorStepper({ activeIndex, steps, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Fluxo de Operações</h3>
        <p className="text-xs text-muted-foreground">Guia de etapas (mock)</p>
      </div>

      <ol className="space-y-2">
        {steps.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isActive = idx === activeIndex;

          return (
            <li
              key={step.id}
              className={cn(
                "rounded-xl border border-border bg-secondary/40 p-4 transition-colors",
                isActive && "border-primary/30 bg-primary/10",
              )}
            >
              <button
                type="button"
                className="w-full text-left flex items-start gap-3"
                onClick={() => onChange(idx)}
              >
                <div
                  className={cn(
                    "mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center",
                    isDone
                      ? "bg-success/20 text-success"
                      : isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-foreground",
                  )}
                  aria-label={isDone ? "Concluído" : isActive ? "Atual" : "Pendente"}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <span className="text-sm font-semibold">{idx + 1}</span>}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
