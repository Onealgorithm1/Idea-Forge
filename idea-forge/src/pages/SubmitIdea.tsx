import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import SubmitIdeaForm from "@/components/SubmitIdeaForm";

const SubmitIdea = () => {
  return (
    <div className="min-h-screen w-full bg-[#f4f5f7] flex flex-col relative overflow-x-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-60 dark:opacity-30">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[120%] h-[400px] bg-gradient-to-b from-primary/30 to-transparent rounded-[100%] blur-[120px]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[160px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-info/20 blur-[120px]" />
      </div>

      <Header />
      <div className="flex flex-1 overflow-hidden relative z-10">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-10 no-scrollbar pb-safe-nav">
          <SubmitIdeaForm />
        </main>
      </div>
    </div>
  );
};

export default SubmitIdea;
