import { useState } from "react";
import { Search, Sparkles, Plus } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getTenantPath, ROUTES } from "@/lib/constants";
import ProfileIdeaCard from "./ProfileIdeaCard";
import { toast } from "sonner";

const MyIdeasView = () => {
  const { token, user } = useAuth();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ["user-ideas", user?.id],
    queryFn: () => api.get("/ideas/my-ideas", token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const bookmarkMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ideas/${id}/bookmark`, {}, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-ideas", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["bookmarked-ideas", user?.id] });
    },
  });

  const handleBookmark = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    bookmarkMutation.mutate(id);
  };

  const filteredIdeas = ideas.filter((idea: any) =>
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-card rounded-2xl border border-border shadow-sm transition-colors">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">My Ideas</h2>
            <p className="text-muted-foreground font-medium">{ideas.length} submissions track record.</p>
          </div>
        </div>

        <div className="relative w-full sm:w-72 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search my ideas…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredIdeas.map((idea: any) => (
            <motion.div
              layout
              key={idea.id}
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
          <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center text-4xl">✨</div>
          <div className="space-y-1">
            <p className="text-xl font-black text-foreground">No ideas found</p>
            <p className="text-muted-foreground">You haven't submitted any ideas yet or none match your search.</p>
          </div>
          <Button asChild className="rounded-xl font-bold h-11 px-6 shadow-lg shadow-primary/20">
             <Link to={getTenantPath(ROUTES.SUBMIT_IDEA, tenantSlug)}>Submit your first idea</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default MyIdeasView;
