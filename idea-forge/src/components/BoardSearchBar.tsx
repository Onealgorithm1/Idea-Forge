import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Show the ⌘K keyboard shortcut hint when empty */
  showKbdHint?: boolean;
  className?: string;
}

/**
 * Shared search bar used by both the desktop sidebar and the mobile board header.
 * Forward the ref to focus the input externally (e.g. via ⌘K shortcut).
 */
const BoardSearchBar = forwardRef<HTMLInputElement, BoardSearchBarProps>(
  (
    {
      value,
      onChange,
      placeholder = "Search ideas...",
      showKbdHint = false,
      className,
    },
    ref
  ) => {
    return (
      <div className={cn("relative group", className)}>
        {/* Focus-glow underline — subtle decoration */}
        <div className="absolute inset-x-0 -bottom-2 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />

        {/* Search icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
          <Search className="h-4 w-4" />
        </div>

        <input
          ref={ref}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 h-11 bg-background/60 border border-border/50 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 rounded-2xl transition-all font-medium text-foreground text-[16px] placeholder:text-muted-foreground/50 shadow-sm group-hover:bg-background focus:outline-none"
        />

        {/* Right slot: clear button or ⌘K hint */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value ? (
            <button
              onClick={() => onChange("")}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-90"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : showKbdHint ? (
            <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          ) : null}
        </div>
      </div>
    );
  }
);

BoardSearchBar.displayName = "BoardSearchBar";

export default BoardSearchBar;
