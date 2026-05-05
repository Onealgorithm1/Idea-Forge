import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, MessageSquare, ThumbsUp, Bookmark, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTenantPath, ROUTES, PLATFORM_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProfileIdeaCardProps {
  idea: any;
  tenantSlug: string;
  onBookmark: (e: React.MouseEvent, id: string) => void;
  onDelete?: (e: React.MouseEvent, id: string) => void;
  canDelete?: boolean;
}

const ProfileIdeaCard = ({ idea, tenantSlug, onBookmark, onDelete, canDelete }: ProfileIdeaCardProps) => (
  <Link to={getTenantPath(ROUTES.IDEA_DETAIL.replace(":id", idea.id), tenantSlug)}>
    <Card className="h-full border border-border/60 dark:border-border/40 shadow-sm hover:shadow-md bg-card group p-5 flex flex-col justify-between transition-all duration-300 rounded-2xl hover:-translate-y-1">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/15 uppercase text-[9px] font-black tracking-widest px-2 py-0.5 rounded-lg"
          >
            {idea.category}
          </Badge>
          <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(idea.created_at), "MMM d, yyyy")}
          </div>
        </div>
        <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {idea.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{idea.description}</p>
      </div>

      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          <span className={cn(
            "flex items-center gap-1 text-[10px] font-black transition-colors",
            idea.votes_count > 0 ? "text-emerald-500" : idea.votes_count < 0 ? "text-rose-500" : "text-muted-foreground"
          )}>
            <ThumbsUp className={cn(
              "h-3.5 w-3.5",
              idea.vote_type === 'up' ? "fill-emerald-200 text-emerald-600" : (idea.vote_type === 'down' ? "text-rose-600 rotate-180" : "text-slate-400")
            )} />
            {idea.votes_count || 0}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-black text-muted-foreground group-hover:text-primary transition-colors">
            <MessageSquare className="h-3.5 w-3.5 fill-primary/5 text-primary/70" />
            {idea.comments_count || 0}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Badge
            variant="secondary"
            className="text-[8px] px-2 py-0.5 h-5 bg-secondary text-muted-foreground border-0 font-bold uppercase tracking-tighter rounded-md"
          >
            {PLATFORM_STATUS_LABELS[idea.status] || idea.status}
          </Badge>
          <button
            onClick={(e) => onBookmark(e, idea.id)}
            className={cn(
              "p-1.5 rounded-xl transition-all border border-transparent hover:scale-110",
              idea.is_bookmarked ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : "text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/20"
            )}
            title={idea.is_bookmarked ? "Unfollow Idea" : "Follow Idea"}
          >
            <Bookmark className={cn("h-3.5 w-3.5", idea.is_bookmarked && "fill-current")} />
          </button>
          {canDelete && onDelete && (
            <button
              onClick={(e) => onDelete(e, idea.id)}
              className="p-1.5 rounded-xl transition-all border border-transparent text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 hover:scale-110"
              title="Delete Idea"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  </Link>
);

export default ProfileIdeaCard;
