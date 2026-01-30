import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Save, Building2, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsModule() {
  const { settings, setSettings } = useAxion();
  
  const [formData, setFormData] = useState({
    companyName: settings.companyName,
    taxRate: settings.taxRate,
    currency: settings.currency,
  });

  const handleSave = () => {
    setSettings({
      companyName: formData.companyName,
      taxRate: formData.taxRate,
      currency: formData.currency,
    });
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <h2 className="text-2xl font-bold text-foreground mb-6">Configurações do Sistema</h2>
        
        <div className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Nome da Empresa/Agência
            </Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Nome da sua empresa"
              className="input-dark"
            />
          </div>

          {/* Tax Rate */}
          <div className="space-y-2">
            <Label htmlFor="taxRate" className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              Taxa de Imposto Base: {formData.taxRate}%
            </Label>
            <Slider
              value={[formData.taxRate]}
              onValueChange={([value]) => setFormData({ ...formData, taxRate: value })}
              max={50}
              step={0.5}
              className="mt-3"
            />
            <p className="text-xs text-muted-foreground">
              Esta taxa será usada no cálculo do lucro líquido real
            </p>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Moeda Padrão
            </Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger className="input-dark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-border">
            <Button onClick={handleSave} className="btn-primary gap-2 w-full">
              <Save className="w-4 h-4" />
              Salvar Configurações
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20"
      >
        <h4 className="font-medium text-primary mb-2">💡 Dica</h4>
        <p className="text-sm text-muted-foreground">
          As configurações definidas aqui afetam diretamente os cálculos financeiros do sistema.
          A taxa de imposto é aplicada automaticamente para calcular o lucro líquido real.
        </p>
      </motion.div>
    </div>
  );
}
