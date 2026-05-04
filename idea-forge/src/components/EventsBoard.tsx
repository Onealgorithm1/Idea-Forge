import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Users, Vote, CheckCircle2, Trophy, Sparkles, Plus, X, 
  ArrowBigUp, ArrowBigDown, MessageSquare, Share2, MoreHorizontal,
  Flame, Clock, TrendingUp, Info, Hash, ExternalLink, PartyPopper,
  Zap, Gift, Star, Rocket, Target, Crown, Timer, Activity, Edit2,
  Image as ImageIcon, Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const EventsBoard = () => {
  const { user, token } = useAuth();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'tenant_admin' || user?.role === 'super_admin' || user?.role === 'admin';
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newEventName, setNewEventName] = useState("");
  const [newEventType, setNewEventType] = useState("poll");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventOptions, setNewEventOptions] = useState<string[]>(["", ""]);
  const [newEventImage, setNewEventImage] = useState<string | null>(null);
  const [newEventImagePreview, setNewEventImagePreview] = useState<string | null>(null);
  const [filter, setFilter] = useState("hot");
  const [uploading, setUploading] = useState(false);

  // --- API Queries ---
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["events", tenantSlug],
    queryFn: () => api.get("/events", token!),
    enabled: !!token,
  });

  // --- API Mutations ---
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/events", data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowCreateForm(false);
      resetForm();
      toast.success("Event broadcasted! 🎉");
      triggerConfetti();
    },
    onError: (error: any) => toast.error(error.message || "Failed to create event"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/events/${id}`, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setEditingEvent(null);
      toast.success("Event updated! ✨");
    },
    onError: (error: any) => toast.error(error.message || "Failed to update event"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted");
    },
    onError: (error: any) => toast.error(error.message || "Failed to delete event"),
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, optionId }: { id: string; optionId: string }) => api.post(`/events/${id}/vote/${optionId}`, {}, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
    onError: (error: any) => toast.error(error.message || "Failed to vote"),
  });

  // --- Handlers ---
  const resetForm = () => {
    setNewEventName("");
    setNewEventType("poll");
    setNewEventDescription("");
    setNewEventOptions(["", ""]);
    setNewEventImage(null);
    setNewEventImagePreview(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview for instant feedback
    const localUrl = URL.createObjectURL(file);
    if (isEdit) {
      setEditingEvent({ ...editingEvent, imagePreview: localUrl });
    } else {
      setNewEventImagePreview(localUrl);
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload('/upload/single', formData, token!);
      
      const storedUrl = res.file.storedUrl;
      const signedUrl = res.file.url;
      
      if (isEdit) {
        setEditingEvent({ 
          ...editingEvent, 
          image: storedUrl, // Use storedUrl for saving
          imagePreview: signedUrl // Use signedUrl for preview
        });
      } else {
        setNewEventImage(storedUrl);
        setNewEventImagePreview(signedUrl);
      }
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateEvent = () => {
    if (!newEventName.trim()) {
      toast.error("Don't forget the title! 🎈");
      return;
    }

    createMutation.mutate({
      title: newEventName.trim(),
      description: newEventDescription.trim(),
      type: newEventType,
      image: newEventImage,
      options: newEventType === 'poll' ? newEventOptions.filter(opt => opt.trim()) : []
    });
  };

  const handleUpdateEvent = () => {
    if (!editingEvent.title && !editingEvent.name) return;
    
    updateMutation.mutate({
      id: editingEvent.id,
      data: {
        title: editingEvent.title || editingEvent.name,
        description: editingEvent.description,
        status: editingEvent.status,
        image: editingEvent.image,
        type: editingEvent.type,
        options: editingEvent.type === 'poll' ? (editingEvent.options || []).map((o: any) => typeof o === 'string' ? o : o.text || o.option_text) : []
      }
    });
  };

  const triggerConfetti = () => {
    const colors = ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'];
    for (let i = 0; i < 50; i++) {
      const confettiEl = document.createElement('div');
      confettiEl.style.position = 'fixed';
      confettiEl.style.width = '8px';
      confettiEl.style.height = '8px';
      confettiEl.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confettiEl.style.left = Math.random() * 100 + 'vw';
      confettiEl.style.top = '-10px';
      confettiEl.style.zIndex = '9999';
      confettiEl.style.borderRadius = '50%';
      document.body.appendChild(confettiEl);
      const animate = () => {
        let y = -10; let x = parseFloat(confettiEl.style.left);
        const velocity = 5 + Math.random() * 5; const drift = (Math.random() - 0.5) * 2;
        const step = () => {
          y += velocity; x += drift; confettiEl.style.top = y + 'px'; confettiEl.style.left = x + 'px';
          if (y < window.innerHeight) requestAnimationFrame(step);
          else confettiEl.remove();
        };
        step();
      };
      animate();
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 py-8 space-y-10">
      {/* Responsive Hero Section */}
      <div className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[300px] flex items-end">
          <div className="absolute inset-0 bg-slate-900">
            <img
              src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80"
              alt="Hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

        <div className="relative z-10 w-full p-8 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-white">
                <Badge className="bg-yellow-400 text-black border-none px-3 py-1 rounded-full font-black uppercase tracking-widest text-[9px]">
                    Featured Event 🔥
                </Badge>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                    The Annual Product <br className="hidden md:block" /> Hackathon 2024
                </h2>
                <div className="flex flex-wrap items-center gap-6 text-white/70 text-sm font-bold">
                    <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-yellow-400" /> Starts in 2 Days</div>
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> 456 Participants</div>
                </div>
                <div className="pt-2">
                    <Button className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-black hover:scale-105 transition-all">
                        Secure Your Spot! 🚀
                    </Button>
                </div>
            </div>

            <div className="hidden lg:flex flex-col items-end gap-3">
                <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-muted overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=h${i}`} alt="u" />
                        </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-black bg-primary flex items-center justify-center text-primary-foreground font-black text-[10px]">
                        +42
                    </div>
                </div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Active Now</p>
            </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Feed (8 columns) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-4 bg-muted/20 p-2 rounded-2xl border border-border/50">
            <div className="flex items-center gap-1">
              {['hot', 'new', 'top'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === t ? 'bg-background shadow-md text-primary scale-105' : 'text-muted-foreground hover:bg-background/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {isAdmin && (
              <Button
                  onClick={() => setShowCreateForm(true)}
                  size="sm"
                  className="rounded-xl font-black bg-foreground text-background"
              >
                  + New Post
              </Button>
            )}
          </div>

          <AnimatePresence>
              {showCreateForm && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <Card className="p-6 border-none bg-muted/40 rounded-[2rem] shadow-sm space-y-6">
                          <div className="flex items-center justify-between">
                              <h3 className="text-lg font-black">Broadcast Event</h3>
                              <Button variant="ghost" size="icon" onClick={() => { setShowCreateForm(false); resetForm(); }} className="rounded-full"><X className="h-4 w-4" /></Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Image Upload Area */}
                            <div className="md:col-span-1">
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square w-full rounded-2xl bg-background border-2 border-dashed border-border hover:border-primary transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group relative"
                              >
                                {newEventImagePreview ? (
                                  <>
                                    <img src={newEventImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ImageIcon className="text-white h-8 w-8" />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <ImageIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest mt-2 text-muted-foreground">Add Cover</span>
                                  </>
                                )}
                                <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={(e) => handleImageUpload(e)} 
                                />
                              </div>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <Input
                                    placeholder="What's the title? ✨"
                                    value={newEventName}
                                    onChange={(e) => setNewEventName(e.target.value)}
                                    className="h-12 bg-background border-none rounded-xl font-bold px-6"
                                />
                                
                                <textarea
                                    placeholder="Tell the community about it..."
                                    value={newEventDescription}
                                    onChange={(e) => setNewEventDescription(e.target.value)}
                                    className="w-full min-h-[100px] bg-background border-none rounded-xl p-4 text-sm font-medium resize-none focus:ring-1 focus:ring-primary/20 transition-all"
                                />

                                <div className="flex flex-wrap gap-2">
                                    {['poll', 'challenge', 'hackathon', 'announcement'].map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setNewEventType(t)}
                                            className={`flex-1 min-w-[80px] h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newEventType === t ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                {newEventType === 'poll' && (
                                    <div className="space-y-2 pt-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Poll Options</p>
                                        {newEventOptions.map((opt, i) => (
                                            <div key={i} className="flex gap-2">
                                                <Input 
                                                    placeholder={`Option ${i + 1}`}
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const next = [...newEventOptions];
                                                        next[i] = e.target.value;
                                                        setNewEventOptions(next);
                                                    }}
                                                    className="h-10 bg-background border-none rounded-xl text-xs font-bold px-4"
                                                />
                                                {newEventOptions.length > 2 && (
                                                    <Button variant="ghost" size="icon" onClick={() => setNewEventOptions(newEventOptions.filter((_, idx) => idx !== i))} className="h-10 w-10 rounded-xl"><X className="h-4 w-4" /></Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setNewEventOptions([...newEventOptions, ""])}
                                            className="w-full rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-background/30 hover:bg-background/50"
                                        >
                                            + Add Option
                                        </Button>
                                    </div>
                                )}
                            </div>
                          </div>

                          <Button 
                            onClick={handleCreateEvent} 
                            disabled={createMutation.isPending || uploading}
                            className="w-full h-12 font-black rounded-xl shadow-lg shadow-primary/10"
                          >
                            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Launch Event! 🚀"}
                          </Button>
                      </Card>
                  </motion.div>
              )}

              {editingEvent && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                      <Card className="w-full max-w-2xl p-8 border-none bg-card/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]">
                          <div className="flex items-center justify-between">
                              <h3 className="text-2xl font-black tracking-tighter">Edit Event</h3>
                              <Button variant="ghost" size="icon" onClick={() => setEditingEvent(null)} className="rounded-full"><X className="h-5 w-5" /></Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             {/* Image Upload Area */}
                             <div className="md:col-span-1">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2 ml-1">Cover Image</p>
                                <div 
                                  onClick={() => editFileInputRef.current?.click()}
                                  className="aspect-square w-full rounded-2xl bg-background border-2 border-dashed border-border hover:border-primary transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group relative"
                                >
                                  {editingEvent.imagePreview || editingEvent.image ? (
                                    <>
                                      <img src={editingEvent.imagePreview || editingEvent.image} alt="Preview" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ImageIcon className="text-white h-8 w-8" />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <ImageIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />}
                                      <span className="text-[10px] font-black uppercase tracking-widest mt-2 text-muted-foreground">Add Cover</span>
                                    </>
                                  )}
                                  <input 
                                    type="file" 
                                    ref={editFileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={(e) => handleImageUpload(e, true)} 
                                  />
                                </div>
                              </div>

                              <div className="md:col-span-2 space-y-4">
                                  <div className="space-y-1.5">
                                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">Event Title</p>
                                      <Input 
                                          value={editingEvent.title || editingEvent.name}
                                          onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                                          className="h-12 bg-background/50 border-none rounded-2xl font-bold px-6"
                                      />
                                  </div>
                                  <div className="space-y-1.5">
                                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">Description</p>
                                      <textarea 
                                          value={editingEvent.description}
                                          onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                                          className="w-full min-h-[100px] bg-background/50 border-none rounded-2xl p-4 text-sm font-medium resize-none focus:ring-1 focus:ring-primary/20 transition-all"
                                      />
                                  </div>

                                  <div className="space-y-1.5">
                                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">Event Type</p>
                                      <div className="flex flex-wrap gap-2">
                                          {['poll', 'challenge', 'hackathon', 'announcement'].map(t => (
                                              <button 
                                                  key={t}
                                                  onClick={() => setEditingEvent({ ...editingEvent, type: t })}
                                                  className={`flex-1 min-w-[80px] h-9 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${editingEvent.type === t ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                                              >
                                                  {t}
                                              </button>
                                          ))}
                                      </div>
                                  </div>

                                  {editingEvent.type === 'poll' && editingEvent.options && (
                                      <div className="space-y-3">
                                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1">Poll Options</p>
                                          {editingEvent.options.map((opt: any, i: number) => (
                                              <div key={i} className="flex gap-2">
                                                <Input 
                                                    value={typeof opt === 'string' ? opt : opt.text || opt.option_text}
                                                    onChange={(e) => {
                                                        const next = [...editingEvent.options];
                                                        if (typeof next[i] === 'string') {
                                                          next[i] = e.target.value;
                                                        } else {
                                                          next[i] = { ...next[i], text: e.target.value, option_text: e.target.value };
                                                        }
                                                        setEditingEvent({ ...editingEvent, options: next });
                                                    }}
                                                    className="h-10 bg-background/50 border-none rounded-xl text-xs font-bold px-4"
                                                />
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  onClick={() => {
                                                    const next = editingEvent.options.filter((_: any, idx: number) => idx !== i);
                                                    setEditingEvent({ ...editingEvent, options: next });
                                                  }} 
                                                  className="h-10 w-10 rounded-xl"
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </div>
                                          ))}
                                          <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={() => setEditingEvent({ ...editingEvent, options: [...editingEvent.options, ""] })}
                                              className="w-full rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-background/30 hover:bg-background/50"
                                          >
                                              + Add Option
                                          </Button>
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="flex gap-4 pt-4">
                              <Button variant="outline" onClick={() => setEditingEvent(null)} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                              <Button 
                                onClick={handleUpdateEvent} 
                                disabled={updateMutation.isPending || uploading}
                                className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                              >
                                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
                              </Button>
                          </div>
                      </Card>
                  </motion.div>
              )}
          </AnimatePresence>

          {/* Events Feed */}
          <div className="space-y-6">
            {events.length === 0 ? (
              <div className="text-center py-20 bg-muted/10 rounded-[2rem] border border-dashed border-border">
                <PartyPopper className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No events broadcasting yet.</p>
                {isAdmin && <Button variant="link" onClick={() => setShowCreateForm(true)}>Be the first! 🚀</Button>}
              </div>
            ) : (
              events.map((event: any) => (
                <motion.div
                  key={event.id}
                  whileHover={{ y: -2 }}
                  className="flex bg-card/60 backdrop-blur-xl border border-border/50 rounded-[2rem] overflow-hidden transition-all cursor-pointer group hover:border-primary/40 shadow-sm"
                  onClick={() => navigate(`/${tenantSlug}/events/${event.id}`)}
                >
                  {/* Voting Sidebar */}
                  <div className="w-14 bg-muted/10 flex flex-col items-center py-6 gap-2 border-r border-border/10">
                    <button className="p-1 hover:text-primary transition-colors"><ArrowBigUp className="h-7 w-7" /></button>
                    <span className="text-xs font-black">{event.votes_count || 0}</span>
                    <button className="p-1 hover:text-red-500 transition-colors"><ArrowBigDown className="h-7 w-7" /></button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 md:p-8 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary bg-primary/5`}>
                              {event.type}
                          </Badge>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[100px] md:max-w-none">
                              {event.creator_name || 'Anonymous'} • {new Date(event.created_at).toLocaleDateString()}
                          </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 md:w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `75%` }}
                                  className={`h-full bg-primary`}
                              />
                          </div>
                          <span className="text-[9px] font-black uppercase text-muted-foreground">75%</span>
                      </div>
                    </div>

                    <div className="flex gap-6 items-start">
                      <div className="flex-1 space-y-2">
                          <h3 className="text-xl md:text-2xl font-black tracking-tight group-hover:text-primary transition-colors leading-tight">
                              {event.title || event.name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed italic line-clamp-2">
                              "{event.description || 'No description provided.'}"
                          </p>
                      </div>
                      {event.image && (
                          <div className="hidden sm:block w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-border/50 shrink-0">
                              <img
                                  src={event.image}
                                  alt="e"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                          </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-dashed border-border/40">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">
                          <MessageSquare className="h-4 w-4" /> {event.comments_count || 0}
                      </div>
                      
                      
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary ml-auto">
                          <Timer className="h-4 w-4" /> {event.ends_at ? new Date(event.ends_at).toLocaleDateString() : 'Active'}
                      </div>

                      {isAdmin && (
                          <div className="flex items-center gap-2 border-l border-border/50 pl-4 ml-2">
                              <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    updateMutation.mutate({ id: event.id, data: { status: event.status === 'active' ? 'ended' : 'active' } });
                                  }}
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  title="Toggle Status"
                              >
                                  <Clock className="h-4 w-4" />
                              </Button>
                              <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => { e.stopPropagation(); setEditingEvent(event); }}
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  title="Edit Event"
                              >
                                  <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (confirm("Delete this event?")) deleteMutation.mutate(event.id);
                                  }}
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  title="Delete Event"
                              >
                                  <X className="h-4 w-4" />
                              </Button>
                          </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right: Sidebar (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-8 border-none bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute -top-4 -right-4 p-4 opacity-10">
                <Activity className="h-32 w-32" />
            </div>
            <div className="space-y-6 relative z-10">
                <div className="space-y-1">
                    <h4 className="text-lg font-black uppercase tracking-tighter italic">Live Pulse</h4>
                    <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Community Activity</p>
                </div>

                <div className="space-y-3">
                    {[
                        { u: 'Sarah', a: 'joined hackathon', t: '2m', s: 's1' },
                        { u: 'Alex', a: 'voted in poll', t: '5m', s: 's2' },
                        { u: 'Dave', a: 'commented', t: '12m', s: 's3' }
                    ].map((act, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10 group hover:bg-white/20 transition-all">
                            <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden shrink-0">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${act.s}`} alt="p" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black truncate">{act.u}</p>
                                <p className="text-[10px] text-white/60 truncate font-bold uppercase tracking-tight">{act.a}</p>
                            </div>
                            <span className="text-[9px] text-white/40 font-black shrink-0">{act.t}</span>
                        </div>
                    ))}
                </div>
            </div>
          </Card>

          <Card className="p-8 border-none bg-card/60 backdrop-blur-xl rounded-[2rem] space-y-6 shadow-sm border border-border/50">
            <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> Top Stars
            </h4>
            <div className="space-y-4">
                {[1,2,3].map(i => (
                    <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-muted overflow-hidden border-2 border-border/50 group-hover:border-primary transition-all">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=star${i}`} alt="u" />
                            </div>
                            <div>
                                <p className="text-xs font-black">User_{i}42</p>
                                <p className="text-[9px] text-muted-foreground font-bold">1.2k Contributions</p>
                            </div>
                        </div>
                        <Crown className={`h-4 w-4 ${i === 1 ? 'text-yellow-500' : 'text-muted-foreground/20'}`} />
                    </div>
                ))}
            </div>
          </Card>

          <Card className="p-8 border-none bg-muted/20 rounded-[2rem] space-y-4">
            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Trending Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {['hackathon', 'poll', 'design', 'ux', 'code'].map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-lg px-2 py-1 text-[9px] font-black hover:bg-primary hover:text-primary-foreground cursor-pointer transition-all">
                  #{tag}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventsBoard;
