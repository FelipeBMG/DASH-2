import type { ReactNode } from "react";

type Props = {
  title: string;
  leftSlot?: ReactNode;
};

export function ProducaoHeader({ title, leftSlot }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-4 md:px-6 py-4">
      <div className="flex items-center gap-3 min-w-0">
        {leftSlot ? <div className="shrink-0">{leftSlot}</div> : null}
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">Acesso e gestão de projetos</p>
      </div>
    </header>
  );
}
