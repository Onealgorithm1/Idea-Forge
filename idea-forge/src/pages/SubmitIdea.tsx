import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import SubmitIdeaForm from "@/components/SubmitIdeaForm";

const SubmitIdea = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{
            backgroundImage: "url('/Idea%20Sharing%20Hero%20Image.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "30% top",
            backgroundRepeat: "no-repeat",
          }}
        >
          <SubmitIdeaForm />
        </main>
      </div>
    </div>
  );
};

export default SubmitIdea;
