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
    <div ref={containerRef} className="flex flex-col w-full h-full">
      <div className={cn(
        "relative flex items-center bg-muted/30 border border-border rounded-xl transition-all duration-300 group shrink-0",
        "focus-within:bg-background focus-within:ring-0 focus:ring-0 outline-none focus-within:outline-none",
        isOpen && query.length >= 2 && !autoFocus && "md:rounded-b-none md:border-b-transparent"
      )}>
        <div className="absolute left-4 z-10 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors">
          <Search className="h-4 w-4" />
        </div>

        <input
          type="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck="false"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={spaceId ? "Search in space..." : "Search ideas, members..."}
          className="w-full h-12 md:h-14 pl-11 pr-12 bg-transparent border-none text-[16px] font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 focus-visible:ring-0 transition-all outline-none appearance-none"
        />

        <div className="absolute right-4 z-10 flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground/40 animate-spin" />
          ) : query ? (
            <button onClick={() => { setQuery(""); setIsOpen(false); }} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted border border-border opacity-60">
              <Command className="h-3 w-3" />
              <span className="text-[10px] font-bold">K</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              "z-[100] mt-4 flex flex-col min-h-0 overflow-hidden",
              autoFocus ? "relative w-full flex-1" : "absolute top-full left-0 right-0 hidden md:flex rounded-2xl border border-border bg-card/50 backdrop-blur-xl shadow-premium"
            )}
          >
            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              {results.length > 0 ? (
                <>
                  <div className="px-5 py-3 mb-1 border-b border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <Layers className="h-3 w-3" />
                      Results {spaceId && "in space"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    {results.map((idea: SearchResult) => {
                      const uiStatus = PLATFORM_STATUS_LABELS[idea.status] ?? idea.status;
                      const theme = STATUS_THEMES[uiStatus] ?? { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground/30" };

                      return (
                        <button
                          key={idea.id}
                          onClick={() => handleSelect(idea.id)}
                          className="w-full flex flex-col text-left px-5 py-4 border-b border-border/50 last:border-0 hover:bg-muted transition-all"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex flex-col gap-1">
                              <h4 className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {idea.title}
                              </h4>
                              <p className="text-[12px] text-muted-foreground line-clamp-1 italic font-medium leading-relaxed">
                                {idea.description || "No description"}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" />
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full", theme.bg)}>
                              <div className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} />
                              <span className={cn("text-[10px] font-bold uppercase tracking-wider", theme.text)}>
                                {uiStatus}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Layers className="h-3.5 w-3.5" />
                              <span className="text-[11px] font-bold tracking-tight">{idea.category || "General"}</span>
                            </div>

                            <div className="ml-auto text-[10px] font-black text-muted-foreground/30">
                              {idea.votes_count} VOTES
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : !isLoading ? (
                <div className="p-12 text-center flex flex-col items-center gap-5">
                  <div className="p-5 rounded-full bg-muted border border-border ring-8 ring-muted/20">
                    <Search className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-base font-bold text-foreground">No matches found</p>
                    <p className="text-[12px] text-muted-foreground font-medium">Try different keywords</p>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
