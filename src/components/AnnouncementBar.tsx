import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const AnnouncementBar = () => {
  return (
    <div className="bg-foreground text-primary-foreground py-2.5 px-4">
      <div className="container flex items-center justify-center gap-2 text-sm">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-medium">The All-in-One AI-Powered B2B Lead Generation & Email Outreach Platform</span>
        <Link 
          to="/pricing" 
          className="ml-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          Try it now
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementBar;
