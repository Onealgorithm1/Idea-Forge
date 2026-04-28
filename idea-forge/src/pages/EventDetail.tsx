import { ChevronLeft, Info, MessageSquare, Timer, Users, Flame, Vote, Trophy, Crown, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import CommentNode from "../components/CommentNode";

const EventDetail = () => {
  const { id, tenantSlug } = useParams<{ id: string; tenantSlug: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");

  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvent = () => {
      const stored = localStorage.getItem("platformEvents");
      if (stored) {
        const events = JSON.parse(stored);
        const found = events.find((e: any) => e.id === id);
        setEvent(found);
      }
      setIsLoading(false);
    };
    loadEvent();
  }, [id]);

  const handleVote = (index: number) => {
    if (!token) return toast.error("Please login to vote");
    
    const stored = localStorage.getItem("platformEvents");
    if (stored && event) {
      const events = JSON.parse(stored);
      const updatedEvents = events.map((e: any) => {
        if (e.id === id) {
          const updatedOptions = [...(e.options || [])];
          if (updatedOptions[index]) {
            updatedOptions[index] = { 
              ...updatedOptions[index], 
              votes: (updatedOptions[index].votes || 0) + 1 
            };
          }
          return { ...e, options: updatedOptions, votes: (e.votes || 0) + 1, hasVoted: true };
        }
        return e;
      });
      localStorage.setItem("platformEvents", JSON.stringify(updatedEvents));
      setEvent(updatedEvents.find((e: any) => e.id === id));
      toast.success("Vote recorded!");
    }
  };

  const handlePostComment = () => {
    if (!token) return toast.error("Please login to comment");
    if (!newComment.trim()) return;

    const stored = localStorage.getItem("platformEvents");
    if (stored && event) {
      const events = JSON.parse(stored);
      const updatedEvents = events.map((e: any) => {
        if (e.id === id) {
          const newCommentObj = {
            id: Date.now().toString(),
            content: newComment,
            author_name: user?.name || "Anonymous",
            created_at: new Date().toISOString(),
            votes_count: 0
          };
          const updatedComments = [newCommentObj, ...(e.comments_list || [])];
          return { ...e, comments_count: (e.comments_count || 0) + 1, comments_list: updatedComments };
        }
        return e;
      });
      localStorage.setItem("platformEvents", JSON.stringify(updatedEvents));
      setEvent(updatedEvents.find((e: any) => e.id === id));
      setNewComment("");
      toast.success("Comment posted!");
    }
  };

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center">Loading event...</div>;
  if (!event) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground font-bold">Event not found</div>;

  return (
    <div className="flex-1 w-full">
      {/* Hero Section */}
      <div className="relative w-full min-h-[350px] flex items-end overflow-hidden">
            <div className="absolute inset-0 bg-slate-900">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/30 blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[80px]" />
                </div>
                <img 
                    src={event.image || 'https://images.unsplash.com/photo-1540575861501-7ce0e1d1aa99?auto=format&fit=crop&w=1200&q=80'} 
                    alt="" 
                    className={`w-full h-full object-cover transition-opacity duration-1000 ${imageLoaded ? 'opacity-60' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </div>

            <div className="relative z-10 w-full p-8 md:p-16 space-y-6">
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(getTenantPath(ROUTES.IDEA_BOARD, tenantSlug!))}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-primary transition-all bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-xl"
                >
                    <ChevronLeft className="h-3 w-3" /> Back to Board
                </motion.button>
                
                <div className="space-y-4 w-full text-white">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-primary text-white border-none px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px]">
                            {event.type}
                        </Badge>
                        <Badge variant="outline" className="border-white/20 text-white/80 px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px] backdrop-blur-sm">
                            {event.status}
                        </Badge>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                        {event.name}
                    </h1>
                </div>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="px-4 md:px-8 py-12 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 w-full">

              {/* Left Column: Stats, Poll, About */}
              <div className="space-y-12 min-w-0">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-card/40 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] shadow-sm">
                    {[
                        { label: 'Ends In', value: event.timeLeft || '2d 14h', icon: Timer, color: 'text-yellow-500' },
                        { label: 'Community', value: event.participants, icon: Users, color: 'text-primary' },
                        { label: 'Hype', value: `${event.hype || 85}%`, icon: Flame, color: 'text-orange-500' },
                        { label: 'Votes', value: event.votes, icon: Vote, color: 'text-purple-500' }
                    ].map((stat, i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                                {stat.label}
                            </div>
                            <p className="text-xl font-black">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Poll Section */}
                {event.type === 'poll' && (
                    <div className="space-y-8">
                        <h3 className="text-xl font-black flex items-center gap-2 px-2">
                            <Vote className="h-5 w-5 text-primary" />
                            Community Vote
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {event.options?.map((opt: any, idx: number) => {
                                const totalVotes = event.options.reduce((acc: number, curr: any) => acc + (curr.votes || 0), 0);
                                const percentage = totalVotes > 0 ? Math.round((opt.votes || 0) / totalVotes * 100) : 0;
                                return (
                                    <motion.button
                                        key={idx}
                                        whileHover={!event.hasVoted ? { scale: 1.01, x: 5 } : {}}
                                        disabled={event.hasVoted}
                                        onClick={() => handleVote(idx)}
                                        className={`w-full relative min-h-[85px] rounded-[2.5rem] border-2 transition-all p-8 flex items-center justify-between overflow-hidden group/opt ${
                                            event.hasVoted 
                                                ? 'bg-muted/10 border-border/40 cursor-default' 
                                                : 'bg-background border-primary/5 hover:border-primary/40 hover:shadow-2xl'
                                        }`}
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} />
                                        <div className="relative z-10 flex items-center gap-6">
                                            {event.hasVoted && (
                                                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${opt.votes > 0 ? 'bg-primary text-white shadow-lg' : 'bg-muted opacity-50'}`}>
                                                    <CheckCircle2 className="h-6 w-6" />
                                                </div>
                                            )}
                                            <span className="text-xl font-black text-foreground/90 group-hover/opt:text-primary transition-colors">{opt.text}</span>
                                        </div>
                                        {event.hasVoted && (
                                            <div className="relative z-10 flex flex-col items-end">
                                                <span className="text-3xl font-black text-primary leading-none tracking-tighter">{percentage}%</span>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{opt.votes} votes</span>
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* About Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black flex items-center gap-2 px-2">
                        <Info className="h-5 w-5 text-primary" />
                        About this Event
                    </h3>
                    <Card className="p-10 border-none bg-card/60 backdrop-blur-3xl rounded-[3rem] shadow-premium border border-border/10">
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium italic">
                            "{event.description}"
                        </p>
                    </Card>
                </div>
              </div>

              {/* Sidebar - Right Column */}
              <div className="space-y-4 w-full shrink-0">
                <h3 className="text-xl font-black flex items-center gap-2 px-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Contributors
                </h3>
                <Card className="p-8 border-none bg-card/40 backdrop-blur-2xl rounded-[2.5rem] space-y-6 border border-border/50 shadow-sm">
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-muted overflow-hidden border border-border/50 shadow-sm">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=star${i}`} alt="u" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black">User_{i}00</p>
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{i === 1 ? 'Legend' : 'Pro'}</p>
                                    </div>
                                </div>
                                <Crown className={`h-4 w-4 ${i === 1 ? 'text-yellow-500' : 'text-muted-foreground/10'}`} />
                            </div>
                        ))}
                    </div>
                </Card>
              </div>

              {/* Discussions - Spans Full Width */}
              <div className="col-span-full space-y-8 pt-12 mt-4 border-t border-dashed border-border/40">
                  <h3 className="text-3xl font-black tracking-tighter px-2">Event Discussion</h3>
                  
                  {/* New Comment Input */}
                  <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-[2rem] p-6 space-y-4 shadow-sm">
                      <div className="flex gap-4">
                          <Avatar className="h-10 w-10 rounded-2xl border border-border/50 shrink-0">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Me'}`} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">{getInitials(user?.name || 'Me')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-4">
                              <textarea 
                                  placeholder="Add a comment... 💡"
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="w-full min-h-[100px] bg-background/50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 resize-none outline-none"
                              />
                              <div className="flex items-center justify-between">
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Share your feedback with the community</p>
                                  <Button 
                                      onClick={handlePostComment}
                                      disabled={!newComment.trim()}
                                      className="rounded-xl px-8 font-black uppercase tracking-widest h-10 shadow-lg shadow-primary/20"
                                  >
                                      Post Comment
                                  </Button>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-2">
                      {(!event.comments_list || event.comments_list.length === 0) ? (
                          <div className="py-20 text-center space-y-4 bg-muted/5 rounded-[2rem] border border-dashed border-border/40">
                              <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                              <p className="text-sm text-muted-foreground font-black uppercase tracking-widest">No thoughts shared yet. Be the first!</p>
                          </div>
                      ) : (
                          event.comments_list.map((comment: any) => (
                              <CommentNode key={comment.id} comment={comment} depth={0} />
                          ))
                      )}
                  </div>
              </div>

            </div>
          </div>
    </div>
  );
};

export default EventDetail;
