import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Loader2, Share2, MoreHorizontal } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import VotingSystem from './VotingSystem';
import { Button } from './ui/button';

import CommentNode from './CommentNode';

interface CommentSectionProps {
  ideaId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ ideaId }) => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', ideaId],
    queryFn: () => api.get(`/ideas/${ideaId}/comments`),
  });

  // Post comment mutation
  const commentMutation = useMutation({
    mutationFn: ({ content, parent_id }: { content: string, parent_id?: string }) => 
      api.post(`/ideas/${ideaId}/comments`, { content, parent_id }, token!),
    onSuccess: () => {
      setNewComment('');
      setReplyText('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['comments', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      toast.success('Thought shared! 💬');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to add comment'),
  });

  const handlePostComment = (parentId: string | null = null, text?: string) => {
    const finalContent = text || newComment;
    if (!finalContent.trim()) return;
    if (!token) return toast.error('Please login to join the discussion');
    commentMutation.mutate({ content: finalContent, parent_id: parentId || undefined });
  };

  return (
    <div className="space-y-8">
      {/* New Comment Input */}
      <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-[2rem] p-6 space-y-4 shadow-sm">
        <div className="flex gap-4">
        <Avatar className="h-10 w-10 rounded-2xl border border-border/50 shrink-0">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Me'}`} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {getInitials(user?.name || 'Me')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <textarea 
              placeholder="What are your thoughts on this? 💡"
              value={newComment}
              disabled={!token || commentMutation.isPending}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full min-h-[100px] bg-background/50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 resize-none outline-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Share your feedback with the community</p>
              <Button 
                onClick={() => handlePostComment()}
                disabled={!newComment.trim() || commentMutation.isPending || !token}
                className="rounded-xl px-8 font-black uppercase tracking-widest h-10 shadow-lg shadow-primary/20"
              >
                {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Thought"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Loading Conversation</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-muted/5 rounded-[2rem] border border-dashed border-border/40">
            <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground font-black uppercase tracking-widest">No thoughts shared yet. Be the first!</p>
          </div>
        ) : (
          comments.map((comment: any) => (
            <CommentNode key={comment.id} comment={comment} depth={0} />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
