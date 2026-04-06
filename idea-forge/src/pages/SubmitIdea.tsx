import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import SubmitIdeaForm from "@/components/SubmitIdeaForm";

const SubmitIdea = () => {
  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col relative overflow-hidden">
      {/* Soft gradient blobs matching IdeaDetail layout */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-200/30 blur-[160px]" />
        <div className="absolute bottom-0 right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-[120px]" />
      </div>

      <Header />
      <div className="flex flex-1 overflow-hidden relative z-10">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
          <SubmitIdeaForm />
        </main>
      </div>
    </div>
  );
};

export default SubmitIdea;
