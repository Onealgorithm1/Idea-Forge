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
          'h-9 w-9 rounded-full transition-all duration-300 relative',
          userVote === 'up'
            // Active — voted up (locked in green with glow)
            ? 'bg-emerald-500/15 text-emerald-600 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] ring-1 ring-emerald-500/20'
            : isLoading
                // Loading state
                ? 'text-slate-300 opacity-50 cursor-not-allowed'
                // No vote yet — interactive
                : 'text-slate-300 hover:bg-emerald-50 hover:text-emerald-500 group'
        )}
        disabled={isFullyDisabled}
        title={
          disabled ? 'Voting is closed for ideas in Production' :
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
          animate={userVote === 'up' ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          <ThumbsUp
            strokeWidth={2.5}
            className={cn(
              'h-[18px] w-[18px] transition-all duration-300',
              userVote === 'up' && 'fill-emerald-500 text-emerald-600 opacity-100',
              userVote !== 'up' && !isFullyDisabled && 'opacity-80 group-hover:opacity-100',
            )}
          />
        </motion.div>
        {userVote === 'up' && (
          <motion.div
            layoutId={`glow-${ideaId}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            className="absolute inset-0 bg-emerald-400/10 blur-md rounded-full -z-0"
          />
        )}
      </Button>

      {/* ── Vote count ── */}
      <div className="relative h-6 min-w-[1rem] flex items-center justify-center overflow-hidden font-bold text-xs mx-1">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={initialVotes}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'absolute',
              userVote === 'up' ? 'text-emerald-600' : 
              userVote === 'down' ? 'text-slate-600' : 'text-slate-500'
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
          'h-9 w-9 rounded-full transition-all duration-300 relative',
          userVote === 'down'
            ? 'bg-slate-500/15 text-slate-600 shadow-[0_0_15px_-5px_rgba(100,116,139,0.3)] ring-1 ring-slate-400/20'
            : isLoading
                ? 'text-slate-300 opacity-50 cursor-not-allowed'
                : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500 group'
        )}
        disabled={isFullyDisabled}
        title={
          disabled ? 'Voting is closed for ideas in Production' :
          userVote === 'down' ? 'Remove downvote' :
          isLoading ? 'Saving...' : 'Downvote'
        }
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isFullyDisabled) onVote('down');
        }}
      >
        <motion.div className="relative z-10">
          <ThumbsDown
            strokeWidth={2.5}
            className={cn(
              'h-[18px] w-[18px] transition-all duration-300',
              userVote === 'down' && 'fill-slate-400 text-slate-600 opacity-100',
              userVote !== 'down' && !isFullyDisabled && 'opacity-80 group-hover:opacity-100',
            )}
          />
        </motion.div>
      </Button>
    </div>
  );
};

export default VotingSystem;
