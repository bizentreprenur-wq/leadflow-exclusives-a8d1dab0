import { Link } from "react-router-dom";
import { Suspense } from "react";
import CleanMailboxLayout from "@/components/CleanMailboxLayout";
import { Button } from "@/components/ui/button";

export default function MailboxDemo() {
  const searchType =
    (typeof window !== "undefined"
      ? (sessionStorage.getItem("bamlead_search_type") as "gmb" | "platform" | null)
      : null) || null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card flex-shrink-0">
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

      <main className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading mailbox...</div>
          </div>
        }>
          <CleanMailboxLayout
            searchType={searchType}
            campaignContext={{ isActive: false, sentCount: 0, totalLeads: 0 }}
          />
        </Suspense>
      </main>
    </div>
  );
}
