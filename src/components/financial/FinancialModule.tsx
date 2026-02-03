import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
  Check,
  Edit3,
  Trash2
} from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionForm } from './TransactionForm';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Project, Transaction } from '@/types/axion';
import { useFinancialTransactions } from '@/hooks/useFinancialTransactions';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function FinancialModule() {
  const { projects, openModal } = useAxion();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: financialTx = [], isLoading, error } = useFinancialTransactions();
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteTxId, setPendingDeleteTxId] = useState<string | null>(null);

  const handleNewTransaction = (type: 'income' | 'expense') => {
    openModal(<TransactionForm defaultType={type} />);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    openModal(<TransactionForm transaction={transaction} />);
  };

  const performDeleteTransaction = (transactionId: string) => {
    void (async () => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) {
        console.error('[FinancialModule] delete financial_transactions failed:', error);
        toast({
          title: 'Não foi possível excluir a transação',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      void qc.invalidateQueries({ queryKey: ['financial_transactions'] });
    })();
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setPendingDeleteTxId(transactionId);
    setDeleteDialogOpen(true);
  };

  const transactions: Transaction[] = financialTx.map((t) => ({
    id: t.id,
    type: t.type,
    category: t.category,
    description: t.description,
    value: Number(t.value) || 0,
    date: t.date,
    projectId: undefined,
    receivedValue: Number(t.receivedValue ?? t.value) || 0,
    pendingValue: Number(t.pendingValue) || 0,
  }));

  const incomeTransactions = transactions.filter((t) => t.type === 'income');
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.value, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.value, 0);
  const balance = totalIncome - totalExpenses;

  const pendingProjects = projects.filter(p => p.totalValue > p.paidValue);
  const totalReceivables = pendingProjects.reduce((sum, p) => sum + (p.totalValue - p.paidValue), 0);

  // Group expenses by category
  const expensesByCategory = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.value;
    return acc;
  }, {} as Record<string, number>);

  const sortedExpenseCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="h-full flex flex-col">
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setPendingDeleteTxId(null);
        }}
        title="Excluir transação?"
        description="Essa ação não pode ser desfeita."
        cancelText="Cancelar"
        confirmText="Excluir"
        confirmVariant="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onConfirm={() => {
          if (!pendingDeleteTxId) return;
          const id = pendingDeleteTxId;
          setDeleteDialogOpen(false);
          setPendingDeleteTxId(null);
          performDeleteTransaction(id);
        }}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="transactions">Extrato</TabsTrigger>
            <TabsTrigger value="receivables">A Receber</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button 
              onClick={() => handleNewTransaction('income')} 
              className="bg-success hover:bg-success/90 text-success-foreground gap-2"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Entrada
            </Button>
            <Button 
              onClick={() => handleNewTransaction('expense')} 
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10 gap-2"
            >
              <ArrowDownCircle className="w-4 h-4" />
              Despesa
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 mt-0">
          {error ? (
            <div className="glass-card p-6 mb-6">
              <p className="text-sm text-destructive">Erro ao carregar transações do Supabase.</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'Tente novamente.'}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="metric-card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento Bruto</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalIncome)}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="metric-card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Despesas</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="metric-card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  balance >= 0 ? "bg-primary/20" : "bg-destructive/20"
                )}>
                  <Wallet className={cn("w-6 h-6", balance >= 0 ? "text-primary" : "text-destructive")} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    balance >= 0 ? "text-foreground" : "text-destructive"
                  )}>
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="metric-card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalReceivables)}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Expense Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Distribuição de Custos</h3>
              
              {sortedExpenseCategories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma despesa registrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedExpenseCategories.map(([category, value]) => {
                    const percentage = totalExpenses > 0 ? (value / totalExpenses) * 100 : 0;
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground font-medium">{category}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(value)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Últimas Transações</h3>
              
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Carregando transações…</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma transação registrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          transaction.type === 'income' ? "bg-success/20" : "bg-destructive/20"
                        )}>
                          {transaction.type === 'income' ? (
                            <ArrowUpCircle className="w-5 h-5 text-success" />
                          ) : (
                            <ArrowDownCircle className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">{transaction.category}</p>
                          {transaction.type === 'income' && (transaction.pendingValue ?? 0) > 0 ? (
                            <p className="text-xs text-muted-foreground">
                              A receber: {formatCurrency(transaction.pendingValue ?? 0)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className={cn(
                            "font-semibold",
                            transaction.type === 'income' ? "text-success" : "text-destructive"
                          )}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.value)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(transaction.date), 'dd/MM', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditTransaction(transaction)}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="flex-1 mt-0">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Extrato Completo</h3>
            
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Carregando extrato…</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma transação registrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        transaction.type === 'income' ? "bg-success/20" : "bg-destructive/20"
                      )}>
                        {transaction.type === 'income' ? (
                          <ArrowUpCircle className="w-5 h-5 text-success" />
                        ) : (
                          <ArrowDownCircle className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{transaction.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {transaction.category}
                          </span>
                          {transaction.type === 'income' && (transaction.pendingValue ?? 0) > 0 ? (
                            <span className="text-xs text-muted-foreground">
                              A receber: {formatCurrency(transaction.pendingValue ?? 0)}
                            </span>
                          ) : null}
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(transaction.date), "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={cn(
                        "text-lg font-semibold",
                        transaction.type === 'income' ? "text-success" : "text-destructive"
                      )}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.value)}
                      </p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditTransaction(transaction)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Receivables Tab */}
        <TabsContent value="receivables" className="flex-1 mt-0">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Projetos a Receber</h3>
            
            {pendingProjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum projeto com pagamento pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingProjects.map((project) => {
                  const pending = project.totalValue - project.paidValue;
                  const progress = (project.paidValue / project.totalValue) * 100;
                  
                  return (
                    <ReceivableCard 
                      key={project.id}
                      project={project}
                      pending={pending}
                      progress={progress}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


// Componente para cada projeto a receber com opção de marcar como recebido
function ReceivableCard({ 
  project, 
  pending, 
  progress 
}: { 
  project: Project; 
  pending: number; 
  progress: number; 
}) {
  const { setProjects } = useAxion();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleReceivePayment = (amount: number) => {
    // Atualiza o projeto
    setProjects(prev => prev.map(p => {
      if (p.id === project.id) {
        const newPaidValue = Math.min(p.paidValue + amount, p.totalValue);
        return {
          ...p,
          paidValue: newPaidValue,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    }));

    // Cria transação de entrada no Supabase (fonte da verdade)
    void (async () => {
      const txId = crypto.randomUUID();
      const txDate = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('financial_transactions')
        .upsert(
          {
            id: txId,
            type: 'income',
            category: 'Recebimento de Projeto',
            cost_center: 'Geral',
            description: `Pagamento: ${project.title}`,
            value: Number(amount) || 0,
            received_value: Number(amount) || 0,
            pending_value: 0,
            date: txDate,
          },
          { onConflict: 'id' },
        );

      if (error) {
        console.error('[ReceivableCard] upsert financial_transactions failed:', error);
        toast({
          title: 'Não foi possível registrar o recebimento',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      void qc.invalidateQueries({ queryKey: ['financial_transactions'] });
    })();

    setIsEditing(false);
    setCustomValue('');
  };

  const handleReceiveTotal = () => {
    handleReceivePayment(pending);
  };

  const handleReceiveCustom = () => {
    const value = parseFloat(customValue);
    if (value > 0 && value <= pending) {
      handleReceivePayment(value);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-secondary/50">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-foreground">{project.title}</p>
          <p className="text-sm text-muted-foreground">{project.client}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-warning">{formatCurrency(pending)}</p>
          <p className="text-xs text-muted-foreground">a receber</p>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Pago: {formatCurrency(project.paidValue)}</span>
          <span>Total: {formatCurrency(project.totalValue)}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-success to-primary rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Ações de recebimento */}
      {!isEditing ? (
        <div className="flex gap-2 pt-3 border-t border-border">
          <Button
            size="sm"
            onClick={handleReceiveTotal}
            className="flex-1 bg-success hover:bg-success/90 text-success-foreground gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            Receber Total
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="flex-1 gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Valor Específico
          </Button>
        </div>
      ) : (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              max={pending}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder={`Máx: ${formatCurrency(pending)}`}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleReceiveCustom}
              disabled={!customValue || parseFloat(customValue) <= 0 || parseFloat(customValue) > pending}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setIsEditing(false); setCustomValue(''); }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
