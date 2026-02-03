import { motion } from 'framer-motion';
import { 
  FileText, 
  Printer
} from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFlowCards } from '@/hooks/useFlowCards';
import { useFinancialTransactions } from '@/hooks/useFinancialTransactions';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useCollaboratorsAdmin } from '@/hooks/useCollaboratorsAdmin';
import { exportDreAsPrintablePdf } from '@/lib/dreExport';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

function withinRange(isoDate: string, start: string, end: string) {
  // ISO yyyy-mm-dd string compare works lexicographically.
  return isoDate >= start && isoDate <= end;
}

function daysBetweenInclusive(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1);
}

function daysInMonthForISO(isoDate: string) {
  const d = new Date(isoDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  return new Date(year, month + 1, 0).getDate();
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--info))',
];

function renderPieLabel(props: { cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number; name?: string }) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0, name = '' } = props;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const RADIAN = Math.PI / 180;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent <= 0.04) return null; // evita texto espremido

  return (
    <text
      x={x}
      y={y}
      fill={'hsl(var(--foreground))'}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name} (${Math.round(percent * 100)}%)`}
    </text>
  );
}

export function ReportsModule() {
  const { dateRange } = useAxion();
  const { data: flowCards = [] } = useFlowCards();
  const { data: financialTx = [] } = useFinancialTransactions();
  const { data: appSettings } = useAppSettings();
  const { data: collaborators = [] } = useCollaboratorsAdmin();

  const companyName = appSettings?.companyName ?? 'Empresa';
  const taxRate = appSettings?.taxRate ?? 15;

  // Receita (serviços): Flow Cards em produção + concluído, no período (comparando updatedAt)
  const serviceRevenue = flowCards
    .filter(
      (c) =>
        (c.status === 'em_producao' || c.status === 'concluido') &&
        withinRange((c.updatedAt || '').slice(0, 10), dateRange.start, dateRange.end),
    )
    .reduce((sum, c) => sum + (Number(c.entryValue) || 0), 0);

  // Entradas/Saídas (Financeiro): no período
  const incomeTransactions = financialTx
    .filter((t) => t.type === 'income' && withinRange(t.date, dateRange.start, dateRange.end));
  const expenseTransactions = financialTx
    .filter((t) => t.type === 'expense' && withinRange(t.date, dateRange.start, dateRange.end));

  const totalIncomeTransactions = incomeTransactions.reduce((sum, t) => sum + (Number(t.value) || 0), 0);
  const totalExpenseTransactions = expenseTransactions.reduce((sum, t) => sum + (Number(t.value) || 0), 0);

  // Receita Bruta total (serviços + outras entradas)
  const totalIncome = serviceRevenue + totalIncomeTransactions;

  // Impostos sobre a receita
  const taxAmount = totalIncome * (taxRate / 100);

  // Fixos (equipe): rateado por período
  const days = daysBetweenInclusive(dateRange.start, dateRange.end);
  const monthDays = daysInMonthForISO(dateRange.start);
  const prorationFactor = monthDays > 0 ? Math.min(1, days / monthDays) : 1;
  const fixedCost = collaborators.reduce((sum, c) => sum + (Number(c.commissionFixed) || 0), 0) * prorationFactor;

  // Comissões pagas (variável): % * valor finalizado (somente cards concluídos) no período
  const finalizedCardsInRange = flowCards.filter(
    (c) => c.status === 'concluido' && withinRange((c.updatedAt || '').slice(0, 10), dateRange.start, dateRange.end),
  );
  const commissionPaid = finalizedCardsInRange.reduce((sum, c) => {
    const sellerId = c.attendantId;
    const percent = Number(collaborators.find((col) => col.user_id === sellerId)?.commissionPercent ?? 0);
    return sum + (Number(c.entryValue) || 0) * (percent / 100);
  }, 0);

  // Despesas operacionais (sem imposto): saídas do financeiro + fixos rateados + comissões
  const operationalExpenses = totalExpenseTransactions + fixedCost + commissionPaid;
  const totalExpenses = operationalExpenses + taxAmount;
  const netProfit = totalIncome - operationalExpenses - taxAmount;

  // Group expenses by category for pie chart
  const expensesByCategory = expenseTransactions.reduce((acc, t) => {
    const key = (t.category || 'Outros').trim() || 'Outros';
    acc[key] = (acc[key] || 0) + (Number(t.value) || 0);
    return acc;
  }, {} as Record<string, number>);

  // Itens que não vêm como transação (e para manter a visualização completa): impostos, fixos e comissão
  if (taxAmount > 0) expensesByCategory['Impostos'] = (expensesByCategory['Impostos'] || 0) + taxAmount;
  if (fixedCost > 0) expensesByCategory['Fixos (equipe)'] = (expensesByCategory['Fixos (equipe)'] || 0) + fixedCost;
  if (commissionPaid > 0) expensesByCategory['Comissões (variável)'] = (expensesByCategory['Comissões (variável)'] || 0) + commissionPaid;

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  // Monthly data for bar chart
  const barData = [
    { name: 'Receitas', value: totalIncome, fill: 'hsl(var(--success))' },
    { name: 'Despesas (operacionais)', value: operationalExpenses, fill: 'hsl(var(--destructive))' },
    { name: 'Impostos', value: taxAmount, fill: 'hsl(var(--warning))' },
    { name: 'Lucro Líquido', value: netProfit, fill: 'hsl(var(--primary))' },
  ];

  const handleExportDre = () => {
    const periodLabel = `Período: ${dateRange.start} a ${dateRange.end}`;
    exportDreAsPrintablePdf({
      title: `DRE — ${companyName}`,
      subtitle: 'Demonstrativo de Resultados (DRE)',
      periodLabel,
      fileName: `DRE-${companyName}-${dateRange.start}-${dateRange.end}`,
      rows: [
        { label: 'Receita Bruta', value: formatCurrency(totalIncome) },
        { label: '(-) Despesas Operacionais', value: formatCurrency(operationalExpenses), tone: 'destructive' },
        { label: `(-) Impostos (${taxRate}%)`, value: formatCurrency(taxAmount), tone: 'warning' },
        { label: 'Lucro Líquido', value: formatCurrency(netProfit), tone: netProfit >= 0 ? 'success' : 'destructive' },
        { label: 'Receita (serviços)', value: formatCurrency(serviceRevenue), tone: 'muted' },
        { label: 'Fixos (equipe) — rateado', value: formatCurrency(fixedCost), tone: 'muted' },
        { label: 'Comissões (variável)', value: formatCurrency(commissionPaid), tone: 'muted' },
        { label: 'Entradas (financeiro)', value: formatCurrency(totalIncomeTransactions), tone: 'muted' },
        { label: 'Saídas (financeiro)', value: formatCurrency(totalExpenseTransactions), tone: 'muted' },
      ],
    });
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
          <Button variant="outline" onClick={handleExportDre} className="gap-2">
            <Printer className="w-4 h-4" />
            Exportar DRE
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
          DRE - {companyName}
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-foreground font-medium">Receita Bruta</span>
            <span className="text-foreground font-semibold">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted-foreground">(-) Despesas Operacionais</span>
            <span className="text-destructive">{formatCurrency(operationalExpenses)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted-foreground">(-) Impostos ({taxRate}%)</span>
            <span className="text-warning">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between items-center py-3 bg-primary/10 rounded-lg px-4 -mx-4">
            <span className="text-foreground font-semibold text-lg">Lucro Líquido</span>
            <span className={`font-bold text-xl ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(netProfit)}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground">Receita (serviços)</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(serviceRevenue)}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground">Fixos (equipe) — rateado</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(fixedCost)}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground">Comissões (variável)</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(commissionPaid)}</p>
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
                  label={renderPieLabel as never}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
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
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                cursor={false}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
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
