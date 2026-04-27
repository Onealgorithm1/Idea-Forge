import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, MessageSquare, Bookmark, BookmarkCheck, Calendar,
  Target, Loader2, Pencil, Star, X, Check, Trash2, Layers,
  Send, AlertCircle, Hash, ChevronDown, ChevronUp, Reply, MessageCircle,
  Paperclip, FileText, ExternalLink, Upload, Lock, MoreHorizontal, Repeat2, Share,
  Activity, LayoutGrid, Timer, Users, Flame, Vote, Sparkles, Trophy, Crown, Share2, Info
} from "lucide-react";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES, getTenantPath, PLATFORM_STATUS_LABELS, ADMIN_ROLES, MANAGEMENT_ROLES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";
import VotingSystem from "@/components/VotingSystem";
import CommentSection from "@/components/CommentSection";

const IdeaDetail = () => {
  const { id, tenantSlug } = useParams<{ id: string; tenantSlug: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: idea, isLoading: isIdeaLoading } = useQuery({
    queryKey: ["idea", id, tenantSlug],
    queryFn: () => api.get(`/ideas/${id}`, token || undefined),
    staleTime: 1000 * 5,
    enabled: !!id,
  });

  const voteMutation = useMutation({
    mutationFn: ({ type }: { type: "up" | "down" }) =>
      api.post(`/ideas/${id}/vote`, { type }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["idea", id, tenantSlug] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => api.post(`/ideas/${id}/bookmark`, {}, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["idea", id, tenantSlug] });
    },
  });

  if (isIdeaLoading) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-col items-center justify-center flex-1 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 items-center justify-center flex-col gap-4">
          <h2 className="text-2xl font-black">Idea not found</h2>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link to={getTenantPath(ROUTES.IDEA_BOARD, tenantSlug)}>Back to Feed</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex relative overflow-hidden transition-colors duration-300">
      <SidebarNav />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10 w-full">
        <Header />

        <main className="flex-1 min-w-0 overflow-y-auto no-scrollbar pb-20 w-full">
          {/* Hero Section - Matching EventDetail */}
          <div className="relative w-full min-h-[400px] flex items-end overflow-hidden">
            <div className="absolute inset-0 bg-slate-900">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/30 blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[80px]" />
                </div>

                <img
                    src={`https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80`}
                    alt=""
                    className={`w-full h-full object-cover transition-opacity duration-1000 ${imageLoaded ? 'opacity-60' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
            </div>

            <div className="relative z-10 w-full p-8 md:p-16 space-y-6">
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(getTenantPath(ROUTES.IDEA_BOARD, tenantSlug))}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all bg-background/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-border/10 mb-2 w-fit"
                >
                    <ChevronLeft className="h-3 w-3" />
                    Back to Feed
                </motion.button>

                <div className="space-y-4 w-full">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-primary text-primary-foreground border-none px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px]">
                            {idea.category}
                        </Badge>
                        <Badge variant="outline" className="border-white/20 text-white/80 px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px] backdrop-blur-sm">
                            {PLATFORM_STATUS_LABELS[idea.status] || idea.status}
                        </Badge>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                        {idea.title}
                    </h1>
                </div>
            </div>
          </div>

          <div className="px-4 md:px-8 py-12 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 w-full">

              {/* Description Card - Left Side */}
              <div className="space-y-4 min-w-0">
                  <h3 className="text-xl font-black flex items-center gap-2 px-2">
                      <Info className="h-5 w-5 text-primary" />
                      About this Idea
                  </h3>
                  <Card className="p-10 border-none bg-card/60 backdrop-blur-3xl rounded-[3rem] shadow-premium border border-border/10">
                      <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium italic">
                          "{idea.description}"
                      </p>
                      {idea.tags && idea.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-8">
                          {idea.tags.map((tag: string) => (
                            <span key={tag} className="text-sm font-bold text-primary hover:underline cursor-pointer">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                  </Card>
              </div>

              {/* Sidebar - Right Side */}
              <div className="space-y-4 w-full shrink-0">
                <h3 className="text-xl font-black flex items-center gap-2 px-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Originator
                </h3>
                <Card className="p-8 border-none bg-card/40 backdrop-blur-2xl rounded-[2.5rem] space-y-6 border border-border/50 shadow-sm">
                    <div className="flex items-center gap-4 p-4 bg-muted/10 rounded-3xl border border-border/20">
                        <Avatar className="h-14 w-14 rounded-2xl border border-border/50 shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${idea.author_name || 'U'}`} />
                            <AvatarFallback>{getInitials(idea.author_name || 'U')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-base font-black text-foreground">{idea.author_name}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Space Pioneer</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/10">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Points</p>
                            <p className="text-2xl font-black text-primary">{(idea.votes_count || 0) * 10}</p>
                        </div>
                        <VotingSystem
                            ideaId={idea.id}
                            initialVotes={idea.votes_count}
                            userVote={idea.vote_type}
                            onVote={(type) => {
                                if (!token) return toast.error("Please login to vote");
                                if (voteMutation.isPending) return;
                                voteMutation.mutate({ type });
                            }}
                            className="scale-110"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className={cn("flex-1 rounded-2xl h-11 font-black uppercase text-[10px] tracking-widest", idea.is_bookmarked && "border-primary/30 text-primary bg-primary/5")}
                            onClick={() => bookmarkMutation.mutate()}
                        >
                            <Bookmark className={cn("h-4 w-4 mr-2", idea.is_bookmarked && "fill-current")} />
                            {idea.is_bookmarked ? "Saved" : "Bookmark"}
                        </Button>
                        <Button variant="outline" className="h-11 w-11 rounded-2xl p-0">
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
              </div>

              {/* Discussions - SPANS FULL WIDTH */}
              <div className="col-span-full space-y-8 pt-12 mt-4 border-t border-dashed border-border/40">
                  <div className="flex items-center justify-between">
                      <div className="space-y-1">
                          <h3 className="text-3xl font-black tracking-tighter">Community Discussion</h3>
                          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{idea.comments_count || 0} Thoughts Shared</p>
                      </div>
                  </div>
                  <CommentSection ideaId={id!} />
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default IdeaDetail;
