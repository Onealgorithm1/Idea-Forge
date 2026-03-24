import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MessageSquare, Heart, Bookmark, Calendar, Target, Plus, Search, Edit2, Camera, Check, X, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { getTenantPath, ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import VotingSystem from "@/components/VotingSystem";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Profile = () => {
  const { user, token } = useAuth();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || "default";
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => api.get("/users/me", token!),
    enabled: !!token,
  });

  const { data: ideas = [], isLoading: loadingIdeas } = useQuery({
    queryKey: ["user-ideas", user?.id],
    queryFn: () => api.get("/ideas/my-ideas", token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditBio(profile.bio || "");
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; bio: string }) => 
      api.patch("/users/profile", data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
        toast.error(error.message || "Failed to update profile");
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return api.upload("/users/avatar", formData, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile picture updated");
    },
    onError: (error: any) => {
        toast.error(error.message || "Failed to upload picture");
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("File size must be under 5MB");
      uploadAvatarMutation.mutate(file);
    }
  };

  const voteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: "up" | "down" }) => 
      api.post(`/ideas/${id}/vote`, { type }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-ideas", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Vote recorded");
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ideas/${id}/bookmark`, {}, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-ideas", user?.id] });
    }
  });

  const handleVote = (e: React.MouseEvent, id: string, type: 'up' | 'down') => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return toast.error("Please login to vote");
    voteMutation.mutate({ id, type });
  };

  const handleBookmark = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return toast.error("Please login to bookmark");
    bookmarkMutation.mutate(id);
  };

  const filteredIdeas = ideas.filter((idea: any) => 
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadingProfile || loadingIdeas) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const VITE_API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:5001';
  const avatarUrl = profile?.avatar_url ? (profile.avatar_url.startsWith('http') ? profile.avatar_url : `${VITE_API_URL}${profile.avatar_url}`) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-8"
          >
            <Card className="border-none shadow-premium bg-white/80 backdrop-blur-md overflow-hidden p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 flex-1">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Avatar className="h-24 w-24 border-4 border-white shadow-xl group-hover:opacity-80 transition-all duration-300">
                                {avatarUrl && <AvatarImage src={avatarUrl} className="object-cover" />}
                                <AvatarFallback className="text-3xl font-black bg-primary/5 text-primary">
                                    {profile?.name ? getInitials(profile.name) : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-all duration-300">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                                accept="image/*"
                            />
                            {uploadAvatarMutation.isPending && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full">
                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="text-center md:text-left flex-1 space-y-2">
                            {isEditing ? (
                                <div className="space-y-4 max-w-md mx-auto md:mx-0">
                                    <Input 
                                        value={editName} 
                                        onChange={(e) => setEditName(e.target.value)} 
                                        className="text-xl font-black h-12 border-primary/20 focus:border-primary"
                                        placeholder="Full Name"
                                    />
                                    <Textarea 
                                        value={editBio} 
                                        onChange={(e) => setEditBio(e.target.value)} 
                                        className="text-sm border-primary/20 focus:border-primary min-h-[100px]"
                                        placeholder="Write a short bio about yourself..."
                                    />
                                    <div className="flex gap-2">
                                        <Button 
                                            size="sm" 
                                            onClick={() => updateProfileMutation.mutate({ name: editName, bio: editBio })}
                                            disabled={updateProfileMutation.isPending}
                                            className="font-bold gap-2"
                                        >
                                            {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            Save Changes
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="font-bold gap-2 text-slate-500">
                                            <X className="h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center md:justify-start gap-4">
                                        <h1 className="text-4xl font-black tracking-tighter text-slate-900">{profile?.name}</h1>
                                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-slate-500 font-medium">{profile?.email}</p>
                                    <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto md:mx-0 italic">
                                        {profile?.bio || "No bio added yet. Tell us a bit about yourself!"}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                                        <Badge variant="secondary" className="px-3 py-1 bg-primary/5 text-primary border-none font-bold">
                                            {ideas.length} Ideas Posted
                                        </Badge>
                                        <Badge variant="secondary" className="px-3 py-1 bg-indigo-50 text-indigo-600 border-none font-bold">
                                            {profile?.role?.toUpperCase()}
                                        </Badge>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {!isEditing && (
                        <Button asChild className="gap-2 font-black shadow-lg shadow-primary/20 h-12 px-6 rounded-2xl group">
                            <Link to={ROUTES.SUBMIT_IDEA}>
                                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                                Share an Idea
                            </Link>
                        </Button>
                    )}
                </div>
            </Card>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <Target className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">My Submissions</h2>
                </div>
                <div className="relative w-full sm:w-64 group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                   <input
                     type="text"
                     placeholder="Search my ideas..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-white border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredIdeas.map((idea) => (
                    <motion.div
                      layout
                      key={idea.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link to={getTenantPath(ROUTES.IDEA_DETAIL.replace(':id', idea.id), tenantSlug)}>
                        <Card className="h-full border-none shadow-premium hover:shadow-hover bg-white group p-6 flex flex-col justify-between transition-all duration-300">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="bg-primary/5 text-primary border-none uppercase text-[9px] font-black tracking-widest px-2 py-0.5">
                                {idea.category}
                              </Badge>
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(idea.created_at), "MMM d, yyyy")}
                              </div>
                            </div>
                            <h3 className="text-base font-black text-slate-800 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                              {idea.title}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                              {idea.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 mt-6 pt-5 border-t border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 group-hover:text-emerald-600 transition-colors">
                                    <Heart className="h-4 w-4 fill-emerald-50 text-emerald-500" />
                                    {idea.votes_count || 0}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 group-hover:text-primary transition-colors">
                                    <MessageSquare className="h-4 w-4 fill-primary/5 text-primary" />
                                    {idea.comments_count || 0}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-auto">
                                <Badge variant="secondary" className="text-[8px] px-2 py-0.5 h-5 bg-slate-100 text-slate-600 border-none font-bold uppercase tracking-tighter">
                                    {idea.status}
                                </Badge>
                                <button 
                                  onClick={(e) => handleBookmark(e, idea.id)}
                                  className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-amber-500 transition-all border border-transparent hover:border-amber-100"
                                >
                                  <Bookmark className="h-4 w-4 fill-current opacity-20" />
                                </button>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredIdeas.length === 0 && (
                <div className="text-center py-24 bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center">
                  {searchQuery ? (
                    <div className="space-y-2">
                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">🔍</div>
                        <p className="text-slate-500 font-bold">No ideas match "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-2 text-3xl">✨</div>
                      <div className="space-y-2">
                        <p className="text-xl font-black text-slate-800 tracking-tight">Your innovation journal is empty.</p>
                        <p className="text-slate-500 font-medium">Be the first to spark a new direction!</p>
                      </div>
                      <Button asChild className="rounded-2xl font-black shadow-lg shadow-primary/20">
                        <Link to={ROUTES.SUBMIT_IDEA}>Go Create Something</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
