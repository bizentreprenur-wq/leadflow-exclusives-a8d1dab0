import { Link } from "react-router-dom";
import { Sparkles, TrendingUp, Users, Megaphone, Briefcase } from "lucide-react";

const industries = [
  { icon: TrendingUp, label: "Sales" },
  { icon: Users, label: "Recruiting" },
  { icon: Megaphone, label: "Marketing" },
  { icon: Briefcase, label: "Consulting" },
];

const AnnouncementBar = () => {
  return (
    <div className="bg-foreground text-primary-foreground py-2.5 px-4">
      <div className="container flex items-center justify-center gap-3 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium text-white">AI-Powered B2B Lead Generation</span>
        </div>
        
        <div className="hidden sm:flex items-center gap-1.5">
          {industries.map(({ icon: Icon, label }) => (
            <span 
              key={label}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/60 border border-primary text-white text-xs font-semibold"
            >
              <Icon className="w-3 h-3 text-white" />
              {label}
            </span>
          ))}
        </div>
        
        <Link 
          to="/pricing" 
          className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-md"
        >
          Try it now
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementBar;
