import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Loader2, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  ideaId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ ideaId }) => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', ideaId],
    queryFn: () => api.get(`/ideas/${ideaId}/comments`),
  });

  // Post comment mutation
  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/ideas/${ideaId}/comments`, { content }, token!),
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] }); // Update comment count on board
      toast.success('Comment added');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to add comment'),
  });

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    if (!token) return toast.error('Please login to comment');
    commentMutation.mutate(newComment);
  };

  return (
    <div className="mt-4 border-t border-slate-100/80 bg-slate-50/30 -mx-4 -mb-4 overflow-hidden rounded-b-xl">
      {/* Header (Optional, makes it feel like a section) */}
      <div className="px-4 py-2 flex items-center gap-2 bg-slate-100/40 border-b border-slate-100/60">
        <MessageSquare className="h-3 w-3 text-slate-400" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Discussion ({comments.length})
        </span>
      </div>

      {/* Input Area (Top for quick access) */}
      <div className="p-3 bg-white/50 border-b border-slate-100/60">
        <div className="relative group">
          <input
            type="text"
            placeholder={token ? "Say something..." : "Login to comment"}
            value={newComment}
            disabled={!token || commentMutation.isPending}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handlePostComment();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-[11px] focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all shadow-sm outline-none placeholder:text-slate-400 font-medium"
          />
          <button
            onClick={(e) => { e.stopPropagation(); handlePostComment(); }}
            disabled={!newComment.trim() || commentMutation.isPending || !token}
            className="absolute right-1 top-1 h-7 w-7 bg-primary text-white rounded-md flex items-center justify-center shadow-md shadow-primary/10 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
          >
            {commentMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="max-h-52 overflow-y-auto p-3 space-y-3 no-scrollbar scroll-smooth">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 opacity-50">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Loading Feed</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 opacity-40">
            <p className="text-[10px] font-bold text-slate-400">No comments yet</p>
          </div>
        ) : (
          comments.map((comment: any, idx: number) => (
            <motion.div 
              key={comment.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex gap-2.5 group/cmt"
            >
              <Avatar className="h-7 w-7 ring-2 ring-white shadow-sm border border-slate-100 shrink-0">
                <AvatarFallback className="text-[10px] font-black bg-slate-100 text-slate-500 uppercase">
                  {getInitials(comment.author || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-black text-slate-800 truncate">{comment.author}</span>
                  <span className="text-[8px] text-slate-400 font-bold opacity-0 group-hover/cmt:opacity-100 transition-opacity whitespace-nowrap">
                    {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal break-words">{comment.content}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {!token && (
        <div className="p-2 border-t border-slate-100/60 bg-slate-100/20">
          <p className="text-[9px] text-slate-400 text-center font-black uppercase tracking-tighter">
            Join the conversation
          </p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
