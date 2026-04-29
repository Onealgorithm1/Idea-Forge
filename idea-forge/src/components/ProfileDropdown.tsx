import {
  UserCircle2,
  Sparkles,
  Bookmark,
  HelpCircle,
  Sun,
  Moon,
  Activity,
  Users,
  Building,
  Tag,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { ROUTES, getTenantPath } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SupportDialog } from "./SupportDialog";

const getInitials = (name: string) => {
  if (!name) return "U";
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
};

interface ProfileDropdownProps {
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}

export const ProfileDropdown = ({ trigger, align = "end", side = "bottom" }: ProfileDropdownProps) => {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentSlug = tenant?.slug || tenantSlug || "default";

  const defaultTrigger = (
    <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-all border border-transparent hover:border-border/50">
      <Avatar className="h-8 w-8 border border-border/50">
        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">
          {getInitials(user?.name || "U")}
        </AvatarFallback>
      </Avatar>
      <ChevronDown className="h-3 w-3 text-muted-foreground mr-1" />
    </button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-72 rounded-2xl p-1.5 shadow-2xl border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="px-3 py-3 mb-2 bg-muted/30 rounded-xl">
          <p className="text-sm font-black truncate">{user?.name || "Account"}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user?.role || "User"}</p>
        </div>

        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3 py-2">Account</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.PROFILE, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
          <UserCircle2 className="mr-3 h-4 w-4 text-primary" /> My Profile
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.MY_IDEAS, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
          <Sparkles className="mr-3 h-4 w-4 text-amber-500" /> My Ideas
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.SAVED_IDEAS, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
          <Bookmark className="mr-3 h-4 w-4 text-primary" /> Saved Ideas
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1.5 opacity-40" />
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3 py-2">Preferences</DropdownMenuLabel>
        
        <DropdownMenuItem 
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} 
          className="rounded-xl px-3 py-2.5 cursor-pointer"
        >
          {mounted ? (
            resolvedTheme === 'dark' ? (
              <Sun className="mr-3 h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="mr-3 h-4 w-4 text-primary" />
            )
          ) : (
            <div className="mr-3 h-4 w-4" />
          )}
          Appearance
        </DropdownMenuItem>

        <SupportDialog>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-xl px-3 py-2.5 cursor-pointer w-full">
            <HelpCircle className="mr-3 h-4 w-4 text-blue-500" /> Help & Support
          </DropdownMenuItem>
        </SupportDialog>
        
        {['admin', 'tenant_admin', 'super_admin'].includes(user?.role || '') && (
          <>
            <DropdownMenuSeparator className="my-1.5 opacity-40" />
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3 py-2">Administration</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.ADMIN_DASHBOARD, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
              <Activity className="mr-3 h-4 w-4 text-orange-500" /> Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.ADMIN_USERS, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
              <Users className="mr-3 h-4 w-4 text-blue-500" /> Manage Users
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.ADMIN_SETTINGS, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
              <Building className="mr-3 h-4 w-4 text-purple-500" /> Organisation Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(getTenantPath(ROUTES.ADMIN_CATEGORIES, currentSlug))} className="rounded-xl px-3 py-2.5 cursor-pointer">
              <Tag className="mr-3 h-4 w-4 text-amber-500" /> Manage Categories
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="my-1.5 opacity-40" />
        <DropdownMenuItem onClick={() => logout()} className="rounded-xl px-3 py-2.5 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="mr-3 h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
