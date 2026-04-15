import { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, ArrowRight, CornerDownLeft, Command, Globe, Layers } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useNavigate, useParams } from "react-router-dom";
import { getTenantPath, ROUTES, PLATFORM_STATUS_LABELS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  title: string;
  status: string;
  votes_count: number;
  author_name: string;
  category: string;
  space_name: string;
  description: string;
}

const STATUS_THEMES: Record<string, { bg: string; text: string; dot: string }> = {
  Ideation:       { bg: "bg-violet-500/10", text: "text-violet-600", dot: "bg-violet-500" },
  "In Development": { bg: "bg-blue-500/10",  text: "text-blue-600",  dot: "bg-blue-500" },
  "QA & Testing": { bg: "bg-amber-500/10", text: "text-amber-600", dot: "bg-amber-500" },
  "In Production": { bg: "bg-emerald-500/10", text: "text-emerald-600", dot: "bg-emerald-500" },
};

interface GlobalSearchProps {
  autoFocus?: boolean;
  onClose?: () => void;
}

export default function GlobalSearch({ autoFocus = false, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { tenantSlug, spaceId } = useParams<{ tenantSlug: string; spaceId?: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSlug = tenantSlug || "default";

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["global-search", query, spaceId],
    queryFn: () => {
      if (!query || query.length < 2) return [];
      return api.get(`/ideas/search?q=${encodeURIComponent(query)}&space_id=${spaceId || ''}`);
    },
    enabled: query.length >= 2,
    staleTime: 0,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    navigate(getTenantPath(ROUTES.IDEA_DETAIL.replace(":id", id), currentSlug));
    setIsOpen(false);
    setQuery("");
    if (onClose) onClose();
  };

  return (
    <div ref={containerRef} className="relative w-full group">
      <div className={cn(
        "relative flex items-center transition-all duration-300",
        isOpen ? "scale-[1.01]" : "scale-100"
      )}>
        <div className="absolute left-4 z-10 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors">
          <Search className="h-4 w-4" />
        </div>

        <input
          type="text"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={spaceId ? "Search in space..." : "Search ideas, members, or tools..."}
          className={cn(
            "w-full h-10 md:h-11 pl-11 pr-12 bg-transparent border-none text-sm font-medium text-white placeholder:text-white/40 focus:outline-none transition-all",
            isOpen && "rounded-b-none"
          )}
        />

        <div className="absolute right-4 z-10 flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
          ) : query ? (
            <button onClick={() => { setQuery(""); setIsOpen(false); }} className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted border border-border opacity-40">
              <Command className="h-2.5 w-2.5" />
              <span className="text-[9px] font-black">K</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute top-full left-0 right-0 z-[100] bg-card border border-border border-t-0 rounded-b-2xl shadow-premium overflow-hidden backdrop-blur-xl"
          >
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-2">
              {results.length > 0 ? (
                <>
                  <div className="px-5 py-2 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Results {spaceId && "in space"}
                    </p>
                  </div>
                  {results.map((idea: SearchResult, idx: number) => {
                    const uiStatus = PLATFORM_STATUS_LABELS[idea.status] ?? idea.status;
                    const theme = STATUS_THEMES[uiStatus] ?? { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground/30" };

                    return (
                      <button
                        key={idea.id}
                        onClick={() => handleSelect(idea.id)}
                        className="w-full flex flex-col text-left px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/50 group transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex flex-col gap-0.5">
                            <h4 className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {idea.title}
                            </h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 italic font-medium">
                              {idea.description || "No description"}
                            </p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1" />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-md", theme.bg)}>
                            <div className={cn("h-1 w-1 rounded-full", theme.dot)} />
                            <span className={cn("text-[9px] font-black uppercase tracking-wider", theme.text)}>
                              {uiStatus}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Layers className="h-3 w-3" />
                            <span className="text-[10px] font-bold tracking-tight">{idea.category || "General"}</span>
                          </div>

                          {!spaceId && idea.space_name && (
                            <div className="flex items-center gap-1.5 text-primary/60">
                              <Globe className="h-3 w-3" />
                              <span className="text-[10px] font-bold tracking-tight">{idea.space_name}</span>
                            </div>
                          )}

                          <div className="ml-auto text-[10px] font-black text-muted-foreground/40">
                            {idea.votes_count} VOTES
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </>
              ) : !isLoading ? (
                <div className="p-10 text-center flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-muted border border-border">
                    <Search className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">No matches</p>
                    <p className="text-[11px] text-muted-foreground font-medium">Try different keywords</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5 text-muted-foreground/40">
                   <CornerDownLeft className="h-2.5 w-2.5" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Select</span>
                 </div>
              </div>
              <Badge variant="outline" className="border-border text-[9px] font-black text-muted-foreground/50">
                QUICK SEARCH
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
