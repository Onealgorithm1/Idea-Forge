import { useEffect, useState } from "react";
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
import { getInitials } from "@/lib/utils";
import { api } from "@/lib/api";
import VotingSystem from "./VotingSystem";
import ConfirmationModal from "./ConfirmationModal";

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
    queryKey: ["ideas"],
    queryFn: () => api.get("/ideas"),
    staleTime: 1000 * 60, // 1 minute
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

  const bookmarkMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ideas/${id}/bookmark`, {}, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
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
  const votingItems = filteredIdeas.filter(i => i.status === 'Under Review' || i.status === 'In Progress');
  const devItems = filteredIdeas.filter(i => i.status === 'In Development' || i.status === 'Shipped');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Idea Pool */}
        <Card className="flex flex-col h-[calc(100vh-14rem)] p-0 overflow-hidden border-none shadow-premium bg-gradient-to-b from-slate-50/80 to-slate-200/50 backdrop-blur-sm border-t-4 border-slate-400/30">
          <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-100/80 to-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-200 rounded-lg">
                <GripVertical className="h-4 w-4 text-slate-500" />
              </div>
              <h3 className="font-bold text-sm tracking-tight text-slate-700">Ideation</h3>
            </div>
            <div className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{ideaPoolItems.length}</div>
          </div>
          <div className="flex-1 p-3 space-y-3 overflow-y-auto no-scrollbar">
            {ideaPoolItems.map((item, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id}
                onMouseEnter={() => prefetchIdea(item.id)}
                onClick={() => handleSelectIdea(item.id)}
                className={`group bg-white rounded-xl border border-border/50 p-4 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer relative`}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0 group-hover:bg-slate-200 transition-all duration-300 group-hover:scale-110 shadow-sm border border-slate-200/50">✨</div>
                      <div>
                        <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">{item.title}</p>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.category}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <button onClick={(e) => { e.stopPropagation(); handleBookmark(item.id); }} className="p-2 bg-white/90 backdrop-blur-sm shadow-md border border-white/20 rounded-xl text-muted-foreground hover:text-amber-500 hover:scale-110 transition-all">
                        <Bookmark className="h-3.5 w-3.5 fill-current" />
                      </button>
                      {(user?.role === 'admin' || user?.id === item.author_id) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIdeaToDelete(item.id); }} 
                          className="p-2 bg-white/90 backdrop-blur-sm shadow-md border border-white/20 rounded-xl text-muted-foreground hover:text-red-500 hover:scale-110 transition-all"
                          title="Delete Idea"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <Link
                        to={getTenantPath(ROUTES.IDEA_DETAIL.replace(':id', item.id), tenantSlug)}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-white/90 backdrop-blur-sm shadow-md border border-white/20 rounded-xl text-muted-foreground hover:text-primary hover:scale-110 transition-all"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[9px] px-2 py-0.5 h-auto bg-slate-100 text-slate-600 border-none font-bold">#{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <VotingSystem
                        ideaId={item.id}
                        initialVotes={item.votes_count}
                        onVote={(type: any) => handleVote(item.id, type)}
                        userVote={item.vote_type}
                        orientation="horizontal"
                        className="scale-95 origin-left"
                      />
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{item.comments_count || 0}</span>
                      </div>
                    </div>

                    <Avatar className="h-7 w-7 ring-2 ring-white shadow-sm border border-slate-200">
                      <AvatarFallback className="text-[9px] font-black bg-slate-200 text-slate-500 uppercase">
                        {getInitials(item.author || "Guest")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Voting & Feedback */}
        <Card className="flex flex-col h-[calc(100vh-14rem)] p-0 overflow-hidden border-none shadow-premium bg-primary/5 backdrop-blur-sm border-t-4 border-primary/30">
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
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id}
                onClick={() => handleSelectIdea(item.id)}
                className={`group bg-white rounded-xl border border-border/50 p-4 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer relative`}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110 shadow-sm border border-primary/10">💡</div>
                      <div>
                        <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">{item.title}</p>
                        <span className="text-[10px] text-primary/70 font-bold uppercase tracking-wider">{item.category}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <button onClick={(e) => { e.stopPropagation(); handleBookmark(item.id); }} className="p-2 bg-white/90 backdrop-blur-sm shadow-md border border-white/20 rounded-xl text-muted-foreground hover:text-amber-500 hover:scale-110 transition-all">
                        <Bookmark className="h-3.5 w-3.5 fill-current" />
                      </button>
                      {(user?.role === 'admin' || user?.id === item.author_id) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIdeaToDelete(item.id); }} 
                          className="p-2 bg-white/90 backdrop-blur-sm shadow-md border border-white/20 rounded-xl text-muted-foreground hover:text-red-500 hover:scale-110 transition-all"
                          title="Delete Idea"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <Link
                        to={getTenantPath(ROUTES.IDEA_DETAIL.replace(':id', item.id), tenantSlug)}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-white/90 backdrop-blur-sm shadow-md border border-white/20 rounded-xl text-muted-foreground hover:text-primary hover:scale-110 transition-all"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[9px] px-2 py-0.5 h-auto bg-primary/5 text-primary border-none">#{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-primary/10">
                    <div className="flex items-center gap-2">
                      <VotingSystem
                        ideaId={item.id}
                        initialVotes={item.votes_count}
                        onVote={(type: any) => handleVote(item.id, type)}
                        userVote={item.vote_type}
                        orientation="horizontal"
                        className="scale-95 origin-left"
                      />

                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] text-primary/60 font-bold bg-primary/5 px-2 py-1 rounded-lg">
                        <MessageSquare className="h-3 w-3" />
                        {item.comments_count || 0}
                      </div>
                      <Avatar className="h-7 w-7 ring-2 ring-white shadow-sm border border-primary/20">
                        <AvatarFallback className="text-[9px] font-black bg-primary/20 text-primary">
                          {getInitials(item.author || "Guest")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* In Development */}
        <Card className="flex flex-col h-[calc(100vh-14rem)] p-0 overflow-hidden border-none shadow-premium bg-success/5 backdrop-blur-sm border-t-4 border-success/30">
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
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id}
                onClick={() => handleSelectIdea(item.id)}
                className={`group bg-white rounded-xl border border-border/50 p-4 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer relative`}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center text-xl shrink-0 group-hover:bg-success/20 transition-all duration-300 group-hover:scale-110 shadow-sm border border-success/10">🚀</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{item.title}</p>
                        <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0 border-none ${statusColor[item.status]}`}>
                          {PLATFORM_STATUS_LABELS[item.status] || item.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      {user?.role === 'admin' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, item.status === 'Shipped' ? 'In Development' : 'In Progress'); }}
                            className="p-1.5 bg-white/90 backdrop-blur-sm shadow-md border border-white/20 rounded-xl text-muted-foreground hover:text-primary transition-all"
                            title="Revert"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, 'Shipped'); }}
                            className={`p-1.5 bg-white/90 backdrop-blur-sm shadow-md border border-white/20 rounded-xl text-muted-foreground hover:text-success transition-all ${item.status === 'Shipped' ? 'hidden' : ''}`}
                            title="Ship It"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[9px] px-2 py-0.5 h-auto bg-success/5 text-success border-none">#{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-success/10">
                    <div className="flex items-center gap-3">
                      <VotingSystem
                        ideaId={item.id}
                        initialVotes={item.votes_count}
                        onVote={(type: any) => handleVote(item.id, type)}
                        userVote={item.vote_type}
                        orientation="horizontal"
                        className="scale-95 origin-left"
                      />
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-success/5 rounded-lg">
                        <MessageSquare className="h-3 w-3 text-success/60" />
                        <span className="text-[10px] font-bold text-success">{item.comments_count || 0}</span>
                      </div>
                    </div>
                    <Avatar className="h-7 w-7 ring-2 ring-white shadow-sm border border-success/20">
                      <AvatarFallback className="text-[9px] font-black bg-success/20 text-success uppercase">
                        {getInitials(item.author || "Guest")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </motion.div>
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
