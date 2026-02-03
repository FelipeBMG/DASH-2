import type { ReactNode } from "react";

import type { VendedorSection } from "@/components/vendedor/types";
import { VendedorSidebar } from "@/components/vendedor/VendedorSidebar";
import { VendedorHeader } from "@/components/vendedor/VendedorHeader";
import { ModalProvider } from "@/components/common/Modal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { VendedorMobileMenu } from "@/components/vendedor/mobile/VendedorMobileMenu";

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
        <Sheet>
          <VendedorHeader
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
            <VendedorMobileMenu activeSection={activeSection} onChangeSection={onChangeSection} />
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
      <ModalProvider />
    </div>
  );
}
