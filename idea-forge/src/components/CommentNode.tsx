import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Share2, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn, getInitials, getAvatarUrl } from '@/lib/utils';
import VotingSystem from './VotingSystem';
import { Button } from './ui/button';

interface CommentNodeProps {
  comment: any;
  depth?: number;
  onReply?: (parentId: string, text: string) => void;
}

const CommentNode: React.FC<CommentNodeProps> = ({ comment, depth = 0, onReply }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [replyTo, setReplyTo] = useState(false);
  const [replyText, setReplyText] = useState("");
  
  const isAdmin = ['admin', 'super_admin', 'tenant_admin'].includes(comment.author_role || '');
  
  const handleReply = () => {
    if (onReply && replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText("");
      setReplyTo(false);
    }
  };

  return (
    <div className="relative">
      {depth > 0 && (
        <div 
          className="absolute left-[-20px] top-0 bottom-0 w-[2px] bg-border/20 group-hover:bg-primary/20 transition-colors"
          style={{ left: `-${24}px` }}
        />
      )}
      
      <div className={`flex gap-3 ${depth > 0 ? 'mt-4' : 'mt-8'}`}>
        {/* Vertical Vote Bar */}
        <div className="flex flex-col items-center shrink-0 w-10">
          <VotingSystem
            ideaId={comment.id}
            initialVotes={comment.votes || 0}
            onVote={(type) => {
              // In a real app, you'd have an API for comment votes
            }}
            orientation="vertical"
            className="scale-90"
          />
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 rounded-full border border-border/50 shadow-sm shrink-0">
              <AvatarImage src={getAvatarUrl(comment.author_avatar, comment.author)} />
              <AvatarFallback className="text-[10px] font-black bg-muted text-muted-foreground uppercase">
                {getInitials(comment.author || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-black tracking-tight", isAdmin && "text-primary")}>
                {comment.author}
                {isAdmin && <span className="ml-1.5 text-[8px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">Admin</span>}
              </span>
              <span className="text-[11px] text-muted-foreground font-bold">
                • {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''}
              </span>
            </div>
            
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              {isCollapsed ? '[ + ]' : '[ - ]'}
            </button>
          </div>

          {!isCollapsed && (
            <>
              <div className="bg-muted/10 rounded-2xl px-4 py-3 border border-border/30">
                <p className="text-[15px] text-foreground/90 font-medium leading-relaxed break-all">
                  {comment.content}
                </p>
              </div>
              
              <div className="flex items-center gap-6 px-1">
                <button 
                  onClick={() => setReplyTo(!replyTo)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageSquare className="h-4 w-4" /> Reply
                </button>
                <button className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">
                  <MoreHorizontal className="h-4 w-4" /> More
                </button>
              </div>

              {replyTo && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-3 pl-4 border-l-2 border-primary/20"
                >
                  <textarea 
                    placeholder="Write your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full min-h-[100px] bg-muted/20 border border-border/50 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setReplyTo(false)} className="rounded-xl text-[10px] h-8 uppercase font-black">Cancel</Button>
                    <Button size="sm" onClick={handleReply} className="rounded-xl text-[10px] h-8 uppercase font-black shadow-lg shadow-primary/20">Post Reply</Button>
                  </div>
                </motion.div>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-6 border-l border-border/10 ml-1 mt-2">
                  {comment.replies.map((reply: any) => (
                    <CommentNode key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentNode;
