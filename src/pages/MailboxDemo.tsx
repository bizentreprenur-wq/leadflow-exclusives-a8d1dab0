import { Link } from "react-router-dom";
import { Suspense, useEffect } from "react";
import CleanMailboxLayout from "@/components/CleanMailboxLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Mail } from "lucide-react";

export default function MailboxDemo() {
  const searchType =
    (typeof window !== "undefined"
      ? (sessionStorage.getItem("bamlead_search_type") as "gmb" | "platform" | null)
      : null) || null;

  // Set default search type if not set (for demo purposes)
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('bamlead_search_type')) {
      sessionStorage.setItem('bamlead_search_type', 'gmb');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card flex-shrink-0">
        <div className="container px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/">Back</Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-foreground">BamLead Mailbox</h1>
            </div>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 border-0 gap-1">
              <Crown className="w-3 h-3" />
              AI Autopilot Campaign Included
            </Badge>
          </div>
          <Button asChild size="sm">
            <Link to="/dashboard-demo">Open Full Demo</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading mailbox...</div>
          </div>
        }>
          <CleanMailboxLayout
            searchType={searchType || 'gmb'}
            campaignContext={{ isActive: false, sentCount: 0, totalLeads: 0 }}
          />
        </Suspense>
      </main>
    </div>
  );
}
