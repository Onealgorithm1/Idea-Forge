import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { getTenantPath, ROUTES, PLATFORM_STATUS_LABELS } from "@/lib/constants";
import { useTenant } from "@/contexts/TenantContext";
import { Card } from "@/components/ui/card";
import { Sparkles, ArrowRight, ChevronDown, ChevronUp, Loader2, X, Globe, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SimilarIdea {
  id: string;
  title: string;
  status: string;
  votes_count: number;
  author_name: string;
  category: string;
  space_name: string;
  rank: number;
}

const STATUS_THEMES: Record<string, { bg: string; text: string; dot: string }> = {
  Ideation:       { bg: "bg-violet-500/10", text: "text-violet-600", dot: "bg-violet-500" },
  "In Development": { bg: "bg-blue-500/10",  text: "text-blue-600",  dot: "bg-blue-500" },
  "QA & Testing": { bg: "bg-amber-500/10", text: "text-amber-600", dot: "bg-amber-500" },
  "In Production": { bg: "bg-emerald-500/10", text: "text-emerald-600", dot: "bg-emerald-500" },
};

export default function SimilarIdeasPanel({ query }: { query: string }) {
  const [ideas, setIdeas] = useState<SimilarIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const prevQuery = useRef<string>("");
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const currentSlug = tenant?.slug || tenantSlug || "default";

  useEffect(() => {
    if (query !== prevQuery.current) {
      prevQuery.current = query;
      setDismissed(false);
      setCollapsed(false);
    }
  }, [query]);

  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setIdeas([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    api
      .get(`/ideas/similar?q=${encodeURIComponent(query.trim())}`)
      .then((data) => {
        if (!cancelled) setIdeas(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setIdeas([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [query]);

  if (dismissed || (!loading && ideas.length === 0)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <Card className="border border-slate-200/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] rounded-2xl bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-indigo-500/30 z-10" />

          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-800 text-[15px] leading-tight">
                    {loading ? "Matching Ideas..." : "Similar Initiatives"}
                  </h3>
                  {!loading && (
                    <p className="text-[11px] text-slate-400 font-medium">Found {ideas.length} existing items</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!loading && ideas.length > 0 && (
                  <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                )}
                <button
                  onClick={() => setDismissed(true)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {!loading && ideas.length > 0 && !collapsed && (
              <div className="space-y-3.5">
                <p className="text-[13px] text-slate-500 leading-relaxed font-medium px-1">
                   Verify if your proposal adds unique value beyond these matches.
                </p>
                
                <div className="grid gap-2.5">
                  {ideas.map((idea, idx) => {
                    const uiStatus = PLATFORM_STATUS_LABELS[idea.status] ?? idea.status;
                    const theme = STATUS_THEMES[uiStatus] ?? { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-500" };

                    return (
                      <motion.button
                        key={idea.id}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => navigate(getTenantPath(ROUTES.IDEA_DETAIL.replace(":id", idea.id), currentSlug))}
                        className="group w-full text-left p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/40 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <p className="text-[13px] font-bold text-slate-800 group-hover:text-indigo-700 leading-snug">
                            {idea.title}
                          </p>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-400 shrink-0 mt-0.5" />
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-3.5 border-t border-slate-50 pt-3">
                          {/* Status Pill */}
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${theme.bg}`}>
                            <div className={`h-1 w-1 rounded-full ${theme.dot}`} />
                            <span className={`text-[9px] font-black uppercase tracking-wider ${theme.text}`}>
                              {uiStatus}
                            </span>
                          </div>

                          {/* Space Badge */}
                          {idea.space_name && (
                            <div className="flex items-center gap-1.5 text-indigo-500">
                              <Globe size={10} className="shrink-0" />
                              <span className="text-[10px] font-bold tracking-tight">
                                {idea.space_name}
                              </span>
                            </div>
                          )}

                          {/* Category */}
                          {idea.category && (
                             <div className="flex items-center gap-1.5 text-slate-400">
                               <Layers size={10} className="shrink-0" />
                               <span className="text-[10px] font-semibold">
                                 {idea.category}
                               </span>
                             </div>
                          )}

                          {/* Votes */}
                          <div className="ml-auto text-slate-300 font-bold text-[10px]">
                            {idea.votes_count} votes
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {loading && (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 text-indigo-400/30 animate-spin" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Analyzing... </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
