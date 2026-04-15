import { Home, Rocket, Plus, Search, Bookmark } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import GlobalSearch from "./GlobalSearch";
import { useState } from "react";

const BottomNav = () => {
  const { pathname } = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const currentSlug = tenantSlug || "default";

  const navItems = [
    { icon: Home, label: "Home", path: getTenantPath(ROUTES.IDEA_BOARD, currentSlug) },
    { icon: Rocket, label: "Roadmap", path: getTenantPath(ROUTES.ROADMAP, currentSlug) },
    { icon: Plus, label: "Submit", path: getTenantPath(ROUTES.SUBMIT_IDEA, currentSlug), primary: true },
    { icon: Bookmark, label: "Saved", path: getTenantPath(ROUTES.SAVED_IDEAS, currentSlug) },
    { icon: Search, label: "Search", isSearch: true },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background/80 dark:bg-card/80 backdrop-blur-xl border-t border-border/50 pb-safe-area-inset-bottom ring-1 ring-black/5">
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

          if (item.isSearch) {
             return (
               <Sheet key="search-sheet" open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                 <SheetTrigger asChild>
                   <button
                     className={cn(
                       "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all",
                       isSearchOpen ? "text-primary scale-110" : "text-muted-foreground"
                     )}
                   >
                     <Icon className="h-5 w-5" />
                     <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                   </button>
                 </SheetTrigger>
                 <SheetContent side="bottom" className="h-[88vh] bg-background border-border p-0 rounded-t-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
                   <SheetHeader className="p-6 border-b border-border/50 shrink-0">
                     <SheetTitle className="text-xl font-bold tracking-tight">Search Ideas</SheetTitle>
                   </SheetHeader>
                   <div className="flex-1 min-h-0 p-6">
                     <GlobalSearch autoFocus onClose={() => setIsSearchOpen(false)} />
                   </div>
                 </SheetContent>
               </Sheet>
             );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
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
