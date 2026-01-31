import { useEffect, useMemo, useState } from 'react';
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
import type { FlowCard, FlowCardStatus } from '@/types/axion';
import { getAuthState } from '@/lib/auth';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type SellerEntry = { id: string; name: string; role?: 'vendedor' | 'admin' };
const DEFAULT_SELLERS: SellerEntry[] = [{ id: 'seller:vendedor', name: 'vendedor', role: 'vendedor' }];

interface FlowCardFormProps {
  card?: FlowCard;
  onSubmit: (card: Omit<FlowCard, 'id' | 'createdAt' | 'updatedAt'>) => void;
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

export function FlowCardForm({ card, onSubmit, onCancel }: FlowCardFormProps) {
  const { team } = useAxion();
  const authUser = getAuthState().user;
  const [sellers] = useLocalStorage<SellerEntry[]>('axion_sellers', DEFAULT_SELLERS);

  const [formData, setFormData] = useState({
    date: card?.date || new Date().toISOString().split('T')[0],
    clientName: card?.clientName || '',
    leadsCount: card?.leadsCount || 1,
    quantity: card?.quantity || 1,
    entryValue: card?.entryValue || 0,
    status: card?.status || 'leads' as FlowCardStatus,
    createdById: card?.createdById || authUser?.id || '',
    createdByName: card?.createdByName || authUser?.name || '',
    attendantId: card?.attendantId || (authUser?.role === 'seller' ? authUser.id : ''),
    attendantName: card?.attendantName || (authUser?.role === 'seller' ? authUser.name : ''),
    productionResponsibleId: card?.productionResponsibleId || '',
    productionResponsibleName: card?.productionResponsibleName || '',
    deadline: card?.deadline || '',
    notes: card?.notes || '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

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

  const teamOptions = useMemo(() => team, [team]);
  const sellerOptions = useMemo(() => sellers.filter((s) => (s.role ?? 'vendedor') === 'vendedor'), [sellers]);

  const handleSellerChange = (sellerId: string) => {
    const seller = sellerOptions.find((s) => s.id === sellerId);
    if (!seller) return;

    setFormData((prev) => ({
      ...prev,
      attendantId: seller.id,
      attendantName: seller.name,
    }));
  };

  const handleProductionChange = (memberId: string) => {
    const member = teamOptions.find((m) => m.id === memberId);
    if (!member) return;

    setFormData((prev) => ({
      ...prev,
      productionResponsibleId: member.id,
      productionResponsibleName: member.name,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 px-1 sm:px-2 md:px-0"
    >
      <header className="space-y-1 px-1 sm:px-2 md:px-0">
        <h2 className="text-xl font-bold text-foreground">
          {card ? 'Editar Card' : 'Novo Card'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Preencha os dados do lead e do processo. (Uploads serão integrados futuramente.)
        </p>
      </header>

      <section className="glass-card p-5 sm:p-6 space-y-4 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="space-y-2 min-w-0">
          <Label>Cliente</Label>
          <Input
            value={formData.clientName}
            onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
            placeholder="Nome do cliente"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 min-w-0">
            <Label>Leads</Label>
            <Input
              type="number"
              min="0"
              value={formData.leadsCount}
              onChange={(e) => setFormData(prev => ({ ...prev, leadsCount: Number(e.target.value) }))}
            />
          </div>

          <div className="space-y-2 min-w-0">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
            />
          </div>

          <div className="space-y-2 min-w-0">
            <Label>Valor de Entrada (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.entryValue}
              onChange={(e) => setFormData(prev => ({ ...prev, entryValue: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2 min-w-0">
            <Label>Produção (Responsável Técnico)</Label>
            <Select
              value={formData.productionResponsibleId}
              onValueChange={handleProductionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {teamOptions.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 min-w-0">
            <Label>Prazo de Entrega</Label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            />
          </div>

          <div className="space-y-2 min-w-0">
            <Label>Uploads (Imagem / Áudio)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="space-y-2 min-w-0">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="min-w-0"
                />
                {imagePreviewUrl ? (
                  <div className="rounded-lg border border-border/60 bg-secondary/20 p-2">
                    <img
                      src={imagePreviewUrl}
                      alt="Prévia da imagem selecionada"
                      className="h-24 w-full object-cover rounded-md"
                      loading="lazy"
                    />
                    <p className="mt-2 text-xs text-muted-foreground truncate">
                      {imageFile?.name}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sem imagem selecionada</p>
                )}
              </div>

              <div className="space-y-2 min-w-0">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                  className="min-w-0"
                />
                {audioFile ? (
                  <div className="rounded-lg border border-border/60 bg-secondary/20 p-2">
                    <audio controls className="w-full">
                      {audioPreviewUrl ? <source src={audioPreviewUrl} /> : null}
                    </audio>
                    <p className="mt-2 text-xs text-muted-foreground truncate">{audioFile.name}</p>
                    <p className="text-[11px] text-muted-foreground">(Arquivo não é salvo ainda)</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sem áudio selecionado</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 min-w-0">
          <Label>Observações</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Notas sobre o card..."
            rows={3}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4">
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
