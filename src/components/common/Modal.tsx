import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';

export function ModalProvider() {
  const { isModalOpen, modalContent, closeModal } = useAxion();

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/60 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-auto no-scrollbar rounded-2xl bg-card border border-border shadow-2xl pointer-events-auto">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors z-10"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              {modalContent}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
