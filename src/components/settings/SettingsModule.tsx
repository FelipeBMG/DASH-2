import { useAxion } from '@/contexts/AxionContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSettingsForm } from '@/components/settings/AdminSettingsForm';
import { AdminCollaboratorsTab } from '@/components/settings/AdminCollaboratorsTab';

export function SettingsModule() {
  const { settings, setSettings } = useAxion();

  return (
    <div className="max-w-5xl mx-auto">
      <Tabs defaultValue="geral" className="w-full">
        <div className="flex justify-start">
          <TabsList className="rounded-full bg-secondary/20 border border-border/60 p-1">
            <TabsTrigger value="geral" className="rounded-full px-4">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="colaboradores" className="rounded-full px-4">
              Colaboradores
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="geral">
          <AdminSettingsForm settings={settings} setSettings={(next) => setSettings(next)} />
        </TabsContent>

        <TabsContent value="colaboradores">
          <AdminCollaboratorsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
