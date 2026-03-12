import { Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ROUTES } from "@/lib/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const tabs = [
  { name: "Dashboard", path: ROUTES.ROOT },
  { name: "Idea Board", path: ROUTES.IDEA_BOARD },
  { name: "Roadmap", path: ROUTES.ROADMAP },
  { name: "Analytics", path: ROUTES.ANALYTICS },
];

function getNavLinkClass(isActive: boolean): string {
  const base = "px-4 py-1.5 text-sm font-medium rounded transition-colors relative";
  return isActive
    ? `${base} text-header-foreground`
    : `${base} text-header-foreground/70 hover:text-header-foreground`;
}

const Header = () => {
  const { user, logout, token } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);

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
    <header className="bg-header text-header-foreground">
      <div className="flex items-center justify-between px-6 h-14">
        <Link to={ROUTES.ROOT} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo imageClassName="h-10 w-10" />
          <span className="font-bold text-lg tracking-tight">IdeaForge</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link key={tab.name} to={tab.path} className={getNavLinkClass(isActive)}>
                {tab.name}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-info rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-1.5 rounded-full hover:bg-header-foreground/10 transition-colors">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center rounded-full border-2 border-header">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <h4 className="text-sm font-semibold">Notifications</h4>
                <Badge variant="outline" className="text-[10px]">{unreadCount} New</Badge>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={`px-4 py-3 border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <p className="text-sm leading-tight mb-1">{n.message}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground italic">
                    No notifications yet.
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm hidden sm:block">{user.name}</span>
              <Avatar className="h-8 w-8 border-2 border-header-foreground/30">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={logout}
                className="relative p-1 rounded-full hover:bg-header-foreground/10 transition-colors ml-1"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Button asChild variant="secondary" size="sm" className="h-8 text-xs font-semibold">
                <Link to={ROUTES.LOGIN}>Login</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
