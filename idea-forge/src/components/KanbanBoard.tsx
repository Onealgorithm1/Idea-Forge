import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams, useParams, useNavigate } from "react-router-dom";
import {
  MoreVertical, Edit2, Trash2, Filter, Search, Plus,
  MessageSquare, ChevronDown, ChevronRight, Bookmark, GripVertical, ArrowBigUp, ChevronUp, ExternalLink, Lock,
  LayoutGrid, Rocket, Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES, getTenantPath, PLATFORM_STATUS_LABELS, ADMIN_ROLES, MANAGEMENT_ROLES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    if (voteType === 'up' && item.vote_type !== 'up') {
      setIsCommentOpen(true);
      toast.info("Thanks for liking! Would you like to leave a comment?", {
        duration: 3000,
      });
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
      onClick={(e) => {
        if (!isCommentOpen) handleSelectIdea(item.id);
      }}
      className={cn(
        "group bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative",
        isCommentOpen && "ring-2 ring-primary/40 shadow-premium"
      )}
    >
      <div className="flex flex-col h-full relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-all duration-300 group-hover:scale-110 shadow-sm border", getIconBg())}>
              {getIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("text-[10px] font-black uppercase tracking-wider flex items-center gap-1", type === 'ideation' ? "text-muted-foreground" : type === 'development' ? "text-primary/70" : "text-success/70")}>
                  {item.parent_name ? (
                    <>
                      {item.parent_name}
                      <ChevronRight className="h-2 w-2 opacity-50" />
                      {item.category}
                    </>
                  ) : (
                    item.category
                  )}
                </span>
                {item.priority && (
                  <Badge variant="outline" className={cn(
                    "text-[8px] font-black px-1.5 py-0 leading-none h-4 border-none uppercase",
                    item.priority === 'High' ? "bg-destructive/10 text-destructive" :
                    item.priority === 'Medium' ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                  )}>
                    {item.priority}
                  </Badge>
                )}
              </div>
              <p className="text-base font-black leading-snug group-hover:text-primary transition-colors line-clamp-2 text-foreground break-words">{item.title}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-2 font-medium leading-relaxed italic">
                  {item.description}
                </p>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-[9px] px-2 py-0.5 h-auto bg-muted/50 text-muted-foreground border-none font-bold">
                      #{tag}
                    </Badge>
                  ))}
                  {item.status === 'Shipped' && (
                    <Badge variant="outline" className="text-[8px] font-black px-1.5 py-0 leading-none h-4 border-none uppercase bg-blue-500/10 text-blue-600 flex items-center gap-1">
                      <Lock className="h-2 w-2" />
                      Closed
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <button
              onClick={(e) => { e.stopPropagation(); handleBookmark(item.id); }}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-300",
                item.is_bookmarked ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title={item.is_bookmarked ? "Remove Bookmark" : "Bookmark Idea"}
            >
              <Bookmark className={cn("h-3.5 w-3.5", item.is_bookmarked && "fill-current")} />
            </button>
            {ADMIN_ROLES.includes(user?.role) && (
              <button
                onClick={(e) => { e.stopPropagation(); setIdeaToDelete(item.id); }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {type === 'production' && ADMIN_ROLES.includes(user?.role) && handleStatusChange && (
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

        {/* Info Row */}
        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <VotingSystem
                ideaId={item.id}
                initialVotes={item.votes_count}
                onVote={onVoteInternal}
                userVote={item.vote_type}
                orientation="horizontal"
                className="scale-95 origin-left"
                isLoading={voteMutation.isPending && voteMutation.variables?.id === item.id}
                disabled={item.status === 'Shipped'}
              />
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-border shadow-sm">
                  <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground uppercase">
                    {getInitials(item.author_name || "Un")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Author</span>
                  <span className="text-[11px] font-bold text-foreground truncate max-w-[80px]">
                    {item.author_name?.split(' ')[0] || "Anonymous"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setIsCommentOpen(!isCommentOpen); }}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all",
                  isCommentOpen ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs font-black">{item.comments_count || 0}</span>
              </button>
              <div className="flex flex-col items-center pl-3 border-l-2 border-primary/20 bg-primary/5 px-2 py-1 rounded-lg">
                <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">Points</span>
                <span className="text-sm font-black text-primary">{(item.votes_count || 0) * 10}</span>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isCommentOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden bg-muted/30 rounded-lg p-2"
              onClick={(e) => e.stopPropagation()}
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

const KanbanBoard = ({ category = "All", spaceId = null }: { category?: string, spaceId?: string | null }) => {
  const navigate = useNavigate();
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [searchParams] = useSearchParams();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<'ideation' | 'development' | 'production'>('ideation');

  const stages = [
    { id: 'ideation' as const, name: 'Ideation', icon: Lightbulb, color: 'muted' },
    { id: 'development' as const, name: 'In Development', icon: ArrowBigUp, color: 'primary' },
    { id: 'production' as const, name: 'In Production', icon: Rocket, color: 'success' },
  ];

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

          if (idea.vote_type === type) {
            // Unvote
            delta = type === 'up' ? -1 : 1;
            newVoteType = null;
          } else {
            // Changing vote or first vote
            if (idea.vote_type === 'up') delta -= 1;
            if (idea.vote_type === 'down') delta += 1;

            if (type === 'up') delta += 1;
            if (type === 'down') delta -= 1;

            newVoteType = type;
          }

          return {
            ...idea,
            votes_count: (parseInt(idea.votes_count || 0) + delta),
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

  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-[450px] h-[calc(100vh-14rem)] bg-muted/20 animate-pulse rounded-3xl border border-border/50" />
        ))}
      </div>
    );
  }

  // Filter ideas based on category, state, and space
  const filteredIdeas = ideas.filter((i: any) => {
    const categoryMatch = category === "All" || i.category === category;
    const spaceMatch = !spaceId || i.idea_space_id === spaceId;
    return categoryMatch && spaceMatch;
  });

  const ideaPoolItems = filteredIdeas.filter((i: any) => i.status === 'Pending');
  const votingItems = filteredIdeas.filter((i: any) => i.status === 'Under Review' || i.status === 'In Progress' || i.status === 'In Development' || i.status === 'QA');
  const devItems = filteredIdeas.filter((i: any) => i.status === 'Shipped');

  return (
    <div className="space-y-6">
      {/* Mobile Stage Selector */}
      <div className="lg:hidden">
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Phase Navigation</label>
          <Select value={activeStage} onValueChange={(val: any) => setActiveStage(val)}>
            <SelectTrigger className="w-full h-14 bg-card border-border shadow-premium rounded-2xl px-5 focus:ring-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  activeStage === 'ideation' ? "bg-muted" : activeStage === 'development' ? "bg-primary/20" : "bg-success/20"
                )}>
                  {activeStage === 'ideation' && <Lightbulb className="h-4 w-4 text-muted-foreground" />}
                  {activeStage === 'development' && <ArrowBigUp className="h-4 w-4 text-primary" />}
                  {activeStage === 'production' && <Rocket className="h-4 w-4 text-success" />}
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-sm font-black text-foreground">
                    {stages.find(s => s.id === activeStage)?.name}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {activeStage === 'ideation' ? ideaPoolItems.length : activeStage === 'development' ? votingItems.length : devItems.length} Ideas
                  </span>
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border bg-card/95 backdrop-blur-xl shadow-2xl">
              {stages.map(stage => {
                const count = stage.id === 'ideation' ? ideaPoolItems.length : stage.id === 'development' ? votingItems.length : devItems.length;
                return (
                  <SelectItem key={stage.id} value={stage.id} className="rounded-xl py-3 px-4 focus:bg-primary/5 cursor-pointer">
                    <div className="flex items-center justify-between w-full min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded-lg",
                          stage.id === 'ideation' ? "bg-muted" : stage.id === 'development' ? "bg-primary/10" : "bg-success/10"
                        )}>
                          <stage.icon className={cn("h-3.5 w-3.5", stage.id === 'ideation' ? "text-muted-foreground" : stage.id === 'development' ? "text-primary" : "text-success")} />
                        </div>
                        <span className="font-bold text-sm">{stage.name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-muted/50 text-muted-foreground font-black text-[10px]">{count}</Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:overflow-x-auto pb-6 no-scrollbar lg:-mx-6 lg:px-6">
        {/* Idea Pool - Ideation */}
        <Card className={cn(
          "flex flex-col flex-shrink-0 w-full lg:w-[450px] h-auto lg:h-[calc(100vh-14rem)] p-0 overflow-hidden border-none shadow-premium bg-gradient-to-b from-muted/50 to-muted/10 backdrop-blur-sm border-t-4 border-muted/50 transition-all duration-300",
          activeStage === 'ideation' ? "flex" : "hidden lg:flex"
        )}>
          <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-muted rounded-lg">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-sm tracking-tight text-foreground">Ideation</h3>
            </div>
            <div className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{ideaPoolItems.length}</div>
          </div>
          <div className="flex-1 p-3 space-y-3 overflow-y-auto lg:max-h-none lg:flex lg:flex-col">
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

        {/* In Development */}
        <Card className={cn(
          "flex flex-col flex-shrink-0 w-full lg:w-[450px] h-auto lg:h-[calc(100vh-14rem)] p-0 overflow-hidden border-none shadow-premium bg-primary/5 backdrop-blur-sm border-t-4 border-primary/30 transition-all duration-300",
          activeStage === 'development' ? "flex" : "hidden lg:flex"
        )}>
          <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-primary/10 bg-primary/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/20 rounded-lg">
                <ArrowBigUp className="h-4 w-4 text-primary fill-primary/20" />
              </div>
              <h3 className="font-bold text-sm tracking-tight text-primary">In Development</h3>
            </div>
            <div className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{votingItems.length}</div>
          </div>
          <div className="flex-1 p-3 space-y-3 overflow-y-auto lg:max-h-none lg:flex lg:flex-col">
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

        {/* In Production */}
        <Card className={cn(
          "flex flex-col flex-shrink-0 w-full lg:w-[450px] h-auto lg:h-[calc(100vh-14rem)] p-0 overflow-hidden border-none shadow-premium bg-success/5 backdrop-blur-sm border-t-4 border-success/30 transition-all duration-300",
          activeStage === 'production' ? "flex" : "hidden lg:flex"
        )}>
          <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-success/10 bg-success/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-success/20 rounded-lg">
                <Plus className="h-4 w-4 text-success" />
              </div>
              <h3 className="font-bold text-sm tracking-tight text-success">In Production</h3>
            </div>
            <div className="bg-success/20 text-success px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{devItems.length}</div>
          </div>
          <div className="flex-1 p-3 space-y-3 overflow-y-auto lg:max-h-none lg:flex lg:flex-col">
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
