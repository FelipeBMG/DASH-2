import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Users, Target, DollarSign, Calendar, Trash2, Edit3 } from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TrafficEntry } from '@/types/axion';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const META_TAX_RATE = 12.5;

export function TrafficModule() {
  const { trafficEntries, setTrafficEntries, settings } = useAxion();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TrafficEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    value: '',
    leads: '',
    conversions: '',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: settings.currency,
    }).format(value);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      value: '',
      leads: '',
      conversions: '',
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  const isUuid = useMemo(() => {
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return (value: string) => uuidRe.test(value);
  }, []);

  const getUuid = useMemo(() => {
    // crypto.randomUUID pode falhar em alguns navegadores/ambientes.
    // Geramos um UUID v4 “good enough” como fallback para não quebrar o salvamento no Supabase.
    const fallbackV4 = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
    return () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cryptoAny = (globalThis as any)?.crypto;
        if (cryptoAny?.randomUUID) return cryptoAny.randomUUID() as string;
      } catch {
        // ignore
      }
      return fallbackV4();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) return;
    setSaving(true);
    
    const value = parseFloat(formData.value) || 0;
    const taxValue = value * (META_TAX_RATE / 100);

    // Para integrar com o Supabase (financial_transactions.id é UUID), garantimos um UUID.
    // Se estiver editando um lançamento antigo (id não-uuid do localStorage), migramos para UUID.
    const newId = editingEntry && isUuid(editingEntry.id) ? editingEntry.id : getUuid();
    
    const entryData: TrafficEntry = {
      id: newId,
      date: formData.date,
      value,
      leads: parseInt(formData.leads) || 0,
      conversions: parseInt(formData.conversions) || 0,
      taxRate: META_TAX_RATE,
      taxValue,
      totalWithTax: value + taxValue,
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
    };

    if (editingEntry) {
      setTrafficEntries(prev => prev.map(e => e.id === editingEntry.id ? entryData : e));
    } else {
      setTrafficEntries(prev => [entryData, ...prev]);
    }

    // Persistir o gasto no financeiro (fonte única para o Dashboard)
    // - value: total com imposto (Meta) para refletir o custo real
    // - category: contém "Tráfego" para entrar no filtro de ROI do dashboard
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .upsert(
          {
            id: entryData.id,
            type: 'expense',
            category: 'Tráfego pago',
            cost_center: 'Marketing',
            description: `Meta Ads — ${entryData.leads} leads / ${entryData.conversions} conv`,
            value: Number(entryData.totalWithTax) || 0,
            date: entryData.date,
          },
          { onConflict: 'id' },
        )
        .select('id');

      if (error) {
        // Deixa explícito no console para facilitar debug quando o toast não aparece.
        console.error('[TrafficModule] upsert financial_transactions failed:', error);
        toast({
          title: 'Não foi possível salvar no Financeiro',
          description: error.message,
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      // Em alguns cenários, o upsert pode não retornar dados (dependendo de configuração);
      // mas se retornou vazio, pelo menos garantimos que não houve erro.
      if (Array.isArray(data) && data.length === 0) {
        console.warn('[TrafficModule] upsert ok, mas sem retorno de rows (select id).');
      }
    } catch (err) {
      console.error('[TrafficModule] unexpected error saving financial_transactions:', err);
      toast({
        title: 'Erro inesperado ao salvar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }

    // Forçar atualização imediata do dashboard/financeiro
    void qc.invalidateQueries({ queryKey: ['financial_transactions'] });

    toast({
      title: editingEntry ? 'Lançamento atualizado' : 'Lançamento salvo',
      description: 'O Dashboard já deve refletir o gasto no período selecionado.',
    });

    resetForm();
    setSaving(false);
  };

  const handleEdit = (entry: TrafficEntry) => {
    setFormData({
      date: entry.date,
      value: entry.value.toString(),
      leads: entry.leads.toString(),
      conversions: entry.conversions.toString(),
    });
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      setTrafficEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  // Calculate totals
  const totals = trafficEntries.reduce(
    (acc, entry) => ({
      value: acc.value + entry.value,
      leads: acc.leads + entry.leads,
      conversions: acc.conversions + entry.conversions,
      taxValue: acc.taxValue + entry.taxValue,
      totalWithTax: acc.totalWithTax + entry.totalWithTax,
    }),
    { value: 0, leads: 0, conversions: 0, taxValue: 0, totalWithTax: 0 }
  );

  const costPerLead = totals.leads > 0 ? totals.totalWithTax / totals.leads : 0;
  const conversionRate = totals.leads > 0 ? (totals.conversions / totals.leads) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tráfego Pago</h1>
          <p className="text-muted-foreground">Gestão de gastos com Meta Ads</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingEntry ? 'Editar Lançamento' : 'Lançamento do Dia'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor Gasto (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leads">Leads</Label>
                  <Input
                    id="leads"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.leads}
                    onChange={(e) => setFormData({ ...formData, leads: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conversions">Conversões</Label>
                  <Input
                    id="conversions"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.conversions}
                    onChange={(e) => setFormData({ ...formData, conversions: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Imposto Meta ({META_TAX_RATE}%)</Label>
                  <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted/50 text-muted-foreground">
                    {formatCurrency((parseFloat(formData.value) || 0) * (META_TAX_RATE / 100))}
                  </div>
                </div>
                <div className="lg:col-span-5 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {editingEntry ? 'Salvar Alterações' : 'Salvar Lançamento'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Investido</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.totalWithTax)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(totals.value)} + {formatCurrency(totals.taxValue)} (imposto)
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Leads</p>
                  <p className="text-2xl font-bold">{totals.leads}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CPL: {formatCurrency(costPerLead)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversões</p>
                  <p className="text-2xl font-bold">{totals.conversions}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Taxa: {conversionRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lançamentos</p>
                  <p className="text-2xl font-bold">{trafficEntries.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    dias registrados
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Histórico de Lançamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trafficEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum lançamento registrado</p>
              <p className="text-sm">Clique em "Novo Lançamento" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Imposto ({META_TAX_RATE}%)</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Conversões</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trafficEntries.map((entry) => {
                    const cpl = entry.leads > 0 ? entry.totalWithTax / entry.leads : 0;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {new Date(entry.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.value)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(entry.taxValue)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.totalWithTax)}
                        </TableCell>
                        <TableCell className="text-right">{entry.leads}</TableCell>
                        <TableCell className="text-right">{entry.conversions}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(cpl)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(entry)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
