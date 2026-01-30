import { useState, useRef } from 'react';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image, Music, X } from 'lucide-react';
import type { Project, ProjectAttachment } from '@/types/axion';

interface ProjectFormProps {
  project?: Project;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const { setProjects, clients, team, closeModal } = useAxion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!project;
  
  const [formData, setFormData] = useState({
    title: project?.title || '',
    client: project?.client || '',
    clientId: project?.clientId || '',
    responsible: project?.responsible || '',
    responsibleId: project?.responsibleId || '',
    totalValue: project?.totalValue?.toString() || '',
    paidValue: project?.paidValue?.toString() || '0',
    billingType: (project?.billingType || 'single') as 'single' | 'monthly' | 'pending',
    deadline: project?.deadline || '',
    paymentForecast: project?.paymentForecast || '',
    briefing: project?.briefing || '',
    productQuantity: project?.productQuantity?.toString() || '1',
  });

  const [attachments, setAttachments] = useState<ProjectAttachment[]>(project?.attachments || []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      
      if (isImage || isAudio) {
        const attachment: ProjectAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: isImage ? 'image' : 'audio',
          url: URL.createObjectURL(file),
        };
        setAttachments(prev => [...prev, attachment]);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData: Project = {
      id: project?.id || crypto.randomUUID(),
      title: formData.title,
      client: formData.client || 'Cliente não definido',
      clientId: formData.clientId,
      responsible: formData.responsible || 'Não atribuído',
      responsibleId: formData.responsibleId,
      totalValue: parseFloat(formData.totalValue) || 0,
      paidValue: parseFloat(formData.paidValue) || 0,
      billingType: formData.billingType,
      deadline: formData.deadline,
      paymentForecast: formData.paymentForecast,
      briefing: formData.briefing,
      status: project?.status || 'backlog',
      productQuantity: parseInt(formData.productQuantity) || 1,
      attachments: attachments,
      createdAt: project?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isEditing) {
      setProjects(prev => prev.map(p => p.id === project.id ? projectData : p));
    } else {
      setProjects(prev => [...prev, projectData]);
    }
    closeModal();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {isEditing ? 'Editar Projeto' : 'Novo Projeto'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="title">Nome do Projeto</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Redesign do Website"
              className="input-dark mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              placeholder="Nome do cliente"
              className="input-dark mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="responsible">Responsável</Label>
            <Select
              value={formData.responsibleId}
              onValueChange={(value) => {
                const member = team.find(m => m.id === value);
                setFormData({ 
                  ...formData, 
                  responsibleId: value,
                  responsible: member?.name || ''
                });
              }}
            >
              <SelectTrigger className="input-dark mt-1.5">
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {team.length === 0 ? (
                  <SelectItem value="none" disabled>Nenhum membro cadastrado</SelectItem>
                ) : (
                  team.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="totalValue">Valor Total (R$)</Label>
            <Input
              id="totalValue"
              type="number"
              step="0.01"
              value={formData.totalValue}
              onChange={(e) => setFormData({ ...formData, totalValue: e.target.value })}
              placeholder="0,00"
              className="input-dark mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="billingType">Tipo de Cobrança</Label>
            <Select
              value={formData.billingType}
              onValueChange={(value: 'single' | 'monthly' | 'pending') => setFormData({ ...formData, billingType: value })}
            >
              <SelectTrigger className="input-dark mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Pagamento Único</SelectItem>
                <SelectItem value="monthly">Mensal (Fee)</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="paidValue">Valor já Recebido (R$)</Label>
            <Input
              id="paidValue"
              type="number"
              step="0.01"
              value={formData.paidValue}
              onChange={(e) => setFormData({ ...formData, paidValue: e.target.value })}
              placeholder="0,00"
              className="input-dark mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="productQuantity">Quantidade de Produtos</Label>
            <Input
              id="productQuantity"
              type="number"
              min="1"
              value={formData.productQuantity}
              onChange={(e) => setFormData({ ...formData, productQuantity: e.target.value })}
              placeholder="1"
              className="input-dark mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="input-dark mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="paymentForecast">Previsão de Pagamento</Label>
            <Input
              id="paymentForecast"
              type="date"
              value={formData.paymentForecast}
              onChange={(e) => setFormData({ ...formData, paymentForecast: e.target.value })}
              className="input-dark mt-1.5"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="briefing">Briefing</Label>
            <Textarea
              id="briefing"
              value={formData.briefing}
              onChange={(e) => setFormData({ ...formData, briefing: e.target.value })}
              placeholder="Descreva os detalhes e requisitos do projeto..."
              className="input-dark mt-1.5 min-h-[120px]"
            />
          </div>

          {/* Área de Anexos */}
          <div className="md:col-span-2">
            <Label>Anexos (Áudio ou Imagem)</Label>
            <div className="mt-1.5 border-2 border-dashed border-border rounded-lg p-4 bg-muted/20">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,audio/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Upload className="w-8 h-8" />
                <p className="text-sm text-center">
                  Arraste arquivos ou{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:underline"
                  >
                    clique para selecionar
                  </button>
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Suporta imagens e áudios (integração com Drive em breve)
                </p>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg"
                  >
                    {attachment.type === 'image' ? (
                      <Image className="w-4 h-4 text-primary" />
                    ) : (
                      <Music className="w-4 h-4 text-primary" />
                    )}
                    <span className="flex-1 text-sm truncate">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="submit" className="btn-primary">
            {isEditing ? 'Salvar Alterações' : 'Criar Projeto'}
          </Button>
        </div>
      </form>
    </div>
  );
}
