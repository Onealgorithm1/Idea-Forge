import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const isFullyDisabled = disabled || isLoading;
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={cn(
        'flex items-center bg-muted/30 rounded-full border border-border/50 shadow-sm overflow-hidden w-fit',
        isVertical ? 'flex-col py-1.5' : 'flex-row px-0',
        className
      )}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* ── Upvote ── */}
      <button
        type="button"
        disabled={isFullyDisabled}
        className={cn(
          'p-1.5 transition-all duration-200 outline-none',
          userVote === 'up' 
            ? 'text-primary bg-primary/10' 
            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isFullyDisabled) onVote('up');
        }}
      >
        <motion.div
          animate={userVote === 'up' ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <ArrowBigUp
            className={cn(
              isVertical ? 'h-5 w-5' : 'h-[18px] w-[18px]',
              'transition-all',
              userVote === 'up' && 'fill-current'
            )}
          />
        </motion.div>
      </button>

      {/* ── Vote count ── */}
      <div className={cn(
        "font-black text-center select-none",
        isVertical ? "text-[12px] py-0.5" : "text-[13px] px-1 min-w-[2.5ch]",
        userVote === 'up' ? "text-primary" : 
        userVote === 'down' ? "text-blue-500" : 
        "text-foreground"
      )}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={initialVotes}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -5, opacity: 0 }}
            className="block"
          >
            {initialVotes}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ── Downvote ── */}
      <button
        type="button"
        disabled={isFullyDisabled}
        className={cn(
          'p-1.5 transition-all duration-200 outline-none',
          userVote === 'down' 
            ? 'text-blue-500 bg-blue-500/10' 
            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isFullyDisabled) onVote('down');
        }}
      >
        <motion.div
          animate={userVote === 'down' ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <ArrowBigDown
            className={cn(
              isVertical ? 'h-5 w-5' : 'h-[18px] w-[18px]',
              'transition-all',
              userVote === 'down' && 'fill-current'
            )}
          />
        </motion.div>
      </button>
    </div>
  );
};

export default VotingSystem;
