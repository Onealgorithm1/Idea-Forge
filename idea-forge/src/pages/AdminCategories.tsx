import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Plus, Loader2, Tag, User, Search, Hash, Archive, RotateCcw, ChevronRight, FolderTree, Clock, Trash2 } from "lucide-react";
import { getInitials, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const AdminCategories = () => {
  const { token, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToArchive, setCategoryToArchive] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "", 
    manager_id: "none",
    parent_id: "none",
    color: ""
  });

  const CATEGORY_COLORS = [
    { value: "", label: "None", bg: "bg-muted", hex: "" },
    { value: "#6366f1", label: "Indigo", bg: "bg-indigo-500", hex: "#6366f1" },
    { value: "#8b5cf6", label: "Violet", bg: "bg-violet-500", hex: "#8b5cf6" },
    { value: "#ec4899", label: "Pink", bg: "bg-pink-500", hex: "#ec4899" },
    { value: "#f97316", label: "Orange", bg: "bg-orange-500", hex: "#f97316" },
    { value: "#eab308", label: "Yellow", bg: "bg-yellow-500", hex: "#eab308" },
    { value: "#22c55e", label: "Green", bg: "bg-green-500", hex: "#22c55e" },
    { value: "#14b8a6", label: "Teal", bg: "bg-teal-500", hex: "#14b8a6" },
    { value: "#3b82f6", label: "Blue", bg: "bg-blue-500", hex: "#3b82f6" },
    { value: "#ef4444", label: "Red", bg: "bg-red-500", hex: "#ef4444" },
    { value: "#64748b", label: "Slate", bg: "bg-slate-500", hex: "#64748b" },
  ];

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/admin/categories", token!),
    enabled: !!token,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: () => api.get("/admin/users", token!),
    enabled: !!token && (isCreateDialogOpen || isEditDialogOpen),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => api.post("/admin/categories", {
      ...data,
      manager_id: data.manager_id === "none" ? null : data.manager_id,
      parent_id: data.parent_id === "none" ? null : data.parent_id
    }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create category");
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.put(`/admin/categories/${id}`, {
        ...data,
        manager_id: data.manager_id === "none" ? null : data.manager_id,
        parent_id: data.parent_id === "none" ? null : data.parent_id
      }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category updated successfully");
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update category");
    }
  });

  const archiveCategoryMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/categories/${id}/archive`, {}, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category archived successfully");
      setCategoryToArchive(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to archive category");
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/categories/${id}`, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category deleted permanently");
      setCategoryToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete category");
    }
  });

  const restoreCategoryMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/categories/${id}`, { is_active: true }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category restored successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to restore category");
    }
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", manager_id: "none", parent_id: "none", color: "" });
  };

  const handleEdit = (cat: any) => {
    setSelectedCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || "",
      manager_id: cat.manager_id || "none",
      parent_id: cat.parent_id || "none",
      color: cat.color || ""
    });
    setIsEditDialogOpen(true);
  };

  const filteredCategories = categories.filter((cat: any) => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCategories = filteredCategories.filter((cat: any) => cat.is_active);
  const inactiveCategories = filteredCategories.filter((cat: any) => !cat.is_active);

  const CategoryCard = ({ category, idx, isInactive = false }: { category: any, idx: number, isInactive?: boolean }) => {
    const isTenantAdmin = currentUser?.role === 'tenant_admin' || currentUser?.role === 'super_admin';
    const managesThis = category.manager_id === currentUser?.id;
    // Check if user manages the parent of this category
    const parentCategory = categories.find((c: any) => c.id === category.parent_id);
    const managesParent = parentCategory?.manager_id === currentUser?.id;
    
    const canEdit = isTenantAdmin || managesThis || managesParent;

    return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: idx * 0.05 }}
      key={category.id}
    >
      <Card className={cn(
        "group relative overflow-hidden border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] bg-card p-6 flex flex-col h-full ring-1 ring-border/50 hover:ring-primary/20",
        isInactive && "opacity-80 grayscale-[0.5]"
      )}>
        {/* Background subtle pattern */}
        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rotate-12">
          {isInactive ? <Archive size={120} /> : <Tag size={120} />}
        </div>

        <div className="relative flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {category.color && (
                    <span className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/20" style={{ background: category.color }} />
                  )}
                  {category.name}
                  {category.is_default && (
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border-none">
                      Default
                    </Badge>
                  )}
                </div>
                {category.parent_name && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                    <FolderTree className="h-3 w-3" />
                    {category.parent_name} <ChevronRight className="h-2 w-2" /> Sub-category
                  </div>
                )}
              </h3>
              {category.slug && (
                <code className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter bg-muted/50 px-1.5 py-0.5 rounded-md">
                  #{category.slug}
                </code>
              )}
            </div>
          </div>

          <p className="text-muted-foreground text-sm font-medium line-clamp-3 leading-relaxed">
            {category.description || "No description provided."}
          </p>

          <div className="pt-4 mt-auto border-t border-border/50 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-accent/50 rounded-lg">
                <User className="h-3.5 w-3.5 text-accent-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                  Manager
                </span>
                <span className="text-sm font-bold text-foreground">
                  {category.manager_name || "Unassigned"}
                </span>
              </div>
            </div>

            {category.ideas_count === 0 && !isInactive && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest leading-none mb-1">
                    Auto-Archive
                  </span>
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    {Math.max(0, 30 - Math.floor((Date.now() - new Date(category.created_at).getTime()) / (1000 * 60 * 60 * 24)))} days remaining
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Overlay */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          {!isInactive ? (
            <>
              <Button 
                variant="secondary"
                size="sm"
                className="flex-1 rounded-xl h-9 font-bold bg-accent/50 hover:bg-accent text-accent-foreground border-none disabled:opacity-50 min-w-[80px]"
                onClick={() => handleEdit(category)}
                disabled={!canEdit}
              >
                <Edit2 className="h-3 w-3 mr-2" />
                Edit
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                className="rounded-xl h-9 px-3 text-muted-foreground hover:text-amber-600 hover:bg-amber-100 disabled:opacity-30 font-bold"
                onClick={() => setCategoryToArchive(category.id)}
                disabled={!canEdit}
              >
                <Archive className="h-4 w-4 mr-2" /> Archive
              </Button>
              {isTenantAdmin && category.ideas_count === 0 && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="rounded-xl h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 font-bold"
                  onClick={() => setCategoryToDelete(category.id)}
                  disabled={!canEdit}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              )}
            </>
          ) : (
            <Button 
              variant="secondary"
              size="sm"
              className="flex-1 rounded-xl h-9 font-bold bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-sm"
              onClick={() => restoreCategoryMutation.mutate(category.id)}
              disabled={restoreCategoryMutation.isPending}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-2" />
              Restore Category
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
    );
  };

  return (
    <>
      
      <div className="flex flex-1 overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
        
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 pb-32">
          <div className="max-w-7xl mx-auto space-y-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight text-foreground">Categories</h2>
                <p className="text-muted-foreground font-medium">
                  Manage idea categories and assign owners/managers.
                </p>
              </div>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                disabled={currentUser?.role === 'admin' && !categories.some((c: any) => c.manager_id === currentUser?.id)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 h-11 px-6 disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                Add Category
              </Button>
            </div>

            {/* Filter section */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                type="text"
                placeholder="Search categories by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 bg-card border-none shadow-sm rounded-2xl focus-visible:ring-primary/20 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 transition-all font-medium"
              />
            </div>

            {/* Categories Grid */}
            <Tabs defaultValue="active" className="space-y-6">
              <TabsList className="bg-card w-full justify-start h-12 p-1 rounded-2xl shadow-sm border-none">
                <TabsTrigger value="active" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                   Active Categories ({activeCategories.length})
                </TabsTrigger>
                <TabsTrigger value="inactive" className="rounded-xl px-6 font-bold data-[state=active]:bg-muted-foreground data-[state=active]:text-white">
                   Inactive ({inactiveCategories.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {isLoading ? (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-muted-foreground font-bold animate-pulse">Loading categories...</p>
                      </div>
                    ) : activeCategories.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 bg-card/30 rounded-[2rem] border-2 border-dashed border-border"
                      >
                        <div className="p-4 bg-muted rounded-full">
                          <Tag className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-foreground">No active categories</p>
                          <p className="text-muted-foreground italic mt-1">
                            {searchQuery ? "Try a different search term" : "Get started by creating your first category"}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      activeCategories.map((category: any, idx: number) => (
                        <CategoryCard key={category.id} category={category} idx={idx} />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </TabsContent>

              <TabsContent value="inactive">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {inactiveCategories.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 bg-card/30 rounded-[2rem] border-2 border-dashed border-border"
                      >
                        <div className="p-4 bg-muted rounded-full">
                          <Archive className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-foreground">Archive is empty</p>
                          <p className="text-muted-foreground italic mt-1">
                            Deactivated categories will appear here.
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      inactiveCategories.map((category: any, idx: number) => (
                        <CategoryCard key={category.id} category={category} idx={idx} isInactive />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black text-foreground">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              Add Category
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Create a new category for ideas in your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category Name</Label>
              <Input
                placeholder="e.g. User Experience"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
              <Textarea
                placeholder="What kind of ideas belong here?"
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                className="resize-none h-24 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Owner / Manager</Label>
              <Select 
                value={formData.manager_id} 
                onValueChange={(val) => setFormData(f => ({ ...f, manager_id: val }))}
              >
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20">
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="none" className="font-medium text-muted-foreground">None (Unassigned)</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id} className="font-bold">
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Parent Category (Optional)</Label>
              <Select 
                value={formData.parent_id} 
                onValueChange={(val) => setFormData(f => ({ ...f, parent_id: val }))}
              >
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20">
                  <SelectValue placeholder="Select a parent" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  {currentUser?.role !== 'admin' && (
                    <SelectItem value="none" className="font-medium text-muted-foreground">None (Top-level)</SelectItem>
                  )}
                  {activeCategories
                    .filter((c: any) => currentUser?.role !== 'admin' || c.manager_id === currentUser?.id)
                    .map((c: any) => (
                      <SelectItem key={c.id} value={c.id} className="font-bold">
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {['tenant_admin', 'super_admin'].includes(currentUser?.role || '') && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category Color</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => setFormData(f => ({ ...f, color: c.value }))}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all relative flex items-center justify-center",
                        formData.color === c.value 
                          ? "border-foreground ring-2 ring-primary ring-offset-2 scale-110 shadow-lg z-10" 
                          : "border-transparent hover:scale-110 opacity-70 hover:opacity-100",
                        !c.value && "border-border bg-muted/50"
                      )}
                      style={c.value ? { background: c.value } : {}}
                    >
                      {formData.color === c.value && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm animate-in zoom-in duration-300" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="rounded-xl font-bold text-muted-foreground">
              Cancel
            </Button>
            <Button 
              onClick={() => createCategoryMutation.mutate(formData)} 
              disabled={createCategoryMutation.isPending}
              className="bg-primary hover:bg-primary/90 font-bold rounded-xl shadow-lg shadow-primary/20 px-6"
            >
              {createCategoryMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black text-foreground">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Edit2 className="h-6 w-6 text-primary" />
              </div>
              Edit Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category Name</Label>
              <Input
                placeholder="e.g. User Experience"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
              <Textarea
                placeholder="What kind of ideas belong here?"
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                className="resize-none h-24 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Owner / Manager</Label>
              <Select 
                value={formData.manager_id} 
                onValueChange={(val) => setFormData(f => ({ ...f, manager_id: val }))}
              >
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20">
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="none" className="font-medium text-muted-foreground">None (Unassigned)</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id} className="font-bold">
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Parent Category (Optional)</Label>
              <Select 
                value={formData.parent_id} 
                onValueChange={(val) => setFormData(f => ({ ...f, parent_id: val }))}
              >
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20">
                  <SelectValue placeholder="Select a parent" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  {currentUser?.role !== 'admin' && (
                    <SelectItem value="none" className="font-medium text-muted-foreground">None (Top-level)</SelectItem>
                  )}
                  {activeCategories
                    .filter((c: any) => c.id !== selectedCategory?.id)
                    .filter((c: any) => currentUser?.role !== 'admin' || c.manager_id === currentUser?.id)
                    .map((c: any) => (
                      <SelectItem key={c.id} value={c.id} className="font-bold">
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {['tenant_admin', 'super_admin'].includes(currentUser?.role || '') && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category Color</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => setFormData(f => ({ ...f, color: c.value }))}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all relative flex items-center justify-center",
                        formData.color === c.value 
                          ? "border-foreground ring-2 ring-primary ring-offset-2 scale-110 shadow-lg z-10" 
                          : "border-transparent hover:scale-110 opacity-70 hover:opacity-100",
                        !c.value && "border-border bg-muted/50"
                      )}
                      style={c.value ? { background: c.value } : {}}
                    >
                      {formData.color === c.value && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm animate-in zoom-in duration-300" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl font-bold text-muted-foreground">
              Cancel
            </Button>
            <Button 
              onClick={() => updateCategoryMutation.mutate({ id: selectedCategory.id, data: formData })} 
              disabled={updateCategoryMutation.isPending}
              className="bg-primary hover:bg-primary/90 font-bold rounded-xl shadow-lg shadow-primary/20 px-6"
            >
              {updateCategoryMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={!!categoryToArchive}
        onClose={() => setCategoryToArchive(null)}
        onConfirm={() => categoryToArchive && archiveCategoryMutation.mutate(categoryToArchive)}
        title="Archive Category?"
        message="This category will be moved to the Inactive list. Ideas attached to it will remain active in the system, but this category will no longer be available for new ideas."
        type="warning"
        confirmText="Yes, archive"
      />

      <ConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => categoryToDelete && deleteCategoryMutation.mutate(categoryToDelete)}
        title="Permanently Delete Category?"
        message="Are you sure you want to completely delete this category? This action cannot be undone."
        type="danger"
        confirmText="Yes, delete permanently"
      />
    </>
  );
};

export default AdminCategories;
