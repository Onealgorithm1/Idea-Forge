import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";
import {
  Bold, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, Link2, ImageIcon, Type, Target, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getSimilarIdeas, type SimilarIdea } from "@/data/mockData";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ─── Sub-components ────────────────────────────────────────────────────────

const TOOLBAR_BUTTONS = [
  [Bold, Strikethrough],
  [List, ListOrdered, AlignLeft, AlignCenter],
  [Link2, ImageIcon],
  [Type],
] as const;

function RichTextToolbar() {
  return (
    <div className="flex items-center gap-1 p-2 border-b bg-gray-50 flex-wrap">
      {TOOLBAR_BUTTONS.map((group, gi) => (
        <span key={gi} className="contents">
          {gi > 0 && <div className="w-px h-4 bg-gray-300 mx-1" />}
          {group.map((Icon, ii) => (
            <Button
              key={ii}
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-600 hover:text-gray-900 bg-white border border-transparent hover:border-gray-200"
            >
              <Icon className="h-4 w-4" />
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
    <div className="text-right text-xs text-gray-500 mt-1">
      {value.length}/{max}
    </div>
  );
}

interface SimilarIdeaItemProps {
  idea: SimilarIdea;
}

function SimilarIdeaItem({ idea, tenantSlug }: SimilarIdeaItemProps & { tenantSlug?: string }) {
  const Icon = idea.icon;
  return (
    <div className="group pb-5 border-b border-gray-100 last:border-0 pt-5 first:pt-0">
      <div className="flex gap-3 items-start">
        <div className={`mt-0.5 w-8 h-8 rounded-full ${idea.iconColor} text-white flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <Link
            to={getTenantPath(ROUTES.IDEA_DETAIL.replace(':id', idea.id), tenantSlug)}
            className="font-medium text-[15px] leading-snug text-[#2e68c0] hover:underline hover:text-[#1e3a8a] block truncate"
          >
            {idea.title}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-[#2e68c0] font-medium bg-blue-50 w-fit px-1.5 py-0.5 rounded">
            <Target className="w-3 h-3" />
            <span>{idea.tags[0] || idea.department}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500">
            <time dateTime={idea.createdAt}>
              {format(new Date(idea.createdAt), "MMM d, yyyy")}
            </time>
            <span className="text-gray-300">•</span>
            <span className="text-emerald-600 font-semibold">{idea.votes} Votes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SimilarIdeasPanelProps {
  ideas: SimilarIdea[];
}

function SimilarIdeasPanel({ ideas, tenantSlug }: SimilarIdeasPanelProps & { tenantSlug?: string }) {
  return (
    <div className="w-full md:w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-fit">
      <h2 className="text-lg font-bold text-[#1e3a8a] mb-5 tracking-tight uppercase">Similar Ideas</h2>
      <div className="space-y-0">
        {ideas.map((idea) => (
          <SimilarIdeaItem key={idea.id} idea={idea} tenantSlug={tenantSlug} />
        ))}
      </div>
    </div>
  );
}

// ─── Module-level data (static, computed once) ──────────────────────────────

const SIMILAR_IDEAS = getSimilarIdeas(5);

// ─── Main Component ──────────────────────────────────────────────────────────

const SubmitIdeaForm = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [ideaSpace, setIdeaSpace] = useState<string>("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [ideaSpaces, setIdeaSpaces] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { token } = useAuth();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const { data: recentIdeas = [] } = useQuery({
    queryKey: ["recent-ideas"],
    queryFn: () => api.get("/ideas"),
    select: (data) => data.slice(0, 5),
  });

  // Map backend ideas to SimilarIdea format for the panel
  const mappedRecentIdeas: SimilarIdea[] = recentIdeas.map((idea: any) => ({
    id: idea.id,
    title: idea.title,
    department: idea.category || "General",
    votes: idea.votes_count || 0,
    createdAt: idea.created_at,
    tags: idea.tags || [],
    icon: Target,
    iconColor: "bg-blue-500"
  }));

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.get("/ideas/categories");
        setCategories(data);
        if (data.length > 0) setCategory(data[0].id);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    const fetchIdeaSpaces = async () => {
      try {
        const data = await api.get("/ideas/spaces");
        setIdeaSpaces(data);
        if (data.length > 0) setIdeaSpace(data[0].id);
      } catch (error) {
        console.error("Failed to fetch idea spaces:", error);
      }
    };

    fetchCategories();
    fetchIdeaSpaces();
  }, []);

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
    try {
      await api.post("/ideas", {
        title,
        description,
        category_id: category,
        idea_space_id: ideaSpace,
        tags: tags.split(',').map(t => t.trim()).filter(t => t !== "")
      }, token || undefined);
      
      toast.success("Idea posted successfully!");
      setTitle("");
      setDescription("");
      setTags("");
      setErrors({});
      navigate(`${getTenantPath(ROUTES.IDEA_BOARD, tenantSlug)}`);
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
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto">
      {/* Form card */}
      <div className="flex-1 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#1e3a8a] tracking-tight mb-4">POST IDEA</h2>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 w-fit mx-auto">
              <li>Add details about your idea's purpose and impact</li>
              <li>Describe its use, and how it benefits our company</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-gray-500 font-normal">
                <span className="text-orange-400 mr-1">*</span>Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
                }}
                placeholder="Celebrate the closing of an opportunity with an in-app animation"
                className={`focus-visible:ring-1 h-11 ${errors.title ? 'border-red-500 focus-visible:ring-red-400' : 'focus-visible:ring-blue-400'}`}
                maxLength={80}
              />
              {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title}</p>}
              <CharacterCount value={title} max={80} />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label htmlFor="tags" className="text-gray-500 font-normal">
                Tags (comma separated)
              </Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="UI, UX, Sales, Animation"
                className="focus-visible:ring-1 focus-visible:ring-blue-400 h-11"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-gray-500 font-normal">
                <span className="text-orange-400 mr-1">*</span>Category
              </Label>
              <Select 
                value={category} 
                onValueChange={(val) => {
                  setCategory(val);
                  if (errors.category) setErrors(prev => ({ ...prev, category: "" }));
                }}
              >
                <SelectTrigger className={`w-full h-11 focus:ring-1 ${errors.category ? 'border-red-500 focus:ring-red-400' : 'focus:ring-blue-400'}`}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-red-500 font-medium">{errors.category}</p>}
            </div>

            {/* Idea Space */}
            <div className="space-y-1.5">
              <Label className="text-gray-500 font-normal">
                <span className="text-orange-400 mr-1">*</span>Idea Space
              </Label>
              <Select 
                value={ideaSpace} 
                onValueChange={(val) => {
                  setIdeaSpace(val);
                  if (errors.ideaSpace) setErrors(prev => ({ ...prev, ideaSpace: "" }));
                }}
              >
                <SelectTrigger className={`w-full h-11 focus:ring-1 ${errors.ideaSpace ? 'border-red-500 focus:ring-red-400' : 'focus:ring-blue-400'}`}>
                  <SelectValue placeholder="Select idea space" />
                </SelectTrigger>
                <SelectContent>
                  {ideaSpaces.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ideaSpace && <p className="text-xs text-red-500 font-medium">{errors.ideaSpace}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-gray-500 font-normal">
                <span className="text-orange-400 mr-1">*</span>Description
              </Label>
              <div className={`border rounded-md flex flex-col overflow-hidden focus-within:ring-1 border-gray-200 ${errors.description ? 'border-red-500 focus-within:ring-red-400' : 'focus-within:ring-blue-400'}`}>
                <RichTextToolbar />
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
                  }}
                  placeholder="When tracking an opportunity in Sales Cloud, there isn't much of a visual cue to represent the closing of an opportunity. By incorporating an in-app animation, sales team members can visually see that they've achieved their goal of closing an opportunity."
                  className="w-full p-4 border-0 focus-visible:ring-0 resize-none text-gray-700 placeholder:text-gray-400 bg-gray-50/30 h-56"
                  maxLength={20000}
                />
              </div>
              {errors.description && <p className="text-xs text-red-500 font-medium">{errors.description}</p>}
              <CharacterCount value={description} max={20000} />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mt-4">
              <Button
                type="button"
                variant="outline"
                className="text-[#1e3a8a] border-[#1e3a8a] bg-blue-50/50 hover:bg-blue-50 focus:ring-2 focus:ring-[#1e3a8a] focus:ring-offset-2 h-11 px-6"
                disabled
              >
                + Add Idea
              </Button>
              <Button
                type="submit"
                className="bg-[#2e68c0] hover:bg-[#25549e] text-white px-10 h-11 shadow-sm focus:ring-2 focus:ring-[#2e68c0] focus:ring-offset-2 font-semibold flex items-center justify-center min-w-[140px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Idea"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <SimilarIdeasPanel ideas={mappedRecentIdeas} tenantSlug={tenantSlug} />
    </div>
  );
};

export default SubmitIdeaForm;
