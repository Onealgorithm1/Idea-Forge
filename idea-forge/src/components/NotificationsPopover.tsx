import { Bell, Settings, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationSettingsDialog } from "./NotificationSettingsDialog";

interface NotificationsPopoverProps {
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}

export const NotificationsPopover = ({ trigger, align = "end", side = "bottom" }: NotificationsPopoverProps) => {
  const { user, token } = useAuth();
  const { tenant } = useTenant();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);

  const currentSlug = tenant?.slug || tenantSlug || "default";

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
  const hasReadNotifications = notifications.some((n) => n.is_read);

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.post('/ideas/notifications/read-all', {}, token);
      fetchNotifications();
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const clearRead = async () => {
    if (!hasReadNotifications) return;
    try {
      await api.post('/ideas/notifications/clear-read', {}, token);
      fetchNotifications();
      toast.success("Read notifications cleared");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      toast.error("Failed to clear notifications");
    }
  };

  const defaultTrigger = (
    <button className="relative p-2 rounded-xl hover:bg-muted transition-all group">
      <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-primary border-2 border-background rounded-full flex items-center justify-center text-[7px] font-black text-primary-foreground">
          {unreadCount}
        </span>
      )}
    </button>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent align={align} side={side} className="p-0 w-[420px] shadow-2xl rounded-[1.5rem] overflow-hidden z-50 border-border/40 bg-background/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-border/40 bg-muted/30 flex items-center justify-between">
          <div>
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-foreground/80">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-[10px] font-bold text-primary mt-0.5">You have {unreadCount} unread messages</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllRead}
                className="h-8 px-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
              >
                Mark all read
              </Button>
            )}
            {hasReadNotifications && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearRead}
                className="h-8 px-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all"
              >
                Clear read
              </Button>
            )}
            <NotificationSettingsDialog>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90">
                <Settings className="h-4.5 w-4.5" />
              </Button>
            </NotificationSettingsDialog>
          </div>
        </div>
        <ScrollArea className="h-[420px] custom-scrollbar">
          <div className="p-2.5 space-y-1">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => markAsReadAndNavigate(n)}
                  className={cn(
                    "p-4 rounded-[1.25rem] cursor-pointer flex gap-4 transition-all duration-300 group relative",
                    n.is_read ? "hover:bg-muted/40" : "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  {!n.is_read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300",
                    n.is_read ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary shadow-lg shadow-primary/10"
                  )}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-snug break-words",
                      n.is_read ? "text-foreground/70" : "text-foreground font-bold"
                    )}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center space-y-3">
                 <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Bell className="h-8 w-8 text-muted-foreground/30" />
                 </div>
                 <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">All caught up! 🚀</p>
                 <p className="text-[10px] text-muted-foreground/40 font-medium">We'll notify you when something happens.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-border/40 bg-muted/20">
          <Button 
            variant="ghost" 
            className="w-full justify-center h-11 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/10 hover:text-primary rounded-xl transition-all active:scale-[0.98] group"
            onClick={() => {
              navigate(getTenantPath(ROUTES.ACTIVITY, currentSlug));
            }}
          >
            <Activity className="mr-2.5 h-4 w-4 transition-transform group-hover:rotate-12" />
            See all activity
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
