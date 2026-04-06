import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
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
  // Buttons remain interactive to allow toggling/undoing
  const isFullyDisabled = disabled || isLoading;

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-1 px-2 rounded-xl bg-background/50 backdrop-blur-md border border-slate-200/60 shadow-sm transition-all',
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
          'h-8 w-8 rounded-full transition-all',
          userVote === 'up'
            // Active — voted up (locked in green)
            ? 'bg-emerald-500/20 text-emerald-600'
            : isLoading
                // Loading state
                ? 'text-slate-300 opacity-50 cursor-not-allowed'
                // No vote yet — interactive
                : 'text-slate-300 hover:bg-emerald-50 hover:text-emerald-500 group'
        )}
        disabled={isFullyDisabled}
        title={
          userVote === 'up' ? 'Remove upvote' :
          isLoading ? 'Saving...' : 'Upvote'
        }
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isFullyDisabled) onVote('up');
        }}
      >
        <motion.div
          whileHover={isFullyDisabled ? {} : { scale: 1.1 }}
          whileTap={isFullyDisabled ? {} : { scale: 0.9 }}
        >
          <ThumbsUp
            strokeWidth={2.5}
            className={cn(
              'h-[18px] w-[18px] transition-all',
              userVote === 'up' && 'fill-emerald-500 text-emerald-600 opacity-100',
              userVote !== 'up' && !isFullyDisabled && 'opacity-80 group-hover:opacity-100',
            )}
          />
        </motion.div>
      </Button>

      {/* ── Vote count ── */}
      <div className="relative h-6 min-w-[1rem] flex items-center justify-center overflow-hidden font-bold text-xs">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={initialVotes}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'absolute',
              initialVotes > 0 ? 'text-emerald-600' : 'text-slate-500'
            )}
          >
            {initialVotes}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VotingSystem;
