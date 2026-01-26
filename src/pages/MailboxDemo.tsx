import { Link } from "react-router-dom";

import CleanMailboxLayout from "@/components/CleanMailboxLayout";
import { Button } from "@/components/ui/button";

export default function MailboxDemo() {
  const searchType =
    (typeof window !== "undefined"
      ? (sessionStorage.getItem("bamlead_search_type") as "gmb" | "platform" | null)
      : null) || null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/">Back</Link>
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Mailbox Demo</h1>
          </div>
          <Button asChild size="sm">
            <Link to="/dashboard-demo">Open Full Demo</Link>
          </Button>
        </div>
      </header>

      <div className="h-[calc(100vh-56px)]">
        <CleanMailboxLayout
          searchType={searchType}
          campaignContext={{ isActive: false, sentCount: 0, totalLeads: 0 }}
        />
      </div>
    </div>
  );
}
