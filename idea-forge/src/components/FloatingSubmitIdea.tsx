import { Plus } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { useTenant } from "@/contexts/TenantContext";

export default function FloatingSubmitIdea() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  
  const currentSlug = tenant?.slug || tenantSlug || "default";

  const hiddenPaths = ["/submit-idea", "/admin", "/profile", "/login", "/super-admin", "/register-workspace"];
  const isHidden = hiddenPaths.some(path => location.pathname.includes(path));

  if (!user || isHidden) return null;

  const handleClick = () => {
    navigate(getTenantPath(ROUTES.SUBMIT_IDEA, currentSlug));
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <motion.button
        onClick={handleClick}
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
        
        {/* Tooltip Label */}
        <span className="absolute right-full mr-4 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-xl border border-white/10">
          Post Your Innovation
        </span>
      </motion.button>
    </div>
  );
}
