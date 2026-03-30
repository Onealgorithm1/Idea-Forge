import { Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export default function FloatingSubmitIdea() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const hiddenPaths = ["/submit-idea", "/admin", "/profile", "/login", "/super-admin", "/register-workspace"];
  const isHidden = hiddenPaths.some(path => location.pathname.includes(path));

  if (!user || isHidden) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <motion.button
        onClick={() => navigate("/submit-idea")}
        className="group relative flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-6 text-primary-foreground shadow-2xl hover:bg-primary/90 focus:outline-none"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
        <span className="font-bold text-sm tracking-wide">Submit Idea</span>
        
        {/* Tooltip-like label */}
        <span className="absolute right-full mr-4 whitespace-nowrap rounded-lg bg-header px-3 py-1.5 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-xl border border-white/10">
          Post Your Innovation
        </span>
      </motion.button>
    </div>
  );
}
