import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Users, Target, DollarSign, Calendar, Trash2, Edit3 } from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TrafficEntry } from '@/types/axion';

const META_TAX_RATE = 12.5;

export function TrafficModule() {
  const { trafficEntries, setTrafficEntries, settings } = useAxion();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TrafficEntry | null>(null);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const value = parseFloat(formData.value) || 0;
    const taxValue = value * (META_TAX_RATE / 100);
    
    const entryData: TrafficEntry = {
      id: editingEntry?.id || Date.now().toString(),
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
    resetForm();
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
                  <Button type="submit">
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
