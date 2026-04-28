import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  GripVertical, CheckCircle2, FlaskConical, PlayCircle, Clock, 
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, MessageSquare, 
  Trash2, ArrowBigUp, Lock, Rocket, Lightbulb, SearchX, Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES, getTenantPath, ADMIN_ROLES, MANAGEMENT_ROLES } from "@/lib/constants";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";
import { api } from "@/lib/api";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import ConfirmationModal from "./ConfirmationModal";
import VotingSystem from "./VotingSystem";
import CommentSection from "./CommentSection";

import { Skeleton } from "@/components/ui/skeleton";

const RoadmapCardSkeleton = () => (
  <div className="bg-card/40 rounded-2xl p-4 border border-border/50 space-y-3 animate-pulse">
    <div className="flex items-start justify-between gap-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
    <Skeleton className="h-3 w-full opacity-50" />
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-6 w-12 rounded-lg" />
      <Skeleton className="h-6 w-12 rounded-lg" />
    </div>
  </div>
);

const RoadmapBoardSkeleton = () => (
  <div className="flex flex-col lg:flex-row gap-6 overflow-hidden pb-8 no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
    {[1, 2, 3, 4].map((col) => (
      <div key={col} className="flex-shrink-0 w-full lg:w-[420px] space-y-4">
        <div className="flex items-center justify-between px-4 py-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-8 rounded-md" />
        </div>
        <div className="bg-muted/10 rounded-2xl p-4 space-y-4 border border-border/20 h-[calc(100vh-18rem)] overflow-hidden">
          {[1, 2, 3].map((card) => (
            <RoadmapCardSkeleton key={card} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

interface RoadmapIdeaCardProps {
  idea: any;
  index: number;
  user: any;
  tenantSlug: string;
  navigate: any;
  handleVote: (id: string, type: 'up' | 'down') => void;
  voteMutation: any;
  setIdeaToDelete: (id: string) => void;
  handleStatusUpdate: (id: string, status: string) => void;
}

const RoadmapIdeaCard = ({ 
  idea, 
  index, 
  user, 
  tenantSlug, 
  navigate, 
  handleVote, 
  voteMutation, 
  setIdeaToDelete,
  handleStatusUpdate
}: RoadmapIdeaCardProps) => {
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  return (
    <Draggable draggableId={String(idea.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative",
            snapshot.isDragging && "shadow-2xl ring-2 ring-primary/20 scale-[1.02] z-50",
            isCommentOpen && "ring-2 ring-primary/40 shadow-premium"
          )}
          onClick={(e) => {
            if (!isCommentOpen) navigate(getTenantPath(ROUTES.IDEA_DETAIL.replace(':id', idea.id), tenantSlug));
          }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest flex items-center gap-1">
                    {idea.parent_name ? (
                      <>
                        {idea.parent_name}
                        <ChevronRight className="h-2 w-2 opacity-50" />
                        {idea.category}
                      </>
                    ) : (
                      idea.category
                    )}
                  </span>
                  {idea.priority && (
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-black px-1.5 py-0 leading-none h-4 border-none uppercase",
                      idea.priority === 'High' ? "bg-destructive/10 text-destructive" :
                      idea.priority === 'Medium' ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                    )}>
                      {idea.priority}
                    </Badge>
                  )}
                  {idea.status === 'Shipped' && (
                    <Badge variant="outline" className="text-[8px] font-black px-1.5 py-0 leading-none h-4 border-none uppercase bg-blue-500/10 text-blue-600 flex items-center gap-1">
                      <Lock className="h-2 w-2" />
                      Closed
                    </Badge>
                  )}
                </div>
                <h4 className="font-black text-base text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors pr-6 break-words">
                  {idea.title}
                </h4>
                {idea.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1 font-medium leading-relaxed italic break-words">
                    {idea.description}
                  </p>
                )}
                {idea.tags && idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {idea.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[8px] px-1.5 py-0 h-auto bg-muted/50 text-muted-foreground border-none font-bold">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 absolute top-4 right-4 translate-x-2 group-hover:translate-x-0">
                {(ADMIN_ROLES.includes(user?.role) || user?.id === idea.author_id) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIdeaToDelete(idea.id); }}
                    className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {MANAGEMENT_ROLES.includes(user?.role) && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate(idea.id, getPrevStatus(idea.status)); }}
                      className="p-1 hover:bg-slate-100 rounded-md text-slate-400 transition-all"
                      title="Previous Stage"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate(idea.id, getNextStatus(idea.status)); }}
                      className="p-1 hover:bg-muted rounded-md text-muted-foreground/60 hover:text-foreground transition-all"
                      title="Next Stage"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border border-background shadow-sm ring-1 ring-border">
                  <AvatarFallback className="text-[10px] font-black bg-muted text-muted-foreground uppercase">
                    {getInitials(idea.author_name || idea.author || 'Un')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-foreground truncate max-w-[80px]">
                    {idea.author_name?.split(' ')[0] || idea.author?.split(' ')[0] || "Anonymous"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <VotingSystem
                  ideaId={idea.id}
                  initialVotes={idea.votes_count}
                  onVote={(type) => handleVote(idea.id, type)}
                  userVote={idea.vote_type}
                  isLoading={voteMutation.isPending && voteMutation.variables?.id === idea.id}
                  disabled={idea.status === 'Shipped'}
                  className="scale-90"
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsCommentOpen(!isCommentOpen); }}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all",
                    isCommentOpen ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-xs font-black">{idea.comments_count || 0}</span>
                </button>
                <div className="flex flex-col items-center pl-3 border-l-2 border-primary/20 bg-primary/5 px-2 py-1 rounded-lg shrink-0">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">Points</span>
                  <span className="text-sm font-black text-primary">{(idea.votes_count || 0) * 10}</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isCommentOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden bg-muted/30 rounded-xl p-2 border border-border/50 mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CommentSection ideaId={idea.id} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const roadmapStages = [
  { id: 'backlog', name: 'Ideation', icon: Clock, color: 'slate', statuses: ['Pending', 'Under Review'], defaultStatus: 'Pending' },
  { id: 'progress', name: 'In Development', icon: PlayCircle, color: 'primary', statuses: ['In Progress', 'In Development'], defaultStatus: 'In Progress' },
  { id: 'qa', name: 'QA & Testing', icon: FlaskConical, color: 'warning', statuses: ['QA'], defaultStatus: 'QA' },
  { id: 'done', name: 'In Production', icon: CheckCircle2, color: 'success', statuses: ['Shipped'], defaultStatus: 'Shipped' },
];

const stageColors: Record<string, string> = {
  slate: "border-t-muted bg-muted/20",
  primary: "border-t-primary/40 bg-primary/5",
  warning: "border-t-warning/40 bg-warning/5",
  success: "border-t-success/40 bg-success/5",
};

const RoadmapBoard = ({ spaceId = null, search = "" }: { spaceId?: string | null, search?: string }) => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<string>(roadmapStages[0].id);

  const { data: ideas = [], isLoading, isFetching } = useQuery({
    queryKey: ["ideas", tenantSlug, search, spaceId],
    queryFn: () => {
      const endpoint = (search && search.trim().length >= 2) 
        ? `/ideas/search?q=${encodeURIComponent(search)}&space_id=${spaceId || ''}` 
        : `/ideas?space_id=${spaceId || ''}`;
      return api.get(endpoint, token!);
    },
    enabled: !!tenantSlug,
    staleTime: 1000 * 60,
  });

  const isCurrentlySearching = isFetching && !!search;

  // Calculate stage items even during loading for hook consistency
  const getStageItems = (statuses: string[]) => {
    return ideas.filter(i => {
      const statusMatch = statuses.includes(i.status);
      const spaceMatch = !spaceId || i.idea_space_id === spaceId;
      return statusMatch && spaceMatch;
    });
  };

  const backlogItems = getStageItems(roadmapStages[0].statuses);
  const progressItems = getStageItems(roadmapStages[1].statuses);
  const qaItems = getStageItems(roadmapStages[2].statuses);
  const doneItems = getStageItems(roadmapStages[3].statuses);

  // Auto-switch mobile stage if current stage has no results but another does (when searching)
  useEffect(() => {
    if (search && search.length >= 1) {
      const counts = {
        backlog: backlogItems.length,
        progress: progressItems.length,
        qa: qaItems.length,
        done: doneItems.length
      };

      const currentCount = counts[activeStage as keyof typeof counts];

      if (currentCount === 0) {
        if (counts.backlog > 0) setActiveStage('backlog');
        else if (counts.progress > 0) setActiveStage('progress');
        else if (counts.qa > 0) setActiveStage('qa');
        else if (counts.done > 0) setActiveStage('done');
      }
    }
  }, [search, backlogItems.length, progressItems.length, qaItems.length, doneItems.length, activeStage]);

  const voteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: "up" | "down" }) =>
      api.post(`/ideas/${id}/vote`, { type }, token!),
    onMutate: async ({ id, type }) => {
      await queryClient.cancelQueries({ queryKey: ["ideas", tenantSlug, search, spaceId] });
      const previousIdeas = queryClient.getQueryData(["ideas", tenantSlug, search, spaceId]);
      queryClient.setQueryData(["ideas", tenantSlug, search, spaceId], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map(idea => {
          if (idea.id !== id) return idea;
          let delta = 0;
          let newVoteType: "up" | "down" | null = null;
          if (idea.vote_type === type) {
            delta = type === 'up' ? -1 : 1;
            newVoteType = null;
          } else {
            if (idea.vote_type === 'up') delta -= 1;
            if (idea.vote_type === 'down') delta += 1;
            if (type === 'up') delta += 1;
            if (type === 'down') delta -= 1;
            newVoteType = type;
          }
          return {
            ...idea,
            votes_count: (parseInt(idea.votes_count || 0) + delta),
            vote_type: newVoteType,
          };
        });
      });
      return { previousIdeas };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousIdeas) {
        queryClient.setQueryData(["ideas", tenantSlug, search, spaceId], context.previousIdeas);
      }
      toast.error(err.message || "Failed to vote");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug, search, spaceId] });
    },
  });

  const handleVote = (id: string, type: 'up' | 'down') => {
    if (!token) return toast.error("Please login to vote");
    voteMutation.mutate({ id, type });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/ideas/${id}/status`, { status }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug, search, spaceId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Update failed");
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug, search, spaceId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ideas/${id}`, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug, search, spaceId] });
      toast.success("Idea deleted");
    },
    onError: (error: any) => toast.error(error.message || "Failed to delete idea"),
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (!MANAGEMENT_ROLES.includes(user?.role)) {
      toast.error("Only admins/reviewers can move ideas on the roadmap");
      return;
    }

    const destinationStage = roadmapStages.find(s => s.id === destination.droppableId);
    if (destinationStage) {
      statusMutation.mutate({ id: draggableId, status: destinationStage.defaultStatus });
      toast.info(`Moving to ${destinationStage.name}...`);
    }
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    if (!token) return toast.error("Login required");
    statusMutation.mutate({ id, status: newStatus });
  };

  if (isLoading || isCurrentlySearching) {
    return <RoadmapBoardSkeleton />;
  }

  if (ideas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150" />
          <div className="relative bg-card/50 backdrop-blur-xl border border-border/50 p-10 rounded-[2.5rem] shadow-premium">
            {search ? <SearchX className="h-16 w-16 text-primary/40 mb-2" /> : <Inbox className="h-16 w-16 text-muted-foreground/30 mb-2" />}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            {search ? "No matches found" : "No roadmap items"}
          </h2>
          <p className="text-muted-foreground text-sm font-medium max-w-[280px]">
            {search 
              ? `We couldn't find anything for "${search}". Try adjusting your keywords or filters.`
              : "The roadmap is currently clear. Ideas will appear here once they move into planning."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          {/* Mobile Stage Selector — pill tabs matching KanbanBoard */}
          <div className="lg:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-xl -mx-4 px-4 py-3 border-b border-border/50">
            <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/50">
              {roadmapStages.map(stage => {
                const isActive = activeStage === stage.id;
                const stageIdeas = stage.id === 'backlog' ? backlogItems : 
                                  stage.id === 'progress' ? progressItems : 
                                  stage.id === 'qa' ? qaItems : doneItems;
                const count = stageIdeas.length;
                const Icon = stage.icon;

                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(stage.id)}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all relative overflow-hidden",
                      isActive ? "text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-roadmap-stage-bg"
                        className="absolute inset-0 bg-background shadow-sm ring-1 ring-border/20 z-0"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={cn("mb-1", isActive ? "scale-110 transition-transform" : "opacity-70")}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight">{stage.name}</span>
                      <span className="text-[8px] font-bold opacity-60">
                        {count} {count === 1 ? 'Idea' : 'Ideas'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:overflow-x-auto pb-8 no-scrollbar lg:-mx-6 lg:px-6">
            {roadmapStages.map((stage) => {
              const stageIdeas = stage.id === 'backlog' ? backlogItems : 
                                stage.id === 'progress' ? progressItems : 
                                stage.id === 'qa' ? qaItems : doneItems;
              const Icon = stage.icon;

              return (
                <Card key={stage.id} className={cn(
                  `flex flex-col flex-shrink-0 w-full lg:w-[420px] h-auto lg:h-[calc(100vh-10rem)] p-0 overflow-hidden border-none shadow-premium backdrop-blur-sm border-t-4 ${stageColors[stage.color]} transition-all duration-300`,
                  activeStage === stage.id ? "flex" : "hidden lg:flex"
                )}>
                  <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-black/5">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        stage.color === 'slate' ? "bg-muted" : `bg-${stage.color}/20`
                      )}>
                        <Icon className={cn("h-4 w-4", stage.color === 'slate' ? "text-muted-foreground" : `text-${stage.color}`)} />
                      </div>
                      <h3 className="font-bold text-sm tracking-tight text-foreground">{stage.name}</h3>
                    </div>
                    <Badge variant="secondary" className="bg-card/50 text-muted-foreground border-none font-bold text-[10px]">
                      {stageIdeas.length}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div 
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={cn(
                            "flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px] transition-colors duration-200",
                            snapshot.isDraggingOver ? 'bg-black/5' : ''
                          )}
                        >
                          {stageIdeas.map((idea, index) => (
                            <RoadmapIdeaCard
                              key={idea.id}
                              idea={idea}
                              index={index}
                              user={user}
                              tenantSlug={tenantSlug || "default"}
                              navigate={navigate}
                              handleVote={handleVote}
                              voteMutation={voteMutation}
                              setIdeaToDelete={setIdeaToDelete}
                              handleStatusUpdate={handleStatusUpdate}
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {stageIdeas.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-30 grayscale italic text-[10px] text-muted-foreground pointer-events-none">
                        <GripVertical className="h-5 w-5 mb-2" />
                        No items in this stage
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      <ConfirmationModal
        isOpen={!!ideaToDelete}
        onClose={() => setIdeaToDelete(null)}
        onConfirm={() => {
          if (ideaToDelete) {
            deleteMutation.mutate(ideaToDelete);
            setIdeaToDelete(null);
          }
        }}
        title="Delete Idea?"
        message="This action will permanently delete this idea and all associated data. This action cannot be undone."
        confirmText="Delete Idea"
        type="danger"
      />
    </>
  );
};


// Helper to determine next logic status
function getNextStatus(current: string): string {
  const flow = ['Pending', 'Under Review', 'In Progress', 'In Development', 'QA', 'Shipped'];
  const idx = flow.indexOf(current);
  return idx < flow.length - 1 ? flow[idx + 1] : flow[idx];
}

function getPrevStatus(current: string): string {
  const flow = ['Pending', 'Under Review', 'In Progress', 'In Development', 'QA', 'Shipped'];
  const idx = flow.indexOf(current);
  return idx > 0 ? flow[idx - 1] : flow[idx];
}

export default RoadmapBoard;
