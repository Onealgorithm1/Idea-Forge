import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

const AdminDashboard = () => {
  const { token } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats", token!),
    enabled: !!token,
    refetchInterval: 30_000, // refresh every 30s
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: () => api.get("/admin/recent-activity", token!),
    enabled: !!token,
    refetchInterval: 60_000,
  });

  const adminStats = [
    {
      label: "Total Users",
      value: stats?.total_users ?? null,
      sub: `+${stats?.new_users_30d ?? 0} this month`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Idea Submissions",
      value: stats?.total_ideas ?? null,
      sub: `+${stats?.new_ideas_30d ?? 0} this month`,
      icon: Lightbulb,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Total Comments",
      value: stats?.total_comments ?? null,
      sub: "all time",
      icon: MessageSquare,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Engagement Rate",
      value: stats?.engagement_rate != null ? `${stats.engagement_rate}%` : null,
      sub: `${stats?.total_votes ?? 0} upvotes cast`,
      icon: ThumbsUp,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col relative overflow-hidden text-slate-900">
      {/* Mesh Gradient */}
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
                  <Link to={ROUTES.ADMIN_USERS}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Link>
                </Button>
                <Button className="rounded-xl shadow-premium bg-primary hover:bg-primary/90 font-bold px-6">
                  Export Report
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Real Stats Grid */}
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
                    {statsLoading
                      ? <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                      : null
                    }
                  </div>
                  <div className="space-y-1">
                    {statsLoading || stat.value === null ? (
                      <Skeleton className="h-9 w-24 rounded-xl" />
                    ) : (
                      <h3 className="text-3xl font-black tracking-tight">{stat.value}</h3>
                    )}
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    {!statsLoading && (
                      <p className="text-[11px] text-slate-400 font-medium">{stat.sub}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Management Shortcuts */}
              <Card className="lg:col-span-2 p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2rem] space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl">
                      <ShieldCheck className="h-5 w-5 text-slate-600" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight">Management Suite</h2>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="font-bold text-primary group">
                    <Link to={ROUTES.ADMIN_USERS}>
                      View All <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link to={ROUTES.ADMIN_USERS} className="group p-5 bg-slate-50/50 hover:bg-primary/5 border border-slate-100 hover:border-primary/20 rounded-[1.5rem] transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">User Control</h3>
                        <p className="text-xs text-slate-500">
                          {statsLoading ? "Loading…" : `${stats?.total_users ?? 0} total · ${stats?.admin_count ?? 0} admins`}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="group p-5 bg-slate-50/50 hover:bg-info/5 border border-slate-100 hover:border-info/20 rounded-[1.5rem] transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-6 w-6 text-info" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Ideas Overview</h3>
                        <p className="text-xs text-slate-500">
                          {statsLoading ? "Loading…" : `${stats?.total_ideas ?? 0} total · ${stats?.new_ideas_30d ?? 0} new this month`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-8 border-none shadow-premium bg-slate-900 text-white rounded-[2rem] space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Clock className="h-5 w-5 text-white/70" />
                  </div>
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
                            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                              {log.actor}
                            </p>
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

          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
