import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="flex justify-center mb-8">
          <div className="h-24 w-24 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="text-4xl font-bold text-primary-foreground">D</span>
          </div>
        </div>
        <h1 className="text-5xl font-bold tracking-tight">DOLKS</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Professional crew and service management platform
        </p>
        <div className="pt-4">
          <Button size="lg" onClick={() => navigate("/admin/login")}>
            Access Admin Panel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
