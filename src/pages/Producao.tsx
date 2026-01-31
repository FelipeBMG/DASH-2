import { AxionProvider } from "@/contexts/AxionContext";
import { ProducaoDashboard } from "@/components/producao/ProducaoDashboard";

export default function Producao() {
  return (
    <AxionProvider>
      <ProducaoDashboard />
    </AxionProvider>
  );
}
