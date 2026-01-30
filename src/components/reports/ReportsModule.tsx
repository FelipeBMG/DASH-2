import { motion } from 'framer-motion';
import { 
  FileText, 
  Download,
  Printer
} from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const COLORS = ['hsl(174, 72%, 50%)', 'hsl(142, 72%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(217, 91%, 60%)'];

export function ReportsModule() {
  const { transactions, metrics, projects, settings } = useAxion();

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.value, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.value, 0);
  const taxAmount = totalIncome * (settings.taxRate / 100);
  const netProfit = totalIncome - totalExpenses - taxAmount;

  // Group expenses by category for pie chart
  const expensesByCategory = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.value;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  // Monthly data for bar chart
  const barData = [
    { name: 'Faturamento', value: totalIncome, fill: 'hsl(142, 72%, 45%)' },
    { name: 'Despesas', value: totalExpenses, fill: 'hsl(0, 72%, 51%)' },
    { name: 'Impostos', value: taxAmount, fill: 'hsl(38, 92%, 50%)' },
    { name: 'Lucro Líquido', value: Math.max(0, netProfit), fill: 'hsl(174, 72%, 50%)' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
          <p className="text-muted-foreground">Demonstrativo de Resultados (DRE)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* DRE Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          DRE - {settings.companyName}
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-foreground font-medium">Receita Bruta</span>
            <span className="text-foreground font-semibold">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted-foreground">(-) Despesas Operacionais</span>
            <span className="text-destructive">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted-foreground">(-) Impostos ({settings.taxRate}%)</span>
            <span className="text-warning">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between items-center py-3 bg-primary/10 rounded-lg px-4 -mx-4">
            <span className="text-foreground font-semibold text-lg">Lucro Líquido</span>
            <span className={`font-bold text-xl ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(netProfit)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Expense Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Distribuição de Despesas</h3>
          
          {pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Nenhuma despesa registrada
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(222 47% 10%)', 
                    border: '1px solid hsl(222 30% 16%)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Income vs Expenses */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Resumo Financeiro</h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 20%)" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(215 20% 55%)"
                tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(215 20% 55%)"
                tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }}
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(222 47% 10%)', 
                  border: '1px solid hsl(222 30% 16%)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
