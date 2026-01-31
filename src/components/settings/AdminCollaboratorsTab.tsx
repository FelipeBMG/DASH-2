import { motion } from "framer-motion";
import { Users } from "lucide-react";

import { SellersManager } from "@/components/settings/SellersManager";

export function AdminCollaboratorsTab() {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-bold text-foreground">Colaboradores</h2>
        </div>
        <SellersManager />
      </motion.div>
    </div>
  );
}
