import { useState } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import {
  MessageCircle, Bookmark, Share, MoreHorizontal, Repeat2,
  Image as ImageIcon, ArrowBigUp, ArrowBigDown, SendHorizontal
} from "lucide-react";
import { motion } from "framer-motion";
import { ROUTES, getTenantPath } from "@/lib/constants";
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
import { getInitials, cn, getAvatarUrl } from "@/lib/utils";
import { api } from "@/lib/api";
import VotingSystem from "./VotingSystem";
import ConfirmationModal from "./ConfirmationModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const BoardSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((card) => (
      <div key={card} className="bg-card rounded-3xl p-5 border border-border/50 space-y-5 animate-pulse shadow-sm">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    ))}
  </div>
);

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
};

const SocialFeed = ({ category = "All", spaceId = null, search = "" }: { category?: string, spaceId?: string | null, search?: string }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<'ideation' | 'development' | 'production'>('ideation');

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
      // Cancel any outgoing refetch so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["ideas", tenantSlug, search, spaceId] });

      // Snapshot the previous value
      const previousIdeas = queryClient.getQueryData(["ideas", tenantSlug, search, spaceId]);

      // Optimistically update to the new value
      queryClient.setQueryData(["ideas", tenantSlug, search, spaceId], (old: any[] | undefined) => {
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
        queryClient.setQueryData(["ideas", tenantSlug, search, spaceId], context.previousIdeas);
      }
      if ((err as any)?.status !== 409) {
        toast.error(err.message || "Failed to vote");
      }
    },
    onSettled: () => {
      // Always refetch after error or success to keep server in sync
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug, search, spaceId] });
    },
  });

  const handleVote = (id: string, type: 'up' | 'down') => {
    if (!token) return toast.error("Please login to like");
    if (voteMutation.isPending) return;
    voteMutation.mutate({ id, type });
  };

  const deleteIdeaMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ideas/${id}`, token!),
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug, search, spaceId] });
      setIdeaToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete post");
      setIdeaToDelete(null);
    }
  });

  const baseFilteredIdeas = ideas.filter((i: any) => {
    const categoryMatch = category === "All" || i.category === category;
    const spaceMatch = !spaceId || i.idea_space_id === spaceId;
    return categoryMatch && spaceMatch;
  });

  const ideaPoolItems = baseFilteredIdeas.filter((i: any) => i.status === 'Pending' || i.status === 'Open');
  const votingItems = baseFilteredIdeas.filter((i: any) => i.status === 'Under Review' || i.status === 'In Progress' || i.status === 'In Development' || i.status === 'QA' || i.status === 'Planned');
  const devItems = baseFilteredIdeas.filter((i: any) => i.status === 'Shipped' || i.status === 'Live' || i.status === 'Closed');

  const filteredIdeas = (activeStage === 'ideation' ? ideaPoolItems 
                      : activeStage === 'development' ? votingItems 
                      : devItems).sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));

  const [quickTitle, setQuickTitle] = useState("");

  if (isLoading || (isFetching && !!search)) {
    return <BoardSkeleton />;
  }

  const handleQuickSubmit = () => {
    if (!quickTitle.trim()) return;
    navigate(`${getTenantPath(ROUTES.SUBMIT_IDEA, tenantSlug || "default")}?title=${encodeURIComponent(quickTitle.trim())}`);
  };

  return (
    <div className="space-y-6">
      {/* Create Post Input (Fake) */}
      <div className="flex bg-card rounded-3xl p-5 border border-border shadow-sm items-center gap-4 group hover:border-primary/30 transition-all">
        <Avatar className="h-12 w-12 border border-border shadow-sm group-hover:scale-105 transition-transform">
          <AvatarImage src={getAvatarUrl(user?.avatar_url, user?.name)} />
          <AvatarFallback className="bg-primary/5 text-primary font-bold">
            {getInitials(user?.name || "Me")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 relative">
          <Input 
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickSubmit()}
            placeholder="What's on your mind? Share an idea..."
            className="flex-1 bg-muted/50 hover:bg-muted text-foreground border-none px-5 py-6 rounded-full text-sm font-medium transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
        <button 
          onClick={handleQuickSubmit}
          disabled={!quickTitle.trim()}
          className="p-3 bg-primary text-primary-foreground rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale shadow-lg shadow-primary/20"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Stage Filter Tabs */}
      <div className="flex bg-muted/30 p-1.5 rounded-[1.25rem] border border-border/50">
        {[
          { id: 'ideation', label: 'Ideation', count: ideaPoolItems.length },
          { id: 'development', label: 'In Development', count: votingItems.length },
          { id: 'production', label: 'In Production', count: devItems.length },
        ].map((stage) => {
          const isActive = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id as any)}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                isActive ? "bg-background text-foreground shadow-sm ring-1 ring-border/40" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {stage.label}
              <span className={cn(
                "px-2 py-0.5 rounded-lg text-[10px]",
                isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>{stage.count}</span>
            </button>
          );
        })}
      </div>

      {/* Feed Divider */}
      <div className="flex items-center gap-4 py-1">
        <div className="h-[1px] flex-1 bg-border/50"></div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Feed</span>
        <div className="h-[1px] flex-1 bg-border/50"></div>
      </div>

      {/* List Items */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
        {filteredIdeas.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground">No posts found.</div>
        ) : (
          filteredIdeas.map((item: any) => (
            <motion.div
              key={item.id}
              onClick={() => navigate(getTenantPath(ROUTES.IDEA_DETAIL.replace(':id', item.id), tenantSlug || "default"))}
              className="group bg-card rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-border/60 flex flex-col gap-4 cursor-pointer relative"
            >
              {/* Header: User Info & Time */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border shadow-sm">
                    <AvatarImage src={getAvatarUrl(item.author_avatar, item.author_name)} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                      {getInitials(item.author_name || "Un")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[15px] text-foreground leading-tight hover:underline">
                        {item.author_name || "Anonymous"}
                      </p>
                      <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-none h-4 px-1.5 font-black">
                        {(item.votes_count || 0) * 10} PTS
                      </Badge>
                    </div>
                    <p className="text-[13px] text-muted-foreground font-medium flex items-center gap-1.5 flex-wrap">
                      {timeAgo(item.created_at)}
                      {item.category && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                          style={item.category_color
                            ? { background: item.category_color + '22', color: item.category_color, border: `1px solid ${item.category_color}55` }
                            : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                        >
                          {item.category_color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.category_color }} />}
                          {item.category}
                        </span>
                      )}
                      {item.tenant_name && (
                        <span className="text-[11px] text-muted-foreground/60 font-medium">· {item.tenant_name}</span>
                      )}
                      {item.space_name && (
                        <span className="text-[11px] text-muted-foreground/60 font-medium">· {item.space_name}</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button onClick={(e) => e.stopPropagation()} className="p-2 -mr-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    <DropdownMenuItem className="cursor-pointer">Report post</DropdownMenuItem>
                    {['admin', 'tenant_admin', 'super_admin'].includes(user?.role || '') &&
                      ['Pending', 'Open', 'Under Review', 'In Progress', 'In Development'].includes(item.status) && (
                      <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={(e) => { e.stopPropagation(); setIdeaToDelete(item.id); }}>
                        Delete post
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Content */}
              <div className="space-y-2 mt-1">
                <h3 className="text-lg font-bold text-foreground leading-snug">{item.title}</h3>
                {item.description && (
                  <p className="text-[15px] text-foreground/80 leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Social Action Bar */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/40">
                <div className="flex items-center gap-6 md:gap-8">
                  {/* Upvote / Downvote */}
                  <VotingSystem
                    ideaId={item.id}
                    initialVotes={item.votes_count}
                    userVote={item.vote_type}
                    onVote={(type) => handleVote(item.id, type)}
                  />

                  {/* Comment */}
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 group transition-colors">
                    <div className="p-2 -ml-2 rounded-full transition-colors group-hover:bg-blue-500/10">
                      <MessageCircle className="h-[18px] w-[18px]" />
                    </div>
                    <span className="font-semibold text-[13px]">{item.comments_count || 0}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={(e) => e.stopPropagation()} className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                    <Bookmark className="h-[18px] w-[18px]" />
                  </button>
                </div>
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
            deleteIdeaMutation.mutate(ideaToDelete);
          }
        }}
        title="Delete Post?"
        message="This action will permanently delete this post. This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default SocialFeed;
