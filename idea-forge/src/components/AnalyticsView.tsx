import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Lightbulb, Activity, BarChart as BarChartIcon, PieChart as PieChartIcon, ThumbsUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsView = () => {
  const { token, user } = useAuth();
  
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["analytics", "summary", user?.id],
    queryFn: () => api.get("/analytics/summary", token!),
    enabled: !!token,
  });

  const { data: growth, isLoading: loadingGrowth } = useQuery({
    queryKey: ["analytics", "growth", user?.id],
    queryFn: () => api.get("/analytics/growth", token!),
    enabled: !!token,
  });

  const { data: statusDist, isLoading: loadingStatus } = useQuery({
    queryKey: ["analytics", "distribution-status", user?.id],
    queryFn: () => api.get("/analytics/distribution/status", token!),
    enabled: !!token,
  });

  const { data: catDist, isLoading: loadingCat } = useQuery({
    queryKey: ["analytics", "distribution-category", user?.id],
    queryFn: () => api.get("/analytics/distribution/category", token!),
    enabled: !!token,
  });

  const { data: topIdeas, isLoading: loadingTop } = useQuery({
    queryKey: ["analytics", "top-ideas", user?.id],
    queryFn: () => api.get("/analytics/top-ideas", token!),
    enabled: !!token,
  });

  if (loadingSummary || loadingGrowth || loadingStatus || loadingCat || loadingTop) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Ideas" value={summary?.total_ideas} icon={Lightbulb} color="bg-primary/10 text-primary" />
        <MetricCard title="Active Contributors" value={summary?.active_contributors} icon={Users} color="bg-indigo-100 text-indigo-600" />
        <MetricCard title="Total Engagement" value={(summary?.total_votes || 0) + (summary?.total_comments || 0)} icon={Activity} color="bg-emerald-100 text-emerald-600" />
        <MetricCard title="Engagement Rate" value={summary?.total_ideas ? ((summary?.total_votes + summary?.total_comments) / summary.total_ideas).toFixed(1) : 0} icon={BarChartIcon} color="bg-amber-100 text-amber-600" suffix="per idea" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth Chart */}
        <Card className="border-none shadow-premium overflow-hidden bg-white/50 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Idea Creation Velocity (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} hide />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-none shadow-premium overflow-hidden bg-white/50 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Lifecycle Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center pt-4">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDist?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                </PieChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <Card className="border-none shadow-premium overflow-hidden bg-white/50 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChartIcon className="h-4 w-4 text-primary" />
              Category Popularity
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} width={80} />
                <Tooltip 
                   cursor={{fill: 'transparent'}}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Leaderboard */}
        <Card className="border-none shadow-premium overflow-hidden bg-white/50 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-primary" />
              Most Engaging Ideas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {topIdeas?.length > 0 ? topIdeas.map((idea: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:translate-x-1 transition-all">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-xs font-black text-slate-800 truncate mb-0.5">{idea.title}</p>
                    <div className="flex gap-2 text-[9px] font-bold text-slate-400">
                      <span className="text-emerald-600">{idea.votes_count} Votes</span>
                      <span>•</span>
                      <span className="text-primary">{idea.comments_count} Comments</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-100 min-w-10">
                    <span className="text-[10px] font-black leading-none">{idea.total_engagement}</span>
                    <span className="text-[7px] text-slate-400 uppercase font-bold mt-0.5">impact</span>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center text-slate-400 italic text-xs">No engagement data available yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, color, suffix }: any) => (
  <Card className="border-none shadow-premium bg-white/80 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-black text-slate-900 leading-none">{value || 0}</h3>
            {suffix && <span className="text-[10px] text-slate-400 font-bold">{suffix}</span>}
          </div>
        </div>
        <div className={`p-3 rounded-2xl ${color} group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const AnalyticsSkeleton = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl border-none shadow-sm" />)}
    </div>
    <div className="grid grid-cols-2 gap-8">
      <Skeleton className="h-[350px] rounded-[2rem] border-none shadow-sm" />
      <Skeleton className="h-[350px] rounded-[2rem] border-none shadow-sm" />
    </div>
  </div>
);

export default AnalyticsView;
