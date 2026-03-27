import { useState } from "react";
import { Plus, X, Lightbulb } from "lucide-react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SubmitIdeaForm from "./SubmitIdeaForm";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function FloatingSubmitIdea() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const location = useLocation();

  const hiddenPaths = ["/submit-idea", "/admin", "/profile", "/login", "/super-admin", "/register-workspace"];
  const isHidden = hiddenPaths.some(path => location.pathname.includes(path));

  if (!user || isHidden) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <motion.button
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 focus:outline-none"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
            
            {/* Tooltip-like label */}
            <span className="absolute right-full mr-4 whitespace-nowrap rounded-lg bg-header px-3 py-1.5 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-xl border border-white/10">
              Submit New Idea
            </span>
          </motion.button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent shadow-none">
          <div className="bg-muted/50 p-6 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6 px-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/20 rounded-xl">
                   <Lightbulb className="h-5 w-5 text-primary" />
                 </div>
                 <h2 className="text-xl font-bold tracking-tight">Share Your Innovation</h2>
               </div>

            </div>
            <div className="bg-white rounded-2xl p-2">
              <SubmitIdeaForm />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
