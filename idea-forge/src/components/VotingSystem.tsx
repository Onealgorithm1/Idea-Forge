import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface VotingSystemProps {
  ideaId: string;
  initialVotes: number;
  onVote: (type: 'up' | 'down') => void;
  userVote?: 'up' | 'down' | null;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

const VotingSystem: React.FC<VotingSystemProps> = ({
  ideaId,
  initialVotes,
  onVote,
  userVote = null,
  orientation = 'horizontal',
  className,
  disabled = false,
  isLoading = false,
}) => {
  // Once a user has voted, both buttons lock. The voted button stays highlighted.
  const hasVoted = userVote !== null && userVote !== undefined;
  const isFullyDisabled = disabled || isLoading || hasVoted;

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 rounded-xl bg-background/50 backdrop-blur-md border border-slate-200/60 shadow-sm transition-all',
        !hasVoted && 'hover:shadow-md hover:border-slate-300',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className
      )}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* ── Upvote ── */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'h-7 w-7 rounded-lg transition-all',
          userVote === 'up'
            // Active — voted up (locked in green)
            ? 'bg-emerald-500/20 text-emerald-600 cursor-default'
            : userVote === 'down'
              // Opposite voted — fully greyed, no hover
              ? 'text-slate-300 opacity-40 cursor-not-allowed'
              : isLoading
                // Loading state
                ? 'text-slate-400 opacity-50 cursor-not-allowed'
                // No vote yet — interactive
                : 'text-slate-500 hover:bg-emerald-500/20 hover:text-emerald-600 group'
        )}
        disabled={isFullyDisabled}
        title={
          userVote === 'up' ? 'You upvoted this idea' :
          userVote === 'down' ? 'You already downvoted' :
          isLoading ? 'Saving...' : 'Upvote'
        }
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isFullyDisabled) onVote('up');
        }}
      >
        <motion.div
          whileHover={isFullyDisabled ? {} : { scale: 1.15 }}
          whileTap={isFullyDisabled ? {} : { scale: 0.9 }}
        >
          <ThumbsUp
            className={cn(
              'h-4 w-4 transition-all',
              userVote === 'up' && 'fill-emerald-500 text-emerald-600 opacity-100',
              userVote !== 'up' && !isFullyDisabled && 'opacity-70 group-hover:opacity-100',
            )}
          />
        </motion.div>
      </Button>

      {/* ── Vote count ── */}
      <div className="relative h-6 min-w-[1.25rem] flex items-center justify-center overflow-hidden font-bold text-xs">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={initialVotes}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'absolute',
              initialVotes > 0 ? 'text-emerald-600' :
              initialVotes < 0 ? 'text-rose-600' :
              'text-slate-500'
            )}
          >
            {initialVotes}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ── Downvote ── */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'h-7 w-7 rounded-lg transition-all',
          userVote === 'down'
            // Active — voted down (locked in red)
            ? 'bg-rose-500/20 text-rose-600 cursor-default'
            : userVote === 'up'
              // Opposite voted — fully greyed, no hover
              ? 'text-slate-300 opacity-40 cursor-not-allowed'
              : isLoading
                ? 'text-slate-400 opacity-50 cursor-not-allowed'
                : 'text-slate-500 hover:bg-rose-500/20 hover:text-rose-600 group'
        )}
        disabled={isFullyDisabled}
        title={
          userVote === 'down' ? 'You downvoted this idea' :
          userVote === 'up' ? 'You already upvoted' :
          isLoading ? 'Saving...' : 'Downvote'
        }
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isFullyDisabled) onVote('down');
        }}
      >
        <motion.div
          whileHover={isFullyDisabled ? {} : { scale: 1.15 }}
          whileTap={isFullyDisabled ? {} : { scale: 0.9 }}
        >
          <ThumbsDown
            className={cn(
              'h-4 w-4 transition-all',
              userVote === 'down' && 'fill-rose-500 text-rose-600 opacity-100',
              userVote !== 'down' && !isFullyDisabled && 'opacity-70 group-hover:opacity-100',
            )}
          />
        </motion.div>
      </Button>
    </div>
  );
};

export default VotingSystem;
