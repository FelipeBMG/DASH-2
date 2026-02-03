import type { ReactNode } from "react";

import type { ProducaoSection } from "@/components/producao/types";
import { ProducaoSidebar } from "@/components/producao/ProducaoSidebar";
import { ProducaoHeader } from "@/components/producao/ProducaoHeader";
import { ModalProvider } from "@/components/common/Modal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ProducaoMobileMenu } from "@/components/producao/mobile/ProducaoMobileMenu";

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
        <Sheet>
          <ProducaoHeader
            title={title}
            leftSlot={
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
            }
          />
          <SheetContent side="left" className="p-0">
            <ProducaoMobileMenu activeSection={activeSection} onChangeSection={onChangeSection} />
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
      <ModalProvider />
    </div>
  );
}
