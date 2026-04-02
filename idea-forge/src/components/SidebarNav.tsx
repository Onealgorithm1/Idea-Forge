import { User, TrendingUp, Users, Tag, Briefcase, Package, Palette, Megaphone, Cpu, Settings, LayoutGrid, Lock, Plus, ShieldCheck, Activity, Building, type LucideIcon } from "lucide-react";
import { Link, useNavigate, useLocation, useSearchParams, useParams } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface SidebarItem {
  icon: LucideIcon;
  label: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  "Sales": Briefcase,
  "Opportunities": Briefcase,
  "Product": Package,
  "Design": Palette,
  "UI/UX": Palette,
  "Marketing": Megaphone,
  "Content": Megaphone,
  "Engineering": Cpu,
  "Tech": Cpu,
  "Operations": Settings,
  "General": LayoutGrid,
  "Default": Tag
};

const getCategoryIcon = (name: string): LucideIcon => {
  if (name === "All") return LayoutGrid;
  for (const key in ICON_MAP) {
    if (name.toLowerCase().includes(key.toLowerCase())) return ICON_MAP[key];
  }
  return ICON_MAP.Default;
};

interface SidebarNavProps {
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string;
}

interface SidebarButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarButton({ icon: Icon, label, active, onClick }: SidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-3 px-4 py-3 text-sm w-full text-left group transition-all duration-300 rounded-r-2xl overflow-hidden ${
        active
          ? "text-primary font-semibold bg-gradient-to-r from-primary/10 to-transparent"
          : "text-slate-500 font-medium hover:text-slate-800 hover:bg-slate-100/60"
      }`}
    >
      {/* Active Indicator Line */}
      <div 
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary transition-all duration-300 ${
          active ? "h-6 opacity-100" : "h-0 opacity-0"
        }`} 
      />
      
      <div className={`relative flex items-center justify-center p-1.5 rounded-lg transition-colors duration-300 ${
        active ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'bg-transparent'
      }`}>
        <Icon 
          className={`h-4 w-4 shrink-0 transition-all duration-300 ${
            active ? 'text-primary scale-110' : 'text-slate-400 group-hover:text-slate-600 group-hover:scale-105'
          }`} 
          strokeWidth={active ? 2.5 : 2}
        />
      </div>
      <span className="tracking-tight truncate pr-2">{label}</span>
    </button>
  );
}

const SidebarNav = ({ onCategorySelect, selectedCategory: propCategory }: SidebarNavProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const selectedCategory = propCategory || searchParams.get("category") || "All";
  
  // Robust slug detection
  const currentSlug = tenant?.slug || tenantSlug || "default";

  // Fetch tenant-specific categories
  const { data: dbCategories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories", currentSlug],
    queryFn: () => api.get("/ideas/categories"),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: 1,
  });

  // Combine dynamic categories with mandatory 'All' category
  const displayCategories: SidebarItem[] = [
    { icon: LayoutGrid, label: "All" },
    ...(Array.isArray(dbCategories) ? dbCategories.map((cat: any) => ({
      icon: getCategoryIcon(cat.name),
      label: cat.name
    })) : [])
  ];

  const handleCategoryClick = (label: string) => {
    if (onCategorySelect) {
      onCategorySelect(label);
    } else {
      const params = new URLSearchParams();
      if (label !== "All") params.set("category", label);
      const targetPath = getTenantPath(ROUTES.IDEA_BOARD, tenantSlug);
      navigate(`${targetPath}${params.toString() ? '?' + params.toString() : ''}`);
    }
  };

  return (
    <aside className="sticky top-0 h-screen w-[260px] shrink-0 border-r border-slate-200/60 hidden md:flex flex-col pt-6 pb-4 gap-2 bg-white/40 backdrop-blur-xl shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] z-20">

      {user?.role === 'admin' && (
        <div className="mb-4 space-y-1">
          <div className="px-5 mb-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              <ShieldCheck className="h-3 w-3" />
              Administration
            </div>
          </div>
          <div className="space-y-0.5 px-2">
            <Link to={getTenantPath(ROUTES.ADMIN_DASHBOARD, currentSlug)} className="block w-full">
              <SidebarButton
                icon={Activity}
                label="Admin Dashboard"
                active={pathname === getTenantPath(ROUTES.ADMIN_DASHBOARD, currentSlug)}
              />
            </Link>
            <Link to={getTenantPath(ROUTES.ADMIN_USERS, currentSlug)} className="block w-full">
              <SidebarButton
                icon={Users}
                label="Manage Users"
                active={pathname === getTenantPath(ROUTES.ADMIN_USERS, currentSlug)}
              />
            </Link>
            <Link to={getTenantPath(ROUTES.ADMIN_SETTINGS, currentSlug)} className="block w-full">
              <SidebarButton
                icon={Building}
                label="Organization Settings"
                active={pathname === getTenantPath(ROUTES.ADMIN_SETTINGS, currentSlug)}
              />
            </Link>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 space-y-2 mt-2 overflow-hidden">
        <div className="px-5 mb-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            <Tag className="h-3 w-3" />
            Categories
          </div>
        </div>

        <div className="flex-1 space-y-0.5 overflow-y-auto no-scrollbar pb-4 px-2">
          {displayCategories.map((cat) => (
            <SidebarButton
              key={cat.label}
              icon={cat.icon}
              label={cat.label}
              active={selectedCategory === cat.label || (cat.label === "All" && !selectedCategory && pathname !== getTenantPath(ROUTES.ADMIN_DASHBOARD, currentSlug) && pathname !== getTenantPath(ROUTES.ADMIN_USERS, currentSlug))}
              onClick={() => handleCategoryClick(cat.label)}
            />
          ))}
        </div>
      </div>

    </aside>
  );
};

export default SidebarNav;
