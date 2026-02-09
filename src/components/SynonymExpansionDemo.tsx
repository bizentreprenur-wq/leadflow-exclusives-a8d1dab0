import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const synonymDatabase: Record<string, string[]> = {
  mechanic: ["auto repair", "car repair", "diesel mechanic", "service technician", "transmission repair", "brake specialist", "oil change", "tire shop", "auto body", "collision repair", "engine repair", "mobile mechanic", "fleet maintenance", "auto electrician", "muffler shop", "alignment shop"],
  dentist: ["dental clinic", "orthodontist", "oral surgeon", "teeth whitening", "dental implants", "family dentistry", "cosmetic dentistry", "pediatric dentist", "dental hygienist", "endodontist", "periodontist", "dental office", "dental care", "emergency dentist", "dentures specialist"],
  plumber: ["plumbing contractor", "drain cleaning", "pipe repair", "water heater repair", "sewer line", "emergency plumber", "commercial plumbing", "residential plumbing", "toilet repair", "faucet installation", "leak detection", "septic service", "backflow testing", "hydro jetting", "gas line repair"],
  restaurant: ["cafe", "bistro", "diner", "eatery", "pizzeria", "sushi bar", "steakhouse", "food truck", "catering service", "bakery", "fast food", "fine dining", "buffet", "bar & grill", "food delivery"],
  lawyer: ["attorney", "law firm", "legal services", "personal injury lawyer", "divorce attorney", "criminal defense", "estate planning", "immigration lawyer", "business attorney", "family law", "real estate lawyer", "bankruptcy attorney", "tax attorney", "employment lawyer", "civil litigation"],
  realtor: ["real estate agent", "property manager", "real estate broker", "home sales", "commercial real estate", "property listing", "real estate investor", "rental management", "home appraiser", "title company", "mortgage broker", "real estate consultant", "land developer", "home staging", "property inspector"],
};

const SynonymExpansionDemo = () => {
  const [query, setQuery] = useState("");
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
  const [isExpanding, setIsExpanding] = useState(false);
  const [estimatedLeads, setEstimatedLeads] = useState(0);

  const expandKeywords = useCallback((input: string) => {
    const key = input.toLowerCase().trim();
    const match = Object.keys(synonymDatabase).find(k => key.includes(k));
    if (match) {
      setIsExpanding(true);
      setActiveKeywords([]);
      setEstimatedLeads(0);
      const synonyms = synonymDatabase[match];
      synonyms.forEach((synonym, i) => {
        setTimeout(() => {
          setActiveKeywords(prev => [...prev, synonym]);
          setEstimatedLeads(prev => prev + Math.floor(Math.random() * 120) + 80);
        }, (i + 1) * 200);
      });
      setTimeout(() => setIsExpanding(false), (synonyms.length + 1) * 200);
    } else if (key.length >= 3) {
      // Show generic expansion for unknown keywords
      setIsExpanding(true);
      setActiveKeywords([]);
      setEstimatedLeads(0);
      const generic = [`${key} services`, `${key} near me`, `${key} contractor`, `${key} specialist`, `${key} company`, `best ${key}`, `${key} repair`, `${key} maintenance`];
      generic.forEach((g, i) => {
        setTimeout(() => {
          setActiveKeywords(prev => [...prev, g]);
          setEstimatedLeads(prev => prev + Math.floor(Math.random() * 100) + 50);
        }, (i + 1) * 200);
      });
      setTimeout(() => setIsExpanding(false), (generic.length + 1) * 200);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) expandKeywords(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, expandKeywords]);

  // Auto-demo on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery("mechanic");
      expandKeywords("mechanic");
    }, 1500);
    return () => clearTimeout(timer);
  }, [expandKeywords]);

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container px-4 relative">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-500">SYNONYM AI EXPANSION</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Type One Keyword.<br />
            <span className="text-amber-500">Get 2,000+ Leads.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            BamLead auto-expands your search across 15+ related keywords to maximize discovery. Try it below.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Search Input */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "mechanic", "dentist", "plumber", "restaurant", "lawyer"...'
              className="pl-12 pr-4 py-6 text-lg rounded-2xl border-2 border-border focus:border-amber-500/50 bg-card"
            />
            {isExpanding && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
              </div>
            )}
          </div>

          {/* Expansion Results */}
          <AnimatePresence>
            {activeKeywords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-foreground">
                      AI expanded "{query}" into {activeKeywords.length} search queries
                    </span>
                  </div>
                  {estimatedLeads > 0 && (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      ~{estimatedLeads.toLocaleString()} leads
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {/* Original keyword */}
                  <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5">
                    {query}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-muted-foreground self-center" />
                  <AnimatePresence>
                    {activeKeywords.map((keyword, i) => (
                      <motion.div
                        key={keyword}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge
                          variant="outline"
                          className="px-3 py-1.5 text-foreground/80 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
                        >
                          {keyword}
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Each synonym triggers a separate AI-powered search across Google Maps, websites, and social profiles
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default SynonymExpansionDemo;
