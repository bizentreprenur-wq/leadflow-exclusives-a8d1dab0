import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Shield, Search, Download, RefreshCw, AlertTriangle, 
  CheckCircle, XCircle, Clock, User, Globe, Activity,
  TrendingUp, Eye, ChevronLeft, ChevronRight, Filter, X
} from 'lucide-react';
import { 
  fetchAuditLogs, fetchAuditStats, fetchSecurityAlerts, getAuditExportUrl,
  AuditLog, AuditLogFilters, AuditStats, SecurityAlerts,
  AUDIT_CATEGORIES, AUDIT_STATUSES
} from '@/lib/api/auditLogs';

export default function AuditLogsDashboard() {
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchAuditLogs(filters, page, 50);
      if (response.success) {
        setLogs(response.data);
        setTotalPages(response.pagination.pages);
        setTotal(response.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetchAuditStats(30);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const response = await fetchSecurityAlerts(7);
      if (response.success) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    } else if (activeTab === 'stats') {
      loadStats();
    } else if (activeTab === 'security') {
      loadAlerts();
    }
  }, [activeTab, loadLogs, loadStats, loadAlerts]);

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  };

  const handleExport = () => {
    const url = getAuditExportUrl(30, filters.category);
    window.open(url, '_blank');
    toast.success('Export started');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getCategoryBadge = (category: string) => {
    const config = AUDIT_CATEGORIES[category as keyof typeof AUDIT_CATEGORIES] || AUDIT_CATEGORIES.system;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Audit Logs</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => activeTab === 'logs' ? loadLogs() : activeTab === 'stats' ? loadStats() : loadAlerts()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="logs" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Security Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Search actions, IPs, errors..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                {Object.keys(filters).length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
              
              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <Select value={filters.category || ''} onValueChange={(v) => setFilters({ ...filters, category: v || undefined })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {Object.entries(AUDIT_CATEGORIES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.status || ''} onValueChange={(v) => setFilters({ ...filters, status: v || undefined })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failure">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input 
                    placeholder="IP Address" 
                    value={filters.ip || ''}
                    onChange={(e) => setFilters({ ...filters, ip: e.target.value || undefined })}
                  />
                  
                  <Input 
                    type="date"
                    placeholder="From Date"
                    value={filters.date_from || ''}
                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Status</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="w-[80px]">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id} className={log.status === 'failure' ? 'bg-red-50/50' : ''}>
                          <TableCell>{getStatusIcon(log.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(log.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{log.user_email || 'Anonymous'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{log.action}</TableCell>
                          <TableCell>{getCategoryBadge(log.category)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-sm">{log.ip_address}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {logs.length} of {total} entries
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{stats.totals.total_actions.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Total Actions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{stats.totals.total_users}</div>
                    <p className="text-sm text-muted-foreground">Unique Users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{stats.totals.total_ips}</div>
                    <p className="text-sm text-muted-foreground">Unique IPs</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{stats.totals.success_count.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Successful</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-red-600">{stats.totals.failure_count}</div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.by_category.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getCategoryBadge(cat.category)}
                          <span className="text-sm">{cat.count.toLocaleString()} actions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-600">{cat.success_count} ✓</span>
                          <span className="text-sm text-red-600">{cat.failure_count} ✗</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Actions (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.top_actions.slice(0, 10).map((action, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono">{action.action}</TableCell>
                          <TableCell>{getCategoryBadge(action.category)}</TableCell>
                          <TableCell className="text-right">{action.count.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {alerts && (
            <>
              {/* Failed Logins */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Failed Login Attempts
                  </CardTitle>
                  <CardDescription>IPs with 3+ failed login attempts in the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {alerts.failed_logins.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No suspicious login activity</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Last Attempt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alerts.failed_logins.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">{item.ip_address}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">{item.attempts}</Badge>
                            </TableCell>
                            <TableCell>{formatDate(item.last_attempt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Suspicious IPs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Globe className="h-5 w-5" />
                    Suspicious IP Addresses
                  </CardTitle>
                  <CardDescription>IPs with high failure rates</CardDescription>
                </CardHeader>
                <CardContent>
                  {alerts.suspicious_ips.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No suspicious IP activity</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Failures</TableHead>
                          <TableHead>Failed Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alerts.suspicious_ips.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">{item.ip_address}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">{item.failure_count}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                              {item.failed_actions}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Recent Failures */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Security-Related Failures</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {alerts.recent_failures.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No recent failures</p>
                    ) : (
                      <div className="space-y-2">
                        {alerts.recent_failures.slice(0, 20).map((log) => (
                          <div key={log.id} className="flex items-start gap-3 p-2 rounded bg-red-50/50">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{log.action}</span>
                                {getCategoryBadge(log.category)}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {log.error_message || 'No error message'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {log.ip_address} • {formatDate(log.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getStatusIcon(selectedLog.status)}
              Audit Log Details
            </DialogTitle>
            <DialogDescription>
              Full details for this audit event
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Action</label>
                    <p className="font-mono">{selectedLog.action}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <div className="mt-1">{getCategoryBadge(selectedLog.category)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User</label>
                    <p>{selectedLog.user_email || 'Anonymous'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                    <p>{formatDate(selectedLog.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                    <p className="font-mono">{selectedLog.ip_address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Duration</label>
                    <p>{selectedLog.duration_ms ? `${selectedLog.duration_ms}ms` : 'N/A'}</p>
                  </div>
                </div>
                
                {selectedLog.entity_type && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Entity</label>
                    <p>{selectedLog.entity_type}: {selectedLog.entity_id}</p>
                  </div>
                )}
                
                {selectedLog.error_message && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Error Message</label>
                    <p className="text-red-600">{selectedLog.error_message}</p>
                  </div>
                )}
                
                {selectedLog.request_path && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Request</label>
                    <p className="font-mono text-sm">{selectedLog.request_method} {selectedLog.request_path}</p>
                  </div>
                )}
                
                {selectedLog.user_agent && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                    <p className="text-sm text-muted-foreground break-all">{selectedLog.user_agent}</p>
                  </div>
                )}
                
                {selectedLog.request_data && Object.keys(selectedLog.request_data).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Request Data</label>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.request_data, null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Metadata</label>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
