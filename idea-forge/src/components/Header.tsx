import {
  Briefcase,
  Activity,
  Bell,
  ChevronDown,
  HelpCircle,
  Layers,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Tag,
  UserCircle2,
  Users,
  Moon,
  Sun,
  Lock,
  Search,
  ExternalLink,
  Plus,
  Building,
  TrendingUp,
  LayoutGrid,
  Bookmark,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationSettingsDialog } from "./NotificationSettingsDialog";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/contexts/TenantContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { SupportDialog } from "./SupportDialog";
import ThemeToggle from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTheme } from "next-themes";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight, HomeIcon } from "lucide-react";

const getInitials = (name: string) => {
  if (!name) return "U";
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
};

const Header = () => {
  const { user, logout, token } = useAuth();
  const { tenant } = useTenant();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Robust slug detection
  const currentSlug = tenant?.slug || tenantSlug || "default";

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["categories", currentSlug],
    queryFn: () => api.get("/ideas/categories"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: ideaSpaces = [] } = useQuery({
    queryKey: ["idea-spaces", currentSlug],
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

  const displayCategories = [
    { label: "All" },
    ...(Array.isArray(dbCategories) ? dbCategories.map((cat: any) => ({ label: cat.name })) : [])
  ];



  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await api.get("/ideas/notifications", token);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const markAsReadAndNavigate = async (n: any) => {
    if (!n.is_read) {
      try {
        await api.post(`/ideas/notifications/${n.id}/read`, {}, token);
        fetchNotifications();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    navigate(getTenantPath(ROUTES.IDEA_DETAIL.replace(':id', n.reference_id), currentSlug));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-16 px-4 md:px-8 w-full">
        {/* Left: Mobile Menu Trigger */}
        <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <Menu className="h-5 w-5 text-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px] border-none bg-background">
                <ScrollArea className="h-full">
                   <div className="p-6">
                      <div className="flex items-center gap-3 mb-8">
                        <Logo imageClassName="h-8 w-8 text-primary" />
                        <div className="flex flex-col">
                          <span className="font-black text-xl tracking-tighter text-foreground leading-none">forge</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{tenant?.name || 'Workspace'}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-50 px-2">Navigation</p>
                        <div className="space-y-1">
                          <Link 
                            to={getTenantPath(ROUTES.IDEA_BOARD, currentSlug)} 
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                              location.pathname.includes('idea-board') ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <LayoutGrid className="h-4 w-4" /> Feed
                          </Link>
                          <Link 
                            to={getTenantPath(ROUTES.ROADMAP, currentSlug)} 
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                              location.pathname.includes('roadmap') ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <TrendingUp className="h-4 w-4" /> Roadmap
                          </Link>
                          {['admin', 'reviewer', 'super_admin'].includes(user?.role || '') && (
                            <Link 
                              to={getTenantPath(ROUTES.ANALYTICS, currentSlug)} 
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                                location.pathname.includes('analytics') ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                              )}
                            >
                              <Activity className="h-4 w-4" /> Analytics
                            </Link>
                          )}
                        </div>
                      </div>
                   </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
        </div>

        {/* Center: Search & Breadcrumbs */}
        <div className="flex-1 flex items-center justify-between max-w-5xl mx-auto gap-8 px-4">
          <div className="hidden lg:flex items-center min-w-0">
             <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={getTenantPath(ROUTES.IDEA_BOARD, currentSlug)} className="flex items-center gap-2 hover:text-primary transition-colors">
                      <HomeIcon className="h-3.5 w-3.5" />
                      <span className="hidden xl:inline text-xs font-black uppercase tracking-widest">forge</span>
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3 w-3 opacity-50" />
                </BreadcrumbSeparator>
                
                {location.pathname.includes('/ideas/') && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to={getTenantPath(ROUTES.IDEA_BOARD, currentSlug)} className="text-xs font-bold text-muted-foreground hover:text-foreground">Ideas</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-3 w-3 opacity-50" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-xs font-black text-primary uppercase tracking-wider truncate max-w-[120px]">
                        Detail
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}

                {location.pathname.includes('/roadmap') && (
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs font-black text-primary uppercase tracking-wider">Roadmap</BreadcrumbPage>
                  </BreadcrumbItem>
                )}

                {location.pathname.includes('/analytics') && (
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs font-black text-primary uppercase tracking-wider">Analytics</BreadcrumbPage>
                  </BreadcrumbItem>
                )}

                {location.pathname.includes('/profile') && (
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs font-black text-primary uppercase tracking-wider">Profile</BreadcrumbPage>
                  </BreadcrumbItem>
                )}

                {location.pathname.includes('/idea-board') && !location.pathname.includes('/ideas/') && (
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs font-black text-primary uppercase tracking-wider">Idea Board</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="relative w-full max-w-md group flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={new URLSearchParams(location.search).get("search") || ""}
              onChange={(e) => {
                const params = new URLSearchParams(location.search);
                if (e.target.value) params.set("search", e.target.value);
                else params.delete("search");
                navigate(`${location.pathname}?${params.toString()}`, { replace: true });
              }}
              placeholder="Search everything... (⌘K)"
              className="w-full h-10 pl-11 pr-4 bg-muted/40 border border-transparent rounded-xl text-sm focus:bg-background focus:border-border/60 transition-all outline-none"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button 
            onClick={() => navigate(getTenantPath(ROUTES.SUBMIT_IDEA, currentSlug))}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all group"
          >
             <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" /> 
             <span className="hidden sm:inline">New Idea</span>
             <span className="sm:hidden">Add</span>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-2 rounded-xl hover:bg-muted transition-all group">
                <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-primary border-2 border-background rounded-full flex items-center justify-center text-[7px] font-black text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0 w-[380px] shadow-2xl rounded-2xl overflow-hidden mt-2 z-50 border-border/50">
              <div className="p-4 border-b border-border/40 bg-muted/20">
                <h3 className="font-bold text-sm uppercase tracking-widest opacity-70">Notifications</h3>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="p-2">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl hover:bg-muted/50 cursor-pointer flex gap-3 transition-all">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold leading-snug">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center">
                       <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-50">All caught up! 🚀</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-all border border-transparent hover:border-border/50">
                <Avatar className="h-8 w-8 border border-border/50">
                   <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">
                     {getInitials(user?.name || "U")}
                   </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3 w-3 text-muted-foreground mr-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-2xl p-1.5 shadow-2xl border-border/50">
              <div className="px-3 py-3 mb-2 bg-muted/30 rounded-xl">
                 <p className="text-sm font-black truncate">{user?.name || "Account"}</p>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user?.role || "User"}</p>
              </div>

              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3 py-2">Personal</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.PROFILE, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
                <UserCircle2 className="mr-3 h-4 w-4 text-primary" /> My Profile
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.MY_IDEAS, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
                <Sparkles className="mr-3 h-4 w-4 text-amber-500" /> My Ideas
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.SAVED_IDEAS, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
                <Bookmark className="mr-3 h-4 w-4 text-primary" /> Saved Ideas
              </DropdownMenuItem>
              
              <SupportDialog>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-xl px-3 py-2.5 cursor-pointer">
                  <HelpCircle className="mr-3 h-4 w-4 text-blue-500" /> Help & Support
                </DropdownMenuItem>
              </SupportDialog>

              <DropdownMenuItem 
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} 
                className="rounded-xl px-3 py-2.5 cursor-pointer"
              >
                {mounted ? (
                  resolvedTheme === 'dark' ? (
                    <Sun className="mr-3 h-4 w-4 text-amber-500" />
                  ) : (
                    <Moon className="mr-3 h-4 w-4 text-primary" />
                  )
                ) : (
                  <div className="mr-3 h-4 w-4" />
                )}
                Appearance
              </DropdownMenuItem>
              
              {['admin', 'tenant_admin', 'super_admin'].includes(user?.role || '') && (
                <>
                  <DropdownMenuSeparator className="my-1.5 opacity-40" />
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3 py-2">Administration</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.ADMIN_DASHBOARD, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
                    <Activity className="mr-3 h-4 w-4 text-orange-500" /> Admin Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.ADMIN_USERS, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
                    <Users className="mr-3 h-4 w-4 text-blue-500" /> Manage Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.ADMIN_SETTINGS, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
                    <Building className="mr-3 h-4 w-4 text-purple-500" /> Org Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.ADMIN_CATEGORIES, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
                    <Tag className="mr-3 h-4 w-4 text-amber-500" /> Manage Categories
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator className="my-1.5 opacity-40" />
              <DropdownMenuItem onClick={logout} className="rounded-xl px-3 py-2.5 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="mr-3 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
