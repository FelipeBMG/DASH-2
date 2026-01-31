import type { ReactNode } from "react";

import type { VendedorSection } from "@/components/vendedor/types";
import { VendedorSidebar } from "@/components/vendedor/VendedorSidebar";
import { VendedorHeader } from "@/components/vendedor/VendedorHeader";
import { ModalProvider } from "@/components/common/Modal";

type Props = {
  title: string;
  activeSection: VendedorSection;
  onChangeSection: (section: VendedorSection) => void;
  children: ReactNode;
};

export function VendedorLayout({ title, activeSection, onChangeSection, children }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <VendedorSidebar activeSection={activeSection} onChangeSection={onChangeSection} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <VendedorHeader title={title} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <ModalProvider />
    </div>
  );
}
