import { SidebarContent } from "./SidebarContent";

interface SidebarNavProps {
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

const SidebarNav = ({ onCategorySelect, selectedCategory }: SidebarNavProps) => {
  return (
    <aside className="sticky top-0 h-[100dvh] w-[260px] shrink-0 border-r border-border/40 hidden md:flex flex-col bg-background z-20 transition-all duration-300">
      <SidebarContent 
        onCategorySelect={onCategorySelect} 
        selectedCategory={selectedCategory} 
      />
    </aside>
  );
};

export default SidebarNav;
