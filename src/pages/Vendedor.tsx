import { useMemo, useState } from "react";

import { VendedorLayout } from "@/components/vendedor/VendedorLayout";
import { VendedorAtendimentoPanel } from "@/components/vendedor/VendedorAtendimentoPanel";
import { VendedorCalendarPanel } from "@/components/vendedor/VendedorCalendarPanel";
import { VendedorSettingsPanel } from "@/components/vendedor/VendedorSettingsPanel";
import type { VendedorSection } from "@/components/vendedor/types";
import { FluxoOperacoesModule } from "@/components/fluxo/FluxoOperacoesModule";
import { VendedorSalesPanel } from "@/components/vendedor/VendedorSalesPanel";

export default function Vendedor() {
  const [activeSection, setActiveSection] = useState<VendedorSection>("atendimento");

  const title = useMemo(() => {
    switch (activeSection) {
      case "atendimento":
        return "Painel do Vendedor";
      case "calendar":
        return "Calendário de Compromissos";
      case "fluxo":
        return "Fluxo de Operações";
      case "sales":
        return "Vendas";
      case "settings":
        return "Configurações";
      default:
        return "Painel do Vendedor";
    }
  }, [activeSection]);

  return (
    <VendedorLayout title={title} activeSection={activeSection} onChangeSection={setActiveSection}>
      {activeSection === "atendimento" ? (
        <VendedorAtendimentoPanel onNewAtendimento={() => setActiveSection("fluxo")} />
      ) : null}
      {activeSection === "fluxo" ? <FluxoOperacoesModule /> : null}
      {activeSection === "sales" ? <VendedorSalesPanel /> : null}
      {activeSection === "calendar" ? <VendedorCalendarPanel /> : null}
      {activeSection === "settings" ? <VendedorSettingsPanel /> : null}
    </VendedorLayout>
  );
}
