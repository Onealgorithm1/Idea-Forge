import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Lightbulb,
  MessageSquare,
  ThumbsUp,
  ArrowUpRight,
  Settings,
  ShieldCheck,
  TrendingUp,
  Clock,
  ChevronRight,
  Loader2,
  Tag,
  FolderOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

const AdminDashboard = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats", token!),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: () => api.get("/admin/recent-activity", token!),
    enabled: !!token,
    refetchInterval: 60_000,
  });

  // Categories
  const [newCategory, setNewCategory] = useState("");
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/admin/categories", token!),
    enabled: !!token,
  });
  const createCatMutation = useMutation({
    mutationFn: (name: string) => {
      if (!name || name.trim().length < 2) throw new Error("Category name must be at least 2 characters");
      return api.post("/admin/categories", { name }, token!);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); setNewCategory(""); toast.success("Category created"); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/categories/${id}`, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
    onError: (e: any) => toast.error(e.message),
  });

  // Idea Spaces
  const [newSpace, setNewSpace] = useState("");
  const { data: spaces = [], isLoading: spacesLoading } = useQuery({
    queryKey: ["admin-spaces"],
    queryFn: () => api.get("/admin/spaces", token!),
    enabled: !!token,
  });
  const createSpaceMutation = useMutation({
    mutationFn: (name: string) => {
      if (!name || name.trim().length < 2) throw new Error("Space name must be at least 2 characters");
      return api.post("/admin/spaces", { name }, token!);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-spaces"] }); setNewSpace(""); toast.success("Space created"); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteSpaceMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/spaces/${id}`, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-spaces"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const adminStats = [
    { label: "Total Users", value: stats?.total_users ?? null, sub: `+${stats?.new_users_30d ?? 0} this month`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Idea Submissions", value: stats?.total_ideas ?? null, sub: `+${stats?.new_ideas_30d ?? 0} this month`, icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Total Comments", value: stats?.total_comments ?? null, sub: "all time", icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Engagement Rate", value: stats?.engagement_rate != null ? `${stats.engagement_rate}%` : null, sub: `${stats?.total_votes ?? 0} upvotes cast`, icon: ThumbsUp, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col relative overflow-hidden text-slate-900">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-info/10 blur-[100px]" />
      </div>

      <Header />
      <div className="flex flex-1 overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-6xl mx-auto space-y-10">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-up">
              <div>
                <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1 font-bold text-[10px] uppercase tracking-[0.2em]">
                  Admin Central
                </Badge>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  System <span className="text-primary">Intelligence.</span>
                </h1>
                <p className="text-slate-500 mt-3 text-lg font-medium">
                  Monitoring platform health and community growth.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline" className="rounded-xl border-slate-200 shadow-sm font-bold bg-white/50 backdrop-blur-sm">
                  <Link to={getTenantPath(ROUTES.ADMIN_USERS, tenantSlug)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {adminStats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-premium hover:shadow-premium-hover transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    {statsLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-300" /> : null}
                  </div>
                  <div className="space-y-1">
                    {statsLoading || stat.value === null ? (
                      <Skeleton className="h-9 w-24 rounded-xl" />
                    ) : (
                      <h3 className="text-3xl font-black tracking-tight">{stat.value}</h3>
                    )}
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    {!statsLoading && <p className="text-[11px] text-slate-400 font-medium">{stat.sub}</p>}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Management + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <Card className="lg:col-span-2 p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2rem] space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl"><ShieldCheck className="h-5 w-5 text-slate-600" /></div>
                    <h2 className="text-xl font-black tracking-tight">Management Suite</h2>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="font-bold text-primary group">
                    <Link to={getTenantPath(ROUTES.ADMIN_USERS, tenantSlug)}>
                      View All <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link to={getTenantPath(ROUTES.ADMIN_USERS, tenantSlug)} className="group p-5 bg-slate-50/50 hover:bg-primary/5 border border-slate-100 hover:border-primary/20 rounded-[1.5rem] transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">User Control</h3>
                        <p className="text-xs text-slate-500">{statsLoading ? "Loading…" : `${stats?.total_users ?? 0} total · ${stats?.admin_count ?? 0} admins`}</p>
                      </div>
                    </div>
                  </Link>
                  <div className="group p-5 bg-slate-50/50 hover:bg-info/5 border border-slate-100 hover:border-info/20 rounded-[1.5rem] transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-6 w-6 text-info" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Ideas Overview</h3>
                        <p className="text-xs text-slate-500">{statsLoading ? "Loading…" : `${stats?.total_ideas ?? 0} total · ${stats?.new_ideas_30d ?? 0} new this month`}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-8 border-none shadow-premium bg-slate-900 text-white rounded-[2rem] space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl"><Clock className="h-5 w-5 text-white/70" /></div>
                  <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
                </div>
                <div className="space-y-5">
                  {activityLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                        <Skeleton className="h-4 w-full rounded-md bg-white/10" />
                      </div>
                    ))
                  ) : activity.length === 0 ? (
                    <p className="text-white/30 text-sm">No activity yet.</p>
                  ) : (
                    activity.map((log: any, i: number) => (
                      <div key={i} className="flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-white/90 group-hover:text-primary transition-colors capitalize">
                              {log.action} {log.entity_type}
                            </p>
                            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{log.actor}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-white/30 shrink-0 ml-2">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Categories & Spaces Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Categories */}
              <Card className="p-6 border-none bg-white/80 shadow-premium rounded-[2rem] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl"><Tag className="h-5 w-5 text-amber-600" /></div>
                  <h2 className="text-lg font-black">Categories</h2>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="New category name…"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && newCategory.trim()) createCatMutation.mutate(newCategory.trim()); }}
                  />
                  <Button
                    size="icon"
                    onClick={() => { if (newCategory.trim()) createCatMutation.mutate(newCategory.trim()); }}
                    disabled={createCatMutation.isPending}
                  >
                    {createCatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {catsLoading ? <Skeleton className="h-8 w-full rounded-lg" /> :
                    categories.length === 0 ? <p className="text-sm text-muted-foreground italic">No categories yet.</p> :
                      categories.map((cat: any) => (
                        <div key={cat.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl group">
                          <span className="text-sm font-medium">{cat.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                            onClick={() => deleteCatMutation.mutate(cat.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                  }
                </div>
              </Card>

              {/* Idea Spaces */}
              <Card className="p-6 border-none bg-white/80 shadow-premium rounded-[2rem] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl"><FolderOpen className="h-5 w-5 text-blue-600" /></div>
                  <h2 className="text-lg font-black">Idea Spaces</h2>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="New space name…"
                    value={newSpace}
                    onChange={(e) => setNewSpace(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && newSpace.trim()) createSpaceMutation.mutate(newSpace.trim()); }}
                  />
                  <Button
                    size="icon"
                    onClick={() => { if (newSpace.trim()) createSpaceMutation.mutate(newSpace.trim()); }}
                    disabled={createSpaceMutation.isPending}
                  >
                    {createSpaceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {spacesLoading ? <Skeleton className="h-8 w-full rounded-lg" /> :
                    spaces.length === 0 ? <p className="text-sm text-muted-foreground italic">No idea spaces yet.</p> :
                      spaces.map((sp: any) => (
                        <div key={sp.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl group">
                          <div>
                            <span className="text-sm font-medium">{sp.name}</span>
                            {sp.key && <span className="ml-2 text-[10px] text-muted-foreground">/{sp.key}</span>}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                            onClick={() => deleteSpaceMutation.mutate(sp.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                  }
                </div>
              </Card>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

