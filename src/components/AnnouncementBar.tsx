import { Link } from "react-router-dom";
import { Sparkles, Briefcase, Users, DollarSign, Building2, Brain } from "lucide-react";

const audiences = [
  { icon: Briefcase, label: "Agencies" },
  { icon: Users, label: "Sales Teams" },
  { icon: DollarSign, label: "Investors" },
  { icon: Building2, label: "SaaS" },
];

const AnnouncementBar = () => {
  return (
    <div className="bg-black py-2.5 px-4 border-b border-white/10">
      <div className="container flex items-center justify-center gap-3 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
          <span className="font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">🤖 Super AI Business Intelligence — 100+ Data Points</span>
        </div>
        
        <div className="hidden sm:flex items-center gap-1.5">
          {audiences.map(({ icon: Icon, label }) => (
            <span 
              key={label}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/90 border border-primary text-black text-xs font-bold shadow-md"
            >
              <Icon className="w-3 h-3 text-black" />
              {label}
            </span>
          ))}
        </div>
        
        <Link 
          to="/pricing" 
          className="px-3 py-1.5 rounded-full bg-primary text-black text-xs font-bold hover:bg-primary/90 transition-colors shadow-lg"
        >
          Try Free
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementBar;
