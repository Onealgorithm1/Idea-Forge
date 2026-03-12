import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface VotingSystemProps {
  ideaId: string;
  initialVotes: number;
  onVote: (type: 'up' | 'down') => void;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

const VotingSystem: React.FC<VotingSystemProps> = ({
  ideaId,
  initialVotes,
  onVote,
  orientation = 'vertical',
  className
}) => {
  return (
    <div className={cn(
      "flex items-center gap-1 p-1 rounded-xl bg-background/40 backdrop-blur-md border border-primary/10 shadow-sm transition-all hover:shadow-md hover:border-primary/20",
      orientation === 'vertical' ? "flex-col" : "flex-row",
      className
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors group"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onVote('up');
        }}
      >
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronUp className="h-5 w-5" />
        </motion.div>
      </Button>

      <div className="relative h-6 min-w-[2rem] flex items-center justify-center overflow-hidden font-bold text-sm">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={initialVotes}
            initial={{ y: initialVotes > 0 ? 20 : -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: initialVotes > 0 ? -20 : 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "absolute",
              initialVotes > 0 ? "text-emerald-600" : initialVotes < 0 ? "text-rose-600" : "text-foreground"
            )}
          >
            {initialVotes}
          </motion.span>
        </AnimatePresence>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors group"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onVote('down');
        }}
      >
        <motion.div
          whileHover={{ y: 2 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </Button>
    </div>
  );
};

export default VotingSystem;
