import { User, TrendingUp, Users, Tag, Briefcase, Package, Palette, Megaphone, Cpu, Settings, LayoutGrid, Lock, Plus, ShieldCheck, Activity, Building, ChevronDown, ChevronRight, type LucideIcon, Compass, Home, UserCircle2, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation, useSearchParams, useParams } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

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

interface SidebarButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  color?: string;
}

function SidebarButton({ icon: Icon, label, active, onClick, color }: SidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-3 px-4 py-3 text-sm w-full text-left group transition-all duration-300 rounded-r-2xl overflow-hidden ${
        active
          ? "font-semibold"
          : "text-muted-foreground font-medium hover:text-foreground hover:bg-accent/40"
      }`}
      style={active ? { 
        color: color || 'hsl(var(--primary))',
        background: `linear-gradient(to right, ${color ? color + '33' : 'hsl(var(--primary) / 0.2)'}, transparent)`,
        boxShadow: `inset 4px 0 12px -4px ${color ? color + '44' : 'hsl(var(--primary) / 0.3)'}`
      } : {}}
    >
      <div 
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300 ${
          active ? "h-6 opacity-100" : "h-0 opacity-0"
        }`} 
        style={active ? { background: color || 'hsl(var(--primary))' } : {}}
      />
      
      <div className={`relative flex items-center justify-center p-1.5 rounded-lg transition-colors duration-300 ${
        active ? 'bg-background shadow-sm ring-1' : 'bg-transparent'
      }`} style={active ? { '--tw-ring-color': color ? color + '33' : 'hsl(var(--border))' } as React.CSSProperties : {}}>
        <Icon 
          className={`h-4 w-4 shrink-0 transition-all duration-300 ${
            active ? 'scale-110' : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
          }`} 
          style={active ? { color: color || 'hsl(var(--primary))' } : {}}
          strokeWidth={active ? 3 : 2}
        />
      </div>
      <span className={cn("tracking-tight truncate pr-2 font-black uppercase text-[11px]", active ? "opacity-100" : "opacity-70 group-hover:opacity-100")}>{label}</span>
    </button>
  );
}

export const SidebarContent = ({ onCategorySelect, selectedCategory: propCategory }: { onCategorySelect?: (category: string) => void; selectedCategory?: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [isSpacesExpanded, setIsSpacesExpanded] = useState(true);

  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const isEventPage = pathname.includes('/events');
  const isEventsSpace = searchParams.get("space") === "events" || isEventPage;
  const selectedCategory = propCategory || searchParams.get("category") || (isEventsSpace ? "" : "All");
  const currentSlug = tenant?.slug || tenantSlug || "default";

  const { data: dbCategories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories", currentSlug, user?.id],
    queryFn: () => api.get("/ideas/categories"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: ideaSpaces, isLoading: isSpacesLoading } = useQuery({
    queryKey: ["idea-spaces", currentSlug, user?.id],
    queryFn: () => api.get("/ideas/spaces"),
    staleTime: 1000 * 60 * 5,
  });

  const buildTree = (cats: any[], parentId: string | null = null): any[] => {
    return (Array.isArray(cats) ? cats : [])
      .filter(c => (parentId === null) ? !c.parent_id : c.parent_id === parentId)
      .map(c => ({
        ...c,
        children: buildTree(cats, c.id)
      }));
  };

  const activeCategories = (Array.isArray(dbCategories) ? dbCategories : [])
    .filter(c => c.is_active)
    .sort((a, b) => a.name.localeCompare(b.name));
  const categoryTree = buildTree(activeCategories);

  const handleCategoryClick = (label: string) => {
    if (onCategorySelect) {
      onCategorySelect(label);
    } else {
      const params = new URLSearchParams(searchParams);
      if (label === "All") {
        params.delete("category");
      } else {
        params.set("category", label);
      }
      if (params.get("space") === "events") {
        params.delete("space");
      }
      const targetPath = getTenantPath(ROUTES.IDEA_BOARD, currentSlug);
      navigate(`${targetPath}${params.toString() ? '?' + params.toString() : ''}`);
    }
  };

  const CategoryItem = ({ item, level = 0 }: { item: any; level?: number }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = selectedCategory === item.name;
    const [isExpanded, setIsExpanded] = useState(isActive);

    return (
      <div className="space-y-0.5">
        <div className="flex items-center group relative">
          <SidebarButton
            icon={getCategoryIcon(item.name)}
            label={item.name}
            active={isActive}
            color={item.color}
            onClick={() => handleCategoryClick(item.name)}
          />
          {hasChildren && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="absolute right-4 p-1 rounded-md hover:bg-accent/50 text-muted-foreground transition-colors z-20"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="pl-4 border-l border-border/50 ml-6 space-y-0.5"
          >
            {item.children.map((child: any) => (
              <CategoryItem key={child.id} item={child} level={level + 1} />
            ))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar Header */}
      <div className="h-16 px-7 flex items-center border-b border-border/40 shrink-0">
        <Link to={getTenantPath(ROUTES.IDEA_BOARD, currentSlug)} className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Logo imageClassName="h-8 w-8 relative z-10 transition-transform duration-500 group-hover:scale-110" />
          </div>
          <span className="font-bold text-xl tracking-tighter text-foreground transition-colors group-hover:text-primary/90">
            Idea<span className="text-primary">Forge</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {/* Main Menu */}
        <div className="space-y-1">
          <p className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Menu</p>
          <Link to={getTenantPath(ROUTES.IDEA_BOARD, currentSlug)} className="block">
            <SidebarButton
              icon={Home}
              label="Overview"
              active={pathname === getTenantPath(ROUTES.IDEA_BOARD, currentSlug) && !searchParams.get("category") && !searchParams.get("space")}
            />
          </Link>
          <Link to={getTenantPath(ROUTES.ROADMAP, currentSlug)} className="block">
            <SidebarButton
              icon={TrendingUp}
              label="Roadmap"
              active={pathname === getTenantPath(ROUTES.ROADMAP, currentSlug)}
            />
          </Link>
          {['admin', 'reviewer', 'super_admin'].includes(user?.role || '') && (
            <Link to={getTenantPath(ROUTES.ANALYTICS, currentSlug)} className="block">
              <SidebarButton
                icon={Activity}
                label="Analytics"
                active={pathname === getTenantPath(ROUTES.ANALYTICS, currentSlug)}
              />
            </Link>
          )}
        </div>

        {/* Idea Spaces */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Idea Spaces</p>
            <button onClick={() => setIsSpacesExpanded(!isSpacesExpanded)} className="text-muted-foreground hover:text-foreground transition-colors">
              {isSpacesExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          </div>

          <AnimatePresence>
            {isSpacesExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-0.5 overflow-hidden"
              >
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set("space", "events");
                    params.delete("category");
                    navigate(`${getTenantPath(ROUTES.IDEA_BOARD, currentSlug)}?${params.toString()}`);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm w-full text-left rounded-xl transition-all duration-200 group ${
                    isEventsSpace
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${isEventsSpace ? "bg-background" : "bg-primary/5"}`}>
                    <Sparkles className={`h-4 w-4 ${isEventsSpace ? "text-primary" : "text-primary/60"}`} />
                  </div>
                  <span className="font-semibold tracking-tight">Events</span>
                  {isEventsSpace && (
                     <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </button>

                {isSpacesLoading ? (
                  <div className="space-y-2 p-2">
                    <div className="h-8 bg-muted/20 animate-pulse rounded-xl w-full" />
                    <div className="h-8 bg-muted/20 animate-pulse rounded-xl w-full" />
                  </div>
                ) : (
                  Array.isArray(ideaSpaces) && ideaSpaces.map((space: any) => (
                    <SidebarButton
                      key={space.id}
                      icon={LayoutGrid}
                      label={space.name}
                      active={searchParams.get("space") === space.id}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set("space", space.id);
                        params.delete("category");
                        navigate(`${getTenantPath(ROUTES.IDEA_BOARD, currentSlug)}?${params.toString()}`);
                      }}
                    />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories */}
        <div className="space-y-1">
          <p className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Categories</p>
          <div className="space-y-0.5">
            <SidebarButton
              icon={Tag}
              label="All Categories"
              active={selectedCategory === "All" && !isEventsSpace}
              onClick={() => handleCategoryClick("All")}
            />
            {isCategoriesLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2].map(i => <div key={i} className="h-8 bg-muted/20 animate-pulse rounded-xl w-full" />)}
              </div>
            ) : (
              categoryTree.filter(c => c.name !== "Events").map((cat: any) => (
                <CategoryItem key={cat.id} item={cat} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border/40 bg-accent/5 mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-background shadow-sm border border-border/50">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
            <Building className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 leading-none mb-1">Organization</span>
            <span className="text-sm font-black truncate text-foreground">{tenant?.name || "IdeaForge"}</span>
          </div>
        </div>
      </div>
    </>
  );
};
