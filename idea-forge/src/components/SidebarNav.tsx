import { User, TrendingUp, Users, Tag, Briefcase, Package, Palette, Megaphone, Cpu, Settings, LayoutGrid, Lock, Plus, ShieldCheck, Activity, Building, ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation, useSearchParams, useParams } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

import BoardSearchBar from "@/components/BoardSearchBar";

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
  searchQuery?: string;
  onSearch?: (query: string) => void;
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
          : "text-muted-foreground font-medium hover:text-foreground hover:bg-accent/40"
      }`}
    >
      <div 
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary transition-all duration-300 ${
          active ? "h-6 opacity-100" : "h-0 opacity-0"
        }`} 
      />
      
      <div className={`relative flex items-center justify-center p-1.5 rounded-lg transition-colors duration-300 ${
        active ? 'bg-background shadow-sm ring-1 ring-border' : 'bg-transparent'
      }`}>
        <Icon 
          className={`h-4 w-4 shrink-0 transition-all duration-300 ${
            active ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
          }`} 
          strokeWidth={active ? 2.5 : 2}
        />
      </div>
      <span className="tracking-tight truncate pr-2">{label}</span>
    </button>
  );
}

const SidebarNav = ({ onCategorySelect, selectedCategory: propCategory, searchQuery = "", onSearch }: SidebarNavProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [isSpacesExpanded, setIsSpacesExpanded] = useState(true);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const selectedCategory = propCategory || searchParams.get("category") || "All";
  const currentSlug = tenant?.slug || tenantSlug || "default";

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


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

  const activeCategories = (Array.isArray(dbCategories) ? dbCategories : []).filter(c => c.is_active);
  const archivedCategories = (Array.isArray(dbCategories) ? dbCategories : []).filter(c => !c.is_active);

  const categoryTree = buildTree(activeCategories);
  const archivedTree = buildTree(archivedCategories);

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
    <aside className="sticky top-0 h-full w-[260px] shrink-0 border-r border-border hidden md:flex flex-col bg-card/40 dark:bg-card/20 backdrop-blur-xl shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] z-20 transition-colors duration-300">
      <div className="flex-1 overflow-y-auto no-scrollbar pt-6 pb-20">
        {/* Search Bar in Sidebar */}
        <div className="px-5 mb-8">
          <BoardSearchBar
            ref={searchInputRef}
            value={localSearch}
            onChange={(val) => {
              setLocalSearch(val);
              if (onSearch) onSearch(val);
            }}
            placeholder="Search ideas..."
            showKbdHint
          />
        </div>

        {['admin', 'tenant_admin', 'super_admin'].includes(user?.role || '') && (
          <div className="mb-6 space-y-1">
            <div className="px-5 mb-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
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
              <Link to={getTenantPath(ROUTES.ADMIN_CATEGORIES, currentSlug)} className="block w-full">
                <SidebarButton
                  icon={Tag}
                  label="Manage Categories"
                  active={pathname === getTenantPath(ROUTES.ADMIN_CATEGORIES, currentSlug)}
                />
              </Link>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-1">
            <button 
              onClick={() => setIsSpacesExpanded(!isSpacesExpanded)}
              className="w-full px-5 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] group-hover:text-foreground">
                <LayoutGrid className="h-3 w-3" />
                Idea Spaces
              </div>
              {isSpacesExpanded ? (
                <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-foreground" />
              )}
            </button>

            {isSpacesExpanded && (
              <div className="space-y-0.5 px-2 mt-2">
                {isSpacesLoading ? (
                  <div className="space-y-2 p-2">
                    <div className="h-8 bg-muted/20 animate-pulse rounded-xl w-full" />
                    <div className="h-8 bg-muted/20 animate-pulse rounded-xl w-full" />
                  </div>
                ) : (
                  Array.isArray(ideaSpaces) && ideaSpaces.map((space: any) => (
                    <SidebarButton
                      key={space.id}
                      icon={Briefcase}
                      label={space.name}
                      active={searchParams.get("space") === space.id}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set("space", space.id);
                        navigate(`${getTenantPath(ROUTES.IDEA_BOARD, currentSlug)}?${params.toString()}`);
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="px-5 mb-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                <Tag className="h-3 w-3" />
                Categories
              </div>
            </div>

            <div className="space-y-0.5 px-2">
              <SidebarButton
                icon={LayoutGrid}
                label="All Categories"
                active={selectedCategory === "All"}
                onClick={() => handleCategoryClick("All")}
              />
              
              {isCategoriesLoading ? (
                <div className="space-y-2 p-2 mt-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 bg-muted/20 animate-pulse rounded-xl w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {categoryTree.map((cat: any) => (
                    <CategoryItem key={cat.id} item={cat} />
                  ))}
                  
                  {archivedTree.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border/50">
                      <div className="px-5 mb-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                          <Lock className="h-3 w-3" />
                          Archived
                        </div>
                      </div>
                      <div className="opacity-70 grayscale-[0.5]">
                        {archivedTree.map((cat: any) => (
                          <CategoryItem key={cat.id} item={cat} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarNav;
