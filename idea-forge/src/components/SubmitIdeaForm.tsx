import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SimilarIdeasPanel from "@/components/SimilarIdeasPanel";
import { ROUTES, getTenantPath } from "@/lib/constants";
import {
  Bold, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, Link2, ImageIcon, Type, Loader2,
  Sparkles, CheckCircle2, ChevronRight, Paperclip, X, FileText, Upload
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

// ─── Sub-components ────────────────────────────────────────────────────────

const TOOLBAR_BUTTONS = [
  [Bold, Strikethrough],
  [List, ListOrdered, AlignLeft, AlignCenter],
  [Link2, ImageIcon],
  [Type],
] as const;

function RichTextToolbar() {
  return (
    <div className="flex items-center gap-1 p-1.5 border-b border-slate-100 bg-slate-50/30 flex-wrap">
      {TOOLBAR_BUTTONS.map((group, gi) => (
        <span key={gi} className="contents">
          {gi > 0 && <div className="w-px h-3.5 bg-slate-200 mx-1" />}
          {group.map((Icon, ii) => (
            <Button
              key={ii}
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-700 bg-transparent hover:bg-slate-100 rounded-md transition-all"
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </span>
      ))}
    </div>
  );
}

interface CharacterCountProps {
  value: string;
  max: number;
}

function CharacterCount({ value, max }: CharacterCountProps) {
  return (
    <div className="text-right text-[11px] font-medium text-slate-400 mt-1">
      {value.length}/{max}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const SubmitIdeaForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [title, setTitle] = useState("");
  const [debouncedTitle, setDebouncedTitle] = useState("");
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

  // Use tenant context slug if available, fallback to param
  const currentSlug = tenant?.slug || tenantSlug || "default";

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories", tenantSlug, user?.id],
    queryFn: () => api.get("/ideas/categories"),
  });

  const { data: ideaSpaces = [], isLoading: isSpacesLoading } = useQuery({
    queryKey: ["idea-spaces", tenantSlug, user?.id],
    queryFn: () => api.get("/ideas/spaces"),
  });

  // Set default values when data is loaded
  useEffect(() => {
    if (categories.length > 0 && !category) setCategory(categories[0].id);
  }, [categories, category]);

  useEffect(() => {
    if (ideaSpaces.length > 0 && !ideaSpace) setIdeaSpace(ideaSpaces[0].id);
  }, [ideaSpaces, ideaSpace]);

  // Debounce title → FTS search (600ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTitle(title);
    }, 600);
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
    // Final safety check: Ensure user's session matches the tenant they are in
    const storedTenantId = localStorage.getItem('tenantId');
    if (user && storedTenantId && user.tenantId !== storedTenantId) {
      toast.error("Organization mismatch! Please log out and log back in to the correct organization.");
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
          fileUrl: a.storedUrl || a.fileUrl,  // Use storedUrl for database, fallback to fileUrl
          mimeType: a.mimeType, 
          fileSize: a.fileSize 
        })) : undefined
      }, token || undefined);

      toast.success("Idea posted successfully!");
      setTitle("");
      setDescription("");
      setTags("");
      setAttachments([]);
      setErrors({});

      // Invalidate relevant queries to refresh the board immediately
      // Broadly invalidate all ideas for this tenant to ensure UI sync
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Left Side: Main Form */}
        <Card className="border border-border/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] rounded-2xl bg-card overflow-hidden relative">
          {/* Blue-to-Green gradient top border */}
          <div
            className="absolute top-0 left-0 right-0 h-[4px] z-10"
            style={{
              background: "linear-gradient(to right, #818cf8, #34d399)",
            }}
          />

          <div className="p-8 sm:p-10 pt-10">
            <div className="mb-8 space-y-4">
              <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-500 text-[11px] font-bold px-3 py-1 rounded-full border border-indigo-100">
                <Sparkles className="h-3 w-3" />
                New Initiative
              </span>

              <h1 className="text-[28px] font-black tracking-tight text-slate-900 leading-tight">
                Share Your Idea
              </h1>
              <p className="text-[14px] text-slate-500 leading-relaxed max-w-xl">
                Describe your concept, its potential impact, and how it aligns with our broader organizational goals. Great ideas spark from simple observations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col space-y-7">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-[13px] font-bold text-slate-700">
                  Title <span className="text-rose-400 font-normal">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
                  }}
                  placeholder="e.g. Implement a unified design system"
                  className={`h-11 shadow-sm border-slate-200 text-[14px] bg-slate-50/50 rounded-xl transition-all ${errors.title ? 'border-rose-300 focus-visible:border-rose-400 focus-visible:ring-rose-100' : 'focus-visible:border-indigo-400 focus-visible:ring-indigo-100'}`}
                  maxLength={80}
                />
                <div className="flex items-center justify-between">
                  {errors.title ? (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.title}</p>
                  ) : <span />}
                  <CharacterCount value={title} max={80} />
                </div>
              </div>

              {/* Mobile-only: similar ideas panel appears right after title input */}
              <div className="lg:hidden">
                <SimilarIdeasPanel query={debouncedTitle} />
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label htmlFor="tags" className="text-[13px] font-bold text-slate-700">
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Comma separated (e.g. design, performance, UI)"
                  className="h-11 shadow-sm border-slate-200 bg-slate-50/50 text-[14px] focus-visible:border-indigo-400 focus-visible:ring-indigo-100 rounded-xl"
                />
              </div>

              {/* Category & Idea Space */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700">
                    Category <span className="text-rose-400 font-normal">*</span>
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(val) => {
                      setCategory(val);
                      if (errors.category) setErrors(prev => ({ ...prev, category: "" }));
                    }}
                  >
                    <SelectTrigger className={`w-full h-11 bg-slate-50/50 shadow-sm rounded-xl text-[14px] ${errors.category ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'}`}>
                      <SelectValue placeholder={isCategoriesLoading ? "Loading..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c: any) => c.is_active) // Only show active categories for submission
                        .sort((a: any, b: any) => {
                          const aName = a.parent_name ? `${a.parent_name} > ${a.name}` : a.name;
                          const bName = b.parent_name ? `${b.parent_name} > ${b.name}` : b.name;
                          return aName.localeCompare(bName);
                        })
                        .map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-[14px]">
                            {cat.parent_name ? (
                              <div className="flex items-center gap-1.5 opacity-85">
                                <span className="text-muted-foreground whitespace-nowrap">{cat.parent_name}</span>
                                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                                <span className="font-bold">{cat.name}</span>
                              </div>
                            ) : (
                              <span className="font-bold">{cat.name}</span>
                            )}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-[11px] text-rose-500 font-medium">{errors.category}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700">
                    Idea Space <span className="text-rose-400 font-normal">*</span>
                  </Label>
                  <Select
                    value={ideaSpace}
                    onValueChange={(val) => {
                      setIdeaSpace(val);
                      if (errors.ideaSpace) setErrors(prev => ({ ...prev, ideaSpace: "" }));
                    }}
                  >
                    <SelectTrigger className={`w-full h-11 bg-slate-50/50 shadow-sm rounded-xl text-[14px] ${errors.ideaSpace ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'}`}>
                      <SelectValue placeholder={isSpacesLoading ? "Loading..." : "Select idea space"} />
                    </SelectTrigger>
                    <SelectContent>
                      {ideaSpaces.map((sp: any) => (
                        <SelectItem key={sp.id} value={sp.id} className="text-[14px]">{sp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.ideaSpace && <p className="text-[11px] text-rose-500 font-medium">{errors.ideaSpace}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-[13px] font-bold text-slate-700">
                  Description <span className="text-rose-400 font-normal">*</span>
                </Label>
                <div className={`border rounded-xl flex flex-col overflow-hidden bg-slate-50/50 shadow-sm transition-all ${errors.description ? 'border-rose-300 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100' : 'border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100'}`}>
                  <RichTextToolbar />
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
                    }}
                    placeholder="Detail your idea, intended audience, and potential value..."
                    className="w-full p-4 border-0 focus-visible:ring-0 resize-y text-[14px] bg-transparent text-slate-700 placeholder:text-slate-400 min-h-[160px]"
                    maxLength={20000}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  {errors.description ? (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.description}</p>
                  ) : <span />}
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-slate-700 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                  <span className="text-xs font-normal text-slate-400">(Max 10MB per file)</span>
                </Label>
                
                {/* File List */}
                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {attachments.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm group"
                      >
                        {file.mimeType.startsWith('image/') ? (
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                            <img 
                              src={file.fileUrl} 
                              alt={file.fileName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                            <FileText className="h-6 w-6 text-indigo-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 truncate font-medium">{file.fileName}</p>
                          <p className="text-slate-400 text-xs">({(file.fileSize / 1024 / 1024).toFixed(2)} MB)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                          className="text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;

                    // Check total files (max 5)
                    if (attachments.length + files.length > 5) {
                      toast.error("Maximum 5 files allowed");
                      return;
                    }

                    setIsUploading(true);
                    const newAttachments = [...attachments];

                    for (const file of Array.from(files)) {
                      // Check file size (10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error(`File "${file.name}" exceeds 10MB limit`);
                        continue;
                      }

                      try {
                        const formData = new FormData();
                        formData.append('file', file);

                        const response = await api.upload('/upload/single', formData, token || undefined);

                        newAttachments.push({
                          fileName: response.file.originalName,
                          fileUrl: response.file.url,           // Pre-signed URL for preview
                          storedUrl: response.file.storedUrl,   // Friendly URL for database storage
                          mimeType: response.file.mimetype,
                          fileSize: response.file.size
                        });
                      } catch (error: any) {
                        toast.error(`Failed to upload "${file.name}": ${error.message}`);
                      }
                    }

                    setAttachments(newAttachments);
                    setIsUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || attachments.length >= 5}
                  className="h-10 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {attachments.length === 0 ? 'Add Files' : 'Add More Files'}
                    </>
                  )}
                </Button>
                {attachments.length >= 5 && (
                  <p className="text-xs text-slate-400">Maximum 5 files allowed</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end items-center pt-2">
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-7 shadow-sm font-semibold transition-all w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Submit Idea"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Right Side: Sidebar Panels — desktop only */}
        <div className="hidden lg:block space-y-6 sticky top-6">
          {/* Similar ideas FTS panel */}
          <SimilarIdeasPanel query={debouncedTitle} />

          <Card className="border border-border/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] rounded-2xl bg-card p-6 relative overflow-hidden">
            {/* Background floating icon decoration */}
            <div className="absolute right-[-10px] top-4 opacity-[0.03] pointer-events-none">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>

            <div className="flex items-center gap-2 mb-3 relative z-10">
              <CheckCircle2 className="h-5 w-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800 text-[15px]">Impact Guide</h3>
            </div>
            <p className="text-[13px] text-slate-500 mb-5 relative z-10 leading-relaxed">
              A great idea has clarity and context.
            </p>

            <ul className="space-y-4 relative z-10 text-[13px] text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span><strong className="text-slate-800 font-semibold">Problem:</strong> What is currently not working?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span><strong className="text-slate-800 font-semibold">Solution:</strong> How does your idea fix this?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span><strong className="text-slate-800 font-semibold">Value:</strong> What is the return on investment?</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default SubmitIdeaForm;
