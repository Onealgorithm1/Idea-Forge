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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
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

const Header = () => {
  const { user, logout, token } = useAuth();
  const { tenant } = useTenant();
  const { theme, setTheme } = useTheme();
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

  const tabs = [
    { name: "Idea Board", path: getTenantPath(ROUTES.IDEA_BOARD, currentSlug) },
    { name: "Roadmap", path: getTenantPath(ROUTES.ROADMAP, currentSlug) },
    { name: "My Ideas", path: getTenantPath(ROUTES.MY_IDEAS, currentSlug) },
    { name: "Followed Ideas", path: getTenantPath(ROUTES.SAVED_IDEAS, currentSlug) },
  ];
  
  if (user?.role === "admin" || user?.role === "reviewer" || user?.role === "super_admin") {
    tabs.splice(2, 0, { name: "Analytics", path: getTenantPath(ROUTES.ANALYTICS, currentSlug) });
  }

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

  const isAuthPage = location.pathname.includes('/login') || 
                    location.pathname.includes('/auth') || 
                    location.pathname.includes('/register-workspace') ||
                    location.pathname.includes('/forgot-password');

  if (isAuthPage) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-header text-header-foreground border-b border-white/5 shadow-lg">
      <div className="flex items-center h-16 max-w-[1600px] mx-auto w-full px-4 md:px-6">
        <div className="flex-1 flex items-center justify-start gap-3 md:gap-4">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] bg-header border-white/10 p-0 text-white">
                <SheetHeader className="p-6 border-b border-white/10 text-left">
                  <SheetTitle className="text-white flex items-center gap-3">
                    <Logo imageClassName="h-8 w-8" />
                    <span>IdeaForge</span>
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-80px)] p-6">
                  <div className="space-y-8">

                    <div className="space-y-4">
                      <p className="text-[10px] uppercase font-black tracking-widest text-white/40 px-2 flex items-center gap-2">
                        <Briefcase className="h-3 w-3" /> Idea Spaces
                      </p>
                      <div className="flex flex-wrap gap-2 px-1">
                        {Array.isArray(ideaSpaces) && ideaSpaces.map((space: any) => {
                          const searchParams = new URLSearchParams(location.search);
                          const isActive = searchParams.get("space") === space.id;
                          const params = new URLSearchParams(location.search);
                          params.set("space", space.id);
                          const path = `${getTenantPath(ROUTES.IDEA_BOARD, currentSlug)}?${params.toString()}`;

                          return (
                            <Link
                              key={space.id}
                              to={path}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                                isActive ? "bg-primary text-white border-primary" : "bg-white/5 text-white/70 border-white/10 hover:border-white/20"
                              }`}
                            >
                              {space.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {(location.pathname === getTenantPath(ROUTES.IDEA_BOARD, currentSlug)) && (
                      <div className="space-y-4">
                        <p className="text-[10px] uppercase font-black tracking-widest text-white/40 px-2 flex items-center gap-2">
                          <Tag className="h-3 w-3" /> Categories
                        </p>
                        <div className="flex flex-col gap-1 px-1">
                          <Link
                            to={getTenantPath(ROUTES.IDEA_BOARD, currentSlug)}
                            className={cn(
                              "px-4 py-2 text-sm font-bold rounded-xl transition-all",
                              !(new URLSearchParams(location.search).get("category")) 
                                ? "bg-white/10 text-white" 
                                : "text-white/60 hover:text-white hover:bg-white/5"
                            )}
                          >
                            All Categories
                          </Link>
                          {(() => {
                            const renderCategory = (cat: any, depth = 0) => (
                              <div key={cat.id} className="flex flex-col gap-1">
                                <Link
                                  to={`${getTenantPath(ROUTES.IDEA_BOARD, currentSlug)}?category=${encodeURIComponent(cat.name)}`}
                                  className={cn(
                                    "px-4 py-2 text-sm font-bold rounded-xl transition-all",
                                    new URLSearchParams(location.search).get("category") === cat.name 
                                      ? "bg-white/10 text-white" 
                                      : "text-white/60 hover:text-white hover:bg-white/5"
                                  )}
                                  style={{ paddingLeft: `${(depth + 1) * 1}rem` }}
                                >
                                  {cat.name}
                                </Link>
                                {cat.children?.map((child: any) => renderCategory(child, depth + 1))}
                              </div>
                            );
                            return categoryTree.map((cat: any) => renderCategory(cat));
                          })()}
                        </div>

                        {archivedTree.length > 0 && (
                          <div className="mt-8 space-y-4 pt-6 border-t border-white/5">
                            <p className="text-[10px] uppercase font-black tracking-widest text-white/30 px-2 flex items-center gap-2">
                              <Lock className="h-3 w-3" /> Archived Categories
                            </p>
                            <div className="flex flex-col gap-1 px-1 opacity-60 grayscale-[0.5]">
                              {(() => {
                                const renderCategory = (cat: any, depth = 0) => (
                                  <div key={cat.id} className="flex flex-col gap-1">
                                    <Link
                                      to={`${getTenantPath(ROUTES.IDEA_BOARD, currentSlug)}?category=${encodeURIComponent(cat.name)}`}
                                      className={cn(
                                        "px-4 py-2 text-sm font-bold rounded-xl transition-all",
                                        new URLSearchParams(location.search).get("category") === cat.name 
                                          ? "bg-white/10 text-white" 
                                          : "text-white/60 hover:text-white hover:bg-white/5"
                                      )}
                                      style={{ paddingLeft: `${(depth + 1) * 1}rem` }}
                                    >
                                      {cat.name}
                                    </Link>
                                    {cat.children?.map((child: any) => renderCategory(child, depth + 1))}
                                  </div>
                                );
                                return archivedTree.map((cat: any) => renderCategory(cat));
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {['admin', 'tenant_admin', 'super_admin'].includes(user?.role || '') && (
                      <div className="space-y-4">
                        <p className="text-[10px] uppercase font-black tracking-widest text-white/40 px-2 flex items-center gap-2">
                          <ShieldCheck className="h-3 w-3" /> Administration
                        </p>
                        <div className="space-y-2">
                          <Link to={getTenantPath(ROUTES.ADMIN_DASHBOARD, currentSlug)} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all">
                            Admin Dashboard
                          </Link>
                          <Link to={getTenantPath(ROUTES.ADMIN_USERS, currentSlug)} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all">
                            Manage Users
                          </Link>
                          <Link to={getTenantPath(ROUTES.ADMIN_SETTINGS, currentSlug)} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all">
                            Organization Settings
                          </Link>
                          <Link to={getTenantPath(ROUTES.ADMIN_CATEGORIES, currentSlug)} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all">
                            Manage Categories
                          </Link>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <SupportDialog>
                        <button className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold bg-white/5 text-white/80 hover:bg-white/10 transition-all border border-white/5">
                          <HelpCircle className="h-5 w-5 text-primary" />
                          Help & Support
                        </button>
                      </SupportDialog>
                    </div>

                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <Link to={getTenantPath(ROUTES.IDEA_BOARD, currentSlug)} className="flex items-center gap-2 md:gap-3.5 hover:opacity-90 transition-all group shrink-0">
            <div className="bg-primary/20 p-1.5 md:p-2.5 rounded-xl group-hover:bg-primary/30 transition-colors">
              <Logo imageClassName="h-6 w-6 md:h-10 md:w-10" />
            </div>
            <div className="flex flex-col -gap-1 overflow-hidden">
              <span 
                className="block font-black text-base md:text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 truncate max-w-[120px] xs:max-w-[180px] md:max-w-none"
                style={{ WebkitTextFillColor: 'transparent' }}
              >
                {tenant?.name || "IdeaForge"}
              </span>
              {tenant?.name && (
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-[0.2em] text-primary/80 ml-0.5">
                  IdeaForge
                </span>
              )}
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex flex-none items-center gap-8 h-full justify-center">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.name}
                to={tab.path}
                className={`text-sm font-bold transition-all relative h-full flex items-center group ${
                  isActive ? "text-white" : "text-white/50 hover:text-white/90"
                }`}
              >
                {tab.name}
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 flex items-center justify-end gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-2 rounded-xl hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:outline-none transition-all group">
                <Bell className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-destructive border-2 border-header rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="bg-header border-white/10 text-white p-0 w-[380px] shadow-2xl rounded-2xl overflow-hidden mt-2 z-50">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive/20 ml-2">
                      {unreadCount} New
                    </Badge>
                  )}
                </h3>
                <NotificationSettingsDialog>
                  <button className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Notification Settings">
                    <Settings className="w-4 h-4 text-white/70" />
                  </button>
                </NotificationSettingsDialog>
              </div>
              <ScrollArea className="h-[400px] max-h-[60vh]">
                <div className="p-2">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsReadAndNavigate(n)}
                        className={`p-3 rounded-xl mb-1 transition-all cursor-pointer flex gap-4 items-start ${
                          !n.is_read 
                            ? "bg-primary/5 hover:bg-primary/10" 
                            : "hover:bg-white/5"
                        }`}
                      >
                        <div className="relative mt-1">
                           <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center relative shadow-inner">
                              <Bell className="w-5 h-5 text-primary/70" />
                              {!n.is_read && (
                                <div className="absolute top-0 right-0 w-3 h-3 bg-primary border-2 border-header rounded-full"></div>
                              )}
                           </div>
                        </div>
                        <div className="flex-1 space-y-1 py-1">
                          <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>
                            {n.message}
                          </p>
                          <p className={`text-[11px] ${!n.is_read ? 'text-primary/80 font-medium' : 'text-white/40'}`}>
                            {new Date(n.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                      <div className="bg-white/5 p-4 rounded-full mb-3">
                        <Bell className="h-6 w-6 text-white/20" />
                      </div>
                      <h3 className="text-base font-bold mb-1">No notifications</h3>
                      <p className="text-xs text-white/40">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-2 border-t border-white/10 bg-white/5 text-center">
                 <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1 w-full" onClick={() => navigate(getTenantPath(ROUTES.ACTIVITY, currentSlug))}>
                    See all Activity
                 </button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="hidden md:flex items-center gap-2 ml-1 border-l border-white/10 pl-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:outline-none transition-all group">
                    <div className="relative">
                      <Avatar className="h-8 w-8 border-2 border-white/10 group-hover:border-primary/50 transition-colors">
                        <AvatarFallback className="bg-primary text-white text-[10px] font-bold">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-success border-2 border-header rounded-full" />
                    </div>
                    <div className="hidden sm:flex flex-col items-start leading-none gap-1">
                      <span className="text-sm font-bold tracking-tight">{user.name}</span>
                      <span className="text-[10px] opacity-50 uppercase font-bold tracking-wider">{user.role}</span>
                    </div>
                    <ChevronDown className="hidden sm:block h-4 w-4 text-white/40 group-hover:text-white/70 transition-colors" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-72 rounded-2xl border border-white/10 bg-header/95 p-1.5 text-white backdrop-blur-2xl shadow-[0_24px_60px_-24px_rgba(15,23,42,0.7)]"
                >
                  <DropdownMenuLabel className="px-3 pb-1.5 pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                    Quick Actions
                  </DropdownMenuLabel>
                  
                  <DropdownMenuItem 
                    onClick={() => navigate(getTenantPath(ROUTES.PROFILE, currentSlug))}
                    className="group cursor-pointer rounded-xl px-3 py-2.5 text-white/82 transition-all hover:!bg-white/90 hover:!text-slate-950 focus:!bg-white/90 focus:!text-slate-950"
                  >
                    <UserCircle2 className="mr-3 h-4 w-4 text-primary transition-colors group-hover:text-slate-950" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold leading-tight">My Profile</span>
                      <span className="text-[10px] leading-tight text-white/50 transition-colors group-hover:text-slate-700">Manage your account & preferences</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="group cursor-pointer rounded-xl px-3 py-2.5 text-white/82 transition-all hover:!bg-white/90 hover:!text-slate-950 focus:!bg-white/90 focus:!text-slate-950"
                  >
                    {mounted && (theme === 'dark' ? (
                      <Sun className="mr-3 h-4 w-4 text-amber-400 fill-amber-400/20 transition-colors group-hover:text-slate-950" />
                    ) : (
                      <Moon className="mr-3 h-4 w-4 text-primary transition-colors group-hover:text-slate-950" />
                    ))}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold leading-tight">Appearance</span>
                      <span className="text-[10px] leading-tight text-white/50 transition-colors group-hover:text-slate-700">
                        {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                      </span>
                    </div>
                  </DropdownMenuItem>

                  <SupportDialog>
                    <DropdownMenuItem className="group cursor-pointer rounded-xl px-3 py-2.5 text-white/82 transition-all hover:!bg-white/90 hover:!text-slate-950 focus:!bg-white/90 focus:!text-slate-950 w-full">
                      <HelpCircle className="mr-3 h-4 w-4 text-info transition-colors group-hover:text-slate-950" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-tight">Contact Support</span>
                        <span className="text-[10px] leading-tight text-white/50 transition-colors group-hover:text-slate-700">Need help? Get in touch</span>
                      </div>
                    </DropdownMenuItem>
                  </SupportDialog>

                  <DropdownMenuSeparator className="my-1.5 bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="group cursor-pointer rounded-xl px-3 py-2.5 text-red-200 transition-all hover:!bg-white/90 hover:!text-slate-950 focus:!bg-white/90 focus:!text-slate-950"
                  >
                    <LogOut className="mr-3 h-4 w-4 transition-colors group-hover:text-slate-950 group-focus:text-slate-950" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold leading-tight">Logout</span>
                      <span className="text-[10px] leading-tight text-red-200/70 transition-colors group-hover:text-slate-700 group-focus:text-slate-700">Sign out of this workspace</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Button asChild variant="default" size="sm" className="h-8 px-4 rounded-full text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                  <Link to={getTenantPath(ROUTES.LOGIN, currentSlug)}>Login</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
