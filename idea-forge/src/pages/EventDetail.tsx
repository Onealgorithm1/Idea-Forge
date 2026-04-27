import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Users, Vote, Trophy, Sparkles, 
  Calendar, MessageSquare, Share2, Info, CheckCircle2,
  Timer, Activity, Flame, Zap, Rocket, Crown, ExternalLink,
  MoreHorizontal, ArrowBigUp, ArrowBigDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const EventDetail = () => {
  const { id, tenantSlug } = useParams<{ id: string, tenantSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("platformEvents");
    if (stored) {
      const events = JSON.parse(stored);
      const found = events.find((e: any) => e.id === id);
      if (found) {
        setEvent(found);
        setComments(found.discussion || [
            { id: '1', user: 'Sarah', text: 'This is exactly what the community needs! 🌳', time: '2h ago', avatar: 'Sarah' },
            { id: '2', user: 'Alex', text: 'Can we also suggest specific locations for the trees?', time: '1h ago', avatar: 'Alex' }
        ]);
      }
    }
    setLoading(false);
  }, [id]);

    const handleAddComment = (parentId: string | null = null) => {
        const text = parentId ? replyText : newComment;
        if (!text.trim()) return;
        
        const comment = {
            id: Date.now().toString(),
            user: user?.name || 'Anonymous',
            text: text.trim(),
            time: 'Just now',
            avatar: user?.name || 'Anon',
            votes: 1,
            replies: [],
            isOP: user?.name === event?.author,
            isAdmin: isAdmin
        };

        const addRecursive = (list: any[]): any[] => {
            if (!parentId) return [comment, ...list];
            return list.map(c => {
                if (c.id === parentId) {
                    return { ...c, replies: [comment, ...(c.replies || [])] };
                }
                if (c.replies) return { ...c, replies: addRecursive(c.replies) };
                return c;
            });
        };

        const updatedComments = addRecursive(comments);
        setComments(updatedComments);
        if (parentId) {
            setReplyTo(null);
            setReplyText("");
        } else {
            setNewComment("");
        }

        // Sync back to platformEvents
        const stored = localStorage.getItem("platformEvents");
        if (stored) {
            const allEvents = JSON.parse(stored);
            const updatedEvents = allEvents.map((e: any) => {
                if (e.id === id) {
                    return { ...e, discussion: updatedComments, comments: calculateTotalComments(updatedComments) };
                }
                return e;
            });
            localStorage.setItem("platformEvents", JSON.stringify(updatedEvents));
        }
        
        toast.success("Thought shared! 💬");
    };

    const calculateTotalComments = (list: any[]): number => {
        return list.reduce((acc, curr) => acc + 1 + calculateTotalComments(curr.replies || []), 0);
    };

    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const toggleCollapse = (cid: string) => {
        const next = new Set(collapsed);
        if (next.has(cid)) next.delete(cid);
        else next.add(cid);
        setCollapsed(next);
    };

    const CommentNode = ({ comment, depth = 0 }: { comment: any, depth: number }) => {
        const isCollapsed = collapsed.has(comment.id);
        
        return (
            <div className="relative">
                {depth > 0 && (
                    <div 
                        className="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-border/20 group-hover:bg-primary/20 transition-colors"
                        style={{ left: `-${24}px` }}
                    />
                )}
                
                <div className={`flex gap-3 ${depth > 0 ? 'mt-4' : 'mt-6'}`}>
                    {/* Reddit-style Vote Bar */}
                    <div className="flex flex-col items-center gap-1.5 pt-2 shrink-0 w-10">
                        <button className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-primary/5">
                            <ArrowBigUp className="h-7 w-7" />
                        </button>
                        <span className="text-sm font-black">{comment.votes}</span>
                        <button className="text-muted-foreground hover:text-blue-500 transition-colors p-1.5 rounded-md hover:bg-blue-500/5">
                            <ArrowBigDown className="h-7 w-7" />
                        </button>
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0 border border-border/50 shadow-sm">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.avatar}`} alt="u" />
                            </div>
                            <span className={`text-xs font-black tracking-tight ${comment.isOP ? 'text-blue-500' : ''}`}>
                                {comment.user}
                                {comment.isOP && <span className="ml-1.5 text-[9px] font-black text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">OP</span>}
                                {comment.isAdmin && <span className="ml-1.5 text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">Admin</span>}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-bold">• {comment.time}</span>
                            
                            <button 
                                onClick={() => toggleCollapse(comment.id)}
                                className="ml-auto text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
                            >
                                [{isCollapsed ? '+' : '-'}]
                            </button>
                        </div>

                        {!isCollapsed && (
                            <>
                                <p className="text-base text-foreground/90 font-medium leading-relaxed">
                                    {comment.text}
                                </p>
                                <div className="flex items-center gap-6 pt-2">
                                    <button 
                                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <MessageSquare className="h-4 w-4" /> Reply
                                    </button>
                                    <button className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">
                                        <Share2 className="h-4 w-4" /> Share
                                    </button>
                                </div>

                                {replyTo === comment.id && (
                                    <div className="mt-4 space-y-3">
                                        <textarea 
                                            placeholder="Write your reply..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            className="w-full min-h-[80px] bg-muted/20 border border-border/50 rounded-2xl p-4 text-xs font-medium focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)} className="rounded-xl text-[10px] h-8 uppercase font-black">Cancel</Button>
                                            <Button size="sm" onClick={() => handleAddComment(comment.id)} className="rounded-xl text-[10px] h-8 uppercase font-black shadow-lg shadow-primary/10">Post Reply</Button>
                                        </div>
                                    </div>
                                )}

                                {comment.replies && comment.replies.length > 0 && (
                                    <div className="pl-6 border-l border-border/10 ml-1 mt-2">
                                        {comment.replies.map((reply: any) => (
                                            <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

  const triggerConfetti = () => {
    const colors = ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'];
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('div');
      el.style.cssText = `position:fixed;width:8px;height:8px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${Math.random()*100}vw;top:-10px;z-index:9999;border-radius:50%;`;
      document.body.appendChild(el);
      let y = -10; const v = 5+Math.random()*5;
      const step = () => {
        y += v; el.style.top = y + 'px';
        if (y < window.innerHeight) requestAnimationFrame(step);
        else el.remove();
      };
      step();
    }
  };

  const handleVote = (optionIndex: number) => {
    if (event.hasVoted) return;
    const stored = localStorage.getItem("platformEvents");
    if (stored) {
      const events = JSON.parse(stored);
      const updatedEvents = events.map((e: any) => {
        if (e.id === id) {
          const newOptions = [...e.options];
          newOptions[optionIndex] = { ...newOptions[optionIndex], votes: (newOptions[optionIndex].votes || 0) + 1 };
          return { ...e, options: newOptions, participants: (e.participants || 0) + 1, hasVoted: true };
        }
        return e;
      });
      localStorage.setItem("platformEvents", JSON.stringify(updatedEvents));
      setEvent(updatedEvents.find((e: any) => e.id === id));
      toast.success("Vote recorded! 🥳");
      triggerConfetti();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!event) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
      <h2 className="text-2xl font-bold">Event not found</h2>
      <Button onClick={() => navigate(`/${tenantSlug}/idea-board?category=Events`)}>Back to Board</Button>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-background flex flex-col relative overflow-hidden transition-colors duration-300">
      <Header />
      <div className="flex flex-1 overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
        <SidebarNav />

        <main className="flex-1 overflow-y-auto">
          {/* Hero Section with Robust Background */}
          <div className="relative w-full min-h-[350px] flex items-end overflow-hidden">
            {/* Visual Layer: Gradient + Image */}
            <div className="absolute inset-0 bg-slate-900">
                {/* Mesh Gradient Fallback (Visible if image fails or loading) */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/30 blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[80px]" />
                </div>
                
                <img 
                    src={event.image || 'https://images.unsplash.com/photo-1540575861501-7ce0e1d1aa99?auto=format&fit=crop&w=1200&q=80'} 
                    alt="" 
                    className={`w-full h-full object-cover transition-opacity duration-1000 ${imageLoaded ? 'opacity-60' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                
                {/* Sophisticated Dark Gradient for Text Protection */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
            </div>

            <div className="relative z-10 w-full p-8 md:p-16 space-y-6">
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(`/${tenantSlug}/idea-board?category=Events`)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all bg-background/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-border/10 mb-2"
                >
                    <ChevronLeft className="h-3 w-3" />
                    Back to Board
                </motion.button>
                
                <div className="space-y-4 max-w-4xl">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-primary text-primary-foreground border-none px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px]">
                            {event.type}
                        </Badge>
                        <Badge variant="outline" className="border-white/20 text-white/80 px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px] backdrop-blur-sm">
                            {event.status}
                        </Badge>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                        {event.name}
                    </h1>
                </div>
            </div>
          </div>

          <div className="px-8 md:px-16 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              <div className="lg:col-span-8 space-y-12">
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

                <div className="space-y-4">
                    <h3 className="text-xl font-black flex items-center gap-2 px-2">
                        <Info className="h-5 w-5 text-primary" />
                        The Mission
                    </h3>
                    <Card className="p-10 border-none bg-card/60 backdrop-blur-3xl rounded-[3rem] shadow-premium border border-border/10">
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium italic">
                            "{event.description}"
                        </p>
                    </Card>
                </div>

                {event.type === 'poll' && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-black flex items-center gap-2">
                                <Vote className="h-5 w-5 text-primary" />
                                Community Vote
                            </h3>
                        </div>
                        
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
                                        <div 
                                            className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-1000 ease-out" 
                                            style={{ width: `${percentage}%` }}
                                        />
                                        <div className="relative z-10 flex items-center gap-6">
                                            {event.hasVoted && (
                                                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${opt.votes > 0 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted opacity-50'}`}>
                                                    <CheckCircle2 className="h-6 w-6" />
                                                </div>
                                            )}
                                            <span className="text-xl font-black text-foreground/90 group-hover/opt:text-primary transition-colors">
                                                {opt.text}
                                            </span>
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

                {/* Community Discussion Section */}
                <div className="space-y-8 pt-12 border-t border-dashed border-border/40">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black tracking-tighter">Community Discussion</h3>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{comments.length} Thoughts Shared</p>
                        </div>
                        <Button variant="outline" className="rounded-2xl font-black uppercase text-[10px] tracking-widest">
                            Sort by: Newest
                        </Button>
                    </div>

                    {/* New Comment Input */}
                    <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] p-6 space-y-4 shadow-sm">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-muted overflow-hidden border border-border/50 shrink-0">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Guest'}`} alt="me" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <textarea 
                                    placeholder="What are your thoughts on this? 💡"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="w-full min-h-[80px] bg-background/50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 resize-none"
                                />
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Supports Markdown</p>
                                    <Button 
                                        onClick={handleAddComment}
                                        className="rounded-xl px-6 font-black uppercase tracking-widest h-10 shadow-lg shadow-primary/20"
                                    >
                                        Post Thought <Sparkles className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4">
                        {comments.length === 0 ? (
                            <div className="py-20 text-center space-y-4 bg-card/20 rounded-[2.5rem] border border-dashed border-border/40">
                                <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                                <p className="text-sm text-muted-foreground font-black uppercase tracking-widest">No thoughts shared yet. Be the first!</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <CommentNode key={comment.id} comment={comment} depth={0} />
                            ))
                        )}
                    </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <Card className="p-8 border-none bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity className="h-32 w-32" />
                    </div>
                    <div className="space-y-1 relative z-10">
                        <h4 className="text-lg font-black uppercase tracking-tight italic">Live Activity</h4>
                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Pulse Check</p>
                    </div>
                    <div className="space-y-3 relative z-10">
                        {[
                            { u: 'Sarah', a: 'Voted', t: '2m', s: 'v1' },
                            { u: 'Alex', a: 'Joined', t: '5m', s: 'v2' },
                            { u: 'Julia', a: 'Cheered', t: '12m', s: 'v3' }
                        ].map((act, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white/10 p-3.5 rounded-2xl border border-white/10">
                                <div className="w-9 h-9 rounded-full bg-white/20 overflow-hidden shrink-0 border border-white/10">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${act.s}`} alt="p" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black">{act.u}</p>
                                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-tight">{act.a}</p>
                                </div>
                                <span className="text-[9px] text-white/40 font-black">{act.t}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-8 border-none bg-card/40 backdrop-blur-2xl rounded-[2.5rem] space-y-6 border border-border/50 shadow-sm">
                    <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" /> Top Contributors
                    </h4>
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

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EventDetail;
