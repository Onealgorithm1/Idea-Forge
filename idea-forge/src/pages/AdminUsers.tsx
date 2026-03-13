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
import { Trash2, Shield, User, Loader2, Key, Lock } from "lucide-react";
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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/admin/users", token!),
    enabled: !!token,
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
      <div className="flex flex-1 overflow-hidden relative z-10">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <div className="mb-10 flex justify-between items-center animate-fade-in-up">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">User Management</h1>
                <p className="text-muted-foreground mt-3 text-lg">Manage system users, roles, and permissions.</p>
              </div>
            </div>

            <Card className="border-none shadow-premium bg-white/60 backdrop-blur-md overflow-hidden animate-fade-in-up md:animate-delay-100">
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
          </div>
        </main>
      </div>

       <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Lock className="h-5 w-5 text-primary" />
               Reset Password
             </DialogTitle>
             <DialogDescription>
               Enter a new password for <strong>{selectedUser?.name}</strong>.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="password">New Password</Label>
               <Input
                 id="password"
                 type="password"
                 placeholder="Enter securely generated password"
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
                 className="col-span-3"
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
               Cancel
             </Button>
             <Button 
               onClick={handleUpdatePassword} 
               disabled={updatePasswordMutation.isPending}
             >
               {updatePasswordMutation.isPending && (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               )}
               Update Password
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 };

export default AdminUsers;
