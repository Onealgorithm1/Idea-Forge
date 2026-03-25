import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";
import { Trash2, Shield, User, Loader2, Key, Lock, UserPlus, Plus, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminUsers = () => {
  const { token, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/admin/users", token!),
    enabled: !!token,
  });

  const createUserMutation = useMutation({
    mutationFn: (data: typeof createForm) => api.post("/admin/users", data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User created successfully and invitation sent!");
      setIsCreateDialogOpen(false);
      setCreateForm({ name: "", email: "", password: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create user");
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => 
      api.patch(`/admin/users/${id}/role`, { role }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User role updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update role");
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => 
      api.patch(`/admin/users/${id}/password`, { password }, token!),
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedUser(null);
      toast.success("User password updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update password");
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete user");
    }
  });

  const handleOpenPasswordDialog = (user: any) => {
    setSelectedUser(user);
    setNewPassword("");
    setIsPasswordDialogOpen(true);
  };

  const handleUpdatePassword = () => {
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }
    updatePasswordMutation.mutate({ id: selectedUser.id, password: newPassword });
  };

  const handleToggleRole = (user: any) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    updateRoleMutation.mutate({ id: user.id, role: newRole });
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-info/10 blur-[100px]" />
        <div className="absolute top-[40%] left-[60%] w-[25%] h-[25%] rounded-full bg-success/5 blur-[80px]" />
      </div>

      <Header />
      <div className="flex flex-1 overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">User <span className="text-primary">Management.</span></h1>
                <p className="text-slate-500 mt-3 text-lg font-medium">Manage organization members, roles, and access control.</p>
              </div>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)} 
                className="rounded-2xl h-12 px-6 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <UserPlus className="mr-2 h-5 w-5" /> Add New Member
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-none shadow-premium bg-white/70 backdrop-blur-md overflow-hidden rounded-[2rem]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          <p className="text-muted-foreground mt-2">Loading users...</p>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((u: any) => (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={u.avatar_url} />
                                <AvatarFallback className="bg-primary/5 text-primary">
                                  {getInitials(u.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm">{u.name}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge 
                              variant={u.role === 'admin' ? 'default' : 'secondary'}
                              className="text-[10px] font-bold uppercase tracking-wider"
                            >
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {format(new Date(u.created_at), "MMM d, yyyy")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-muted-foreground hover:text-primary"
                                 onClick={() => handleOpenPasswordDialog(u)}
                                 title="Change Password"
                               >
                                 <Key className="h-4 w-4" />
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-muted-foreground hover:text-primary"
                                 onClick={() => handleToggleRole(u)}
                                 disabled={u.id === currentUser?.id}
                                 title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                               >
                                 <Shield className={`h-4 w-4 ${u.role === 'admin' ? 'fill-current' : ''}`} />
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                 onClick={() => handleDeleteUser(u.id)}
                                 disabled={u.id === currentUser?.id}
                                 title="Delete User"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </div>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             </Card>
            </motion.div>
           </div>
         </main>
       </div>

       <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
         <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl bg-white/95 backdrop-blur-xl">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2 text-2xl font-black">
               <Lock className="h-6 w-6 text-primary" />
               Reset Password
             </DialogTitle>
             <DialogDescription className="text-slate-500 font-medium">
               Enter a new password for <strong>{selectedUser?.name}</strong>.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-400">New Password</Label>
               <div className="relative">
                 <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                 <Input
                   id="password"
                   type="password"
                   placeholder="Enter new password"
                   value={newPassword}
                   onChange={(e) => setNewPassword(e.target.value)}
                   className="pl-10 h-10 rounded-xl"
                 />
               </div>
             </div>
           </div>
           <DialogFooter className="gap-2 sm:gap-0">
             <Button variant="ghost" onClick={() => setIsPasswordDialogOpen(false)} className="rounded-xl font-bold text-slate-500">
               Cancel
             </Button>
             <Button 
               onClick={handleUpdatePassword} 
               disabled={updatePasswordMutation.isPending}
               className="bg-primary hover:bg-primary/90 font-bold rounded-xl shadow-lg shadow-primary/20 px-6"
             >
               {updatePasswordMutation.isPending && (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               )}
               Update Password
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl bg-white/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black">
              <UserPlus className="h-6 w-6 text-primary" />
              Add Member
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Invite a new member to your organization. They will receive an email with their credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name" className="text-xs font-bold uppercase tracking-widest text-slate-400">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="create-name"
                  placeholder="John Doe"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email" className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="create-email"
                  type="email"
                  placeholder="john@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password" className="text-xs font-bold uppercase tracking-widest text-slate-400">Temporary Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="create-password"
                    type="text"
                    placeholder="Generates securely..."
                    value={createForm.password}
                    onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    className="pl-10 h-10 rounded-xl"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl border-slate-200"
                  onClick={() => setCreateForm(f => ({ ...f, password: Math.random().toString(36).slice(-10) }))}
                  title="Generate Password"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="rounded-xl font-bold text-slate-500">
              Cancel
            </Button>
            <Button 
              onClick={() => createUserMutation.mutate(createForm)} 
              disabled={createUserMutation.isPending || !createForm.name || !createForm.email || !createForm.password}
              className="bg-primary hover:bg-primary/90 font-bold rounded-xl shadow-lg shadow-primary/20 px-6"
            >
              {createUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create & Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
