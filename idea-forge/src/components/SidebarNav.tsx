import { User, TrendingUp, Users, Tag, Briefcase, Package, Palette, Megaphone, Cpu, Settings, LayoutGrid, Lock, Plus, ShieldCheck, Activity, type LucideIcon } from "lucide-react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface SidebarItem {
  icon: LucideIcon;
  label: string;
}

const navItems: SidebarItem[] = [
  { icon: User, label: "My Ideas" },
  { icon: TrendingUp, label: "Trending Ideas" },
  { icon: Users, label: "Team Ideas" },
];

const categories: SidebarItem[] = [
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
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-full transition-all duration-200 w-full text-left group ${
        active
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-bold"
          : "text-muted-foreground hover:text-foreground hover:bg-white hover:shadow-premium"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
      {label}
    </button>
  );
}

const SidebarNav = ({ onCategorySelect, selectedCategory: propCategory }: SidebarNavProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const selectedCategory = propCategory || searchParams.get("category") || "All";

  const handleCategoryClick = (label: string) => {
    if (onCategorySelect) {
      onCategorySelect(label);
    } else {
      // If we don't have an explicit handler (like on Detail page),
      // navigate to root with the category param
      const params = new URLSearchParams();
      if (label !== "All") params.set("category", label);
      navigate(`${ROUTES.ROOT}${params.toString() ? '?' + params.toString() : ''}`);
    }
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border/50 hidden md:flex flex-col p-4 pt-6 gap-1 bg-background/50 backdrop-blur-sm">

      {user?.role === 'admin' && (
        <div className="mb-4 space-y-1">
          <div className="px-3 mb-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.15em]">
              <ShieldCheck className="h-3 w-3" />
              Administration
            </div>
          </div>
          <Link to={ROUTES.ADMIN_DASHBOARD} className="w-full">
            <SidebarButton
              icon={Activity}
              label="Admin Dashboard"
              active={pathname === ROUTES.ADMIN_DASHBOARD}
            />
          </Link>
          <Link to={ROUTES.ADMIN_USERS} className="w-full">
            <SidebarButton
              icon={Users}
              label="Manage Users"
              active={pathname === ROUTES.ADMIN_USERS}
            />
          </Link>
        </div>
      )}

      <div className="px-3 mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
          <Tag className="h-3 w-3" />
          Categories
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-1 -mx-1 custom-scrollbar">
        {categories.map((cat) => (
          <SidebarButton
            key={cat.label}
            icon={cat.icon}
            label={cat.label}
            active={selectedCategory === cat.label || (cat.label === "All" && !selectedCategory)}
            onClick={() => handleCategoryClick(cat.label)}
          />
        ))}

        <div className="pt-6 pb-2">
          <Button asChild className="w-full justify-start gap-2 shadow-md hover:shadow-lg transition-all rounded-xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm">
            <Link to={ROUTES.SUBMIT_IDEA}>
              <Plus className="h-5 w-5 shrink-0" />
              New Idea
            </Link>
          </Button>
        </div>
      </div>

    </aside>
  );
};

export default SidebarNav;
