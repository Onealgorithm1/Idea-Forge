import { useState } from "react";
import { Search, Bookmark as BookmarkIcon, LayoutGrid } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getTenantPath, ROUTES } from "@/lib/constants";
import ProfileIdeaCard from "./ProfileIdeaCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SavedIdeasView = () => {
  const { token, user } = useAuth();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'votes' | 'date' | 'comments' | 'alphabetical'>('date');
  const queryClient = useQueryClient();

  const { data: bookmarkedIdeas = [], isLoading } = useQuery({
    queryKey: ["bookmarked-ideas", user?.id],
    queryFn: () => api.get("/ideas/bookmarked", token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const bookmarkMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ideas/${id}/bookmark`, {}, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarked-ideas", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Followed state updated");
    },
  });

  const handleBookmark = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    bookmarkMutation.mutate(id);
  };

  const filteredIdeas = bookmarkedIdeas
    .filter((idea: any) =>
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'votes':
          return (b.votes_count || 0) - (a.votes_count || 0);
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'comments':
          return (b.comments_count || 0) - (a.comments_count || 0);
        case 'alphabetical':
          return (a.title || "").localeCompare(b.title || "");
        default:
          return 0;
      }
    });

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-card rounded-2xl border border-border shadow-sm transition-colors">
            <BookmarkIcon className="h-7 w-7 text-amber-500 fill-amber-500/20" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">Followed Ideas</h2>
            <p className="text-muted-foreground font-medium">{bookmarkedIdeas.length} followed items for reference.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search followed ideas…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm text-foreground"
            />
          </div>

          <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 mr-1">Sort</span>
            <button 
              onClick={() => setSortBy('date')}
              className={cn("px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all", sortBy === 'date' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground")}
            >Date</button>
            <button 
              onClick={() => setSortBy('votes')}
              className={cn("px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all", sortBy === 'votes' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground")}
            >Votes</button>
            <button 
              onClick={() => setSortBy('comments')}
              className={cn("px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all", sortBy === 'comments' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground")}
            >Comments</button>
            <button 
              onClick={() => setSortBy('alphabetical')}
              className={cn("px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all", sortBy === 'alphabetical' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground")}
            >A-Z</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredIdeas.map((idea: any) => (
            <motion.div
              layout
              key={`saved-${idea.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileIdeaCard idea={idea} tenantSlug={tenantSlug || "default"} onBookmark={handleBookmark} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredIdeas.length === 0 && (
        <div className="text-center py-24 bg-card border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center gap-4 transition-colors">
          <div className="h-20 w-20 bg-amber-500/10 rounded-full flex items-center justify-center text-4xl">🔖</div>
          <div className="space-y-1">
            <p className="text-xl font-black text-foreground">No followed ideas</p>
            <p className="text-muted-foreground">You haven't followed any ideas yet.</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl font-bold h-11 px-6 border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-foreground">
             <Link to={getTenantPath(ROUTES.IDEA_BOARD, tenantSlug)}>Explore Idea Board</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default SavedIdeasView;
