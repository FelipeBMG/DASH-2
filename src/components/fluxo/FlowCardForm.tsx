import { useState } from 'react';
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
  const [formData, setFormData] = useState({
    date: card?.date || new Date().toISOString().split('T')[0],
    clientName: card?.clientName || '',
    leadsCount: card?.leadsCount || 1,
    quantity: card?.quantity || 1,
    entryValue: card?.entryValue || 0,
    status: card?.status || 'leads' as FlowCardStatus,
    attendantId: card?.attendantId || '',
    attendantName: card?.attendantName || '',
    productionResponsibleId: card?.productionResponsibleId || '',
    productionResponsibleName: card?.productionResponsibleName || '',
    deadline: card?.deadline || '',
    notes: card?.notes || '',
  });

  const handleTeamMemberChange = (field: 'attendant' | 'production', memberId: string) => {
    const member = team.find(m => m.id === memberId);
    if (member) {
      if (field === 'attendant') {
        setFormData(prev => ({
          ...prev,
          attendantId: member.id,
          attendantName: member.name,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          productionResponsibleId: member.id,
          productionResponsibleName: member.name,
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">
        {card ? 'Editar Card' : 'Novo Card'}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
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

      <div className="space-y-2">
        <Label>Cliente</Label>
        <Input
          value={formData.clientName}
          onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
          placeholder="Nome do cliente"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Leads</Label>
          <Input
            type="number"
            min="0"
            value={formData.leadsCount}
            onChange={(e) => setFormData(prev => ({ ...prev, leadsCount: Number(e.target.value) }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Quantidade</Label>
          <Input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
          />
        </div>

        <div className="space-y-2">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Atendente (Colaborador)</Label>
          <Select
            value={formData.attendantId}
            onValueChange={(value) => handleTeamMemberChange('attendant', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o atendente" />
            </SelectTrigger>
            <SelectContent>
              {team.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Produção (Responsável Técnico)</Label>
          <Select
            value={formData.productionResponsibleId}
            onValueChange={(value) => handleTeamMemberChange('production', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent>
              {team.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Prazo de Entrega</Label>
        <Input
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Notas sobre o card..."
          rows={3}
        />
      </div>

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
