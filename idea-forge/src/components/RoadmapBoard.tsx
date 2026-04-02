import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GripVertical, CheckCircle2, FlaskConical, PlayCircle, Clock, ChevronRight, ChevronLeft, MessageSquare, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import { api } from "@/lib/api";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import ConfirmationModal from "./ConfirmationModal";

const roadmapStages = [
  { id: 'backlog', name: 'Ideation', icon: Clock, color: 'slate', statuses: ['Pending', 'Under Review'], defaultStatus: 'Pending' },
  { id: 'progress', name: 'In Development', icon: PlayCircle, color: 'primary', statuses: ['In Progress', 'In Development'], defaultStatus: 'In Progress' },
  { id: 'qa', name: 'QA & Testing', icon: FlaskConical, color: 'warning', statuses: ['QA'], defaultStatus: 'QA' },
  { id: 'done', name: 'In Production', icon: CheckCircle2, color: 'success', statuses: ['Shipped'], defaultStatus: 'Shipped' },
];

const stageColors: Record<string, string> = {
  slate: "border-t-slate-400 bg-slate-50/50",
  primary: "border-t-primary/40 bg-primary/5",
  warning: "border-t-warning/40 bg-warning/5",
  success: "border-t-success/40 bg-success/5",
};

const RoadmapBoard = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ["ideas", tenantSlug],
    queryFn: () => api.get("/ideas"),
    staleTime: 1000 * 60,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/ideas/${id}/status`, { status }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Update failed");
      queryClient.invalidateQueries({ queryKey: ["ideas", tenantSlug] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ideas/${id}`, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Idea deleted");
    },
    onError: (error: any) => toast.error(error.message || "Failed to delete idea"),
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (user?.role !== 'admin' && user?.role !== 'reviewer') {
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-96 bg-slate-100 rounded-3xl border border-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roadmapStages.map((stage) => {
            const stageIdeas = ideas.filter(i => stage.statuses.includes(i.status));
            const Icon = stage.icon;

            return (
              <Card key={stage.id} className={`flex flex-col h-[calc(100vh-14rem)] p-0 overflow-hidden border-none shadow-premium backdrop-blur-sm border-t-4 ${stageColors[stage.color]}`}>
                <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-black/5">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg bg-${stage.color === 'slate' ? 'slate-200' : stage.color + '/20'}`}>
                      <Icon className={`h-4 w-4 text-${stage.color === 'slate' ? 'slate-500' : stage.color}`} />
                    </div>
                    <h3 className="font-bold text-sm tracking-tight text-slate-800">{stage.name}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white/50 text-slate-500 border-none font-bold text-[10px]">
                    {stageIdeas.length}
                  </Badge>
                </div>
                
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 min-h-0 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-black/5' : ''}`}
                    >
                      {stageIdeas.map((idea, index) => (
                        <Draggable key={idea.id} draggableId={String(idea.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`group bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary/20 scale-[1.02] z-50' : ''}`}
                              onClick={() => navigate(getTenantPath(ROUTES.IDEA_DETAIL.replace(':id', idea.id), tenantSlug))}
                            >
                              <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                  <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-bold bg-slate-50 text-slate-400 border-none px-1.5 py-0">
                                    {idea.category}
                                  </Badge>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {(user?.role === 'admin' || user?.id === idea.author_id) && (
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          setIdeaToDelete(idea.id);
                                        }}
                                        className="p-1 hover:bg-red-50 rounded-md text-slate-400 hover:text-red-500"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    {user?.role === 'admin' && (
                                      <>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(idea.id, getPrevStatus(idea.status)); }}
                                          className="p-1 hover:bg-slate-100 rounded-md text-slate-400"
                                          title="Previous Stage"
                                        >
                                          <ChevronLeft className="h-3.5 w-3.5" />
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(idea.id, getNextStatus(idea.status)); }}
                                          className="p-1 hover:bg-slate-100 rounded-md text-slate-400"
                                          title="Next Stage"
                                        >
                                          <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                  {idea.title}
                                </h4>
                                
                                {stage.id !== 'done' && (
                                  <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-50">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                        <MessageSquare className="h-3 w-3" />
                                        {idea.comments_count || 0}
                                      </div>
                                      <div className="h-1 w-1 rounded-full bg-slate-200" />
                                      <span className="text-[10px] font-bold text-emerald-600">
                                        {idea.votes_count || 0} Votes
                                      </span>
                                    </div>
                                    <Avatar className="h-6 w-6 border border-white shadow-sm ring-1 ring-slate-100">
                                      <AvatarFallback className="text-[8px] font-black bg-slate-100 text-slate-500">
                                        {getInitials(idea.author || 'U')}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {stageIdeas.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30 grayscale italic text-[10px] text-slate-400 pointer-events-none">
                    <GripVertical className="h-5 w-5 mb-2" />
                    No items in this stage
                  </div>
                )}
              </Card>
            );
          })}
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
