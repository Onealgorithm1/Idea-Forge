import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MessageSquare, Heart, Bookmark, Calendar, Target, Plus, Search } from "lucide-react";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { getTenantPath, ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import VotingSystem from "@/components/VotingSystem";

const Profile = () => {
  const { user, token } = useAuth();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || "default";
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ["user-ideas", user?.id],
    queryFn: () => api.get("/ideas/my-ideas", token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: "up" | "down" }) => 
      api.post(`/ideas/${id}/vote`, { type }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-ideas", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Vote recorded");
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ideas/${id}/bookmark`, {}, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-ideas", user?.id] });
    }
  });

  const handleVote = (e: React.MouseEvent, id: string, type: 'up' | 'down') => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return toast.error("Please login to vote");
    voteMutation.mutate({ id, type });
  };

  const handleBookmark = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return toast.error("Please login to bookmark");
    bookmarkMutation.mutate(id);
  };

  const filteredIdeas = ideas.filter((idea: any) => 
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 border-2 border-primary/10">
                  <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{user?.name}</h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="px-2 py-0.5">
                      {ideas.length} Ideas Posted
                    </Badge>
                  </div>
                </div>
              </div>

              <Button asChild className="gap-2">
                <Link to={ROUTES.SUBMIT_IDEA}>
                  <Plus className="h-4 w-4" />
                  New Idea
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">My Submissions</h2>
                <div className="relative w-64">
                   <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                   <input
                     type="text"
                     placeholder="Search my ideas..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-background border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredIdeas.map((idea) => (
                    <motion.div
                      layout
                      key={idea.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link to={getTenantPath(ROUTES.IDEA_DETAIL.replace(':id', idea.id), tenantSlug)}>
                        <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all group p-5 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase text-[10px]">
                                {idea.category}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(idea.created_at), "MMM d, yyyy")}
                              </span>
                            </div>
                            <h3 className="font-bold group-hover:text-primary transition-colors line-clamp-2">
                              {idea.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {idea.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 mt-5 pt-4 border-t text-muted-foreground">
                            <VotingSystem 
                              ideaId={idea.id} 
                              initialVotes={idea.votes_count} 
                              onVote={(type) => handleVote({ stopPropagation: () => {}, preventDefault: () => {} } as any, idea.id, type)}
                              orientation="horizontal"
                              className="scale-90 origin-left border-none bg-transparent shadow-none p-0"
                            />
                            <div className="flex items-center gap-1.5 text-xs">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {idea.comments_count || 0}
                            </div>
                            <button 
                              onClick={(e) => handleBookmark(e, idea.id)}
                              className="p-1.5 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground ml-auto"
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                            </button>
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              {idea.status}
                            </Badge>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredIdeas.length === 0 && (
                <div className="text-center py-20 bg-muted/20 border border-dashed rounded-xl">
                  {searchQuery ? (
                    <p className="text-muted-foreground">No ideas match your search.</p>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-lg font-medium">You haven't posted any ideas yet.</p>
                      <Button asChild variant="outline">
                        <Link to={ROUTES.SUBMIT_IDEA}>Start Creating</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
