import { AxionProvider, useAxion } from '@/contexts/AxionContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { FluxoOperacoesModule } from '@/components/fluxo/FluxoOperacoesModule';
import { FinancialModule } from '@/components/financial/FinancialModule';
import { ReportsModule } from '@/components/reports/ReportsModule';
import { CalendarModule } from '@/components/calendar/CalendarModule';
import { TeamModule } from '@/components/team/TeamModule';
import { ContractsModule } from '@/components/contracts/ContractsModule';
import { SettingsModule } from '@/components/settings/SettingsModule';
import { TrafficModule } from '@/components/traffic/TrafficModule';

function AxionContent() {
  const { activeModule } = useAxion();

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'fluxo':
        return <FluxoOperacoesModule />;
      case 'traffic':
        return <TrafficModule />;
      case 'financial':
        return <FinancialModule />;
      case 'reports':
        return <ReportsModule />;
      case 'calendar':
        return <CalendarModule />;
      case 'team':
        return <TeamModule />;
      case 'contracts':
        return <ContractsModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <MainLayout>
      {renderModule()}
    </MainLayout>
  );
}

const Index = () => {
  return (
    <AxionProvider>
      <AxionContent />
    </AxionProvider>
  );
};

export default Index;
