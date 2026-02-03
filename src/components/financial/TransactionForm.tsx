import { useState } from 'react';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Transaction } from '@/types/axion';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const incomeCategories = [
  'Projeto',
  'Fee Mensal',
  'Consultoria',
  'Recebimento de Projeto',
  'Outros',
];

const expenseCategories = [
  'Salários',
  'Ferramentas',
  'Marketing',
  'Infraestrutura',
  'Impostos',
  'Freelancers',
  'Outros',
];

interface TransactionFormProps {
  defaultType?: 'income' | 'expense';
  transaction?: Transaction;
}

export function TransactionForm({ defaultType = 'income', transaction }: TransactionFormProps) {
  const { setTransactions, closeModal } = useAxion();
  const qc = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!transaction;
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    type: transaction?.type || defaultType,
    category: transaction?.category || '',
    description: transaction?.description || '',
    value: transaction?.value?.toString() || '',
    pendingValue: transaction?.pendingValue?.toString() || '',
    date: transaction?.date || new Date().toISOString().split('T')[0],
  });

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) return;
    setSaving(true);
    
    const transactionData: Transaction = {
      id: transaction?.id || crypto.randomUUID(),
      type: formData.type,
      category: formData.category,
      description: formData.description,
      value: parseFloat(formData.value) || 0,
      receivedValue: parseFloat(formData.value) || 0,
      pendingValue: formData.type === 'income' ? (parseFloat(formData.pendingValue) || 0) : 0,
      date: formData.date,
      projectId: transaction?.projectId,
    };

    if (isEditing) {
      setTransactions(prev => prev.map(t => t.id === transaction.id ? transactionData : t));
    } else {
      setTransactions(prev => [...prev, transactionData]);
    }

    // Persistir no Supabase para alimentar Dashboard/Relatórios
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .upsert(
          {
            id: transactionData.id,
            type: transactionData.type,
            category: transactionData.category,
            cost_center: 'Geral',
            description: transactionData.description,
            // Conforme definido: `value` = valor recebido
            value: Number(transactionData.receivedValue) || 0,
            received_value: Number(transactionData.receivedValue) || 0,
            pending_value: Number(transactionData.pendingValue) || 0,
            date: transactionData.date,
          },
          { onConflict: 'id' },
        );

      if (error) {
        console.error('[TransactionForm] upsert financial_transactions failed:', error);
        toast({
          title: 'Não foi possível salvar no Financeiro (Supabase)',
          description: error.message,
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      void qc.invalidateQueries({ queryKey: ['financial_transactions'] });
      closeModal();
    } catch (err) {
      console.error('[TransactionForm] unexpected error saving financial_transactions:', err);
      toast({
        title: 'Erro inesperado ao salvar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }

    setSaving(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {isEditing 
          ? 'Editar Transação' 
          : formData.type === 'income' ? 'Nova Entrada' : 'Nova Despesa'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'income' | 'expense') =>
                setFormData({
                  ...formData,
                  type: value,
                  category: '',
                  pendingValue: value === 'income' ? formData.pendingValue : '',
                })
              }
            >
              <SelectTrigger className="input-dark mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Entrada</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="input-dark mt-1.5">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="value">{formData.type === 'income' ? 'Valor recebido (R$)' : 'Valor (R$)'}</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="0,00"
              className="input-dark mt-1.5"
              required
            />
          </div>

          {formData.type === 'income' ? (
            <div>
              <Label htmlFor="pendingValue">Valor a receber (R$)</Label>
              <Input
                id="pendingValue"
                type="number"
                step="0.01"
                value={formData.pendingValue}
                onChange={(e) => setFormData({ ...formData, pendingValue: e.target.value })}
                placeholder="0,00"
                className="input-dark mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Opcional — se vazio, fica 0.
              </p>
            </div>
          ) : null}

          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-dark mt-1.5"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da transação..."
              className="input-dark mt-1.5 min-h-[80px]"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="submit" className="btn-primary" disabled={saving}>
            {isEditing ? 'Salvar Alterações' : 'Registrar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
