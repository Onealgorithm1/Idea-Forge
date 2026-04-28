import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import SimilarIdeasPanel from "@/components/SimilarIdeasPanel";
import { ROUTES, getTenantPath } from "@/lib/constants";
import {
  Bold, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, Link2, ImageIcon, Type, Loader2,
  Sparkles, X, FileText, Upload, Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "./ui/card";

// ─── Toolbar ─────────────────────────────────────────────────────────────────

const TOOLBAR_BUTTONS = [
  [Bold, Strikethrough],
  [List, ListOrdered, AlignLeft, AlignCenter],
  [Link2, ImageIcon],
  [Type],
] as const;

function RichTextToolbar() {
  return (
    <div className="flex items-center gap-1 p-3 border-b border-border/50 flex-wrap">
      {TOOLBAR_BUTTONS.map((group, gi) => (
        <span key={gi} className="contents">
          {gi > 0 && <div className="w-px h-4 bg-border mx-1" />}
          {group.map((Icon, ii) => (
            <Button
              key={ii}
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground bg-transparent hover:bg-muted/60 rounded-lg transition-all"
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </span>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SubmitIdeaForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [searchParams] = useSearchParams();
  const initialTitle = searchParams.get("title") || "";

  const [title, setTitle] = useState(initialTitle);
  const [debouncedTitle, setDebouncedTitle] = useState(initialTitle);
  const [category, setCategory] = useState<string>("");
  const [ideaSpace, setIdeaSpace] = useState<string>("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [attachments, setAttachments] = useState<Array<{ fileName: string; fileUrl: string; storedUrl: string; mimeType: string; fileSize: number }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { token, user } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const currentSlug = tenant?.slug || tenantSlug || "default";

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", tenantSlug, user?.id],
    queryFn: () => api.get("/ideas/categories"),
  });

  const { data: ideaSpaces = [] } = useQuery({
    queryKey: ["idea-spaces", tenantSlug, user?.id],
    queryFn: () => api.get("/ideas/spaces"),
  });

  // Debounce title → FTS search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTitle(title), 600);
    return () => clearTimeout(timer);
  }, [title]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = "Title is required";
    else if (title.trim().length < 5) newErrors.title = "Title must be at least 5 characters";
    if (!category) newErrors.category = "Please select a category";
    if (!ideaSpace) newErrors.ideaSpace = "Please select an idea space";
    if (!description.trim()) newErrors.description = "Description is required";
    else if (description.trim().length < 20) newErrors.description = "Description must be at least 20 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);

    const storedTenantId = localStorage.getItem('tenantId');
    if (user && storedTenantId && user.tenantId !== storedTenantId) {
      toast.error("Organization mismatch! Please log out and log back in.");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/ideas", {
        title,
        description,
        category_id: category,
        idea_space_id: ideaSpace,
        tags: tags.split(',').map(t => t.trim()).filter(t => t !== ""),
        attachments: attachments.length > 0 ? attachments.map(a => ({
          fileName: a.fileName,
          fileUrl: a.storedUrl || a.fileUrl,
          mimeType: a.mimeType,
          fileSize: a.fileSize,
        })) : undefined,
      }, token || undefined);

      toast.success("Idea posted successfully!");
      setTitle(""); setDescription(""); setTags(""); setAttachments([]); setErrors({});

      // Invalidate relevant queries to refresh the board immediately

      queryClient.invalidateQueries({ queryKey: ["ideas", currentSlug] });
      queryClient.invalidateQueries({ queryKey: ["recent-ideas", currentSlug] });
      queryClient.invalidateQueries({ queryKey: ["analytics", currentSlug] });

      // Also invalidate without slug just in case of inconsistency
      queryClient.invalidateQueries({ queryKey: ["ideas"] });

      if (onSuccess) {
        onSuccess();
      } else {
        const boardPath = getTenantPath(ROUTES.IDEA_BOARD, currentSlug);
        // If an idea space was selected, redirect back to that space specifically
        const redirectPath = ideaSpace
          ? `${boardPath}?space=${ideaSpace}`
          : boardPath;
        navigate(redirectPath);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to post idea");
      if (error.message?.toLowerCase().includes("category")) {
        setErrors(prev => ({ ...prev, category: error.message }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const newAttachments = [...attachments];
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.upload('/upload/single', formData, token || undefined);
        newAttachments.push({
          fileName: response.file.originalName,
          fileUrl: response.file.url,
          storedUrl: response.file.storedUrl,
          mimeType: response.file.mimetype,
          fileSize: response.file.size,
        });
      } catch (error: any) {
        toast.error(`Failed to upload "${file.name}"`);
      }
    }
    setAttachments(newAttachments);
    setIsUploading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto"
    >
      {/* Page Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">New Initiative</h1>
          <p className="text-sm text-muted-foreground font-medium">Share your innovation with the workspace</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── Left: Main content ── */}
          <div className="space-y-5">

            {/* Title */}
            <div className={cn(
              "idea-card p-7 space-y-4 transition-all",
              errors.title && "ring-2 ring-destructive/30"
            )}>
              <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Initiative Title
              </Label>
              <textarea
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
                }}
                placeholder="Give your idea a powerful, clear name..."
                className={cn(
                  "w-full bg-transparent border-none text-3xl md:text-4xl font-black tracking-tight leading-tight placeholder:text-muted-foreground/20 focus:ring-0 resize-none no-scrollbar",
                  errors.title ? "text-destructive" : "text-foreground"
                )}
                rows={2}
              />
              {errors.title && (
                <p className="text-xs text-destructive font-bold">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className={cn(
              "idea-card overflow-hidden transition-all",
              errors.description && "ring-2 ring-destructive/30"
            )}>
              <RichTextToolbar />
              <div className="p-7 pt-6 space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground block">
                  Vision & Detail
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
                  }}
                  placeholder="Describe the problem, the solution, and the impact. What makes this a winning idea?"
                  className="w-full bg-transparent border-none text-base font-medium text-foreground leading-relaxed placeholder:text-muted-foreground/30 focus-visible:ring-0 resize-none min-h-[300px] p-0"
                />
                {errors.description && (
                  <p className="text-xs text-destructive font-bold">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="idea-card p-7 space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground block">
                Keywords / Tags
              </Label>
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. automation, cloud, growth"
                  className="border-none bg-transparent p-0 h-auto text-base font-medium text-foreground focus-visible:ring-0 placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

          </div>

          {/* ── Right: Sidebar ── */}
          <div className="space-y-4">

            {/* Initiator */}
            <div className="idea-card p-5">
              <div className="flex items-center gap-3.5">
                <Avatar className="h-11 w-11 rounded-xl border border-border/60">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'U'}`} />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-black text-sm">
                    {getInitials(user?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-black text-foreground text-sm leading-tight">{user?.name || 'You'}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Initiator</p>
                </div>
              </div>
            </div>

            {/* Category & Space */}
            <div className="idea-card p-5 space-y-5">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Category</Label>
                <Select value={category} onValueChange={(v) => { setCategory(v); setErrors(p => ({ ...p, category: "" })); }}>
                  <SelectTrigger className={cn(
                    "h-11 bg-muted/40 border-border/60 rounded-xl font-semibold text-sm",
                    errors.category && "border-destructive/50 ring-1 ring-destructive/30"
                  )}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60">
                    {(categories as any[]).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="rounded-lg py-2.5 font-semibold cursor-pointer">{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-destructive font-bold">{errors.category}</p>}
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Idea Space</Label>
                <Select value={ideaSpace} onValueChange={(v) => { setIdeaSpace(v); setErrors(p => ({ ...p, ideaSpace: "" })); }}>
                  <SelectTrigger className={cn(
                    "h-11 bg-muted/40 border-border/60 rounded-xl font-semibold text-sm",
                    errors.ideaSpace && "border-destructive/50 ring-1 ring-destructive/30"
                  )}>
                    <SelectValue placeholder="Select a space" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60">
                    {(ideaSpaces as any[]).map((sp) => (
                      <SelectItem key={sp.id} value={sp.id} className="rounded-lg py-2.5 font-semibold cursor-pointer">{sp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.ideaSpace && <p className="text-xs text-destructive font-bold">{errors.ideaSpace}</p>}
              </div>
            </div>

            {/* Attachments */}
            <div className="idea-card p-5 space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground block">Supporting Files</Label>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full h-11 border-dashed border-border/60 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all rounded-xl font-bold text-[11px] uppercase tracking-widest gap-2"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {attachments.length === 0 ? 'Attach Files' : `${attachments.length} File${attachments.length > 1 ? 's' : ''} Attached`}
              </Button>

              {attachments.length > 0 && (
                <div className="space-y-2 pt-1">
                  {attachments.map((file, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-muted/40 border border-border/40 group">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-xs font-semibold truncate text-foreground">{file.fileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground/50 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Similar Ideas */}
            <SimilarIdeasPanel query={debouncedTitle} />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] gap-2.5 py-4"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Publish Initiative
                </>
              )}
            </Button>

          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default SubmitIdeaForm;
