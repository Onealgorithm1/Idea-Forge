import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Info } from 'lucide-react';
import { Button } from './ui/button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const icons = {
    danger: <Trash2 className="h-6 w-6 text-red-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    info: <Info className="h-6 w-6 text-primary" />
  };

  const colors = {
    danger: 'bg-red-50 text-red-700 border-red-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    info: 'bg-primary/5 text-primary border-primary/10'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden z-10 p-6 border border-slate-100"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`p-4 rounded-2xl border ${colors[type]}`}>
              {icons[type]}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{message}</p>
            </div>

            <div className="flex w-full gap-3 pt-2">
              <Button 
                variant="ghost" 
                className="flex-1 h-11 rounded-2xl font-bold text-slate-500" 
                onClick={onClose}
              >
                {cancelText}
              </Button>
              <Button 
                className={`flex-1 h-11 rounded-2xl font-bold shadow-lg transition-all ${
                  type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'shadow-primary/20'
                }`}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                {confirmText}
              </Button>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmationModal;
