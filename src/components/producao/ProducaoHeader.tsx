type Props = {
  title: string;
};

export function ProducaoHeader({ title }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">Acesso e gestão de projetos</p>
      </div>
    </header>
  );
}
