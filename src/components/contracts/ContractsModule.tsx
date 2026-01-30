import { motion } from 'framer-motion';
import { 
  FileText, 
  Download,
  Building2,
  Calendar,
  DollarSign,
  User
} from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function ContractsModule() {
  const { projects, settings } = useAxion();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [contractType, setContractType] = useState<'single' | 'monthly'>('single');
  const [months, setMonths] = useState<string>('1');
  const [paymentMethod, setPaymentMethod] = useState<string>('pix');

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handlePrint = () => {
    window.print();
  };

  const getContractTotal = () => {
    if (!selectedProject) return 0;
    if (contractType === 'single') return selectedProject.totalValue;
    return selectedProject.totalValue * parseInt(months);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Contratos</h2>
          <p className="text-muted-foreground">Gere contratos para seus projetos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Configuração do Contrato</h3>
          
          <div className="space-y-6">
            <div>
              <Label>Projeto</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="input-dark mt-1.5">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum projeto cadastrado</SelectItem>
                  ) : (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title} - {project.client}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Contrato</Label>
              <Select value={contractType} onValueChange={(v: 'single' | 'monthly') => setContractType(v)}>
                <SelectTrigger className="input-dark mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Serviço Único</SelectItem>
                  <SelectItem value="monthly">Recorrência Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {contractType === 'monthly' && (
              <div>
                <Label>Duração (meses)</Label>
                <Select value={months} onValueChange={setMonths}>
                  <SelectTrigger className="input-dark mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mês</SelectItem>
                    <SelectItem value="2">2 meses</SelectItem>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="4">4 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Método de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="input-dark mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credit">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Valor Total do Contrato:</span>
                <span className="text-2xl font-bold text-foreground">{formatCurrency(getContractTotal())}</span>
              </div>
              <Button onClick={handlePrint} className="btn-primary gap-2 w-full" disabled={!selectedProject}>
                <Download className="w-4 h-4" />
                Gerar Contrato PDF
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 overflow-auto"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Preview do Contrato</h3>
          
          {!selectedProject ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Selecione um projeto para visualizar o contrato</p>
            </div>
          ) : (
            <div className="bg-white text-black p-6 rounded-lg font-serif text-sm space-y-4">
              <div className="text-center border-b border-gray-300 pb-4">
                <h1 className="text-xl font-bold">{settings.companyName}</h1>
                <p className="text-gray-600">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span><strong>Contratante:</strong> {selectedProject.client}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span><strong>Projeto:</strong> {selectedProject.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span>
                    <strong>Valor:</strong> {formatCurrency(getContractTotal())}
                    {contractType === 'monthly' && ` (${months}x de ${formatCurrency(selectedProject.totalValue)})`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span><strong>Tipo:</strong> {contractType === 'single' ? 'Serviço Único' : `Recorrência de ${months} meses`}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-300">
                <p className="text-xs text-gray-600">
                  O presente contrato tem por objeto a prestação de serviços especializados conforme
                  briefing acordado entre as partes. O pagamento será realizado via {paymentMethod.toUpperCase()}.
                </p>
              </div>

              <div className="pt-6 flex justify-between">
                <div className="text-center">
                  <div className="border-t border-black w-40 mb-1"></div>
                  <span className="text-xs">{settings.companyName}</span>
                </div>
                <div className="text-center">
                  <div className="border-t border-black w-40 mb-1"></div>
                  <span className="text-xs">{selectedProject.client}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
