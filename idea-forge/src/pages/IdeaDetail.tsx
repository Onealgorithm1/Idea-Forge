import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, MessageSquare, Heart, Bookmark, Calendar, Target, User, ChevronUp, ChevronDown, Check, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import VotingSystem from "@/components/VotingSystem";

const IdeaDetail = () => {
  const { id, tenantSlug } = useParams<{ id: string; tenantSlug: string }>();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allIdeas = [] } = useQuery({
    queryKey: ["ideas"],
    queryFn: () => api.get("/ideas"),
    staleTime: 1000 * 5, // 5 seconds
  });

  const idea = allIdeas.find((i: any) => String(i.id) === id);

  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => api.get(`/ideas/${id}/comments`),
    enabled: !!idea,
  });

  const [newComment, setNewComment] = useState("");

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/ideas/${id}/comments`, { content }, token!),
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Comment added");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add comment");
    }
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    if (!token) return toast.error("Please login to comment");
    commentMutation.mutate(newComment);
  };

  const voteMutation = useMutation({
    mutationFn: ({ type }: { type: "up" | "down" }) =>
      api.post(`/ideas/${id}/vote`, { type }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Vote recorded");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to vote");
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => api.post(`/ideas/${id}/bookmark`, {}, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    }
  });

  const handleVote = (type: 'up' | 'down') => {
    if (!token) return toast.error("Please login to vote");
    voteMutation.mutate({ type });
  };

  const handleBookmark = () => {
    if (!token) return toast.error("Please login to bookmark");
    bookmarkMutation.mutate();
  };

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/ideas/${id}/status`, { status }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    }
  });

  const handleStatusChange = (status: string) => {
    if (!token) return toast.error("Please login to change status");
    statusMutation.mutate(status);
  };

  const isLoading = !idea && !allIdeas.length;

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

  if (!idea) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center flex-col gap-4">
          <h2 className="text-2xl font-bold">Idea not found</h2>
          <Button asChild variant="outline">
            <Link to={getTenantPath(ROUTES.ROOT, tenantSlug)}>Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <Link to={`${getTenantPath(ROUTES.IDEA_BOARD, tenantSlug)}?category=All`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 w-fit">
              <ChevronLeft className="h-4 w-4" />
              Back to Board
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                   <Badge variant="outline" className={cn("bg-primary/5 text-primary border-primary/20", idea.status === 'Shipped' && "bg-success/10 text-success border-success/20")}>
                     {idea.status}
                   </Badge>
                   <span className="text-xs text-muted-foreground">•</span>
                   <span className="text-xs text-muted-foreground">{idea.category}</span>
                   <span className="text-xs text-muted-foreground">•</span>
                   <span className="text-xs text-muted-foreground flex items-center gap-1">
                     <Calendar className="h-3 w-3" />
                     {format(new Date(idea.created_at), "MMM d, yyyy")}
                   </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{idea.title}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {idea.author}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {user?.role === 'admin' && (
                  <div className="flex items-center gap-1 mr-2 bg-muted/50 p-1 rounded-md border border-dashed">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground px-2">Admin Status:</span>
                    {['In Progress', 'In Development', 'Shipped'].map((s) => (
                      <Button
                        key={s}
                        variant={idea.status === s ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-[10px] px-2"
                        onClick={() => handleStatusChange(s)}
                        disabled={statusMutation.isPending}
                      >
                        {statusMutation.isPending && statusMutation.variables === s ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : s}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex items-center bg-background border rounded-md overflow-hidden">
                  <VotingSystem
                    ideaId={idea.id}
                    initialVotes={idea.votes_count}
                    onVote={(type) => handleVote(type)}
                    hasVoted={idea.has_voted}
                    orientation="horizontal"
                    className="border-none bg-transparent shadow-none"
                  />
                </div>

                 <Button
                   variant="outline"
                   size="sm"
                   className="gap-2"
                   onClick={handleBookmark}
                 >
                   <Bookmark className="h-4 w-4" />
                   Save
                 </Button>
              </div>
            </div>

            <Card className="p-8">
              <div className="prose prose-sm max-w-none">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {idea.description}
                </p>
              </div>

              {idea.tags && idea.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t flex flex-wrap gap-2">
                  <Target className="h-4 w-4 text-muted-foreground mr-1" />
                  {idea.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="hover:bg-accent cursor-default">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({comments.length})
              </h3>

              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Share your thoughts or feedback..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  className="flex-1 bg-background border border-border shadow-sm rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || commentMutation.isPending}
                  className="font-medium px-6 py-2.5 rounded-lg shadow-sm"
                >
                  {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              </div>

              <div className="space-y-4">
                {comments.map((c) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={c.id}
                    className="bg-background border rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm">{c.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(c.created_at), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{c.content}</p>
                  </motion.div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-10 bg-background border rounded-lg border-dashed">
                    <p className="text-sm text-muted-foreground italic">No comments yet. Be the first to share your thoughts!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default IdeaDetail;
