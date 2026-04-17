import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { api } from "@/lib/api";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, ChevronLeft, CheckCheck, Loader2, MessageSquare, ThumbsUp, Activity as ActivityIcon } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const Activity = () => {
  const { user, token } = useAuth();
  const { tenant } = useTenant();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentSlug = tenant?.slug || tenantSlug || "default";

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await api.get("/ideas/notifications", token);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, token]);

  const markAsReadAndNavigate = async (n: any) => {
    if (!n.is_read) {
      try {
        await api.post(`/ideas/notifications/${n.id}/read`, {}, token);
        // Refresh local state instead of full fetch for smoothness
        setNotifications(prev => prev.map(notif => 
          notif.id === n.id ? { ...notif, is_read: true } : notif
        ));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    navigate(getTenantPath(ROUTES.IDEA_DETAIL.replace(':id', n.reference_id), currentSlug));
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/ideas/notifications/read-all", {}, token);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive"
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'vote': return <ThumbsUp className="w-5 h-5 text-primary" />;
      case 'comment': return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'status_update': return <ActivityIcon className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-header flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Activity Log</h1>
              <p className="text-sm text-white/50">Keep track of updates and interactions</p>
            </div>
          </div>

          {notifications.some(n => !n.is_read) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary gap-2"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-white/40 font-medium">Loading activity...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-white/5">
              {notifications.map((n, idx) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => markAsReadAndNavigate(n)}
                  className={cn(
                    "flex items-start gap-4 p-5 cursor-pointer transition-all hover:bg-white/[0.07]",
                    !n.is_read ? "bg-primary/[0.03] border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                  )}
                >
                  <div className="relative mt-1">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center relative shadow-inner border border-white/5">
                      {getIcon(n.type)}
                      {!n.is_read && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary border-2 border-[#1a1c23] rounded-full shadow-lg"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn(
                      "text-sm leading-relaxed",
                      !n.is_read ? "text-white font-bold" : "text-white/70 font-medium"
                    )}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-[11px] font-semibold uppercase tracking-wider",
                        !n.is_read ? "text-primary" : "text-white/30"
                      )}>
                        {n.type?.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-white/30">•</span>
                      <span className="text-[11px] text-white/30">
                        {new Date(n.created_at).toLocaleString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          year: new Date(n.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="bg-white/5 p-6 rounded-full mb-6">
                <Bell className="h-10 w-10 text-white/10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Clean slate!</h3>
              <p className="text-sm text-white/40 max-w-xs">
                You don't have any notifications or activity logs to show right now.
              </p>
              <Button 
                variant="link" 
                className="mt-6 text-primary hover:text-primary/80"
                onClick={() => navigate(getTenantPath(ROUTES.IDEA_BOARD, currentSlug))}
              >
                Go to Idea Board
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Activity;
