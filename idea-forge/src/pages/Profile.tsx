import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Heart,
  Bookmark,
  Calendar,
  Target,
  Plus,
  Search,
  Edit2,
  Camera,
  Check,
  X,
  Loader2,
  Lock,
  Building2,
  Sparkles,
  ShieldCheck,
  Lightbulb,
  Globe,
  FileText,
  Briefcase,
  Save,
  ThumbsUp,
  User,
  Settings,
  Mail,
  Fingerprint,
  Trash2,
  Image as ImageIcon,
  Upload
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { getTenantPath, ROUTES, PLATFORM_STATUS_LABELS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials, cn, getAvatarUrl } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import ProfileIdeaCard from "@/components/ProfileIdeaCard";
import ConfirmationModal from "@/components/ConfirmationModal";

/* ─── Constants ────────────────────────────────────────────────────────── */
const PRECONFIGURED_AVATARS = [
  { id: '1', url: '/avatars/avatar.png', name: 'Original' },
  { id: '2', url: '/avatars/boy.png', name: 'Boy' },
  { id: '3', url: '/avatars/dog.png', name: 'Dog' },
  { id: '4', url: '/avatars/gamer.png', name: 'Gamer' },
  { id: '5', url: '/avatars/gamer (1).png', name: 'Gamer Alt' },
  { id: '6', url: '/avatars/girl.png', name: 'Girl' },
  { id: '7', url: '/avatars/man.png', name: 'Man' },
  { id: '8', url: '/avatars/student.png', name: 'Student' },
  { id: '9', url: '/avatars/woman.png', name: 'Woman' },
  { id: '10', url: '/avatars/woman (1).png', name: 'Woman Alt' },
];

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700 border-violet-200",
  reviewer: "bg-sky-100 text-sky-700 border-sky-200",
  user: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

/* ─── Main Component ────────────────────────────────────────────────────── */
const Profile = () => {
  const { user, token, logout, updateUser } = useAuth();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || "default";
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<string>(searchParams.get("section") || "general");
  const [searchQuery, setSearchQuery] = useState("");
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Navigation sync with URL
  useEffect(() => {
    const section = searchParams.get("section");
    if (section) setActiveSection(section);
  }, [searchParams]);

  const setSection = (section: string) => {
    setActiveSection(section);
    setSearchParams({ section });
  };

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => api.get("/users/me", token!),
    enabled: !!token,
  });

  const { data: ideas = [], isLoading: loadingIdeas } = useQuery({
    queryKey: ["user-ideas", user?.id],
    queryFn: () => api.get("/ideas/my-ideas", token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const { data: bookmarkedIdeas = [], isLoading: loadingBookmarks } = useQuery({
    queryKey: ["bookmarked-ideas", user?.id],
    queryFn: () => api.get("/ideas/bookmarked", token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditBio(profile.bio || "");
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name?: string; bio?: string; avatar_url?: string }) =>
      api.patch("/users/profile", data, token!),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      updateUser({ name: data.name, bio: data.bio, avatar_url: data.avatar_url });
      toast.success("Profile updated successfully");
      setIsAvatarPickerOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed to update profile"),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return api.upload("/users/avatar", formData, token!);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      updateUser({ avatar_url: data.avatar_url });
      toast.success("Profile picture updated successfully");
      setIsAvatarPickerOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed to upload profile picture"),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    uploadAvatarMutation.mutate(file);
  };

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => api.patch("/users/change-password", data, token!),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (e: any) => toast.error(e.message || "Failed to change password"),
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ideas/${id}`, token!),
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["user-ideas", user?.id] });
      setIdeaToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete post");
      setIdeaToDelete(null);
    }
  });

  const handleBookmark = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return toast.error("Please login to follow");
    api.post(`/ideas/${id}/bookmark`, {}, token!).then(() => {
        queryClient.invalidateQueries({ queryKey: ["bookmarked-ideas", user?.id] });
    });
  };

  if (loadingProfile || loadingIdeas || loadingBookmarks) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] flex-1 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary relative z-10" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Loading your profile...</p>
      </div>
    );
  }

  const VITE_API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, "") : "http://localhost:5000";
  const avatarUrl = getAvatarUrl(profile?.avatar_url, profile?.name);

  const filteredIdeas = ideas.filter((idea: any) =>
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sections = [
    { id: 'general', label: 'General', icon: User },
    { id: 'ideas', label: 'My Ideas', icon: Lightbulb },
    { id: 'bookmarks', label: 'Followed', icon: Bookmark },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    ...(user?.role === 'admin' ? [{ id: 'organization', label: 'Organization', icon: Building2 }] : []),
  ];

  return (
    <>
      <div className="flex-1 w-full space-y-6">
        <div className="px-4 pt-4 pb-2 md:px-8 md:pt-6 md:pb-2 w-full">
          {/* Horizontal Profile Navigation */}
        <div className="border-b border-border/40 mb-10 overflow-x-auto no-scrollbar flex justify-center">
          <div className="flex items-center justify-center gap-1 min-w-max">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setSection(section.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-6 py-4 rounded-t-2xl text-sm font-bold transition-all relative group",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {section.label}
                  {isActive && (
                    <motion.div 
                      layoutId="profileActiveTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >

                    {/* General Section */}
                    {activeSection === 'general' && (
                      <div className="space-y-8">
                        <div>
                          <h1 className="text-3xl font-black tracking-tight">General Settings</h1>
                          <p className="text-muted-foreground">Manage your profile information and appearance.</p>
                        </div>

                        <Card className="p-8 rounded-3xl border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                           <div className="flex flex-col md:flex-row gap-10">
                              {/* Avatar Section */}
                              <div className="flex flex-col items-center gap-4">
                                 <div className="relative group">
                                    <div className="p-1.5 rounded-full bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 shadow-xl shadow-primary/20">
                                       <Avatar className="h-32 w-32 border-4 border-background shadow-inner">
                                          <AvatarImage src={avatarUrl} />
                                          <AvatarFallback className="text-4xl font-black bg-primary/5 text-primary">
                                             {getInitials(profile?.name || "U")}
                                          </AvatarFallback>
                                       </Avatar>
                                    </div>
                                    <button
                                      onClick={() => setIsAvatarPickerOpen(true)}
                                      className="absolute bottom-1 right-1 p-2.5 bg-primary text-primary-foreground rounded-2xl shadow-lg hover:scale-110 transition-all border-4 border-background"
                                    >
                                      <Camera className="h-4 w-4" />
                                    </button>
                                 </div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profile Avatar</p>
                              </div>

                              {/* Form Section */}
                              <div className="flex-1 space-y-6">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                       <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Full Name</Label>
                                       <Input
                                          value={editName}
                                          onChange={(e) => setEditName(e.target.value)}
                                          className="h-12 rounded-2xl bg-background border-border/60 focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                                       />
                                    </div>
                                    <div className="space-y-2">
                                       <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Email Address</Label>
                                       <div className="relative">
                                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                          <Input
                                             value={profile?.email}
                                             disabled
                                             className="h-12 rounded-2xl bg-muted/30 border-border/40 pl-11 font-medium opacity-70"
                                          />
                                       </div>
                                    </div>
                                 </div>

                                 <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Short Bio</Label>
                                    <Textarea
                                       value={editBio}
                                       onChange={(e) => setEditBio(e.target.value)}
                                       placeholder="Tell us about your role and what you're passionate about..."
                                       className="min-h-[120px] rounded-2xl bg-background border-border/60 focus:ring-4 focus:ring-primary/10 transition-all resize-none p-4 leading-relaxed"
                                    />
                                 </div>

                                 <div className="flex justify-end pt-4">
                                    <Button
                                       onClick={() => updateProfileMutation.mutate({ name: editName, bio: editBio })}
                                       disabled={updateProfileMutation.isPending}
                                       className="h-12 px-8 rounded-2xl font-black shadow-lg shadow-primary/20 gap-2"
                                    >
                                       {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                       Save Changes
                                    </Button>
                                 </div>
                              </div>
                           </div>
                        </Card>
                      </div>
                    )}

                    {/* Ideas Section */}
                    {activeSection === 'ideas' && (
                      <div className="space-y-8">
                        <div className="flex items-end justify-between gap-4">
                           <div>
                              <h1 className="text-3xl font-black tracking-tight">My Submissions</h1>
                              <p className="text-muted-foreground">Ideas you have shared with the organization.</p>
                           </div>
                           <div className="relative w-full max-w-xs group">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input
                                 placeholder="Search your ideas..."
                                 value={searchQuery}
                                 onChange={(e) => setSearchQuery(e.target.value)}
                                 className="h-11 rounded-2xl bg-background border-border/60 pl-11"
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredIdeas.length > 0 ? (
                               filteredIdeas.map((idea: any) => (
                                  <ProfileIdeaCard 
                                    key={idea.id} 
                                    idea={idea} 
                                    tenantSlug={tenantSlug} 
                                    onBookmark={handleBookmark} 
                                    onDelete={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setIdeaToDelete(idea.id);
                                    }}
                                    canDelete={true}
                                  />
                               ))
                            ) : (
                              <div className="col-span-full py-20 bg-muted/20 border-2 border-dashed border-border/40 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-center">
                                 <div className="p-5 bg-background rounded-full shadow-sm">
                                    <Lightbulb className="h-10 w-10 text-muted-foreground/30" />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-lg font-black text-foreground">No ideas yet</p>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">Share your first idea to get started on your innovation journey!</p>
                                 </div>
                                 <Button asChild className="rounded-2xl font-black mt-2">
                                    <Link to={getTenantPath(ROUTES.SUBMIT_IDEA, tenantSlug)}>New Idea</Link>
                                 </Button>
                              </div>
                           )}
                        </div>
                      </div>
                    )}

                    {/* Bookmarks Section */}
                    {activeSection === 'bookmarks' && (
                       <div className="space-y-8">
                          <div>
                             <h1 className="text-3xl font-black tracking-tight">Followed Ideas</h1>
                             <p className="text-muted-foreground">Ideas you're tracking for updates and progress.</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {bookmarkedIdeas.length > 0 ? (
                                bookmarkedIdeas.map((idea: any) => (
                                   <ProfileIdeaCard key={idea.id} idea={idea} tenantSlug={tenantSlug} onBookmark={handleBookmark} />
                                ))
                             ) : (
                                <div className="col-span-full py-20 bg-muted/20 border-2 border-dashed border-border/40 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-center">
                                   <div className="p-5 bg-background rounded-full shadow-sm">
                                      <Bookmark className="h-10 w-10 text-muted-foreground/30" />
                                   </div>
                                   <div className="space-y-1">
                                      <p className="text-lg font-black text-foreground">Nothing followed</p>
                                      <p className="text-sm text-muted-foreground">Explore the idea board to find things you're interested in.</p>
                                   </div>
                                </div>
                             )}
                          </div>
                       </div>
                    )}

                    {/* Security Section */}
                    {activeSection === 'security' && (
                       <div className="space-y-8">
                          <div>
                             <h1 className="text-3xl font-black tracking-tight">Security</h1>
                             <p className="text-muted-foreground">Secure your account and manage access.</p>
                          </div>

                          <Card className="p-8 rounded-[2.5rem] border-border/50 bg-card/50 backdrop-blur-sm space-y-8">
                             <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                   <Fingerprint className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                   <h3 className="text-lg font-black">Authentication</h3>
                                   <p className="text-sm text-muted-foreground">Update your password to keep your account safe.</p>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                   <div className="space-y-2">
                                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Current Password</Label>
                                      <PasswordInput className="h-12 rounded-2xl bg-background" placeholder="••••••••" />
                                   </div>
                                   <div className="space-y-2">
                                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">New Password</Label>
                                      <PasswordInput className="h-12 rounded-2xl bg-background" placeholder="••••••••" />
                                   </div>
                                   <div className="space-y-2">
                                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Confirm New Password</Label>
                                      <PasswordInput className="h-12 rounded-2xl bg-background" placeholder="••••••••" />
                                   </div>
                                   <Button className="h-12 px-8 rounded-2xl font-black gap-2">
                                      Update Password
                                   </Button>
                                </div>

                                <div className="p-6 bg-muted/30 rounded-3xl border border-border/40 flex flex-col justify-between">
                                   <div className="space-y-3">
                                      <h4 className="font-black text-sm uppercase tracking-widest text-primary">Account Status</h4>
                                      <div className="flex items-center gap-2">
                                         <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                         <span className="text-sm font-bold text-foreground">Verified Account</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                         Your account is verified and linked to <span className="font-bold text-foreground">{tenant?.name}</span>.
                                         Multi-factor authentication is currently managed by your organization.
                                      </p>
                                   </div>
                                   <button className="text-destructive text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2 mt-8">
                                      <Trash2 className="h-3.5 w-3.5" /> Deactivate Account
                                   </button>
                                </div>
                             </div>
                          </Card>
                       </div>
                    )}

                    {/* Organization Section (Admin only) */}
                    {activeSection === 'organization' && (
                       <div className="space-y-8">
                          <div>
                             <h1 className="text-3xl font-black tracking-tight">Organization</h1>
                             <p className="text-muted-foreground">Manage your organization's presence and identity.</p>
                          </div>

                          <Card className="p-8 rounded-[2.5rem] border-border/50 bg-card/50 backdrop-blur-sm space-y-8">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                                   <Building2 className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                   <h3 className="text-lg font-black">{tenant?.name}</h3>
                                   <p className="text-sm text-muted-foreground">ID: {tenant?.id}</p>
                                </div>
                             </div>

                             <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div className="space-y-2">
                                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Org Name</Label>
                                      <Input defaultValue={tenant?.name} className="h-12 rounded-2xl bg-background" />
                                   </div>
                                   <div className="space-y-2">
                                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Domain</Label>
                                      <Input defaultValue={`${tenant?.slug}.ideaforge.app`} disabled className="h-12 rounded-2xl bg-muted/30" />
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">About Organization</Label>
                                   <Textarea className="min-h-[100px] rounded-2xl bg-background" placeholder="Organization description..." />
                                </div>
                                <Button className="h-12 px-8 rounded-2xl font-black gap-2">
                                   Update Org Settings
                                </Button>
                             </div>
                          </Card>
                       </div>
                    )}

                  </motion.div>
                </AnimatePresence>

                <ConfirmationModal
                  isOpen={!!ideaToDelete}
                  onClose={() => setIdeaToDelete(null)}
                  onConfirm={() => ideaToDelete && deleteIdeaMutation.mutate(ideaToDelete)}
                  title="Delete Post?"
                  message="This action will permanently delete this post. This action cannot be undone."
                  confirmText="Delete"
                  type="danger"
                />
              </div>
            </div>
          </div>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {isAvatarPickerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAvatarPickerOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-[2.5rem] overflow-hidden"
            >
              <div className="p-8 border-b border-border/50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                       <ImageIcon className="h-6 w-6" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black tracking-tight">Choose Your Avatar</h2>
                       <p className="text-sm text-muted-foreground">Select a pre-configured character or upload your own.</p>
                    </div>
                 </div>
                 <button onClick={() => setIsAvatarPickerOpen(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
                    <X className="h-5 w-5" />
                 </button>
              </div>

              <div className="p-8">
                 <div className="mb-8 flex flex-col items-center justify-center">
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     className="hidden" 
                     accept="image/*" 
                     onChange={handleFileUpload} 
                   />
                   <Button 
                     onClick={() => fileInputRef.current?.click()} 
                     disabled={uploadAvatarMutation.isPending}
                     variant="outline" 
                     className="w-full h-14 rounded-2xl border-dashed border-2 bg-muted/30 hover:bg-muted/50 font-bold gap-2 text-muted-foreground hover:text-foreground transition-all"
                   >
                     {uploadAvatarMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-primary" />}
                     {uploadAvatarMutation.isPending ? "Uploading..." : "Upload Custom Picture (Max 5MB)"}
                   </Button>
                 </div>

                 <div className="flex items-center gap-4 mb-6">
                   <div className="h-px bg-border flex-1" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Or choose from gallery</span>
                   <div className="h-px bg-border flex-1" />
                 </div>

                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-6 gap-y-10">
                    {PRECONFIGURED_AVATARS.map((avatar) => {
                       const url = avatar.url;
                       const isSelected = profile?.avatar_url === url;
                       return (
                          <button
                            key={avatar.id}
                            onClick={() => updateProfileMutation.mutate({ avatar_url: url })}
                            className={cn(
                               "group relative flex flex-col items-center gap-3 transition-all",
                               updateProfileMutation.isPending && "opacity-50 pointer-events-none"
                            )}
                          >
                             <div className={cn(
                                "p-1 rounded-full transition-all duration-300",
                                isSelected ? "ring-4 ring-primary ring-offset-4 ring-offset-background" : "hover:scale-110"
                             )}>
                                <Avatar className="h-20 w-20 shadow-lg border-2 border-border/10 bg-muted/30">
                                   <AvatarImage src={getAvatarUrl(url, avatar.name)} />
                                   <AvatarFallback className="text-xs font-bold">{avatar.name[0]}</AvatarFallback>
                                </Avatar>
                             </div>
                             <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest transition-colors",
                                isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                             )}>
                                {avatar.name}
                             </span>
                             {isSelected && (
                                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground p-1 rounded-full shadow-lg z-10">
                                   <Check className="h-3 w-3" />
                                </div>
                             )}
                          </button>
                       );
                    })}
                 </div>

                 <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-end gap-4">
                    <div className="flex gap-3">
                       <Button variant="ghost" onClick={() => setIsAvatarPickerOpen(false)} className="rounded-2xl font-bold">Cancel</Button>
                       <Button onClick={() => setIsAvatarPickerOpen(false)} className="rounded-2xl font-black px-8">Confirm Selection</Button>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Profile;
