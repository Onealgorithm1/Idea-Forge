import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
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
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  ShieldCheck,
  Lightbulb,
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
import { getTenantPath, ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* ─── Role badge colours ───────────────────────────────────────────────── */
const ROLE_STYLES: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700 border-violet-200",
  reviewer: "bg-sky-100 text-sky-700 border-sky-200",
  user: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

/* ─── Stat Pill ─────────────────────────────────────────────────────────── */
const StatPill = ({
  icon: Icon,
  label,
  value,
  color = "primary",
}: {
  icon: any;
  label: string;
  value: number | string;
  color?: string;
}) => {
  const palette: Record<string, string> = {
    primary: "bg-primary/8 text-primary border-primary/15",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold ${palette[color] ?? palette.primary}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{value}</span>
      <span className="text-[11px] font-semibold opacity-70">{label}</span>
    </div>
  );
};

/* ─── Change Password Modal ─────────────────────────────────────────────── */
const ChangePasswordModal = ({
  token,
  onClose,
}: {
  token: string | null;
  onClose: () => void;
}) => {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mutation = useMutation({
    mutationFn: () => {
      if (!current) throw new Error("Current password is required");
      if (next.length < 8) throw new Error("New password must be at least 8 characters");
      if (next !== confirm) throw new Error("Passwords do not match");
      return api.patch("/users/change-password", { currentPassword: current, newPassword: next }, token!);
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Failed to change password"),
  });

  const strength = (() => {
    if (!next) return 0;
    let s = 0;
    if (next.length >= 8) s++;
    if (/[A-Z]/.test(next)) s++;
    if (/[0-9]/.test(next)) s++;
    if (/[^A-Za-z0-9]/.test(next)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-rose-400", "bg-amber-400", "bg-sky-400", "bg-emerald-400"][strength];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-400">Keep your account secure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="Enter current password"
                className="pr-10 h-11 rounded-xl border-slate-200 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <Input
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="Min. 8 characters"
                className="pr-10 h-11 rounded-xl border-slate-200 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowNext(!showNext)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Strength bar */}
            {next && (
              <div className="space-y-1">
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        i <= strength ? strengthColor : "bg-slate-100"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-[10px] font-bold ${["", "text-rose-500", "text-amber-500", "text-sky-500", "text-emerald-500"][strength]}`}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
                className={`pr-10 h-11 rounded-xl border-slate-200 focus:border-primary ${
                  confirm && next !== confirm ? "border-rose-300 focus:border-rose-400" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirm && next !== confirm && (
              <p className="text-[10px] text-rose-500 font-semibold">Passwords don't match</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 h-11 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Update Password
          </Button>
          <Button variant="ghost" onClick={onClose} className="h-11 px-5 rounded-xl font-bold text-slate-500">
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── Idea Card ─────────────────────────────────────────────────────────── */
const IdeaCard = ({ idea, tenantSlug, onBookmark }: { idea: any; tenantSlug: string; onBookmark: (e: React.MouseEvent, id: string) => void }) => (
  <Link to={getTenantPath(ROUTES.IDEA_DETAIL.replace(":id", idea.id), tenantSlug)}>
    <Card className="h-full border-0 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_-8px_rgba(99,102,241,0.22)] bg-white group p-5 flex flex-col justify-between transition-all duration-300 rounded-2xl hover:-translate-y-1">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/15 uppercase text-[9px] font-black tracking-widest px-2 py-0.5 rounded-lg"
          >
            {idea.category}
          </Badge>
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <Calendar className="h-3 w-3" />
            {format(new Date(idea.created_at), "MMM d, yyyy")}
          </div>
        </div>
        <h3 className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {idea.title}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{idea.description}</p>
      </div>

      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-50">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 group-hover:text-emerald-600 transition-colors">
            <Heart className="h-3.5 w-3.5 fill-rose-50 text-rose-400" />
            {idea.votes_count || 0}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 group-hover:text-primary transition-colors">
            <MessageSquare className="h-3.5 w-3.5 fill-primary/5 text-primary/70" />
            {idea.comments_count || 0}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Badge
            variant="secondary"
            className="text-[8px] px-2 py-0.5 h-5 bg-slate-100 text-slate-500 border-0 font-bold uppercase tracking-tighter rounded-md"
          >
            {idea.status}
          </Badge>
          <button
            onClick={(e) => onBookmark(e, idea.id)}
            className="p-1.5 hover:bg-amber-50 rounded-xl text-slate-300 hover:text-amber-500 transition-all border border-transparent hover:border-amber-100"
          >
            <Bookmark className="h-3.5 w-3.5 fill-current opacity-20" />
          </button>
        </div>
      </div>
    </Card>
  </Link>
);

/* ─── Main Component ────────────────────────────────────────────────────── */
const Profile = () => {
  const { user, token } = useAuth();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || "default";
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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
    staleTime: 1000 * 60 * 5,
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
    onError: (e: any) => toast.error(e.message || "Failed to update profile"),
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
    onError: (e: any) => toast.error(e.message || "Failed to upload picture"),
  });

  const bookmarkMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ideas/${id}/bookmark`, {}, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-ideas", user?.id] }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("File size must be under 5 MB");
    uploadAvatarMutation.mutate(file);
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

  /* ─── Loading skeleton ─── */
  if (loadingProfile || loadingIdeas) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  const VITE_API_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api$/, "")
    : "http://localhost:5001";
  const avatarUrl = profile?.avatar_url
    ? profile.avatar_url.startsWith("http")
      ? profile.avatar_url
      : `${VITE_API_URL}${profile.avatar_url}`
    : null;

  const roleKey = (profile?.role || "user").toLowerCase();
  const roleBadgeClass = ROLE_STYLES[roleKey] ?? ROLE_STYLES.user;

  const totalVotes = ideas.reduce((sum: number, i: any) => sum + (i.votes_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#F5F6FB] flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-auto">
        <SidebarNav />

        <main className="flex-1 min-w-0">
          {/* ── Hero banner ─────────────────────────── */}
          <div className="relative h-44 bg-gradient-to-r from-[hsl(242,82%,42%)] via-[hsl(260,70%,50%)] to-[hsl(220,80%,60%)]">
            {/* decorative blobs */}
            <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-1/3 w-72 h-40 rounded-full bg-white/5 blur-3xl" />
            {/* Tenant label */}
            <div className="absolute top-5 left-8 flex items-center gap-2 text-white/70 text-xs font-bold tracking-wide">
              <Building2 className="h-3.5 w-3.5" />
              {tenant?.name || "Organization"}
            </div>
            {/* Bottom fade from banner into content */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#F5F6FB]" />
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 pb-12 space-y-8 relative z-10">
            {/* ── Profile card ─────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="border-0 shadow-[0_4px_40px_-8px_rgba(0,0,0,0.12)] rounded-3xl bg-white p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  {/* Left: avatar + info */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 flex-1">
                    {/* Avatar */}
                    <div
                      className="relative group cursor-pointer shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="rounded-full p-1 bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 shadow-xl shadow-primary/30">
                        <Avatar className="h-24 w-24 border-4 border-white">
                          {avatarUrl && <AvatarImage src={avatarUrl} className="object-cover" />}
                          <AvatarFallback className="text-3xl font-black bg-gradient-to-br from-primary/20 to-violet-100 text-primary">
                            {profile?.name ? getInitials(profile.name) : "U"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 rounded-full transition-all duration-300">
                        <Camera className="h-7 w-7 text-white drop-shadow-lg" />
                      </div>
                      {uploadAvatarMutation.isPending && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full">
                          <Loader2 className="h-7 w-7 text-primary animate-spin" />
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>

                    {/* Info / Edit form */}
                    <div className="text-center sm:text-left flex-1 space-y-2 pt-1">
                      {isEditing ? (
                        <div className="space-y-3 max-w-md">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-lg font-black h-11 border-primary/20 focus:border-primary rounded-xl"
                            placeholder="Your name"
                          />
                          <Textarea
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            className="text-sm border-primary/20 focus:border-primary min-h-[80px] rounded-xl"
                            placeholder="Write a short bio about yourself…"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateProfileMutation.mutate({ name: editName, bio: editBio })}
                              disabled={updateProfileMutation.isPending}
                              className="gap-2 rounded-xl font-bold shadow-md shadow-primary/20"
                            >
                              {updateProfileMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsEditing(false)}
                              className="gap-2 rounded-xl font-bold text-slate-500"
                            >
                              <X className="h-4 w-4" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">
                              {profile?.name}
                            </h1>
                            <button
                              onClick={() => setIsEditing(true)}
                              className="p-1.5 rounded-lg hover:bg-primary/8 hover:text-primary text-slate-400 transition-all"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <p className="text-sm text-slate-400 font-medium">{profile?.email}</p>

                          {/* Tenant row */}
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-slate-500">
                            <Building2 className="h-3.5 w-3.5 text-primary/60" />
                            <span className="font-semibold text-slate-700">{tenant?.name || "—"}</span>
                          </div>

                          <p className="text-sm text-slate-500 leading-relaxed max-w-xl italic">
                            {profile?.bio || "No bio added yet. Click the edit icon to tell us about yourself!"}
                          </p>

                          {/* Badges row */}
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                            <Badge className={`capitalize border text-[11px] font-bold px-3 py-1 ${roleBadgeClass}`}>
                              {profile?.role}
                            </Badge>
                            <StatPill icon={Lightbulb} label="Ideas" value={ideas.length} color="primary" />
                            <StatPill icon={Heart} label="Votes received" value={totalVotes} color="rose" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: action buttons */}
                  {!isEditing && (
                    <div className="flex flex-col gap-3 shrink-0 items-stretch sm:items-end">
                      <Button
                        asChild
                        className="gap-2 font-black shadow-lg shadow-primary/20 h-10 px-5 rounded-2xl group"
                      >
                        <Link to={getTenantPath(ROUTES.SUBMIT_IDEA, tenantSlug)}>
                          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                          New Idea
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowPasswordModal(true)}
                        className="gap-2 font-bold h-10 px-5 rounded-2xl border-slate-200 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
                      >
                        <Lock className="h-4 w-4" />
                        Change Password
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* ── My Ideas section ─────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="space-y-5"
            >
              {/* Section header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-primary/10 shadow-sm">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900">My Ideas</h2>
                    <p className="text-xs text-slate-400 font-medium">{ideas.length} submissions total</p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-60 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search ideas…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Ideas grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <AnimatePresence mode="popLayout">
                  {filteredIdeas.map((idea: any) => (
                    <motion.div
                      layout
                      key={idea.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.18 }}
                    >
                      <IdeaCard idea={idea} tenantSlug={tenantSlug} onBookmark={handleBookmark} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Empty state */}
              {filteredIdeas.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4"
                >
                  {searchQuery ? (
                    <>
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl">🔍</div>
                      <p className="text-slate-500 font-bold">No ideas match "{searchQuery}"</p>
                    </>
                  ) : (
                    <>
                      <div className="h-20 w-20 bg-primary/8 rounded-full flex items-center justify-center text-3xl">✨</div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-slate-800 tracking-tight">No ideas yet</p>
                        <p className="text-slate-400 font-medium text-sm">Be the first to spark something new!</p>
                      </div>
                      <Button
                        asChild
                        className="rounded-2xl font-black shadow-lg shadow-primary/20 gap-2"
                      >
                        <Link to={getTenantPath(ROUTES.SUBMIT_IDEA, tenantSlug)}>
                          <Plus className="h-4 w-4" />
                          Share an Idea
                        </Link>
                      </Button>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </main>
      </div>

      {/* ── Change Password Modal ─────────────── */}
      <AnimatePresence>
        {showPasswordModal && (
          <ChangePasswordModal token={token} onClose={() => setShowPasswordModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
