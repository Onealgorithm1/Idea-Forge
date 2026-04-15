import {
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/contexts/TenantContext";
import GlobalSearch from "./GlobalSearch";
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

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/ideas/notifications/${id}/read`, {}, token);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-50 w-full bg-header text-header-foreground border-b border-white/5 shadow-lg">
      <div className="flex items-center h-16 max-w-[1600px] mx-auto w-full px-4 md:px-6">
        <div className="flex-1 flex items-center justify-start gap-4">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                  <Menu className="h-6 w-6" />
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
                      <p className="text-[10px] uppercase font-black tracking-widest text-white/40 px-2">Navigation</p>
                      <nav className="flex flex-col gap-2">
                        {tabs.map((tab) => {
                          const isActive = location.pathname === tab.path;
                          return (
                            <Link
                              key={tab.name}
                              to={tab.path}
                              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                                isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/60 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              {tab.name}
                            </Link>
                          );
                        })}
                      </nav>
                    </div>

                    {(location.pathname === getTenantPath(ROUTES.IDEA_BOARD, currentSlug)) && (
                      <div className="space-y-4">
                        <p className="text-[10px] uppercase font-black tracking-widest text-white/40 px-2 flex items-center gap-2">
                          <Tag className="h-3 w-3" /> Categories
                        </p>
                        <div className="flex flex-wrap gap-2 px-1">
                          {displayCategories.map((cat) => {
                            const searchParams = new URLSearchParams(location.search);
                            const currentCat = searchParams.get("category") || "All";
                            const isActive = currentCat === cat.label;
                            const params = new URLSearchParams();
                            if (cat.label !== "All") params.set("category", cat.label);
                            const path = `${getTenantPath(ROUTES.IDEA_BOARD, currentSlug)}${params.toString() ? "?" + params.toString() : ""}`;

                            return (
                              <Link
                                key={cat.label}
                                to={path}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                                  isActive ? "bg-white text-header border-white" : "bg-white/5 text-white/70 border-white/10 hover:border-white/20"
                                }`}
                              >
                                {cat.label}
                              </Link>
                            );
                          })}
                        </div>
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

                    <div className="space-y-4">
                      <p className="text-[10px] uppercase font-black tracking-widest text-white/40 px-2">Account</p>
                      <div className="space-y-2">
                        {user ? (
                          <>
                            <Link
                              to={getTenantPath(ROUTES.PROFILE, currentSlug)}
                              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all"
                            >
                              Profile Settings
                            </Link>
                            <button
                              onClick={logout}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all text-left"
                            >
                              Logout
                            </button>
                          </>
                        ) : (
                          <Link
                            to={getTenantPath(ROUTES.LOGIN, currentSlug)}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold bg-primary text-white text-center justify-center"
                          >
                            Login
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <Link to={getTenantPath(ROUTES.IDEA_BOARD, currentSlug)} className="flex items-center gap-3 md:gap-3.5 hover:opacity-90 transition-all group">
            <div className="bg-primary/20 p-2 md:p-2.5 rounded-xl group-hover:bg-primary/30 transition-colors">
              <Logo imageClassName="h-7 w-7 md:h-10 md:w-10" />
            </div>
            <div className="flex flex-col -gap-1">
              <span 
                className="block font-black text-lg md:text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 truncate max-w-[150px] md:max-w-none"
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
          <Sheet>
            <SheetTrigger asChild>
              <button className="relative p-2 rounded-xl hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:outline-none transition-all group">
                <Bell className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-destructive border-2 border-header rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </button>
            </SheetTrigger>
            <SheetContent className="bg-header border-white/10 text-white p-0 w-[400px] sm:w-[540px]">
              <SheetHeader className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-white flex items-center gap-3">
                    <Bell className="h-5 w-5 text-primary" />
                    Notifications
                  </SheetTitle>
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20">
                    {unreadCount} New
                  </Badge>
                </div>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)]">
                <div className="p-2">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-4 rounded-2xl mb-1 transition-all cursor-pointer group ${
                          !n.is_read 
                            ? "bg-primary/10 border border-primary/20 hover:bg-primary/15" 
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? "bg-primary" : "bg-white/10"}`} />
                          <div className="space-y-1">
                            <p className="text-sm leading-snug font-medium text-white/90">{n.message}</p>
                            <p className="text-[10px] text-white/40">{new Date(n.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                      <div className="bg-white/5 p-4 rounded-full mb-4">
                        <Bell className="h-8 w-8 text-white/20" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">No notifications yet</h3>
                      <p className="text-sm text-white/40">We'll notify you when something important happens.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {user ? (
            <div className="flex items-center gap-2 ml-1 border-l border-white/10 pl-3">
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
                    onClick={logout}
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
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Button asChild variant="default" size="sm" className="h-8 px-4 rounded-full text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Link to={getTenantPath(ROUTES.LOGIN, currentSlug)}>Login</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
