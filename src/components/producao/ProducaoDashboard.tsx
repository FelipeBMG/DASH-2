import { useMemo, useState } from "react";

import { CalendarModule } from "@/components/calendar/CalendarModule";
import { ProductionKanban } from "@/components/producao/ProductionKanban";
import { ProductionProjectsList } from "@/components/producao/ProductionProjectsList";
import { ProducaoLayout } from "@/components/producao/ProducaoLayout";
import type { ProducaoSection } from "@/components/producao/types";

export function ProducaoDashboard() {
  const [activeSection, setActiveSection] = useState<ProducaoSection>("kanban");

  const title = useMemo(() => {
    if (activeSection === "lista") return "Produção — Projetos";
    if (activeSection === "calendario") return "Produção — Calendário";
    return "Produção — Kanban";
  }, [activeSection]);

  return (
    <ProducaoLayout title={title} activeSection={activeSection} onChangeSection={setActiveSection}>
      {activeSection === "kanban" ? <ProductionKanban /> : null}
      {activeSection === "lista" ? <ProductionProjectsList /> : null}
      {activeSection === "calendario" ? <CalendarModule /> : null}
    </ProducaoLayout>
  );
}
