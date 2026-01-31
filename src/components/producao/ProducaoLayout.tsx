import type { ReactNode } from "react";

import type { ProducaoSection } from "@/components/producao/types";
import { ProducaoSidebar } from "@/components/producao/ProducaoSidebar";
import { ProducaoHeader } from "@/components/producao/ProducaoHeader";
import { ModalProvider } from "@/components/common/Modal";

type Props = {
  title: string;
  activeSection: ProducaoSection;
  onChangeSection: (section: ProducaoSection) => void;
  children: ReactNode;
};

export function ProducaoLayout({ title, activeSection, onChangeSection, children }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ProducaoSidebar activeSection={activeSection} onChangeSection={onChangeSection} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ProducaoHeader title={title} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <ModalProvider />
    </div>
  );
}
