import { useState } from 'react';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { TeamMember } from '@/types/axion';

const roles = [
  'Designer',
  'Desenvolvedor',
  'Gerente de Projetos',
  'Marketing',
  'Copywriter',
  'Videomaker',
  'Social Media',
  'Atendimento',
];

interface TeamMemberFormProps {
  member?: TeamMember;
}

export function TeamMemberForm({ member }: TeamMemberFormProps) {
  const { setTeam, closeModal } = useAxion();
  const isEditing = !!member;
  
  const [formData, setFormData] = useState({
    name: member?.name || '',
    email: member?.email || '',
    role: member?.role || '',
    level: (member?.level || 'mid') as 'junior' | 'mid' | 'senior' | 'lead',
    commission: member?.commission ?? 5,
    fixedCost: member?.fixedCost?.toString() || '',
    performance: member?.performance ?? 75,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const memberData: TeamMember = {
      id: member?.id || crypto.randomUUID(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      level: formData.level,
      commission: formData.commission,
      fixedCost: parseFloat(formData.fixedCost) || 0,
      performance: formData.performance,
      avatar: member?.avatar,
    };

    if (isEditing) {
      setTeam(prev => prev.map(m => m.id === member.id ? memberData : m));
    } else {
      setTeam(prev => [...prev, memberData]);
    }
    closeModal();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {isEditing ? 'Editar Membro' : 'Novo Membro'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
              className="input-dark mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              className="input-dark mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Cargo</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger className="input-dark mt-1.5">
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="level">Nível</Label>
            <Select
              value={formData.level}
              onValueChange={(value: 'junior' | 'mid' | 'senior' | 'lead') => 
                setFormData({ ...formData, level: value })
              }
            >
              <SelectTrigger className="input-dark mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="junior">Júnior</SelectItem>
                <SelectItem value="mid">Pleno</SelectItem>
                <SelectItem value="senior">Sênior</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fixedCost">Custo Fixo Mensal (R$)</Label>
            <Input
              id="fixedCost"
              type="number"
              step="0.01"
              value={formData.fixedCost}
              onChange={(e) => setFormData({ ...formData, fixedCost: e.target.value })}
              placeholder="0,00"
              className="input-dark mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="commission">Comissão (%): {formData.commission}%</Label>
            <Slider
              value={[formData.commission]}
              onValueChange={([value]) => setFormData({ ...formData, commission: value })}
              max={20}
              step={1}
              className="mt-3"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="performance">Performance: {formData.performance}%</Label>
            <Slider
              value={[formData.performance]}
              onValueChange={([value]) => setFormData({ ...formData, performance: value })}
              max={100}
              step={1}
              className="mt-3"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="submit" className="btn-primary">
            {isEditing ? 'Salvar Alterações' : 'Adicionar Membro'}
          </Button>
        </div>
      </form>
    </div>
  );
}
