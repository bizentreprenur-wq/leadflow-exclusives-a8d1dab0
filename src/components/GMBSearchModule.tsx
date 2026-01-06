import { useState, forwardRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, MapPin, Briefcase, Building2, Loader2, AlertCircle, 
  Globe, CheckCircle, XCircle, ChevronLeft, ChevronRight, Filter,
  ArrowUpDown, ArrowUp, ArrowDown, Download, Copy, FileSpreadsheet, FileText,
  ShieldCheck, ShieldQuestion, PartyPopper
} from "lucide-react";
import { searchGMB, GMBResult } from "@/lib/api/gmb";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import GMBResultModal from "./GMBResultModal";
import LeadVerificationModal from "./LeadVerificationModal";
import LeadActionModal from "./LeadActionModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type FilterType = "all" | "needs-upgrade" | "good";
type PlatformFilter = "all" | string;
type VerificationFilter = "all" | "verified" | "unverified";
type SortField = "name" | "platform" | "issues";
type SortDirection = "asc" | "desc";

const RESULTS_PER_PAGE = 5;

const GMBSearchModule = forwardRef<HTMLDivElement>((_, ref) => {
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GMBResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>("all");
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Modal
  const [selectedResult, setSelectedResult] = useState<GMBResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Lead verification
  const [selectedForVerification, setSelectedForVerification] = useState<Set<string>>(new Set());
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  
  // Lead action modal (wizard)
  const [showLeadActionModal, setShowLeadActionModal] = useState(false);

  // Get unique platforms from results
  const platforms = useMemo(() => {
    const platformSet = new Set<string>();
    results.forEach(r => {
      if (r.websiteAnalysis.platform) {
        platformSet.add(r.websiteAnalysis.platform);
      }
    });
    return Array.from(platformSet).sort();
  }, [results]);

  // Filtered and sorted results
  const filteredResults = useMemo(() => {
    let filtered = results.filter(r => {
      // Status filter
      if (statusFilter === "needs-upgrade" && !r.websiteAnalysis.needsUpgrade) return false;
      if (statusFilter === "good" && r.websiteAnalysis.needsUpgrade) return false;
      
      // Platform filter
      if (platformFilter !== "all" && r.websiteAnalysis.platform !== platformFilter) return false;

      // Verification filter
      if (verificationFilter === "verified" && !r.verification?.isVerified) return false;
      if (verificationFilter === "unverified" && r.verification?.isVerified) return false;
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "platform":
          const platformA = a.websiteAnalysis.platform || "zzz"; // Put null at end
          const platformB = b.websiteAnalysis.platform || "zzz";
          comparison = platformA.localeCompare(platformB);
          break;
        case "issues":
          comparison = a.websiteAnalysis.issues.length - b.websiteAnalysis.issues.length;
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [results, statusFilter, platformFilter, verificationFilter, sortField, sortDirection]);

  // Separate verified and unverified results for display
  const verifiedResults = useMemo(() => 
    filteredResults.filter(r => r.verification?.isVerified), 
    [filteredResults]
  );
  const unverifiedResults = useMemo(() => 
    filteredResults.filter(r => !r.verification?.isVerified), 
    [filteredResults]
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredResults.length / RESULTS_PER_PAGE);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE;
    return filteredResults.slice(start, start + RESULTS_PER_PAGE);
  }, [filteredResults, currentPage]);

  // Reset pagination when filters change
  const handleFilterChange = (type: "status" | "platform" | "verification", value: string) => {
    setCurrentPage(1);
    if (type === "status") {
      setStatusFilter(value as FilterType);
    } else if (type === "platform") {
      setPlatformFilter(value);
    } else {
      setVerificationFilter(value as VerificationFilter);
    }
  };

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Handle result click
  const handleResultClick = (result: GMBResult) => {
    setSelectedResult(result);
    setModalOpen(true);
  };

  // Lead verification selection
  const toggleLeadSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForVerification(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllUnverified = () => {
    const unverifiedIds = unverifiedResults.map(r => r.id);
    setSelectedForVerification(new Set(unverifiedIds));
  };

  const clearSelection = () => {
    setSelectedForVerification(new Set());
  };

  const getSelectedLeads = (): GMBResult[] => {
    return results.filter(r => selectedForVerification.has(r.id));
  };

  const handleVerifyLeads = (leads: GMBResult[]) => {
    // In production, this would call an API to verify leads
    // For now, we simulate verification
    setResults(prev => prev.map(r => {
      if (leads.some(l => l.id === r.id)) {
        return {
          ...r,
          verification: {
            isVerified: true,
            verifiedAt: new Date().toISOString(),
            contactValid: Math.random() > 0.1, // 90% valid
            businessActive: Math.random() > 0.05, // 95% active
            lastChecked: new Date().toISOString(),
          }
        };
      }
      return r;
    }));
    setSelectedForVerification(new Set());
    toast.success(`Verified ${leads.length} lead${leads.length !== 1 ? "s" : ""} successfully!`);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredResults.length === 0) {
      toast.error("No results to export");
      return;
    }

    const headers = ["Name", "Website", "Phone", "Address", "Platform", "Needs Upgrade", "Issues", "Mobile Score"];
    const csvRows = [
      headers.join(","),
      ...filteredResults.map(r => [
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.url || ''}"`,
        `"${r.phone || ''}"`,
        `"${r.address || ''}"`,
        `"${r.websiteAnalysis.platform || 'Unknown'}"`,
        r.websiteAnalysis.needsUpgrade ? "Yes" : "No",
        `"${r.websiteAnalysis.issues.join('; ')}"`,
        r.websiteAnalysis.mobileScore || "N/A"
      ].join(","))
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredResults.length} leads to CSV`);
  };

  // Copy to clipboard (for Google Docs paste)
  const copyToClipboard = async () => {
    if (filteredResults.length === 0) {
      toast.error("No results to copy");
      return;
    }

    const textRows = filteredResults.map(r => 
      `${r.name}\t${r.url || 'No website'}\t${r.phone || 'N/A'}\t${r.websiteAnalysis.platform || 'Unknown'}\t${r.websiteAnalysis.needsUpgrade ? 'Needs Upgrade' : 'Good'}`
    );
    
    const header = "Name\tWebsite\tPhone\tPlatform\tStatus";
    const textContent = [header, ...textRows].join("\n");

    try {
      await navigator.clipboard.writeText(textContent);
      toast.success("Copied to clipboard! Paste into Google Docs or Sheets");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (filteredResults.length === 0) {
      toast.error("No results to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // Primary blue
    doc.text("Lead Report", 14, 20);
    
    // Subtitle with date and search info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 28);
    doc.text(`Search: "${service}" in "${location}"`, 14, 34);
    
    // Summary stats
    const upgradeCount = filteredResults.filter(r => r.websiteAnalysis.needsUpgrade).length;
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Leads: ${filteredResults.length}  |  Needs Upgrade: ${upgradeCount}  |  Good: ${filteredResults.length - upgradeCount}`, 14, 44);

    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 48, pageWidth - 14, 48);

    // Table with business details
    const tableData = filteredResults.map(r => [
      r.name,
      r.phone || "N/A",
      r.websiteAnalysis.platform || "Unknown",
      r.websiteAnalysis.needsUpgrade ? "Yes" : "No",
      r.websiteAnalysis.mobileScore ? `${r.websiteAnalysis.mobileScore}%` : "N/A",
      r.websiteAnalysis.issues.length > 0 ? r.websiteAnalysis.issues.slice(0, 2).join(", ") : "None"
    ]);

    autoTable(doc, {
      startY: 52,
      head: [["Business Name", "Phone", "Platform", "Needs Upgrade", "Mobile Score", "Top Issues"]],
      body: tableData,
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 28 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 18 },
        5: { cellWidth: 45 }
      },
      margin: { left: 14, right: 14 }
    });

    // Detailed breakdown for each lead (new page)
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text("Detailed Lead Analysis", 14, 20);
    
    let yPosition = 32;
    const lineHeight = 6;
    const maxY = doc.internal.pageSize.getHeight() - 20;

    filteredResults.forEach((result, index) => {
      // Check if we need a new page
      if (yPosition > maxY - 50) {
        doc.addPage();
        yPosition = 20;
      }

      // Business name header
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${result.name}`, 14, yPosition);
      yPosition += lineHeight;

      // Details
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      
      if (result.url) {
        doc.text(`Website: ${result.url}`, 18, yPosition);
        yPosition += lineHeight - 1;
      }
      if (result.phone) {
        doc.text(`Phone: ${result.phone}`, 18, yPosition);
        yPosition += lineHeight - 1;
      }
      if (result.address) {
        doc.text(`Address: ${result.address}`, 18, yPosition);
        yPosition += lineHeight - 1;
      }
      
      doc.text(`Platform: ${result.websiteAnalysis.platform || "Unknown"}`, 18, yPosition);
      yPosition += lineHeight - 1;
      
      doc.text(`Mobile Score: ${result.websiteAnalysis.mobileScore ? result.websiteAnalysis.mobileScore + "%" : "N/A"}`, 18, yPosition);
      yPosition += lineHeight - 1;

      // Status with color
      const status = result.websiteAnalysis.needsUpgrade ? "Needs Upgrade" : "Good Website";
      doc.setTextColor(result.websiteAnalysis.needsUpgrade ? 220 : 34, result.websiteAnalysis.needsUpgrade ? 38 : 197, result.websiteAnalysis.needsUpgrade ? 38 : 94);
      doc.text(`Status: ${status}`, 18, yPosition);
      yPosition += lineHeight - 1;

      // Issues
      if (result.websiteAnalysis.issues.length > 0) {
        doc.setTextColor(80, 80, 80);
        doc.text(`Issues: ${result.websiteAnalysis.issues.join(", ")}`, 18, yPosition);
        yPosition += lineHeight - 1;
      }

      yPosition += 6; // Space between entries
    });

    // Footer on last page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    }

    doc.save(`lead-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success(`Exported ${filteredResults.length} leads to PDF`);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service.trim() || !location.trim()) {
      toast.error("Please enter both service type and location");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setCurrentPage(1);
    setStatusFilter("all");
    setPlatformFilter("all");

    const response = await searchGMB(service.trim(), location.trim());

    if (response.success && response.data) {
      setResults(response.data);
      const upgradeCount = response.data.filter(r => r.websiteAnalysis.needsUpgrade).length;
      toast.success(`Found ${response.data.length} businesses, ${upgradeCount} need upgrades`);
      
      // Show lead action modal after search completes
      if (response.data.length > 0) {
        setShowLeadActionModal(true);
      }
    } else {
      toast.error(response.error || "Search failed");
      setResults([]);
    }

    setIsLoading(false);
  };

  // Handle verify with AI action from modal
  const handleVerifyWithAI = () => {
    sessionStorage.setItem('leadsToVerify', JSON.stringify(results));
    toast.success('Leads ready for AI verification! Go to "AI Lead Verification" tab.');
  };

  // Handle send to Google Drive (placeholder)
  const handleSendToGoogleDrive = () => {
    sessionStorage.setItem('googleSheetsLeads', JSON.stringify(results));
    toast.info('Google Drive integration coming soon! For now, download as CSV.');
  };

  const needsUpgradeCount = results.filter(r => r.websiteAnalysis.needsUpgrade).length;
  const goodCount = results.length - needsUpgradeCount;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3 h-3" /> 
      : <ArrowDown className="w-3 h-3" />;
  };

  return (
    <div className="w-full" ref={ref}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Google My Business Search</h3>
          <p className="text-sm text-muted-foreground">Find businesses with GMB listings that need website upgrades</p>
        </div>
      </div>

      <form onSubmit={handleSearch}>
        <div className="p-3 rounded-xl border border-border bg-card shadow-card">
          <div className="flex flex-col md:flex-row gap-2">
            {/* Service input */}
            <div className="flex-1 relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. plumber, roofer, dentist"
                className="pl-12 h-12 bg-secondary/50 border-border text-base placeholder:text-muted-foreground/60 focus-visible:ring-primary"
              />
            </div>

            {/* Location input */}
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State or ZIP code"
                className="pl-12 h-12 bg-secondary/50 border-border text-base placeholder:text-muted-foreground/60 focus-visible:ring-primary"
              />
            </div>

            {/* Search button */}
            <Button type="submit" className="md:w-auto w-full h-12 px-6" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span className="ml-2">{isLoading ? "Searching..." : "Search"}</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Results Section - Hidden, users must choose how to view via wizard modal */}
      {hasSearched && (
        <div className="mt-6">
          {results.length === 0 && !isLoading ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No results found</p>
              <p className="text-sm mt-1">Try a different search term or location.</p>
            </div>
          ) : results.length > 0 && !showLeadActionModal && (
            <div className="text-center py-8">
              <div className="inline-flex flex-col items-center gap-4 p-6 rounded-xl bg-success/10 border border-success/20">
                <div className="p-3 rounded-full bg-success/20">
                  <PartyPopper className="w-8 h-8 text-success" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {results.length} leads ready!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {needsUpgradeCount} need website upgrades
                  </p>
                </div>
                <Button onClick={() => setShowLeadActionModal(true)} className="mt-2">
                  View Options
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <GMBResultModal
        result={selectedResult}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Verification Modal */}
      <LeadVerificationModal
        open={verificationModalOpen}
        onOpenChange={setVerificationModalOpen}
        selectedLeads={getSelectedLeads()}
        onVerify={handleVerifyLeads}
      />

      {/* Lead Action Modal (Wizard) */}
      <LeadActionModal
        open={showLeadActionModal}
        onOpenChange={setShowLeadActionModal}
        leadCount={results.length}
        leads={results.map(r => ({
          id: r.id,
          name: r.name,
          address: r.address,
          phone: r.phone,
          website: r.url,
          email: undefined,
          rating: undefined,
        }))}
        onVerifyWithAI={handleVerifyWithAI}
        onDownload={exportToCSV}
        onSendToGoogleDrive={handleSendToGoogleDrive}
      />
    </div>
  );
});

// ResultCard component for reusability
interface ResultCardProps {
  result: GMBResult;
  onClick: () => void;
  isSelected: boolean;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  showCheckbox: boolean;
}

function ResultCard({ result, onClick, isSelected, onToggleSelect, showCheckbox }: ResultCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border transition-all cursor-pointer hover:shadow-elevated hover:scale-[1.01] ${
        result.verification?.isVerified
          ? "border-success/30 bg-success/5 hover:border-success/50 ring-1 ring-success/20"
          : result.websiteAnalysis.needsUpgrade
            ? "border-destructive/20 bg-destructive/5 hover:border-destructive/40"
            : "border-border bg-card hover:border-border/80"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox for selection */}
        {showCheckbox && (
          <div 
            className="pt-1 shrink-0"
            onClick={(e) => onToggleSelect(result.id, e)}
          >
            <Checkbox 
              checked={isSelected}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground truncate text-lg">{result.name}</h4>
                {result.verification?.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium border border-success/20">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{result.snippet}</p>
              
              {result.displayLink && (
                <div className="flex items-center gap-1.5 mt-3 text-sm text-primary font-medium">
                  <Globe className="w-4 h-4" />
                  <span className="truncate">{result.displayLink}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {result.websiteAnalysis.platform && (
                <span className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                  {result.websiteAnalysis.platform}
                </span>
              )}
              
              {result.websiteAnalysis.needsUpgrade ? (
                <span className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                  <XCircle className="w-4 h-4" />
                  Needs Upgrade
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Good Website
                </span>
              )}
            </div>
          </div>

          {result.websiteAnalysis.issues.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Issues detected:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.websiteAnalysis.issues.map((issue, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive font-medium"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

GMBSearchModule.displayName = "GMBSearchModule";

export default GMBSearchModule;
