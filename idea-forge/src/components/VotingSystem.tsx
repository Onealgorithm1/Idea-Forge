import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface VotingSystemProps {
  ideaId: string;
  initialVotes: number;
  onVote: (type: 'up' | 'down') => void;
  hasVoted?: boolean;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

const VotingSystem: React.FC<VotingSystemProps> = ({
  ideaId,
  initialVotes,
  onVote,
  hasVoted = false,
  orientation = 'horizontal',
  className
}) => {
  return (
    <div className={cn(
      "flex items-center gap-1 p-1 rounded-xl bg-background/50 backdrop-blur-md border border-slate-200/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300",
      orientation === 'vertical' ? "flex-col" : "flex-row",
      className
    )}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-600 transition-all group",
          hasVoted ? "bg-emerald-500/20 text-emerald-600" : "text-slate-500"
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onVote('up');
        }}
      >
        <motion.div
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowBigUp className="h-4 w-4 fill-current opacity-70 group-hover:opacity-100" />
        </motion.div>
      </Button>

      <div className="relative h-6 min-w-[1.25rem] flex items-center justify-center overflow-hidden font-bold text-xs text-slate-700">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={initialVotes}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "absolute",
              initialVotes > 0 ? "text-emerald-600" : initialVotes < 0 ? "text-rose-600" : "text-slate-700"
            )}
          >
            {initialVotes}
          </motion.span>
        </AnimatePresence>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-lg hover:bg-rose-500/20 hover:text-rose-600 text-slate-500 transition-all group"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onVote('down');
        }}
      >
        <motion.div
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowBigDown className="h-4 w-4 fill-current opacity-70 group-hover:opacity-100" />
        </motion.div>
      </Button>
    </div>
  );
};

export default VotingSystem;
