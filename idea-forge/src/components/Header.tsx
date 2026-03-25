import { Bell, LogOut, HelpCircle } from "lucide-react";
import { SupportDialog } from "./SupportDialog";
import { motion } from "framer-motion";
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

const Header = () => {
  const { user, logout, token } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [notifications, setNotifications] = useState<any[]>([]);

  const tabs = [
    { name: "Dashboard", path: getTenantPath(ROUTES.ROOT, tenantSlug) },
    { name: "Idea Board", path: getTenantPath(ROUTES.IDEA_BOARD, tenantSlug) },
    { name: "Roadmap", path: getTenantPath(ROUTES.ROADMAP, tenantSlug) },
    { name: "Analytics", path: getTenantPath(ROUTES.ANALYTICS, tenantSlug) },
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
      // Poll for notifications every 30 seconds
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-50 w-full bg-header text-header-foreground border-b border-white/5 shadow-lg">
      <div className="flex items-center justify-between px-6 h-16 max-w-[1600px] mx-auto w-full">
        
        <Link to={getTenantPath(ROUTES.ROOT, tenantSlug)} className="flex items-center gap-3.5 hover:opacity-90 transition-all group">
          <div className="bg-primary/20 p-2.5 rounded-xl group-hover:bg-primary/30 transition-colors">
            <Logo imageClassName="h-10 w-10" />
          </div>
          <div className="flex flex-col -gap-1">
            <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              {tenant?.name || "IdeaForge"}
            </span>
            {tenant?.name && (
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/80 ml-0.5">
                IdeaForge Platform
              </span>
            )}
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 h-full">
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

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-1.5 rounded-full hover:bg-white/10 transition-colors">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 bg-destructive text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-header">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 border-white/10 bg-header/98 backdrop-blur-xl shadow-2xl mt-2" align="end">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                <h4 className="text-sm font-bold uppercase tracking-wider opacity-70">Notifications</h4>
                <Badge variant="secondary" className="text-[10px]">{unreadCount} New</Badge>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={`px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <p className="text-sm leading-tight mb-1 font-medium">{n.message}</p>
                      <span className="text-[10px] opacity-50">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-sm opacity-40 italic">
                    No notifications yet.
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <SupportDialog>
            <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors" title="Contact Support">
              <HelpCircle className="h-4 w-4" />
            </button>
          </SupportDialog>

          {user ? (
            <div className="flex items-center gap-2 ml-1 border-l border-white/10 pl-3">
              {/* Profile link — navigates directly to profile page */}
              <Link
                to={getTenantPath(ROUTES.PROFILE, tenantSlug)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/10 transition-all group"
              >
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
              </Link>

              {/* Logout button */}
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Button asChild variant="default" size="sm" className="h-8 px-4 rounded-full text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Link to={getTenantPath(ROUTES.LOGIN, tenantSlug)}>Login</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
