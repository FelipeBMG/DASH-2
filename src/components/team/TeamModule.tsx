import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreHorizontal,
  Trophy,
  Trash2,
  Mail,
  Edit3
} from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { TeamMemberForm } from './TeamMemberForm';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const levelColors = {
  junior: 'bg-info/20 text-info',
  mid: 'bg-primary/20 text-primary',
  senior: 'bg-warning/20 text-warning',
  lead: 'bg-success/20 text-success',
};

const levelLabels = {
  junior: 'Júnior',
  mid: 'Pleno',
  senior: 'Sênior',
  lead: 'Lead',
};

export function TeamModule() {
  const { team, setTeam, openModal } = useAxion();

  const handleNewMember = () => {
    openModal(<TeamMemberForm />);
  };

  const handleEditMember = (member: typeof team[0]) => {
    openModal(<TeamMemberForm member={member} />);
  };

  const handleDeleteMember = (memberId: string) => {
    if (confirm('Tem certeza que deseja remover este membro?')) {
      setTeam(prev => prev.filter(m => m.id !== memberId));
    }
  };

  const sortedTeam = [...team].sort((a, b) => b.performance - a.performance);
  const totalCost = team.reduce((sum, m) => sum + m.fixedCost, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Equipe</h2>
          <p className="text-muted-foreground">
            {team.length} membros • Custo total: {formatCurrency(totalCost)}/mês
          </p>
        </div>
        <Button onClick={handleNewMember} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Novo Membro
        </Button>
      </div>

      {/* Team Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
        <AnimatePresence mode="popLayout">
          {sortedTeam.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card-hover p-5 relative"
            >
              {/* Ranking Badge */}
              {index < 3 && (
                <div className={cn(
                  "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center",
                  index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                  index === 1 ? "bg-gray-300/20 text-gray-300" :
                  "bg-orange-400/20 text-orange-400"
                )}>
                  <Trophy className="w-4 h-4" />
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary-foreground">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground truncate">{member.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                  <span className={cn("status-badge mt-1", levelColors[member.level])}>
                    {levelLabels[member.level]}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditMember(member)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteMember(member.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Mail className="w-4 h-4" />
                <span className="truncate">{member.email}</span>
              </div>

              {/* Performance */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Performance</span>
                  <span className="font-medium text-foreground">{member.performance}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${member.performance}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={cn(
                      "h-full rounded-full",
                      member.performance >= 80 ? "bg-success" :
                      member.performance >= 60 ? "bg-warning" :
                      "bg-destructive"
                    )}
                  />
                </div>
              </div>

              {/* Financial */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Custo Fixo</p>
                  <p className="font-semibold text-foreground">{formatCurrency(member.fixedCost)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Comissão</p>
                  <p className="font-semibold text-foreground">{member.commission}%</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {team.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum membro cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
