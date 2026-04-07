import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams, useParams, useNavigate } from "react-router-dom";
import { Plus, GripVertical, ArrowBigUp, MessageSquare, ChevronUp, ChevronDown, Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES, getTenantPath, PLATFORM_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getInitials, cn } from "@/lib/utils";
import { api } from "@/lib/api";
import VotingSystem from "./VotingSystem";
import ConfirmationModal from "./ConfirmationModal";
import CommentSection from "./CommentSection";

interface BoardIdeaCardProps {
  item: any;
  idx: number;
  user: any;
  voteMutation: any;
  handleVote: (id: string, type: 'up' | 'down') => void;
  handleSelectIdea: (id: string) => void;
  handleBookmark: (id: string) => void;
  setIdeaToDelete: (id: string) => void;
  handleStatusChange?: (id: string, status: string) => void;
  type: 'ideation' | 'development' | 'production';
}

const BoardIdeaCard = ({ 
  item, 
  idx, 
  user, 
  voteMutation, 
  handleVote, 
  handleSelectIdea, 
  handleBookmark, 
  setIdeaToDelete,
  handleStatusChange,
  type
}: BoardIdeaCardProps) => {
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  const onVoteInternal = (voteType: 'up' | 'down') => {
    handleVote(item.id, voteType);
    if (voteType === 'up') {
      setIsCommentOpen(true);
    }
  };

  const getIcon = () => {
    if (type === 'ideation') return "✨";
    if (type === 'development') return "💡";
    return "🚀";
  };

  const getIconBg = () => {
    if (type === 'ideation') return "bg-muted group-hover:bg-muted/80 border-border/50";
    if (type === 'development') return "bg-primary/10 group-hover:bg-primary/20 border-primary/10";
    return "bg-success/10 group-hover:bg-success/20 border-success/10";
  };

  const getBorderColor = () => {
    if (type === 'ideation') return "border-border/30";
    if (type === 'development') return "border-primary/10";
    return "border-success/10";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        layout: { duration: 0.3, type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
        delay: idx * 0.05 
      }}
      onClick={() => handleSelectIdea(item.id)}
      className={cn(
        "group bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden",
        isCommentOpen && "ring-2 ring-primary/40 shadow-premium"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all duration-300 group-hover:scale-110 shadow-sm border", getIconBg())}>
              {getIcon()}
            </div>
            <div>
              <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2 text-foreground">{item.title}</p>
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", type === 'ideation' ? "text-muted-foreground" : type === 'development' ? "text-primary/70" : "text-success/70")}>{item.category}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <button 
              onClick={(e) => { e.stopPropagation(); handleBookmark(item.id); }} 
              className={cn(
                "p-2 bg-background/80 backdrop-blur-sm shadow-md border border-border/50 rounded-xl transition-all hover:scale-110",
                item.is_bookmarked ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"
              )}
              title={item.is_bookmarked ? "Remove Bookmark" : "Bookmark Idea"}
            >
              <Bookmark className={cn("h-3.5 w-3.5", item.is_bookmarked && "fill-current")} />
            </button>
            {(user?.role === 'admin' || user?.id === item.author_id) && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIdeaToDelete(item.id); }} 
                className="p-2 bg-background/80 backdrop-blur-sm shadow-md border border-border/50 rounded-xl text-muted-foreground hover:text-red-500 hover:scale-110 transition-all"
                title="Delete Idea"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {type === 'production' && user?.role === 'admin' && handleStatusChange && (
              <button
                onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, item.status === 'Shipped' ? 'In Development' : 'In Progress'); }}
                className="p-1.5 bg-white/90 backdrop-blur-sm shadow-md border border-white/20 rounded-xl text-muted-foreground hover:text-primary transition-all"
                title="Revert"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-4">
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className={cn("text-[9px] px-2 py-0.5 h-auto border-none", type === 'ideation' ? "bg-muted text-muted-foreground font-bold" : type === 'development' ? "bg-primary/10 text-primary" : "bg-success/10 text-success")}>#{tag}</Badge>
              ))}
            </div>
            {/* Points Display */}
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black tracking-tight transition-all shadow-sm",
              (item.votes_count || 0) > 0 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                : "bg-muted text-muted-foreground border-border/50"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", (item.votes_count || 0) > 0 ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30")} />
              {(item.votes_count || 0) * 10} points
            </div>
          </div>
        )}

        <div className={cn("flex items-center justify-between mt-auto pt-4 border-t", getBorderColor())}>
          <div className="flex items-center gap-4">
            <VotingSystem
              ideaId={item.id}
              initialVotes={item.votes_count}
              onVote={onVoteInternal}
              userVote={item.vote_type}
              orientation="horizontal"
              className="scale-95 origin-left"
              isLoading={voteMutation.isPending && voteMutation.variables?.id === item.id}
            />
            <div 
              className="relative"
              onClick={(e) => { e.stopPropagation(); setIsCommentOpen(!isCommentOpen); }}
            >
              <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors", type === 'ideation' ? "bg-muted hover:bg-muted/80" : type === 'development' ? "bg-primary/5 hover:bg-primary/10" : "bg-success/5 hover:bg-success/10")}>
                <MessageSquare className={cn("h-3.5 w-3.5", type === 'ideation' ? "text-muted-foreground" : type === 'development' ? "text-primary/60" : "text-success/60")} />
                <span className={cn("text-xs font-black tracking-tighter", type === 'ideation' ? "text-muted-foreground font-bold" : type === 'development' ? "text-primary/80" : "text-success")}>{item.comments_count || 0}</span>
              </div>
            </div>
          </div>

          <Avatar className={cn("h-7 w-7 ring-2 ring-background shadow-sm border", type === 'ideation' ? "border-border" : type === 'development' ? "border-primary/20" : "border-success/20")}>
            <AvatarFallback className={cn("text-[9px] font-black uppercase", type === 'ideation' ? "bg-muted text-muted-foreground" : type === 'development' ? "bg-primary/20 text-primary" : "bg-success/20 text-success")}>
              {getInitials(item.author || "Guest")}
            </AvatarFallback>
          </Avatar>
        </div>

        <AnimatePresence>
          {isCommentOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <CommentSection ideaId={item.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const statusColor: Record<string, string> = {
  "Pending": "bg-muted text-muted-foreground",
  "Under Review": "bg-warning/15 text-warning border-warning/20",
  "In Progress": "bg-info/15 text-info border-info/20",
  "In Development": "bg-primary/15 text-primary border-primary/20",
  "QA": "bg-warning/15 text-warning border-warning/20",
  "Shipped": "bg-success/15 text-success border-success/20",
};

const KanbanBoard = ({ category = "All" }: { category?: string }) => {
  const navigate = useNavigate();
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [searchParams] = useSearchParams();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ["ideas", tenantSlug],
    queryFn: () => api.get("/ideas", token || undefined),
    staleTime: 1000 * 60, // 1 minute
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: "up" | "down" }) =>
      api.post(`/ideas/${id}/vote`, { type }, token!),
    onMutate: async ({ id, type }) => {
      // Cancel any outgoing refetch so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["ideas", tenantSlug] });

      // Snapshot the previous value
      const previousIdeas = queryClient.getQueryData(["ideas", tenantSlug]);

      // Optimistically update to the new value
      queryClient.setQueryData(["ideas", tenantSlug], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map(idea => {
          if (idea.id !== id) return idea;
          
          let delta = 0;
          let newVoteType: "up" | "down" | null = null;
          
          if (idea.vote_type) {
            // Toggle off: If they had a vote, any click (up or down) removes it
            delta = -1;
            newVoteType = null;
          } else if (type === 'up') {
            // First vote and it's an upvote
            delta = 1;
            newVoteType = 'up';
          }
          
          return {
            ...idea,
            votes_count: Math.max(0, parseInt(idea.votes_count || 0) + delta),
            vote_type: newVoteType,
          };
        });
      });

      return { previousIdeas };
    },
    onError: (err: any, variables, context) => {
      // Roll back optimistic update
      if (context?.previousIdeas) {
        queryClient.setQueryData(["ideas", tenantSlug], context.previousIdeas);
      }
      // Only show toast for non-409 errors (409 means already voted, UI already shows lock)
      if ((err as any)?.status !== 409) {
        toast.error(err.message || "Failed to vote");
      }
    },
    onSettled: (data) => {
      // Always refetch after error or success to keep server in sync
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ideas/${id}/bookmark`, {}, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ideas/${id}`, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Idea deleted");
    },
    onError: (error: any) => toast.error(error.message || "Failed to delete idea"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/ideas/${id}/status`, { status }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    }
  });



  const handleVote = (id: string, type: 'up' | 'down') => {
    if (!token) return toast.error("Please login to vote");
    if (voteMutation.isPending) return;
    voteMutation.mutate({ id, type });
  };

  const handleSelectIdea = (id: string) => {
    navigate(getTenantPath(ROUTES.IDEA_DETAIL.replace(':id', id), tenantSlug || "default"));
  };

  const handleBookmark = (id: string) => {
    if (!token) return toast.error("Please login to bookmark");
    bookmarkMutation.mutate(id);
  };

  const handleStatusChange = (id: string, status: string) => {
    if (!token) return toast.error("Please login to change status");
    statusMutation.mutate({ id, status });
  };

  const prefetchIdea = async (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ["comments", id],
      queryFn: () => api.get(`/ideas/${id}/comments`),
    });
  };

  // Filter ideas based on category and status
  const filteredIdeas = category === "All"
    ? ideas
    : ideas.filter(i => i.category === category);

  const ideaPoolItems = filteredIdeas.filter(i => i.status === 'Pending');
  const votingItems = filteredIdeas.filter(i => i.status === 'Under Review' || i.status === 'In Progress' || i.status === 'In Development' || i.status === 'QA');
  const devItems = filteredIdeas.filter(i => i.status === 'Shipped');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Idea Pool */}
        <Card className="flex flex-col h-[calc(100vh-14rem)] p-0 overflow-hidden border-none shadow-premium bg-gradient-to-b from-muted/50 to-muted/10 backdrop-blur-sm border-t-4 border-muted/50 transition-colors duration-300">
          <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-muted rounded-lg">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-sm tracking-tight text-foreground">Ideation</h3>
            </div>
            <div className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{ideaPoolItems.length}</div>
          </div>
          <div className="flex-1 p-3 space-y-3 overflow-y-auto no-scrollbar">
            {ideaPoolItems.map((item, idx) => (
              <BoardIdeaCard
                key={item.id}
                item={item}
                idx={idx}
                user={user}
                voteMutation={voteMutation}
                handleVote={handleVote}
                handleSelectIdea={handleSelectIdea}
                handleBookmark={handleBookmark}
                setIdeaToDelete={setIdeaToDelete}
                type="ideation"
              />
            ))}
          </div>
        </Card>

        {/* Voting & Feedback */}
        <Card className="flex flex-col h-[calc(100vh-14rem)] p-0 overflow-hidden border-none shadow-premium bg-primary/5 backdrop-blur-sm border-t-4 border-primary/30 transition-colors duration-300">
          <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-primary/10 bg-primary/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/20 rounded-lg">
                <ArrowBigUp className="h-4 w-4 text-primary fill-primary/20" />
              </div>
              <h3 className="font-bold text-sm tracking-tight text-primary">In Development</h3>
            </div>
            <div className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{votingItems.length}</div>
          </div>
          <div className="flex-1 p-3 space-y-3 overflow-y-auto no-scrollbar">
            {votingItems.map((item, idx) => (
              <BoardIdeaCard
                key={item.id}
                item={item}
                idx={idx}
                user={user}
                voteMutation={voteMutation}
                handleVote={handleVote}
                handleSelectIdea={handleSelectIdea}
                handleBookmark={handleBookmark}
                setIdeaToDelete={setIdeaToDelete}
                type="development"
              />
            ))}
          </div>
        </Card>

        {/* In Development */}
        <Card className="flex flex-col h-[calc(100vh-14rem)] p-0 overflow-hidden border-none shadow-premium bg-success/5 backdrop-blur-sm border-t-4 border-success/30 transition-colors duration-300">
          <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-success/10 bg-success/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-success/20 rounded-lg">
                <Plus className="h-4 w-4 text-success" />
              </div>
              <h3 className="font-bold text-sm tracking-tight text-success">In Production</h3>
            </div>
            <div className="bg-success/20 text-success px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{devItems.length}</div>
          </div>
          <div className="flex-1 p-3 space-y-3 overflow-y-auto no-scrollbar">
            {devItems.map((item, idx) => (
              <BoardIdeaCard
                key={item.id}
                item={item}
                idx={idx}
                user={user}
                voteMutation={voteMutation}
                handleVote={handleVote}
                handleSelectIdea={handleSelectIdea}
                handleBookmark={handleBookmark}
                setIdeaToDelete={setIdeaToDelete}
                handleStatusChange={handleStatusChange}
                type="production"
              />
            ))}
          </div>
        </Card>
      </div>

      <ConfirmationModal
        isOpen={!!ideaToDelete}
        onClose={() => setIdeaToDelete(null)}
        onConfirm={() => {
          if (ideaToDelete) {
            deleteMutation.mutate(ideaToDelete);
            setIdeaToDelete(null);
          }
        }}
        title="Delete Idea?"
        message="This action will permanently delete this idea and all associated data. This action cannot be undone."
        confirmText="Delete Idea"
        type="danger"
      />
    </div>
  );
};

export default KanbanBoard;
