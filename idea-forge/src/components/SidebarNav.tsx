import { User, TrendingUp, Users, Tag, Briefcase, Package, Palette, Megaphone, Cpu, Settings, LayoutGrid, Lock, type LucideIcon } from "lucide-react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

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
      className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors w-full text-left ${
        active 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
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
    <aside className="w-52 shrink-0 bg-card border-r hidden md:flex flex-col p-4 gap-1">
      <Link to={ROUTES.PROFILE} className="w-full">
        <SidebarButton icon={User} label="My Ideas" />
      </Link>
      <SidebarButton icon={TrendingUp} label="Trending Ideas" />
      <SidebarButton icon={Users} label="Team Ideas" />

      {user?.role === 'admin' && (
        <>
          <div className="mt-4 mb-1 px-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Lock className="h-3.5 w-3.5" />
              Admin
            </div>
          </div>
          <Link to={ROUTES.ADMIN_USERS} className="w-full">
            <SidebarButton icon={Users} label="Manage Users" />
          </Link>
        </>
      )}

      <div className="mt-4 mb-1 px-3">
        {/* ... Categories label ... */}
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Tag className="h-3.5 w-3.5" />
          Categories
        </div>
      </div>

      {categories.map((cat) => (
        <SidebarButton 
          key={cat.label} 
          icon={cat.icon} 
          label={cat.label} 
          active={selectedCategory === cat.label || (cat.label === "All" && !selectedCategory)}
          onClick={() => handleCategoryClick(cat.label)}
        />
      ))}
    </aside>
  );
};

export default SidebarNav;
