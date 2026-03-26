import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, MessageSquare, Bookmark, Calendar, Target, User, Loader2, Pencil, Star, X, Check, Trash2, Layers } from "lucide-react";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ROUTES, getTenantPath, PLATFORM_STATUS_LABELS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import VotingSystem from "@/components/VotingSystem";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ['Pending', 'Under Review', 'In Progress', 'In Development', 'Shipped'];

// ─── Scoring Panel ────────────────────────────────────────────────────────────
const ScoringPanel = ({ ideaId, token, tenantSlug }: { ideaId: string; token: string | null; tenantSlug: string }) => {
  const queryClient = useQueryClient();
  const { data: scoreData } = useQuery({
    queryKey: ["scores", ideaId],
    queryFn: () => api.get(`/scoring/ideas/${ideaId}/scores`),
  });
  const { data: scorecards = [] } = useQuery({
    queryKey: ["scorecards"],
    queryFn: () => api.get("/scoring/scorecards"),
  });

  const scorecard = scorecards[0];
  const criteria = scorecard?.criteria || [];
  const [localScores, setLocalScores] = useState<Record<string, number>>({});

  const scoreMutation = useMutation({
    mutationFn: ({ criterion_id, score }: { criterion_id: string; score: number }) =>
      api.post(`/scoring/ideas/${ideaId}/scores`, { criterion_id, score, scorecard_id: scorecard?.id || 'default' }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scores", ideaId] });
      toast.success("Score submitted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          Scoring
        </h3>
        {scoreData?.overall_avg > 0 && (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-sm font-bold">
            Avg: {scoreData.overall_avg} / 10
          </Badge>
        )}
      </div>

      {criteria.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No scorecard criteria found.</p>
      ) : (
        <div className="space-y-4">
          {criteria.map((c: any) => {
            const avg = scoreData?.averages?.find((a: any) => a.criterion_id === c.id || a.criterion_name === c.name);
            return (
              <div key={c.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.name}</span>
                  {avg && <span className="text-xs text-muted-foreground">Avg: {avg.avg_score} ({avg.count} scores)</span>}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={c.min_score ?? 0}
                    max={c.max_score ?? 10}
                    step="1"
                    value={localScores[c.id] ?? 5}
                    onChange={(e) => setLocalScores(prev => ({ ...prev, [c.id]: Number(e.target.value) }))}
                    className="flex-1 accent-primary"
                    disabled={!token}
                  />
                  <span className="w-8 text-center font-bold text-sm">{localScores[c.id] ?? 5}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-xs"
                    disabled={!token || scoreMutation.isPending}
                    onClick={() => scoreMutation.mutate({ criterion_id: c.id, score: localScores[c.id] ?? 5 })}
                  >
                    {scoreMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!token && <p className="text-xs text-muted-foreground mt-3 italic">Login to score this idea.</p>}
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const IdeaDetail = () => {
  const { id, tenantSlug } = useParams<{ id: string; tenantSlug: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allIdeas = [] } = useQuery({
    queryKey: ["ideas"],
    queryFn: () => api.get("/ideas"),
    staleTime: 1000 * 5,
  });

  const idea = allIdeas.find((i: any) => String(i.id) === id);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => api.get(`/ideas/${id}/comments`),
    enabled: !!idea,
  });

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIdeaSpace, setEditIdeaSpace] = useState("");
  const [newComment, setNewComment] = useState("");

  const { data: ideaSpaces = [] } = useQuery({
    queryKey: ["idea-spaces"],
    queryFn: () => api.get("/ideas/spaces"),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => {
      if (!content || content.trim().length < 2) throw new Error("Comment must be at least 2 characters");
      if (content.length > 500) throw new Error("Comment is too long (max 500)");
      return api.post(`/ideas/${id}/comments`, { content }, token!);
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Comment added");
    },
    onError: (error: any) => toast.error(error.message || "Failed to add comment"),
  });

  const editMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/ideas/${id}`, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      setIsEditing(false);
      toast.success("Idea updated");
    },
    onError: (e: any) => toast.error(e.message || "Failed to update idea"),
  });

  const voteMutation = useMutation({
    mutationFn: ({ type }: { type: "up" | "down" }) =>
      api.post(`/ideas/${id}/vote`, { type }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Vote recorded");
    },
    onError: (error: any) => toast.error(error.message || "Failed to vote"),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => api.post(`/ideas/${id}/bookmark`, {}, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ideas"] }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/ideas/${id}/status`, { status }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Status updated");
    },
    onError: (error: any) => toast.error(error.message || "Failed to update status"),
  });
  
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/ideas/${id}`, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Idea deleted");
      navigate(getTenantPath(ROUTES.IDEA_BOARD, tenantSlug));
    },
    onError: (error: any) => toast.error(error.message || "Failed to delete idea"),
  });

  const isAuthor = idea?.author_id === user?.id;
  const canEdit = isAuthor || user?.role === 'admin';
  const canChangeStatus = ['admin', 'reviewer'].includes(user?.role ?? '');

  const startEdit = () => {
    setEditTitle(idea?.title || "");
    setEditDescription(idea?.description || "");
    setEditIdeaSpace(idea?.idea_space_id || "");
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = () => {
    if (!editTitle.trim() || editTitle.trim().length < 5) {
      return toast.error("Title must be at least 5 characters long");
    }
    if (!editDescription.trim() || editDescription.trim().length < 20) {
      return toast.error("Description must be at least 20 characters long");
    }
    editMutation.mutate({ title: editTitle, description: editDescription, idea_space_id: editIdeaSpace });
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

            {/* Header row */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("bg-primary/5 text-primary border-primary/20", idea.status === 'Shipped' && "bg-green-100 text-green-700 border-green-200")}>
                    {PLATFORM_STATUS_LABELS[idea.status] || idea.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{idea.category}</span>
                  {idea.space_name && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100 text-[10px] h-5">
                        <Layers className="h-3 w-3 mr-1" />
                        {idea.space_name}
                      </Badge>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(idea.created_at), "MMM d, yyyy")}
                  </span>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-2xl font-bold h-12" />
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-semibold text-muted-foreground uppercase">Space:</span>
                       <Select value={editIdeaSpace} onValueChange={setEditIdeaSpace}>
                        <SelectTrigger className="w-[200px] h-9 text-sm">
                          <SelectValue placeholder="Select space" />
                        </SelectTrigger>
                        <SelectContent>
                          {ideaSpaces.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold tracking-tight">{idea.title}</h1>
                )}

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {idea.author}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Admin/Reviewer Status Controls */}
                {canChangeStatus && (
                  <div className="flex items-center gap-1 mr-2 bg-muted/50 p-1 rounded-md border border-dashed">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground px-2">Status:</span>
                    {STATUSES.map((s) => (
                      <Button
                        key={s}
                        variant={idea.status === s ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-[10px] px-2"
                        onClick={() => statusMutation.mutate(s)}
                        disabled={statusMutation.isPending}
                      >
                        {statusMutation.isPending && statusMutation.variables === s ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (PLATFORM_STATUS_LABELS[s] || s)}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex items-center bg-background border rounded-md overflow-hidden">
                  <VotingSystem
                    ideaId={idea.id}
                    initialVotes={idea.votes_count}
                    onVote={(type) => { if (!token) return toast.error("Please login to vote"); voteMutation.mutate({ type }); }}
                    hasVoted={idea.has_voted}
                    orientation="horizontal"
                    className="border-none bg-transparent shadow-none"
                  />
                </div>

                <Button variant="outline" size="sm" className="gap-2" onClick={() => { if (!token) return toast.error("Please login"); bookmarkMutation.mutate(); }}>
                  <Bookmark className="h-4 w-4" />
                  Save
                </Button>

                {canEdit && !isEditing && (
                  <Button variant="outline" size="sm" className="gap-2" onClick={startEdit}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                
                {canEdit && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 text-destructive hover:text-white hover:bg-destructive transition-all" 
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this idea? This action cannot be undone.")) {
                        deleteMutation.mutate();
                      }
                    }}
                  >
                    {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete
                  </Button>
                )}
                {isEditing && (
                  <>
                    <Button size="sm" className="gap-2" onClick={saveEdit} disabled={editMutation.isPending}>
                      {editMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            </div>

            {/* Description card */}
            <Card className="p-8">
              <div className="prose prose-sm max-w-none">
                {isEditing ? (
                  <Textarea 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)} 
                    rows={8} 
                    className="w-full text-base" 
                    maxLength={2000}
                  />
                ) : (
                  <p className="text-lg leading-relaxed text-muted-foreground">{idea.description}</p>
                )}
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

            {/* Scoring Panel — admin only */}
            {user?.role === 'admin' && (
              <ScoringPanel ideaId={id!} token={token} tenantSlug={tenantSlug!} />
            )}

            {/* Comments */}
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
                  onKeyDown={(e) => { if (e.key === 'Enter') { if (!newComment.trim()) return; if (!token) return toast.error("Please login to comment"); commentMutation.mutate(newComment); }}}
                  className="flex-1 bg-background border border-border shadow-sm rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <Button
                  onClick={() => { if (!newComment.trim()) return; if (!token) return toast.error("Please login to comment"); commentMutation.mutate(newComment); }}
                  disabled={!newComment.trim() || commentMutation.isPending}
                  className="font-medium px-6 py-2.5 rounded-lg shadow-sm"
                >
                  {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              </div>

              <div className="space-y-4">
                {comments.map((c: any) => (
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
