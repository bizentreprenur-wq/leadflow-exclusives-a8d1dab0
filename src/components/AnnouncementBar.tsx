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
          <span className="font-medium">AI-Powered B2B Lead Generation</span>
        </div>
        
        <div className="hidden sm:flex items-center gap-1.5">
          {industries.map(({ icon: Icon, label }) => (
            <span 
              key={label}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium"
            >
              <Icon className="w-3 h-3" />
              {label}
            </span>
          ))}
        </div>
        
        <Link 
          to="/pricing" 
          className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          Try it now
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementBar;
