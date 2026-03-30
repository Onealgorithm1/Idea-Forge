import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Building2, Users, Lightbulb, TrendingUp, Plus, Search, 
  ShieldCheck, MoreHorizontal, ExternalLink, Loader2, Power, Trash2, Settings, MessageSquare
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

const SUPER_ADMIN_API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const saApi = {
  get: async (endpoint: string) => {
    const token = localStorage.getItem("super_admin_token");
    const res = await fetch(`${SUPER_ADMIN_API}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error((await res.json()).message || "Error");
    return res.json();
  },
  post: async (endpoint: string, data: any) => {
    const token = localStorage.getItem("super_admin_token");
    const res = await fetch(`${SUPER_ADMIN_API}${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Error");
    return res.json();
  },
  patch: async (endpoint: string, data: any) => {
    const token = localStorage.getItem("super_admin_token");
    const res = await fetch(`${SUPER_ADMIN_API}${endpoint}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Error");
    return res.json();
  },
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", plan_type: "free" });

  const user = JSON.parse(localStorage.getItem("super_admin_user") || "{}");

  const { data: stats } = useQuery({
    queryKey: ["sa-stats"],
    queryFn: () => saApi.get("/super-admin/tenants/stats"),
  });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["sa-tenants"],
    queryFn: () => saApi.get("/super-admin/tenants"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => saApi.post("/super-admin/tenants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sa-tenants"] });
      toast.success("Tenant created successfully!");
      setCreateOpen(false);
      setForm({ name: "", slug: "", plan_type: "free" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      saApi.patch(`/super-admin/tenants/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sa-tenants"] });
      toast.success("Tenant status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleLogout = () => {
    localStorage.removeItem("super_admin_token");
    localStorage.removeItem("super_admin_user");
    navigate("/super-admin/login");
  };

  const filtered = tenants.filter((t: any) =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    active: "bg-success/10 text-success border-success/20",
    suspended: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    deleted: "bg-destructive/10 text-destructive border-destructive/20",
    pending: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  const planColor: Record<string, string> = {
    free: "bg-slate-100 text-slate-600",
    pro: "bg-primary/10 text-primary",
    enterprise: "bg-violet-500/10 text-violet-600",
  };

  const { data: supportRequests = [], isLoading: loadingSupport } = useQuery({
    queryKey: ["sa-support"],
    queryFn: () => saApi.get("/super-admin/support"),
  });

  const [activeTab, setActiveTab] = useState<"tenants" | "support">("tenants");

  const filteredSupport = supportRequests.filter((s: any) =>
    s.subject.toLowerCase().includes(search.toLowerCase()) || 
    s.tenant_name.toLowerCase().includes(search.toLowerCase())
  );

  const overviewStats = [
    { label: "Total Tenants", value: stats?.total_tenants ?? "–", icon: Building2, color: "text-primary", bg: "bg-primary/10" },
    { label: "Active Orgs", value: stats?.active_tenants ?? "–", icon: ShieldCheck, color: "text-success", bg: "bg-success/10" },
    { label: "Total Users", value: stats?.total_users ?? "–", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Ideas", value: stats?.total_ideas ?? "–", icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Nav */}
      <header className="border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-1.5 rounded-lg"><Logo imageClassName="h-6 w-6" /></div>
            <span className="font-black text-lg tracking-tight">IdeaForge</span>
            <div className="h-5 w-px bg-white/10 mx-1" />
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Super Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/50 font-medium">{user.name}</span>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/5 text-xs font-bold">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Platform <span className="text-primary">Control.</span></h1>
            <p className="text-white/40 mt-2 text-lg">Manage all tenants and platform health.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setActiveTab("support")} 
              className={`rounded-xl border-white/10 font-bold ${activeTab === 'support' ? 'bg-white/10' : ''}`}
            >
              <MessageSquare className="mr-2 h-4 w-4" /> Support {supportRequests.length > 0 && <Badge className="ml-2 bg-primary">{supportRequests.length}</Badge>}
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="rounded-xl bg-primary font-bold px-6 shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> New Tenant
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {overviewStats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white/5 backdrop-blur border border-white/5 p-6 rounded-2xl group hover:bg-white/8 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon className="h-5 w-5" /></div>
                <TrendingUp className="h-4 w-4 text-success opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-3xl font-black">{stat.value}</h3>
              <p className="text-xs text-white/30 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Content Area */}
        <Card className="bg-white/5 border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setActiveTab("tenants")}
                className={`text-lg font-black transition-colors ${activeTab === 'tenants' ? 'text-white' : 'text-white/30 hover:text-white/50'}`}
              >
                All Tenants
              </button>
              <button 
                onClick={() => setActiveTab("support")}
                className={`text-lg font-black transition-colors ${activeTab === 'support' ? 'text-white' : 'text-white/30 hover:text-white/50'}`}
              >
                Support Tickets
              </button>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-9 rounded-xl h-9 text-sm focus:border-primary/40"
              />
            </div>
          </div>

          {activeTab === 'tenants' ? (
            isLoading ? (
              <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-sm text-white/80">
                <thead>
                  <tr className="border-b border-white/5 text-white/30">
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Organization</th>
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Plan</th>
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Users</th>
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Ideas</th>
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Status</th>
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Created</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tenant: any) => (
                    <tr key={tenant.id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center font-black text-primary text-sm">
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{tenant.name}</p>
                            <p className="text-[11px] text-white/30">/{tenant.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${planColor[tenant.plan_type] || "bg-slate-100/10"}`}>
                          {tenant.plan_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">{tenant.user_count ?? 0}</td>
                      <td className="px-6 py-4 font-bold">{tenant.idea_count ?? 0}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`text-[10px] font-bold uppercase border ${statusColor[tenant.status]}`}>
                          {tenant.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-white/30 text-xs">{new Date(tenant.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white hover:bg-white/10">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-900 border-white/10 text-white" align="end">
                            <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                              <Link to={`/super-admin/tenants/${tenant.id}`}>
                                <ExternalLink className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            {tenant.status === 'pending' ? (
                              <DropdownMenuItem 
                                onClick={() => toggleStatus.mutate({ id: tenant.id, status: 'active' })}
                                className="hover:bg-white/10 cursor-pointer text-success"
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" /> Approve Tenant
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => toggleStatus.mutate({ id: tenant.id, status: tenant.status === 'active' ? 'suspended' : 'active' })}
                                className={`hover:bg-white/10 cursor-pointer ${tenant.status === 'active' ? 'text-amber-400' : 'text-success'}`}
                              >
                                <Power className="mr-2 h-4 w-4" />
                                {tenant.status === 'active' ? 'Suspend' : 'Activate'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-16 text-center text-white/20">No tenants found.</td></tr>
                  )}
                </tbody>
              </table>
            )
          ) : (
            loadingSupport ? (
              <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-sm text-white/80">
                <thead>
                  <tr className="border-b border-white/5 text-white/30">
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Subject</th>
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Tenant</th>
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest font-bold">User</th>
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Date</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredSupport.map((req: any) => (
                    <tr key={req.id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white max-w-md truncate">{req.subject}</p>
                        <p className="text-xs text-white/40 line-clamp-1">{req.message}</p>
                      </td>
                      <td className="px-6 py-4 font-bold">{req.tenant_name}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-xs">{req.user_name}</p>
                        <p className="text-[10px] text-white/30">{req.user_email}</p>
                      </td>
                      <td className="px-6 py-4 text-white/30 text-xs">{new Date(req.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                         <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 font-bold text-xs"
                           onClick={() => toast.info(`Message: ${req.message}`, { duration: 5000 })}>
                           Read More
                         </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredSupport.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-16 text-center text-white/20">No support tickets found.</td></tr>
                  )}
                </tbody>
              </table>
            )
          )}
        </Card>
      </main>

      {/* Create Tenant Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white font-black">
              <Building2 className="h-5 w-5 text-primary" /> New Tenant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs uppercase font-bold tracking-wider">Organization Name</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Acme Corp" className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs uppercase font-bold tracking-wider">URL Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') }))}
                placeholder="acme-corp" className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 rounded-xl" />
              <p className="text-[11px] text-white/30">Used for login: ideaforge.io/{form.slug || "..."}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs uppercase font-bold tracking-wider">Plan</Label>
              <select value={form.plan_type} onChange={(e) => setForm(f => ({ ...f, plan_type: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:border-primary/50 outline-none">
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-white/50 hover:text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name || !form.slug}
              className="bg-primary hover:bg-primary/90 font-bold rounded-xl">
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
