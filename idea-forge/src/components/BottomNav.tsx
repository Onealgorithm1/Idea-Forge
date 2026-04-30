import { Home, Rocket, Plus, Search, Bookmark, User, Moon, Sun, HelpCircle, LogOut } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { cn, getAvatarUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupportDialog } from "./SupportDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    { icon: Rocket, label: "Roadmap", path: getTenantPath(ROUTES.ROADMAP, currentSlug) },
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




          if (item.isProfile) {
            return (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all outline-none",
                      "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="relative">
                      {user ? (
                        <Avatar className="h-5 w-5 border border-white/10">
                          <AvatarImage src={getAvatarUrl(user?.avatar_url, user?.name)} />
                          <AvatarFallback className="bg-primary text-white text-[8px] font-bold">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  sideOffset={12}
                  className="w-72 rounded-2xl border border-white/10 bg-header/95 p-1.5 text-white backdrop-blur-2xl shadow-2xl"
                >
                  <DropdownMenuLabel className="px-3 pb-1.5 pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                    Account Actions
                  </DropdownMenuLabel>
                  
                  {user && (
                    <DropdownMenuItem 
                      asChild
                      className="group cursor-pointer rounded-xl px-3 py-2.5 text-white/82 transition-all hover:!bg-white/90 hover:!text-slate-950 focus:!bg-white/90 focus:!text-slate-950"
                    >
                      <Link to={getTenantPath(ROUTES.PROFILE, currentSlug)} className="flex items-center w-full">
                        <User className="mr-3 h-4 w-4 text-primary transition-colors group-hover:text-slate-950" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold leading-tight">My Profile</span>
                          <span className="text-[10px] leading-tight text-white/50 transition-colors group-hover:text-slate-700">Account settings</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem 
                    onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    className="group cursor-pointer rounded-xl px-3 py-2.5 text-white/82 transition-all hover:!bg-white/90 hover:!text-slate-950 focus:!bg-white/90 focus:!text-slate-950"
                  >
                    {mounted && (resolvedTheme === 'dark' ? (
                      <Sun className="mr-3 h-4 w-4 text-amber-400 fill-amber-400/20 transition-colors group-hover:text-slate-950" />
                    ) : (
                      <Moon className="mr-3 h-4 w-4 text-primary transition-colors group-hover:text-slate-950" />
                    ))}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold leading-tight">Appearance</span>
                      <span className="text-[10px] leading-tight text-white/50 transition-colors group-hover:text-slate-700">
                        {mounted ? (resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode') : 'Switch Theme'}
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

                  {user ? (
                    <>
                      <DropdownMenuSeparator className="my-1.5 bg-white/10" />
                      <DropdownMenuItem
                        onClick={() => logout()}
                        className="group cursor-pointer rounded-xl px-3 py-2.5 text-red-200 transition-all hover:!bg-white/90 hover:!text-slate-950 focus:!bg-white/90 focus:!text-slate-950"
                      >
                        <LogOut className="mr-3 h-4 w-4 transition-colors group-hover:text-slate-950" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold leading-tight">Logout</span>
                          <span className="text-[10px] leading-tight text-red-200/70 transition-colors group-hover:text-slate-700">Sign out of IdeaForge</span>
                        </div>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem asChild className="p-0">
                      <Link to={getTenantPath(ROUTES.LOGIN, currentSlug)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold bg-primary text-white text-center justify-center m-1">
                        Login
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
