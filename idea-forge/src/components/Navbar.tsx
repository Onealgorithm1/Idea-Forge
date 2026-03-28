import { Search, Zap, Plus, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

interface NavbarProps {
  onNewIdea: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const Navbar = ({ onNewIdea, searchQuery, onSearchChange }: NavbarProps) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center gap-4">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Logo imageClassName="h-10 w-10" />
          <span>Idea Forge</span>
        </div>

        <div className="relative ml-4 flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-secondary border-0 focus-visible:ring-1"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Button size="sm" onClick={onNewIdea} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Idea</span>
          </Button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm hidden sm:block font-medium">{user.name}</span>
              <Avatar className="h-8 w-8 border">
                <AvatarFallback className="text-xs font-medium bg-accent text-accent-foreground">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={logout}
                className="relative p-1 rounded-full hover:bg-muted transition-colors ml-1"
                title="Log out"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <Button asChild variant="secondary" size="sm" className="h-8 text-xs font-semibold ml-2">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
