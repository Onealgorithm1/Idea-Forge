import { useEffect, useState } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import {
  MessageSquare, ChevronDown, Bookmark, Lock, SearchX, Inbox, Hand, Star, Eye, MoreHorizontal, User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES, getTenantPath, ADMIN_ROLES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getInitials, cn } from "@/lib/utils";
import { api } from "@/lib/api";
import ConfirmationModal from "./ConfirmationModal";
import CommentSection from "./CommentSection";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const BoardSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map((card) => (
      <div key={card} className="bg-card rounded-2xl p-4 border border-border/50 space-y-5 animate-pulse shadow-sm h-24" />
    ))}
  </div>
);

const STATUS_COLORS: Record<string, { bg: string, text: string, border: string, dot: string }> = {
  "Open": { bg: "bg-muted/50", text: "text-muted-foreground", border: "border-border", dot: "bg-muted-foreground" },
  "Under Review": { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200", dot: "bg-blue-500" },
  "Planned": { bg: "bg-cyan-500/10", text: "text-cyan-600", border: "border-cyan-200", dot: "bg-cyan-500" },
  "In Progress": { bg: "bg-yellow-500/10", text: "text-yellow-600", border: "border-yellow-200", dot: "bg-yellow-500" },
  "Closed": { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-200", dot: "bg-red-500" },
  "Shipped": { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-200", dot: "bg-green-500" },
  "Live": { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-200", dot: "bg-green-500" },
  "Pending": { bg: "bg-muted/50", text: "text-muted-foreground", border: "border-border", dot: "bg-muted-foreground" },
};

const getStatusStyle = (status: string) => {
  return STATUS_COLORS[status] || STATUS_COLORS["Open"];
};

const StatusDropdown = ({ currentStatus, onChange }: { currentStatus: string, onChange: (s: string) => void }) => {
  const style = getStatusStyle(currentStatus);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all", style.bg, style.text, style.border)}>
        <span className={cn("w-2 h-2 rounded-full", style.dot)} />
        {currentStatus === "Shipped" ? "Live" : currentStatus}
        <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 rounded-xl p-2 bg-white dark:bg-zinc-900 border-border/50 shadow-xl">
        {["Open", "Under Review", "Planned", "In Progress", "Closed", "Live"].map((s) => {
          const st = getStatusStyle(s === "Live" ? "Shipped" : s);
          return (
            <DropdownMenuItem key={s} onClick={() => onChange(s === "Live" ? "Shipped" : s)} className={cn("flex items-center gap-2 rounded-lg my-0.5 cursor-pointer", currentStatus === (s === "Live" ? "Shipped" : s) ? st.bg : "hover:bg-muted/50")}>
              <span className={cn("w-2 h-2 rounded-full", st.dot)} />
              <span className={cn("font-semibold text-xs", st.text)}>{s}</span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="my-2" />
        <div className="px-2 pb-1">
          <label className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <input type="checkbox" className="rounded-sm border-border" /> Notify All Voters
          </label>
          <button className="w-full bg-primary text-primary-foreground font-bold text-xs py-2 rounded-lg hover:bg-primary/90 transition-colors">
            CHANGE
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const KanbanBoard = ({ category = "All", spaceId = null, search = "" }: { category?: string, spaceId?: string | null, search?: string }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);

  const { data: ideas = [], isLoading, isFetching } = useQuery({
    queryKey: ["ideas", tenantSlug, search, spaceId],
    queryFn: () => {
      const endpoint = (search && search.trim().length >= 2) 
        ? `/ideas/search?q=${encodeURIComponent(search)}&space_id=${spaceId || ''}` 
        : `/ideas?space_id=${spaceId || ''}`;
      return api.get(endpoint, token!);
    },
    enabled: !!tenantSlug,
    staleTime: 1000 * 60,
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: "up" | "down" }) =>
      api.post(`/ideas/${id}/vote`, { type }, token!),
    onMutate: async ({ id, type }) => {
      await queryClient.cancelQueries({ queryKey: ["ideas", tenantSlug] });
      const previousIdeas = queryClient.getQueryData(["ideas", tenantSlug]);
      queryClient.setQueryData(["ideas", tenantSlug], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map(idea => {
          if (idea.id !== id) return idea;
          let delta = 0;
          let newVoteType: "up" | "down" | null = null;
          if (idea.vote_type === type) {
            delta = type === 'up' ? -1 : 1;
            newVoteType = null;
          } else {
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
      if (context?.previousIdeas) {
        queryClient.setQueryData(["ideas", tenantSlug], context.previousIdeas);
      }
      if ((err as any)?.status !== 409) {
        toast.error(err.message || "Failed to vote");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug] });
    },
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

  const filteredIdeas = ideas.filter((i: any) => {
    const categoryMatch = category === "All" || i.category === category;
    const spaceMatch = !spaceId || i.idea_space_id === spaceId;
    return categoryMatch && spaceMatch;
  });

  if (isLoading || (isFetching && !!search)) {
    return <BoardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {["All Posts", "All Priorities", "All Boards", "Newest", "All Assignment", "Status", "Tags", "Assignee"].map((filter) => (
          <div key={filter} className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-card border border-border/60 rounded-2xl text-xs font-bold text-muted-foreground shadow-sm hover:shadow transition-shadow cursor-pointer">
            {filter === "All Priorities" && <Star className="h-3.5 w-3.5 mr-2 text-foreground" />}
            {filter}
            <ChevronDown className="h-3.5 w-3.5 ml-3" />
          </div>
        ))}
      </div>

      {/* List Header */}
      <div className="hidden md:grid grid-cols-[80px_60px_1fr_120px_120px_160px_100px] gap-4 px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border/50">
        <div className="text-center">VOTE</div>
        <div className="text-center">PROFILE</div>
        <div>DETAILS</div>
        <div className="text-center">PRIORITY</div>
        <div className="text-center">PUBLICATION</div>
        <div>STATUS</div>
        <div className="text-center">ASSIGNEE</div>
      </div>

      {/* List Items */}
      <div className="space-y-3 pb-20">
        {filteredIdeas.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No posts found.</div>
        ) : (
          filteredIdeas.map((item: any) => (
            <motion.div
              key={item.id}
              onClick={() => navigate(getTenantPath(ROUTES.IDEA_DETAIL.replace(':id', item.id), tenantSlug || "default"))}
              className="group bg-white dark:bg-card rounded-2xl p-3 md:p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-border/60 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer relative"
            >
              {/* Vote */}
              <div className="w-[80px] flex justify-center shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleVote(item.id, item.vote_type === 'up' ? 'down' : 'up'); }}
                  className={cn("w-12 h-14 rounded-[20px] border-2 flex flex-col items-center justify-center gap-1 transition-all",
                    item.vote_type === 'up' ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <Hand className={cn("h-4 w-4", item.vote_type === 'up' && "fill-primary/20")} />
                  <span className="font-bold text-sm">{item.votes_count || 0}</span>
                </button>
              </div>

              {/* Profile */}
              <div className="hidden md:flex w-[60px] justify-center shrink-0">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{getInitials(item.author_name || "Un")}</AvatarFallback>
                </Avatar>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{item.title}</h4>
                <p className="text-muted-foreground text-sm line-clamp-1 mt-0.5">{item.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs font-medium text-muted-foreground/80">
                  <span>{new Date(item.created_at).toLocaleDateString()} in <span className="font-bold text-foreground/70">{item.category}</span></span>
                  <div className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {item.comments_count || 0}</div>
                </div>
              </div>

              {/* Priority */}
              <div className="hidden md:flex w-[120px] justify-center shrink-0">
                <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-xl transition-colors">
                  <Star className={cn("h-4 w-4", item.priority === 'High' ? "text-red-500 fill-red-500" : "text-amber-400 fill-amber-400")} />
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>

              {/* Publication */}
              <div className="hidden md:flex w-[120px] justify-center shrink-0">
                <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-xl transition-colors">
                  <Eye className="h-4 w-4 text-green-500" />
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>

              {/* Status */}
              <div className="w-[160px] shrink-0" onClick={(e) => e.stopPropagation()}>
                <StatusDropdown currentStatus={item.status} onChange={(s) => statusMutation.mutate({ id: item.id, status: s })} />
              </div>

              {/* Assignee */}
              <div className="hidden md:flex w-[100px] justify-center shrink-0">
                <button className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-xl transition-colors">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-muted text-muted-foreground"><UserIcon className="h-4 w-4"/></AvatarFallback>
                  </Avatar>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <ConfirmationModal
        isOpen={!!ideaToDelete}
        onClose={() => setIdeaToDelete(null)}
        onConfirm={() => {
          if (ideaToDelete) {
            setIdeaToDelete(null);
          }
        }}
        title="Delete Idea?"
        message="This action will permanently delete this idea. This action cannot be undone."
        confirmText="Delete Idea"
        type="danger"
      />
    </div>
  );
};

export default KanbanBoard;
