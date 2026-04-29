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
import { toast } from "sonner";
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
import { formatDistanceToNow } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight, HomeIcon } from "lucide-react";

import { ProfileDropdown } from "./ProfileDropdown";
import { NotificationsPopover } from "./NotificationsPopover";
import { SidebarContent } from "./SidebarContent";

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
  useEffect(() => {
    setMounted(true);
  }, []);

  // Robust slug detection
  const currentSlug = tenant?.slug || tenantSlug || "default";

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
                   <SidebarContent />
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
                      <span className="hidden xl:inline text-xs font-black uppercase tracking-widest">Idea-Forge</span>
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

          <div className="relative flex-1 max-w-md group flex items-center mx-2 md:mx-0">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={new URLSearchParams(location.search).get("search") || ""}
              onChange={(e) => {
                const params = new URLSearchParams(location.search);
                if (e.target.value) params.set("search", e.target.value);
                else params.delete("search");
                navigate(`${location.pathname}?${params.toString()}`, { replace: true });
              }}
              placeholder="Search..."
              className="w-full h-9 md:h-10 pl-9 md:pl-11 pr-4 bg-muted/40 border border-transparent rounded-xl text-xs md:text-sm focus:bg-background focus:border-border/60 transition-all outline-none"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            onClick={() => navigate(getTenantPath(ROUTES.SUBMIT_IDEA, currentSlug))}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all group hidden md:flex"
          >
             <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
             <span className="hidden sm:inline">New Idea</span>
             <span className="sm:hidden">Add</span>
          </Button>

          <div className="hidden md:block">
            <NotificationsPopover />
          </div>

          <div className="hidden md:block">
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
