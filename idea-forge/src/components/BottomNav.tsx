import { Home, Plus, Bookmark, User, Moon, Sun, HelpCircle, LogOut, Bell } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { cn, getAvatarUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { SupportDialog } from "./SupportDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileDropdown } from "./ProfileDropdown";
import { NotificationsPopover } from "./NotificationsPopover";

const BottomNav = () => {
  const { pathname } = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const currentSlug = tenantSlug || "default";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show bottom nav on login/auth pages
  if (pathname.includes('/login') || pathname.includes('/forgot-password') || pathname.includes('/register-workspace')) {
    return null;
  }


  const navItems = [
    { icon: Home, label: "Home", path: getTenantPath(ROUTES.IDEA_BOARD, currentSlug) },
    { icon: Bell, label: "Alerts", isNotifications: true },
    { icon: Plus, label: "Submit", path: getTenantPath(ROUTES.SUBMIT_IDEA, currentSlug), primary: true },
    { icon: Bookmark, label: "Saved", path: getTenantPath(ROUTES.SAVED_IDEAS, currentSlug) },
    { icon: User, label: "Profile", isProfile: true },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 dark:bg-card/80 backdrop-blur-xl border-t border-border/50 pb-safe-area-inset-bottom ring-1 ring-black/5">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link
                key={item.label}
                to={item.path}
                className="relative flex items-center justify-center min-w-[64px]"
              >
                <div className="grid place-items-center bg-primary hover:bg-primary/90 text-white w-12 h-12 rounded-2xl shadow-premium-lg ring-4 ring-background transition-all active:scale-95 group">
                  <Icon className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
                  <motion.div
                    initial={false}
                    animate={isActive ? { scale: 1.2, opacity: 1 } : { scale: 0, opacity: 0 }}
                    className="absolute -inset-1 bg-primary/20 blur-lg rounded-full -z-10"
                  />
                </div>
              </Link>
            );
          }

          if (item.isNotifications) {
            return (
              <NotificationsPopover
                key={item.label}
                align="center"
                side="top"
                trigger={
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all outline-none",
                      "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="relative">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                  </button>
                }
              />
            );
          }

          if (item.isProfile) {
            return (
              <ProfileDropdown
                key={item.label}
                align="end"
                side="top"
              />
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path!}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  />
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
