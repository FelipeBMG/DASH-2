import { useAxion } from '@/contexts/AxionContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSettingsForm } from '@/components/settings/AdminSettingsForm';
import { useAuth } from '@/contexts/AuthContext';
import { AdminProductsTab } from '@/components/settings/AdminProductsTab';

export function SettingsModule() {
  const { settings, setSettings } = useAxion();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-5xl mx-auto">
      <Tabs defaultValue="geral" className="w-full">
        <div className="flex justify-start">
          <TabsList className="rounded-full bg-secondary/20 border border-border/60 p-1">
            <TabsTrigger value="geral" className="rounded-full px-4">
              Visão Geral
            </TabsTrigger>

            {isAdmin ? (
              <>
                <TabsTrigger value="produtos" className="rounded-full px-4">
                  Produtos
                </TabsTrigger>
              </>
            ) : null}
          </TabsList>
        </div>

        <TabsContent value="geral">
          <AdminSettingsForm settings={settings} setSettings={(next) => setSettings(next)} />
        </TabsContent>

        {isAdmin ? (
          <>
            <TabsContent value="produtos">
              <AdminProductsTab />
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  );
}
