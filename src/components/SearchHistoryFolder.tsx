import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Clock,
  MapPin,
  Search,
  Users,
  FileText,
  Download,
  Trash2,
  MoreVertical,
  Flame,
  Thermometer,
  Snowflake,
  RotateCcw,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export interface SearchFolderItem {
  id: string;
  query: string;
  location: string;
  timestamp: string;
  leads: SearchResult[];
  leadsCount: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
}

interface SearchResult {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  source: 'gmb' | 'platform';
  platform?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
  successProbability?: number;
  recommendedAction?: 'call' | 'email' | 'both';
  callScore?: number;
  emailScore?: number;
  urgency?: 'immediate' | 'this_week' | 'nurture';
  painPoints?: string[];
  readyToCall?: boolean;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
  };
}

interface SearchHistoryFolderProps {
  folders: SearchFolderItem[];
  onLoadSearch: (folder: SearchFolderItem) => void;
  onDeleteFolder: (folderId: string) => void;
  onOpenReport?: (folder: SearchFolderItem) => void;
}

export default function SearchHistoryFolder({
  folders,
  onLoadSearch,
  onDeleteFolder,
  onOpenReport,
}: SearchHistoryFolderProps) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Filter folders by search query (keyword or location)
  const filteredFolders = useMemo(() => {
    if (!searchFilter.trim()) return folders;
    const q = searchFilter.toLowerCase();
    return folders.filter(f => 
      f.query.toLowerCase().includes(q) || 
      f.location.toLowerCase().includes(q)
    );
  }, [folders, searchFilter]);

  const toggleFolder = (id: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return 'Unknown date';
    }
  };

  const downloadFolderLeads = (folder: SearchFolderItem, format: 'csv' | 'excel') => {
    if (folder.leads.length === 0) {
      toast.error('No leads to download in this folder');
      return;
    }

    const dateStr = new Date(folder.timestamp).toISOString().split('T')[0];
    const filename = `${folder.query.replace(/[^a-zA-Z0-9]/g, '-')}-${folder.location.replace(/[^a-zA-Z0-9]/g, '-')}-${dateStr}`;

    if (format === 'csv') {
      const headers = ['Name', 'Phone', 'Email', 'Address', 'Website', 'Rating', 'Classification', 'Score'];
      const rows = folder.leads.map(r => [
        `"${r.name || ''}"`,
        `"${r.phone || ''}"`,
        `"${r.email || ''}"`,
        `"${r.address || ''}"`,
        `"${r.website || ''}"`,
        r.rating || '',
        r.aiClassification?.toUpperCase() || '',
        r.leadScore || '',
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${folder.leads.length} leads as CSV`);
    } else {
      const worksheetData = folder.leads.map(r => ({
        'Business Name': r.name || '',
        'Phone': r.phone || '',
        'Email': r.email || '',
        'Address': r.address || '',
        'Website': r.website || '',
        'Rating': r.rating || '',
        'Classification': r.aiClassification?.toUpperCase() || '',
        'Score': r.leadScore || '',
        'Win Probability': r.successProbability ? `${r.successProbability}%` : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      toast.success(`Downloaded ${folder.leads.length} leads as Excel`);
    }
  };

  const handleDeleteClick = (folderId: string) => {
    setFolderToDelete(folderId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (folderToDelete) {
      onDeleteFolder(folderToDelete);
      toast.success('Search folder deleted');
    }
    setDeleteDialogOpen(false);
    setFolderToDelete(null);
  };

  if (folders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Folder className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No search history yet</p>
        <p className="text-xs mt-1">Your searches will appear here as folders</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by keyword or location..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setSearchFilter('')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* Filtered results count */}
      {searchFilter && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredFolders.length} of {folders.length} searches
        </p>
      )}
      
      {filteredFolders.length === 0 && searchFilter && (
        <div className="text-center py-6 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No searches match "{searchFilter}"</p>
        </div>
      )}
      
      {filteredFolders.map((folder) => {
        const isOpen = openFolders.has(folder.id);

        return (
          <Collapsible
            key={folder.id}
            open={isOpen}
            onOpenChange={() => toggleFolder(folder.id)}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <FolderOpen className="w-5 h-5 text-primary" />
                    ) : (
                      <Folder className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{folder.query}</span>
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {folder.leadsCount}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {folder.location}
                        <span className="text-muted-foreground/50">•</span>
                        <Clock className="w-3 h-3" />
                        {formatDate(folder.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Quick stats */}
                    <div className="hidden sm:flex items-center gap-1">
                      {folder.hotCount > 0 && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-xs">
                          <Flame className="w-3 h-3" />
                          {folder.hotCount}
                        </span>
                      )}
                      {folder.warmCount > 0 && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 text-xs">
                          <Thermometer className="w-3 h-3" />
                          {folder.warmCount}
                        </span>
                      )}
                      {folder.coldCount > 0 && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-xs">
                          <Snowflake className="w-3 h-3" />
                          {folder.coldCount}
                        </span>
                      )}
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 pb-3 px-3">
                  <div className="border-t pt-3">
                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs">
                        <Flame className="w-3 h-3" />
                        {folder.hotCount} Hot
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded bg-orange-500/10 text-orange-500 text-xs">
                        <Thermometer className="w-3 h-3" />
                        {folder.warmCount} Warm
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-xs">
                        <Snowflake className="w-3 h-3" />
                        {folder.coldCount} Cold
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => onLoadSearch(folder)}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Load Leads
                      </Button>

                      {onOpenReport && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => onOpenReport(folder)}
                        >
                          <FileText className="w-3 h-3" />
                          View Report
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-3 h-3" />
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => downloadFolderLeads(folder, 'csv')}>
                            Download CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadFolderLeads(folder, 'excel')}>
                            Download Excel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(folder.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Search Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this search and all associated leads from your history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
