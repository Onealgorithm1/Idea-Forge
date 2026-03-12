import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, GripVertical, Heart, MessageSquare, ChevronUp, ChevronDown, Bookmark, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import { api } from "@/lib/api";
import VotingSystem from "./VotingSystem";

const statusColor: Record<string, string> = {
  "Pending": "bg-muted text-muted-foreground",
  "Under Review": "bg-warning/15 text-warning border-warning/20",
  "In Progress": "bg-info/15 text-info border-info/20",
  "In Development": "bg-primary/15 text-primary border-primary/20",
  "Shipped": "bg-success/15 text-success border-success/20",
};

const KanbanBoard = ({ category = "All" }: { category?: string }) => {
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ["ideas"],
    queryFn: () => api.get("/ideas"),
    staleTime: 1000 * 60, // 1 minute
  });

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["comments", selectedIdea?.id],
    queryFn: () => api.get(`/ideas/${selectedIdea.id}/comments`),
    enabled: !!selectedIdea,
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: "up" | "down" }) => 
      api.post(`/ideas/${id}/vote`, { type }, token!),
    onSuccess: (data) => {
      queryClient.setQueryData(["ideas"], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map(idea => 
          idea.id === data.id ? { ...idea, votes_count: data.votes_count } : idea
        );
      });
      // Also refetch to be sure of latest state
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
    onError: (error: any) => {
       toast.error(error.message || "Failed to vote");
    }
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => 
      api.post(`/ideas/${selectedIdea.id}/comments`, { content }, token!),
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", selectedIdea.id] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Comment added");
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ideas/${id}/bookmark`, {}, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    }
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

  useEffect(() => {
    const ideaId = searchParams.get("ideaId");
    if (ideaId && ideas.length > 0) {
      const idea = ideas.find((i: any) => String(i.id) === ideaId);
      if (idea) setSelectedIdea(idea);
    }
  }, [ideas, searchParams]);

  const handleVote = (id: string, type: 'up' | 'down') => {
    if (!token) return toast.error("Please login to vote");
    voteMutation.mutate({ id, type });
  };

  const handleSelectIdea = (idea: any) => {
    setSelectedIdea(idea);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedIdea) return;
    if (!token) return toast.error("Please login to comment");
    commentMutation.mutate(newComment);
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
  const votingItems = filteredIdeas.filter(i => i.status === 'Under Review' || i.status === 'In Progress');
  const devItems = filteredIdeas.filter(i => i.status === 'In Development' || i.status === 'Shipped');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Idea Pool */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Idea Pool</h3>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-3 space-y-2">
            {ideaPoolItems.map((item, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={item.id}
                onMouseEnter={() => prefetchIdea(item.id)}
                onClick={() => handleSelectIdea(item)}
                className={`group bg-background rounded-md border p-3 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer relative ${selectedIdea?.id === item.id ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors pr-6">{item.title}</p>
                  <div className="flex flex-col gap-1 absolute top-2 right-2">
                    <button onClick={(e) => { e.stopPropagation(); handleBookmark(item.id); }} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground">
                      <Bookmark className="h-3.5 w-3.5" />
                    </button>
                    <Link 
                      to={ROUTES.IDEA_DETAIL.replace(':id', item.id)} 
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0 h-4">{tag}</Badge>
                    ))}
                  </div>
                )}
                 <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center gap-2">
                      <VotingSystem 
                        ideaId={item.id} 
                        initialVotes={item.votes_count} 
                        onVote={(type) => handleVote(item.id, type)}
                        orientation="horizontal"
                        className="scale-90 origin-left border-none bg-transparent shadow-none p-0"
                      />
                      {useAuth().user?.role === 'admin' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, 'Under Review'); }}
                          className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary transition-colors"
                          title="Move to Review"
                        >
                          <ChevronUp className="h-3.5 w-3.5 rotate-90" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-info" title={item.category || 'Uncategorized'} />
                       <span className="text-[10px] text-muted-foreground italic font-medium">{item.category}</span>
                    </div>
                 </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Voting & Feedback */}
        <Card className="p-0 overflow-hidden border-primary/30">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
            <h3 className="font-semibold text-sm text-primary">Voting & Feedback</h3>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-3 space-y-2">
            {votingItems.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={item.id}
                onMouseEnter={() => prefetchIdea(item.id)}
                onClick={() => handleSelectIdea(item)}
                className={`group bg-background rounded-md border p-3 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer relative ${selectedIdea?.id === item.id ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-6">
                    <span className="text-lg shrink-0">💡</span>
                    <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors truncate">{item.title}</p>
                  </div>
                  <div className="flex flex-col gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleBookmark(item.id); }} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground">
                      <Bookmark className="h-3.5 w-3.5" />
                    </button>
                    <Link 
                      to={ROUTES.IDEA_DETAIL.replace(':id', item.id)} 
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                    {useAuth().user?.role === 'admin' && (
                      <div className="flex items-center gap-1 mr-2 border-r pr-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, item.status === 'In Progress' ? 'Under Review' : 'Pending'); }}
                          className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary transition-colors"
                          title="Revert Status"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, item.status === 'Under Review' ? 'In Progress' : 'In Development'); }}
                          className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary transition-colors"
                          title="Advance Status"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <VotingSystem 
                      ideaId={item.id} 
                      initialVotes={item.votes_count} 
                      onVote={(type: any) => handleVote(item.id, type)}
                      orientation="horizontal"
                      className="scale-90 origin-left border-none bg-transparent shadow-none p-0"
                    />
                  </div>
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0 h-4">{tag}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-destructive" />
                    {item.votes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {item.comments_count}
                  </span>
                  <span className="text-[10px] italic ml-auto font-medium">{item.category}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* In Development */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">In Development</h3>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-3 space-y-2">
            {devItems.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={item.id}
                onMouseEnter={() => prefetchIdea(item.id)}
                onClick={() => handleSelectIdea(item)}
                className={`group bg-background rounded-md border p-3 flex flex-col gap-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer relative ${selectedIdea?.id === item.id ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
              >
                <div className="flex items-center justify-between gap-3 pr-6">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-[9px] bg-accent text-accent-foreground">
                        {getInitials(item.title)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.title}</p>
                  </div>
                  <Badge variant="outline" className={`text-[11px] font-medium shrink-0 ${statusColor[item.status]}`}>
                    {item.status}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {useAuth().user?.role === 'admin' && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, item.status === 'Shipped' ? 'In Development' : 'In Progress'); }} 
                        className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary"
                        title="Revert Status"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, 'Shipped'); }} 
                        className={`p-1 hover:bg-accent rounded text-muted-foreground hover:text-success ${item.status === 'Shipped' ? 'hidden' : ''}`}
                        title="Mark as Shipped"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleBookmark(item.id); }} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground">
                    <Bookmark className="h-3.5 w-3.5" />
                  </button>
                  <Link 
                    to={ROUTES.IDEA_DETAIL.replace(':id', item.id)} 
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0 h-4">{tag}</Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Selected Idea Details & Comments */}
      {selectedIdea && (
        <Card className="p-5 border-primary/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold mb-1">{selectedIdea.title}</h2>
              <p className="text-sm text-muted-foreground">{selectedIdea.description}</p>
            </div>
            <button onClick={() => setSelectedIdea(null)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </h4>
            
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
              {comments.map((c) => (
                <div key={c.id} className="bg-accent/30 p-3 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold">{c.author}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-xs text-muted-foreground italic">No comments yet.</p>}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-background border rounded-md px-3 py-1.5 text-sm"
              />
              <button 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="bg-primary text-primary-foreground text-xs font-medium px-4 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default KanbanBoard;
