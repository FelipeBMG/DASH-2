import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ModalProvider } from '../common/Modal';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminMobileMenu } from '@/components/layout/mobile/AdminMobileMenu';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Sheet>
          <Header
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
            <AdminMobileMenu />
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
      <ModalProvider />
    </div>
  );
}
