import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, MessageSquare, Bookmark, BookmarkCheck, Calendar,
  Target, Loader2, Pencil, Star, X, Check, Trash2, Layers,
  Send, AlertCircle, Hash, ChevronDown, ChevronUp, Reply, MessageCircle
} from "lucide-react";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES, getTenantPath, PLATFORM_STATUS_LABELS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";
import VotingSystem from "@/components/VotingSystem";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = [
  { value: "Pending", label: "Ideation" },
  { value: "In Progress", label: "In Development" },
  { value: "Shipped", label: "In Production" },
];

// ─── Scoring Panel ────────────────────────────────────────────────────────────
const ScoringPanel = ({
  ideaId,
  token,
  tenantSlug,
}: {
  ideaId: string;
  token: string | null;
  tenantSlug: string;
}) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: scoreData } = useQuery({
    queryKey: ["scores", ideaId],
    queryFn: () => api.get(`/scoring/ideas/${ideaId}/scores`),
  });
  const { data: scorecards = [] } = useQuery({
    queryKey: ["scorecards", tenantSlug],
    queryFn: () => api.get("/scoring/scorecards"),
  });

  const scorecard = scorecards[0];
  const criteria = scorecard?.criteria || [];
  const [localScores, setLocalScores] = useState<Record<string, number>>({});

  const scoreMutation = useMutation({
    mutationFn: ({ criterion_id, score }: { criterion_id: string; score: number }) =>
      api.post(
        `/scoring/ideas/${ideaId}/scores`,
        { criterion_id, score, scorecard_id: scorecard?.id || "default" },
        token!
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scores", ideaId] });
      toast.success("Score submitted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="border-t border-slate-100">
      {/* Collapsible header */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-amber-50/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Star className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
            Admin Scoring
          </span>
          {scoreData?.overall_avg > 0 && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 rounded-full px-1.5 py-0.5">
              {scoreData.overall_avg} / 10
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-amber-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-amber-400" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 space-y-4">
              {criteria.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No scorecard criteria configured.</p>
              ) : (
                <div className="space-y-4">
                  {criteria.map((c: any) => {
                    const avg = scoreData?.averages?.find(
                      (a: any) => a.criterion_id === c.id || a.criterion_name === c.name
                    );
                    const val = localScores[c.id] ?? 5;
                    return (
                      <div key={c.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{c.name}</span>
                          <div className="flex items-center gap-2">
                            {avg && (
                              <span className="text-muted-foreground">
                                avg {avg.avg_score} ({avg.count})
                              </span>
                            )}
                            <span className="w-7 text-center font-black text-slate-800 bg-slate-100 rounded-lg py-0.5">
                              {val}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={c.min_score ?? 0}
                            max={c.max_score ?? 10}
                            step="1"
                            value={val}
                            onChange={(e) =>
                              setLocalScores((p) => ({ ...p, [c.id]: Number(e.target.value) }))
                            }
                            className="flex-1 accent-primary"
                            disabled={!token}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs rounded-xl hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                            disabled={!token || scoreMutation.isPending}
                            onClick={() => scoreMutation.mutate({ criterion_id: c.id, score: val })}
                          >
                            {scoreMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Submit"
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!token && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Login to score this idea.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const IdeaDetail = () => {
  const { id, tenantSlug } = useParams<{ id: string; tenantSlug: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allIdeas = [] } = useQuery({
    queryKey: ["ideas", tenantSlug, user?.id],
    queryFn: () => api.get("/ideas", token || undefined),
    staleTime: 1000 * 5,
  });

  const idea = allIdeas.find((i: any) => String(i.id) === id);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => api.get(`/ideas/${id}/comments`),
    enabled: !!idea,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIdeaSpace, setEditIdeaSpace] = useState("");
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [isDeleteIdeaModalOpen, setIsDeleteIdeaModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [newReply, setNewReply] = useState("");
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());

  const { data: ideaSpaces = [] } = useQuery({
    queryKey: ["idea-spaces", tenantSlug],
    queryFn: () => api.get("/ideas/spaces"),
  });

  const commentMutation = useMutation({
    mutationFn: ({ content, parent_id }: { content: string; parent_id?: string }) => {
      if (!content || content.trim().length < 2)
        throw new Error("Comment must be at least 2 characters");
      if (content.length > 500) throw new Error("Comment is too long (max 500)");
      return api.post(`/ideas/${id}/comments`, { content, parent_id }, token!);
    },
    onSuccess: () => {
      setNewComment("");
      setNewReply("");
      setReplyToId(null);
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug] });
      toast.success("Comment added");
    },
    onError: (error: any) => toast.error(error.message || "Failed to add comment"),
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      api.patch(`/ideas/comments/${commentId}`, { content }, token!),
    onSuccess: () => {
      setEditingCommentId(null);
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      toast.success("Comment updated");
    },
    onError: (error: any) => toast.error(error.message || "Failed to update comment"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      api.delete(`/ideas/comments/${commentId}`, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug] });
      toast.success("Comment deleted");
    },
    onError: (error: any) => toast.error(error.message || "Failed to delete comment"),
  });

  const editMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/ideas/${id}`, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug] });
      setIsEditing(false);
      toast.success("Idea updated");
    },
    onError: (e: any) => toast.error(e.message || "Failed to update idea"),
  });

  const voteMutation = useMutation({
    mutationFn: ({ type }: { type: "up" | "down" }) =>
      api.post(`/ideas/${id}/vote`, { type }, token!),
    onMutate: async ({ type }) => {
      await queryClient.cancelQueries({ queryKey: ["ideas", tenantSlug] });
      const previousIdeas = queryClient.getQueryData(["ideas", tenantSlug]);
      queryClient.setQueryData(["ideas", tenantSlug], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((item) => {
          if (String(item.id) !== id) return item;
          let delta = 0;
          let newVoteType: "up" | "down" | null = null;
          if (item.vote_type) {
            delta = -1;
            newVoteType = null;
          } else if (type === "up") {
            delta = 1;
            newVoteType = "up";
          }
          return {
            ...item,
            votes_count: Math.max(0, parseInt(item.votes_count || 0) + delta),
            vote_type: newVoteType,
          };
        });
      });
      return { previousIdeas };
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousIdeas)
        queryClient.setQueryData(["ideas", tenantSlug], context.previousIdeas);
      if ((err as any)?.status !== 409) toast.error(err.message || "Failed to vote");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["ideas"] }),
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
  const isAdmin = user?.role === "admin";
  const canEdit = isAuthor || isAdmin;
  const canChangeStatus = ["admin", "reviewer"].includes(user?.role ?? "");

  const isInDevelopment = idea?.status === "In Development";
  const oneDay = 24 * 60 * 60 * 1000;
  const isOlderThan24h = idea
    ? Date.now() - new Date(idea.created_at).getTime() > oneDay
    : false;
  const isEditLocked = isInDevelopment || (isOlderThan24h && !isAdmin);

  const getLockReason = () => {
    if (isInDevelopment) return "Ideas in Development stage cannot be edited";
    if (isOlderThan24h && !isAdmin) return "Ideas cannot be edited after 24 hours";
    return "";
  };

  const startEdit = () => {
    setEditTitle(idea?.title || "");
    setEditDescription(idea?.description || "");
    setEditIdeaSpace(idea?.idea_space_id || "");
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!editTitle.trim() || editTitle.trim().length < 5)
      return toast.error("Title must be at least 5 characters");
    if (!editDescription.trim() || editDescription.trim().length < 20)
      return toast.error("Description must be at least 20 characters");
    editMutation.mutate({
      title: editTitle,
      description: editDescription,
      idea_space_id: editIdeaSpace,
    });
  };

  const toggleThread = (commentId: string) => {
    setCollapsedThreads(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const isLoading = !idea && !allIdeas.length;

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-col items-center justify-center flex-1 space-y-4 bg-background transition-colors duration-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading idea details...</p>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 items-center justify-center flex-col gap-4">
          <h2 className="text-2xl font-black text-foreground">Idea not found</h2>
          <Button asChild variant="outline" className="rounded-2xl border-border">
            <Link to={getTenantPath(ROUTES.DASHBOARD, tenantSlug)}>Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Soft gradient blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[160px]" />
        <div className="absolute bottom-0 right-[-5%] w-[40%] h-[40%] rounded-full bg-info/10 blur-[120px]" />
      </div>

      <Header />

      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden relative z-10">
        <SidebarNav />

        <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-8 md:px-10 bg-background/50 dark:bg-background/20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-5"
          >
            {/* Breadcrumb back link */}
            <Link
              to={`${getTenantPath(ROUTES.IDEA_BOARD, tenantSlug)}?category=All`}
              className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all w-fit group mb-2"
            >
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Board
            </Link>

            {/* ── Main Idea Card ─────────────────────────────────────────────────── */}
            <div className="relative">
              <Card className="border border-border shadow-premium rounded-2xl bg-card overflow-hidden relative pt-[3px] transition-colors duration-300">
                {/* Rainbow gradient top border */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px] z-10"
                  style={{
                    background:
                      "linear-gradient(to right, #a78bfa, #60a5fa, #34d399, #a3e635)",
                  }}
                />
                <div className="p-6 sm:p-8 pt-7">

                  {/* ── Breadcrumb pills row */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-5 text-[12px] font-semibold text-muted-foreground">
                    {/* Status pill */}
                    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full px-2.5 py-0.5 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
                      {PLATFORM_STATUS_LABELS[idea.status] || idea.status}
                    </span>

                    {idea.category && (
                      <>
                        <span className="text-border text-xs">◆</span>
                        <span className="text-muted-foreground">{idea.category}</span>
                      </>
                    )}

                    {idea.space_name && (
                      <>
                        <span className="text-border text-xs">◆</span>
                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                          <Layers className="h-3 w-3" />
                          {idea.space_name}
                        </span>
                      </>
                    )}

                    <span className="text-border text-xs">◆</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(idea.created_at), "MMM d, yyyy")}
                    </span>
                  </div>



                  {/* ── Title */}
                  {isEditing ? (
                    <div className="space-y-3 mb-4">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-xl font-black h-12 border-border bg-background transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-2xl"
                        placeholder="Idea title…"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Space:</span>
                        <Select value={editIdeaSpace} onValueChange={setEditIdeaSpace}>
                          <SelectTrigger className="w-[200px] h-9 text-sm rounded-xl border-border">
                            <SelectValue placeholder="Select space" />
                          </SelectTrigger>
                          <SelectContent>
                            {ideaSpaces.map((s: any) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-4 leading-snug">
                      {idea.title}
                    </h1>
                  )}

                  {/* ── Author + date */}
                  <div className="flex items-center gap-2 mb-6">
                    <Avatar className="h-7 w-7 ring-2 ring-background shadow-sm border border-border">
                      <AvatarFallback className="text-[9px] font-black bg-primary/10 text-primary uppercase">
                        {getInitials(idea.author || "Guest")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-bold text-foreground">{idea.author}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(idea.created_at), "MMM d, yyyy 'at' HH:mm")}
                    </span>
                  </div>

                  {/* ── Community Score (Repositioned) */}
                  <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-muted/30 border border-border/40 w-fit">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Community Score</span>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", (idea.votes_count || 0) > 0 ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30")} />
                        <span className="text-xl font-black tracking-tight text-foreground/90">
                          {(idea.votes_count || 0) * 10} points
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Action toolbar */}
                  <div className="flex flex-wrap items-center gap-2 py-4 border-t border-b border-border/50 mb-0">
                    {/* Voting */}
                    <div className="flex items-center bg-background border border-border rounded-xl overflow-hidden shadow-sm">
                      <VotingSystem
                        ideaId={idea.id}
                        initialVotes={idea.votes_count}
                        onVote={(type) => {
                          if (!token) return toast.error("Please login to vote");
                          if (voteMutation.isPending) return;
                          voteMutation.mutate({ type });
                        }}
                        userVote={idea.vote_type}
                        orientation="horizontal"
                        className="border-none bg-transparent shadow-none"
                        isLoading={voteMutation.isPending}
                      />
                    </div>

                    {/* Bookmark */}
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "gap-1.5 rounded-xl border-border font-semibold text-muted-foreground transition-all hover:bg-accent/40",
                        idea.is_bookmarked
                          ? "text-amber-500 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                          : "hover:border-amber-500/30 hover:text-amber-500"
                      )}
                      onClick={() => {
                        if (!token) return toast.error("Please login");
                        bookmarkMutation.mutate();
                      }}
                    >
                      {idea.is_bookmarked ? (
                        <BookmarkCheck className="h-3.5 w-3.5" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5" />
                      )}
                      {idea.is_bookmarked ? "Following" : "Follow"}
                    </Button>

                    {/* Edit */}
                    {canEdit && !isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "gap-1.5 rounded-xl border-border font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all",
                          isEditLocked && "opacity-40"
                        )}
                        onClick={() => {
                          if (isEditLocked) { toast.error(getLockReason()); return; }
                          startEdit();
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}

                    {/* Save / Cancel when editing */}
                    {isEditing && (
                      <>
                        <Button
                          size="sm"
                          className="gap-1.5 rounded-xl font-bold shadow-md shadow-primary/20"
                          onClick={saveEdit}
                          disabled={editMutation.isPending}
                        >
                          {editMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Save Changes
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl font-semibold text-muted-foreground hover:bg-accent/50"
                          onClick={() => setIsEditing(false)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}

                    {/* Delete */}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 rounded-xl font-semibold text-destructive hover:bg-destructive/10 transition-all"
                        disabled={deleteMutation.isPending}
                        onClick={() => setIsDeleteIdeaModalOpen(true)}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </Button>
                    )}

                    {/* Status pills — pushed to right, admin/reviewer only */}
                    {canChangeStatus && (
                      <div className="ml-auto flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                          GOVERNANCE:
                        </span>
                        {STATUSES.map((s) => {
                          const isActive =
                            s.value === "Pending"
                              ? ["Pending", "Under Review"].includes(idea.status)
                              : s.value === "In Progress"
                              ? ["In Progress", "In Development", "QA"].includes(idea.status)
                              : idea.status === s.value;
                          return (
                            <button
                              key={s.value}
                              onClick={() => statusMutation.mutate(s.value)}
                              disabled={statusMutation.isPending}
                              className={cn(
                                "text-[11px] font-bold px-3 py-1 rounded-full border transition-all",
                                isActive
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                  : "text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground bg-background/50"
                              )}
                            >
                              {statusMutation.isPending && statusMutation.variables === s.value ? (
                                <Loader2 className="h-3 w-3 animate-spin inline" />
                              ) : (
                                s.label
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Admin Scoring (collapsible) */}
                {user?.role === "admin" && (
                  <div className="bg-muted/30">
                    <ScoringPanel ideaId={id!} token={token} tenantSlug={tenantSlug!} />
                  </div>
                )}

                {/* ── Idea Description section */}
                <div className="border-t border-border/50">
                  <div className="px-6 sm:px-8 pt-6 pb-2">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        Idea Context
                      </span>
                    </div>

                    {isEditing ? (
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={8}
                        className="w-full text-base border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-2xl transition-all"
                        maxLength={2000}
                      />
                    ) : (
                      <p className="text-[16px] text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
                        {idea.description}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="px-6 sm:px-8 pt-3 pb-8 flex flex-wrap items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      {idea.tags.map((tag: string) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[11px] font-bold bg-muted text-muted-foreground border-border rounded-lg px-3 py-1 hover:bg-accent transition-colors"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Spacer if no tags */}
                  {(!idea.tags || idea.tags.length === 0) && <div className="pb-4" />}
                </div>
              </Card>
            </div>

            {/* ── Discussion section (below the card) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 }}
            >
              {/* Discussion header */}
              <div className="flex items-center gap-3 mb-6 mt-4">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
                <div>
                  <h2 className="text-xl font-black tracking-tight text-foreground">Discussion Library</h2>
                  <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                    {comments.length} Thought{comments.length !== 1 ? "s" : ""} Shared
                  </p>
                </div>
              </div>

              {/* Comment input */}
              <div className="flex gap-3 mb-5">
                <input
                  type="text"
                  placeholder={
                    token
                      ? "Share your thoughts or feedback…"
                      : "Login to leave a comment"
                  }
                  value={newComment}
                  disabled={!token}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      if (!newComment.trim()) return;
                      if (!token) return toast.error("Please login to comment");
                      commentMutation.mutate({ content: newComment });
                    }
                  }}
                  className="flex-1 bg-card/60 backdrop-blur-sm border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm placeholder:text-muted-foreground text-foreground"
                />
                <Button
                  onClick={() => {
                    if (!newComment.trim()) return;
                    if (!token) return toast.error("Please login to comment");
                    commentMutation.mutate({ content: newComment });
                  }}
                  disabled={!newComment.trim() || commentMutation.isPending || !token}
                  className="gap-2 rounded-2xl font-bold shadow-premium-hover px-8 h-auto bg-primary text-white hover:bg-primary/90 transition-all border-none"
                >
                  {commentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Post Thought
                </Button>
              </div>

              {/* Comment list */}
              <div className="space-y-4">
                <AnimatePresence>
                  {(() => {
                    // Group comments into threads
                    const topLevel = comments.filter((c: any) => !c.parent_id);
                    const repliesMap = comments.filter((c: any) => c.parent_id).reduce((acc: any, c: any) => {
                      if (!acc[c.parent_id]) acc[c.parent_id] = [];
                      acc[c.parent_id].push(c);
                      return acc;
                    }, {});

                    return topLevel.map((c: any, i: number) => {
                      const replies = repliesMap[c.id] || [];
                      const isCollapsed = collapsedThreads.has(c.id);
                      
                      return (
                        <div key={c.id} className="space-y-3">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.2, delay: i * 0.03 }}
                            className="group bg-card/50 border border-border rounded-2xl p-5 hover:border-primary/20 hover:shadow-premium-hover transition-all duration-300 relative overflow-hidden"
                          >
                            <div className="flex gap-4">
                              <Avatar className="h-10 w-10 ring-2 ring-background shadow-md border border-border shrink-0">
                                <AvatarFallback className="text-xs font-black bg-primary/10 text-primary uppercase">
                                  {getInitials(c.author || "?")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-foreground">{c.author}</span>
                                    {c.is_edited && (
                                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-lg italic font-medium">
                                        edited
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[11px] text-muted-foreground font-semibold">
                                      {format(new Date(c.created_at), "MMM d, HH:mm")}
                                    </span>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                      <button
                                        onClick={() => setReplyToId(replyToId === c.id ? null : c.id)}
                                        className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
                                        title="Reply"
                                      >
                                        <Reply className="h-3 w-3" />
                                      </button>
                                      {(c.user_id === user?.id || isAdmin) && (
                                        <>
                                          <button
                                            onClick={() => {
                                              setEditingCommentId(c.id);
                                              setEditingCommentContent(c.content);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() => setCommentToDelete(c.id)}
                                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {editingCommentId === c.id ? (
                                  <div className="space-y-2 mt-1">
                                    <Textarea
                                      value={editingCommentContent}
                                      onChange={(e) => setEditingCommentContent(e.target.value)}
                                      className="min-h-[72px] text-sm rounded-xl border-slate-200 focus:border-primary"
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs rounded-xl text-slate-500 font-semibold"
                                        onClick={() => setEditingCommentId(null)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="h-7 text-xs rounded-xl font-bold"
                                        onClick={() =>
                                          editCommentMutation.mutate({
                                            commentId: c.id,
                                            content: editingCommentContent,
                                          })
                                        }
                                        disabled={editCommentMutation.isPending}
                                      >
                                        {editCommentMutation.isPending ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          "Update"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm text-slate-600 leading-relaxed mt-1">{c.content}</p>
                                    
                                    {/* Thread Toggle (if replies exist) */}
                                    {replies.length > 0 && (
                                      <button 
                                        onClick={() => toggleThread(c.id)}
                                        className="flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-primary/70 hover:text-primary transition-colors"
                                      >
                                        {isCollapsed ? (
                                          <><ChevronDown className="h-3 w-3" /> Show {replies.length} repli{replies.length === 1 ? 'y' : 'es'}</>
                                        ) : (
                                          <><ChevronUp className="h-3 w-3" /> Hide replies</>
                                        )}
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </motion.div>

                          {/* Reply Input Area */}
                          <AnimatePresence>
                            {replyToId === c.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="ml-14 mr-2"
                              >
                                <div className="bg-muted/30 border border-border p-3 rounded-2xl flex gap-3 shadow-sm mb-3">
                                  <input 
                                    autoFocus
                                    placeholder={`Reply to ${c.author}...`}
                                    value={newReply}
                                    onChange={(e) => setNewReply(e.target.value)}
                                    className="flex-1 bg-transparent border-none text-sm focus:outline-none focus:ring-0 py-1"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && newReply.trim()) {
                                        commentMutation.mutate({ content: newReply, parent_id: c.id });
                                      }
                                    }}
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs font-semibold" onClick={() => setReplyToId(null)}>Cancel</Button>
                                    <Button 
                                      size="sm" 
                                      className="h-8 rounded-xl text-xs font-bold px-4" 
                                      disabled={!newReply.trim() || commentMutation.isPending}
                                      onClick={() => commentMutation.mutate({ content: newReply, parent_id: c.id })}
                                    >
                                      {commentMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin"/> : "Reply"}
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Render Replies */}
                          {!isCollapsed && (
                            <div className="ml-14 space-y-3">
                              {replies.map((r: any) => (
                                <motion.div
                                  key={r.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="group bg-card/30 border border-border/60 rounded-2xl p-4 hover:border-primary/10 transition-all relative overflow-hidden"
                                >
                                  {/* Thread line visual */}
                                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/10 ml-[-8px]" />
                                  
                                  <div className="flex gap-3">
                                    <Avatar className="h-8 w-8 ring-1 ring-background shadow-sm border border-border shrink-0">
                                      <AvatarFallback className="text-[10px] font-black bg-primary/5 text-primary/70 uppercase">
                                        {getInitials(r.author || "?")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[13px] font-bold text-foreground">{r.author}</span>
                                          <span className="text-[10px] text-muted-foreground font-semibold">
                                            {format(new Date(r.created_at), "MMM d, HH:mm")}
                                          </span>
                                        </div>
                                        {(r.user_id === user?.id || isAdmin) && (
                                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => setCommentToDelete(r.id)}
                                              className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"
                                            >
                                              <Trash2 className="h-2.5 w-2.5" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-sm text-slate-600 leading-relaxed">{r.content}</p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </AnimatePresence>

                {comments.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-3 bg-white/60">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-xl">
                      💬
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700">No comments yet</p>
                      <p className="text-xs text-slate-400 font-medium">
                        Be the first to share your thoughts!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>



      <ConfirmationModal
        isOpen={isDeleteIdeaModalOpen}
        onClose={() => setIsDeleteIdeaModalOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Idea?"
        message="This action will permanently delete this idea and all associated data. This cannot be undone."
        confirmText="Delete Idea"
        type="danger"
      />

      <ConfirmationModal
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={() => commentToDelete && deleteCommentMutation.mutate(commentToDelete)}
        title="Delete Comment?"
        message="Are you sure you want to delete this comment?"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default IdeaDetail;
