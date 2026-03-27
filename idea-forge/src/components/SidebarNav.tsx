import { User, TrendingUp, Users, Tag, Briefcase, Package, Palette, Megaphone, Cpu, Settings, LayoutGrid, Lock, ShieldCheck, Activity, Building, type LucideIcon } from "lucide-react";
import { Link, useNavigate, useLocation, useSearchParams, useParams } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarItem {
  icon: LucideIcon;
  label: string;
}

export const categories: SidebarItem[] = [
  { icon: LayoutGrid, label: "All" },
  { icon: Briefcase, label: "Sales / Opportunities" },
  { icon: Package, label: "Product Development" },
  { icon: Palette, label: "UI/UX Design" },
  { icon: Megaphone, label: "Marketing & Content" },
  { icon: Cpu, label: "Engineering & Tech" },
  { icon: Settings, label: "Operations" },
  { icon: LayoutGrid, label: "General" },
];

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
  const selectedCategory = propCategory || searchParams.get("category") || "All";

  const handleCategoryClick = (label: string) => {
    if (onCategorySelect) {
      onCategorySelect(label);
    } else {
      const params = new URLSearchParams();
      if (label !== "All") params.set("category", label);
      navigate(`${getTenantPath(ROUTES.DASHBOARD, tenantSlug)}${params.toString() ? '?' + params.toString() : ''}`);
    }
  };

  return (
    <>
      <div className="hidden md:block w-[260px] shrink-0" aria-hidden="true" />
      <aside className="hidden md:flex fixed top-16 left-[max(0px,calc((100vw-1600px)/2))] z-30 w-[260px] h-[calc(100vh-4rem)] flex-col gap-2 border-r border-slate-200/60 bg-white/40 pt-6 pb-4 backdrop-blur-xl shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] overflow-hidden">
        {user?.role === 'admin' && (
          <div className="mb-4 space-y-1">
            <div className="px-5 mb-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                <ShieldCheck className="h-3 w-3" />
                Administration
              </div>
            </div>
            <div className="space-y-0.5 px-2">
              <Link to={getTenantPath(ROUTES.ADMIN_DASHBOARD, tenantSlug || "default")} className="block w-full">
                <SidebarButton
                  icon={Activity}
                  label="Admin Dashboard"
                  active={pathname === getTenantPath(ROUTES.ADMIN_DASHBOARD, tenantSlug || "default")}
                />
              </Link>
              <Link to={getTenantPath(ROUTES.ADMIN_USERS, tenantSlug || "default")} className="block w-full">
                <SidebarButton
                  icon={Users}
                  label="Manage Users"
                  active={pathname === getTenantPath(ROUTES.ADMIN_USERS, tenantSlug || "default")}
                />
              </Link>
              <Link to={getTenantPath(ROUTES.ADMIN_SETTINGS, tenantSlug || "default")} className="block w-full">
                <SidebarButton
                  icon={Building}
                  label="Organization Settings"
                  active={pathname === getTenantPath(ROUTES.ADMIN_SETTINGS, tenantSlug || "default")}
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

          <div className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar pb-4 px-2">
            {categories.map((cat) => (
              <SidebarButton
                key={cat.label}
                icon={cat.icon}
                label={cat.label}
                active={selectedCategory === cat.label || (cat.label === "All" && !selectedCategory && pathname !== getTenantPath(ROUTES.ADMIN_DASHBOARD, tenantSlug || "default") && pathname !== getTenantPath(ROUTES.ADMIN_USERS, tenantSlug || "default"))}
                onClick={() => handleCategoryClick(cat.label)}
              />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarNav;
