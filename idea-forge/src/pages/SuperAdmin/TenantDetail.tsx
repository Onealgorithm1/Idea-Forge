import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Building2, Users, Lightbulb, ArrowLeft, Plus, Mail, UserPlus, Info,
  ShieldCheck, Loader2, Key, TrendingUp, MessageSquare, ThumbsUp, Settings,
  MoreHorizontal, Power, Globe
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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

const TenantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
  const [newMaxUsers, setNewMaxUsers] = useState(10);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-detail", id],
    queryFn: () => saApi.get(`/super-admin/tenants/${id}/detail`),
  });

  const createAdminMutation = useMutation({
    mutationFn: (data: any) => saApi.post(`/super-admin/tenants/${id}/admins`, { ...data, tenantId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-detail", id] });
      toast.success("Admin created and email sent!");
      setAdminDialogOpen(false);
      setAdminForm({ name: "", email: "", password: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateLicenseMutation = useMutation({
    mutationFn: (max: number) => saApi.patch(`/super-admin/tenants/${id}/license`, { max_users: max }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-detail", id] });
      toast.success("License updated successfully");
      setLicenseDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleUserStatus = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      saApi.patch(`/super-admin/users/${userId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-detail", id] });
      toast.success("User status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const changeUserRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      saApi.patch(`/super-admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-detail", id] });
      toast.success("User role updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!tenant) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <h2 className="text-2xl font-bold mb-4">Tenant not found</h2>
      <Button onClick={() => navigate("/super-admin/dashboard")}>Back to Dashboard</Button>
    </div>
  );

  const usagePercent = Math.min(100, (tenant.users.length / (tenant.max_users || 10)) * 100);
  const isNearLimit = usagePercent >= 90;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <header className="border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/super-admin/dashboard" className="text-white/40 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-bold">{tenant.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/5 font-bold">
              <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" /> View Platform
              </a>
            </Button>
            <Badge className={tenant.status === 'active' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>
              {tenant.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Basic Info & Stats */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-black tracking-tight">Tenant <span className="text-primary">Overview.</span></h1>
              <Button onClick={() => setAdminDialogOpen(true)} className="rounded-xl bg-primary font-bold">
                <UserPlus className="mr-2 h-4 w-4" /> Add Admin
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-white/5 border-white/5 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Ideas</p>
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-3xl text-white font-bold">{tenant.stats?.total_ideas || 0}</p>
              </Card>
              <Card className="bg-white/5 border-white/5 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Comments</p>
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl text-white font-bold">{tenant.stats?.total_comments || 0}</p>
              </Card>
              <Card className="bg-white/5 border-white/5 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Votes</p>
                  <ThumbsUp className="h-4 w-4 text-success" />
                </div>
                <p className="text-3xl text-white font-black">{tenant.stats?.total_votes || 0}</p>
              </Card>
            </div>

            {/* User List */}
            <Card className="bg-white/5 border-white/5 overflow-hidden rounded-2xl">
              <div className="p-6 border-b border-white/5">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-white" /> Registered Users
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/30 border-b border-white/5">
                      <th className="text-left px-6 py-3 font-bold uppercase text-[10px] tracking-widest">User</th>
                      <th className="text-left px-6 py-3 font-bold uppercase text-[10px] tracking-widest">Role</th>
                      <th className="text-left px-6 py-3 font-bold uppercase text-[10px] tracking-widest">Status</th>
                      <th className="text-left px-6 py-3 font-bold uppercase text-[10px] tracking-widest">Joined</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {tenant.users.map((user: any) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/2 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{user.name}</p>
                          <p className="text-xs text-white/40">{user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold border-white/10 text-white">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-success' : 'bg-destructive'}`} />
                            <span className="capitalize text-white">{user.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white/30 text-xs">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-900 border-white/10 text-white" align="end">
                              <DropdownMenuItem 
                                onClick={() => toggleUserStatus.mutate({ userId: user.id, status: user.status === 'active' ? 'suspended' : 'active' })}
                                className={user.status === 'active' ? "text-amber-400" : "text-success"}
                              >
                                <Power className="mr-2 h-4 w-4" /> {user.status === 'active' ? 'Suspend' : 'Activate'} User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5" />
                              <DropdownMenuItem onClick={() => changeUserRole.mutate({ userId: user.id, role: 'admin' })}>
                                <ShieldCheck className="mr-2 h-4 w-4" /> Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changeUserRole.mutate({ userId: user.id, role: 'user' })}>
                                <Users className="mr-2 h-4 w-4" /> Make User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Right Column: Settings & License */}
          <div className="space-y-8">
            <h2 className="text-xl font-bold">Organization <span className="text-primary">License.</span></h2>
            
            <Card className="bg-white/5 border-white/5 p-6 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">User Limit</h3>
                  <p className="text-xs text-white/40 uppercase font-bold tracking-widest mt-1">License Count</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => {
                  setNewMaxUsers(tenant.max_users || 10);
                  setLicenseDialogOpen(true);
                }} className="text-white/40 hover:text-white hover:bg-white/10">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-black text-white">{tenant.users.length} <span className="text-white/20 text-xl font-medium">/ {tenant.max_users || 10}</span></span>
                  <span className={`text-xs font-bold ${isNearLimit ? 'text-red-400' : 'text-success'}`}>
                    {Math.round(usagePercent)}% Used
                  </span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${usagePercent}%` }}
                    className={`h-full ${isNearLimit ? 'bg-red-500' : 'bg-primary'}`} 
                  />
                </div>
                {isNearLimit && (
                  <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <p className="text-[11px] font-bold leading-tight">Nearly out of user slots. Limit: {tenant.max_users}.</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="bg-white/5 border-white/5 p-6 rounded-2xl">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-white">
                <Mail className="h-4 w-4 text-white" /> Tenant Info
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Slug</span>
                  <span className="font-mono text-xs text-white">/{tenant.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Created</span>
                  <span className="text-white">{new Date(tenant.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Plan</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20 text-primary">
                    {tenant.plan_type}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Admin Dialog */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Create Tenant Admin
            </DialogTitle>
            <DialogDescription className="text-white/40">
              An email with login credentials will be sent to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={adminForm.name} 
                onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Doe" 
                className="bg-white/5 border-white/10 text-white" 
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                type="email"
                value={adminForm.email} 
                onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))}
                placeholder="john@organization.com" 
                className="bg-white/5 border-white/10 text-white" 
              />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <div className="flex gap-2">
                <Input 
                  type="text"
                  value={adminForm.password} 
                  onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white" 
                />
                <Button variant="secondary" onClick={() => setAdminForm(f => ({ ...f, password: Math.random().toString(36).slice(-8) }))}>
                  Auto
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdminDialogOpen(false)} className="text-white/40">Cancel</Button>
            <Button 
              onClick={() => createAdminMutation.mutate(adminForm)} 
              disabled={createAdminMutation.isPending || !adminForm.name || !adminForm.email || !adminForm.password}
              className="bg-primary hover:bg-primary/90 font-bold"
            >
              {createAdminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create & Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Dialog */}
      <Dialog open={licenseDialogOpen} onOpenChange={setLicenseDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Update User License</DialogTitle>
            <DialogDescription className="text-white/40">
              Set the maximum number of users this organization can have.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="space-y-3">
              <Label>Maximum User Count</Label>
              <Input 
                type="number" 
                value={newMaxUsers} 
                onChange={e => setNewMaxUsers(parseInt(e.target.value))}
                className="bg-white/5 border-white/10 text-white text-lg h-12"
              />
              <p className="text-xs text-white/30 italic">Currently used: {tenant.users.length}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLicenseDialogOpen(false)} className="text-white/40">Cancel</Button>
            <Button 
              onClick={() => updateLicenseMutation.mutate(newMaxUsers)} 
              disabled={updateLicenseMutation.isPending || newMaxUsers < tenant.users.length}
              className="bg-primary hover:bg-primary/90 font-bold"
            >
              {updateLicenseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantDetail;
