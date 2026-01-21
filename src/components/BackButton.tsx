import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

interface BackButtonProps {
  fallbackPath?: string;
  showHome?: boolean;
  className?: string;
}

const BackButton = ({ fallbackPath = "/", showHome = true, className = "" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 shadow-[0_0_10px_rgba(52,211,153,0.4)] hover:shadow-[0_0_15px_rgba(52,211,153,0.6)] transition-shadow"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      {showHome && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 shadow-[0_0_10px_rgba(52,211,153,0.4)] hover:shadow-[0_0_15px_rgba(52,211,153,0.6)] transition-shadow"
        >
          <Home className="w-4 h-4" />
          Home
        </Button>
      )}
    </div>
  );
};

export default BackButton;
