import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAxion } from '@/contexts/AxionContext';
import type { FlowCard, FlowCardAttachment, FlowCardStatus } from '@/types/axion';
import { useAuth } from '@/contexts/AuthContext';
import { useFlowCollaborators } from '@/hooks/useFlowCollaborators';
import { Badge } from '@/components/ui/badge';
import { downloadDriveFile } from '@/lib/driveDownload';
import { useProducts } from '@/hooks/useProducts';

interface FlowCardFormProps {
  card?: FlowCard;
  attachments?: FlowCardAttachment[];
  onSubmit: (
    card: Omit<FlowCard, 'id' | 'createdAt' | 'updatedAt'>,
    files: { image?: File | null; audio?: File | null; other?: File | null }
  ) => void;
  onCancel: () => void;
}

const statusOptions: { value: FlowCardStatus; label: string }[] = [
  { value: 'leads', label: 'Leads (Entrada)' },
  { value: 'negociacao', label: 'Negociação (X1)' },
  { value: 'aguardando_pagamento', label: 'Aguardando Pagamento' },
  { value: 'em_producao', label: 'Em Produção' },
  { value: 'revisao', label: 'Revisão' },
  { value: 'concluido', label: 'Concluído' },
];

export function FlowCardForm({ card, attachments = [], onSubmit, onCancel }: FlowCardFormProps) {
  const { team } = useAxion();
  const { user: authUser, session } = useAuth();
  const { sellerOptions, productionOptions } = useFlowCollaborators();
  const { data: products = [] } = useProducts({ activeOnly: true });

  const downloadAttachment = useCallback(
    async (a: FlowCardAttachment) => {
      if (!session?.access_token) {
        throw new Error('Você precisa estar logado para baixar.');
      }
      await downloadDriveFile({
        accessToken: session.access_token,
        fileId: a.objectPath,
        fileName: a.fileName,
      });
    },
    [session?.access_token],
  );

  // Mantém os campos no modelo do card (para compatibilidade), mas não renderiza no form.
  // (pedido: remover “Leads” e “Quantidade”)

  const [formData, setFormData] = useState({
    date: card?.date || new Date().toISOString().split('T')[0],
    clientName: card?.clientName || '',
    whatsapp: card?.whatsapp || '',
    leadsCount: card?.leadsCount || 1,
    quantity: card?.quantity || 1,
    entryValue: card?.entryValue || 0,
    receivedValue: card?.receivedValue || 0,
    productId: card?.productId || '',
    category: card?.category || '',
    status: card?.status || 'leads' as FlowCardStatus,
    createdById: card?.createdById || authUser?.id || '',
    createdByName: card?.createdByName || authUser?.name || authUser?.email || '',
    attendantId: card?.attendantId || (authUser?.role === 'seller' ? authUser.id : ''),
    attendantName: card?.attendantName || (authUser?.role === 'seller' ? (authUser.name || authUser.email) : ''),
    productionResponsibleId: card?.productionResponsibleId || '',
    productionResponsibleName: card?.productionResponsibleName || '',
    deadline: card?.deadline || '',
    notes: card?.notes || '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [otherFile, setOtherFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!audioFile) {
      setAudioPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(audioFile);
    setAudioPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  const hasSellerOptions = useMemo(() => sellerOptions.length > 0, [sellerOptions.length]);
  const hasProductionOptions = useMemo(() => productionOptions.length > 0, [productionOptions.length]);

  const handleSellerChange = useCallback(
    (sellerId: string) => {
      const seller = sellerOptions.find((s) => s.id === sellerId);
      if (!seller) return;

      setFormData((prev) => ({
        ...prev,
        attendantId: seller.id,
        attendantName: seller.name,
      }));
    },
    [sellerOptions],
  );

  const handleProductionChange = useCallback(
    (memberId: string) => {
      const member = productionOptions.find((m) => m.id === memberId);
      if (!member) return;

      setFormData((prev) => ({
        ...prev,
        productionResponsibleId: member.id,
        productionResponsibleName: member.name,
      }));
    },
    [productionOptions],
  );

  const setQuickEntryValue = useCallback((value: number) => {
    setFormData((prev) => ({ ...prev, entryValue: value }));
  }, []);

  // manter compatibilidade: se algum lugar ainda usa `team` para outras coisas
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _teamUnused = team;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      {
        ...formData,
        productId: formData.productId ? formData.productId : undefined,
        // category é legado e NOT NULL no banco: mantenha string vazia quando não usado
        category: formData.category ?? "",
      },
      { image: imageFile, audio: audioFile, other: otherFile }
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 px-4 sm:px-6 pb-6"
    >
      <header className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {card ? 'Editar Card' : 'Novo Card'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Preencha os dados do lead e do processo. Você pode anexar arquivos ao card.
        </p>
      </header>

      <section className="glass-card p-4 sm:p-5 space-y-3 overflow-hidden">
        {card ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Anexos existentes</Label>
              <span className="text-xs text-muted-foreground">{attachments.length}</span>
            </div>

            {attachments.length ? (
              <div className="space-y-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/60 bg-secondary/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{a.fileName}</p>
                        <Badge variant="secondary" className="shrink-0">
                          {a.kind}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{a.mimeType}</p>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                      <button
                        type="button"
                        onClick={() => {
                          void downloadAttachment(a).catch((err: unknown) => {
                            const msg = err instanceof Error ? err.message : 'Erro ao baixar arquivo';
                            alert(msg);
                          });
                        }}
                      >
                        Baixar
                      </button>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum anexo neste card.</p>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-2 min-w-0">
            <Label>Data</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />
          </div>

          <div className="space-y-2 min-w-0">
            <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: FlowCardStatus) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>

          <div className="space-y-2 min-w-0 lg:col-span-2">
            <Label>Cliente</Label>
            <Input
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              placeholder="Nome do cliente"
              required
            />
          </div>
        </div>

        <div className="space-y-2 min-w-0">
          <Label>Número / WhatsApp</Label>
          <Input
            inputMode="tel"
            value={formData.whatsapp}
            onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
            placeholder="Ex: (11) 99999-9999"
          />
          <p className="text-xs text-muted-foreground">
            Esse número será usado no botão “Abrir” do Atendimento (link wa.me).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="space-y-2 min-w-0 md:col-span-2 lg:col-span-2">
            <Label>Valor de Entrada (R$)</Label>
            <Input
              inputMode="decimal"
              placeholder="Ex: 80,00"
              value={String(formData.entryValue).replace('.', ',')}
              onChange={(e) => {
                const raw = e.target.value;
                const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
                const n = Number(normalized);
                setFormData((prev) => ({ ...prev, entryValue: Number.isFinite(n) ? n : 0 }));
              }}
            />

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickEntryValue(40)}>
                40
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickEntryValue(79.9)}>
                79,9
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickEntryValue(80)}>
                80
              </Button>
            </div>
          </div>

          <div className="space-y-2 min-w-0 md:col-span-2 lg:col-span-2">
            <Label>Já Recebido (R$)</Label>
            <Input
              inputMode="decimal"
              placeholder="Ex: 30,00"
              value={String(formData.receivedValue).replace('.', ',')}
              onChange={(e) => {
                const raw = e.target.value;
                const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
                const n = Number(normalized);
                setFormData((prev) => ({ ...prev, receivedValue: Number.isFinite(n) ? n : 0 }));
              }}
            />
          </div>

          <div className="space-y-2 min-w-0 md:col-span-1">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min={1}
              step={1}
              value={String(formData.quantity ?? 1)}
              onChange={(e) => {
                const n = Math.max(1, Math.floor(Number(e.target.value || 1)));
                setFormData((prev) => ({ ...prev, quantity: Number.isFinite(n) ? n : 1 }));
              }}
            />
          </div>

          <div className="space-y-2 min-w-0 md:col-span-2 lg:col-span-3">
            <Label>Produto</Label>
            <Select
              value={formData.productId}
              onValueChange={(v) => {
                const selected = products.find((prod) => prod.id === v);
                setFormData((p) => {
                  const shouldAutofillEntryValue = !card && (p.entryValue === 0 || p.entryValue === 0.0);
                  const nextEntryValue =
                    shouldAutofillEntryValue && selected && Number.isFinite(selected.price) && selected.price > 0
                      ? selected.price
                      : p.entryValue;

                  return {
                    ...p,
                    productId: v,
                    entryValue: nextEntryValue,
                    // mantém category apenas como fallback para cards antigos
                    category: p.category,
                  };
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={products.length ? "Selecione" : "Cadastre produtos em Configurações"} />
              </SelectTrigger>
              <SelectContent>
                {products.map((prod) => (
                  <SelectItem key={prod.id} value={prod.id}>
                    {prod.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!products.length ? (
              <p className="text-xs text-muted-foreground">
                Nenhum produto ativo encontrado. Vá em Configurações &gt; Produtos para cadastrar.
              </p>
            ) : null}
          </div>

          <div className="space-y-2 min-w-0 md:col-span-4 lg:col-span-4">
            <Label>Uploads (Imagem / Áudio)</Label>
            <div className="rounded-lg border border-border/60 bg-secondary/10 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setOtherFile(e.target.files?.[0] ?? null)}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => imageInputRef.current?.click()}
                >
                  Imagem
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => audioInputRef.current?.click()}
                >
                  Áudio
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Arquivo
                </Button>
              </div>

              <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground">
                {imageFile ? <p className="truncate">Imagem: {imageFile.name}</p> : null}
                {audioFile ? <p className="truncate">Áudio: {audioFile.name}</p> : null}
                {otherFile ? <p className="truncate">Arquivo: {otherFile.name}</p> : null}
                {!imageFile && !audioFile && !otherFile ? <p>Nenhum arquivo selecionado.</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-2 min-w-0">
            <Label>Atendente (Colaborador)</Label>
            <Select
              value={formData.attendantId}
              onValueChange={handleSellerChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o atendente" />
              </SelectTrigger>
              <SelectContent>
                {sellerOptions.map((seller) => (
                  <SelectItem key={seller.id} value={seller.id}>
                    {seller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!hasSellerOptions ? (
              <p className="text-xs text-muted-foreground">
                Nenhum vendedor encontrado. Cadastre em Equipe / Configurações e atribua o papel “Vendedor”.
              </p>
            ) : null}
          </div>

          <div className="space-y-2 min-w-0 lg:col-span-2">
            <Label>Produção (Responsável Técnico)</Label>
            <Select
              value={formData.productionResponsibleId}
              onValueChange={handleProductionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {productionOptions.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!hasProductionOptions ? (
              <p className="text-xs text-muted-foreground">
                Nenhum colaborador de Produção encontrado (cadastre com função “Produção” em Configurações &gt; Colaboradores).
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-2 min-w-0">
            <Label>Prazo de Entrega</Label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            />
          </div>
        </div>

        {/* Uploads selecionados via botões acima */}

        <div className="space-y-2 min-w-0">
          <Label>Observações</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Notas sobre o card..."
            rows={2}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 px-0 sm:px-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="btn-primary">
          {card ? 'Salvar' : 'Criar Card'}
        </Button>
      </div>
    </form>
  );
}
