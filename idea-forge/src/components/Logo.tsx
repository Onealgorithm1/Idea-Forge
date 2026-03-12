import { HTMLAttributes } from "react";

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  imageClassName?: string;
}

export function Logo({ className = "", imageClassName = "h-4 w-4", ...props }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`} {...props}>
      <img src="/ideaforge.png" alt="IdeaForge Logo" className={imageClassName} />
    </div>
  );
}
