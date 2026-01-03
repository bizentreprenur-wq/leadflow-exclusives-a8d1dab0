import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, Users, Search, TrendingUp, Crown, 
  Gift, Trash2, Edit, RefreshCw
} from 'lucide-react';
import { ADMIN_ENDPOINTS, getAuthHeaders } from '@/lib/api/config';

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  subscription_status: string;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  is_owner: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface Stats {
  total_users: number;
  active_subscriptions: number;
  trial_users: number;
  total_leads: number;
  total_searches: number;
  users_today: number;
  searches_today: number;
}

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [grantEmail, setGrantEmail] = useState('');
  const [isGranting, setIsGranting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch users and stats in parallel
      const [usersRes, statsRes] = await Promise.all([
        fetch(ADMIN_ENDPOINTS.users, { headers: getAuthHeaders() }),
        fetch(ADMIN_ENDPOINTS.stats, { headers: getAuthHeaders() })
      ]);

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      if (usersData.success) setUsers(usersData.users);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGrantFreeAccount = async () => {
    if (!grantEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsGranting(true);
    try {
      const response = await fetch(ADMIN_ENDPOINTS.grantFree, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: grantEmail })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Free account granted to ${grantEmail}`);
        setGrantEmail('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to grant free account');
      }
    } catch (error) {
      toast.error('Failed to grant free account');
    } finally {
      setIsGranting(false);
    }
  };

  const handleUpdateUser = async (userId: number, updates: Partial<AdminUser>) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.user(userId), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User updated');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-500" />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total_users}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.active_subscriptions}</p>
                    <p className="text-sm text-muted-foreground">Active Subs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Search className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total_searches}</p>
                    <p className="text-sm text-muted-foreground">Total Searches</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.users_today}</p>
                    <p className="text-sm text-muted-foreground">New Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Grant Free Account */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Grant Free Account
            </CardTitle>
            <CardDescription>
              Give a user permanent free access to all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="user@example.com"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                className="max-w-md"
              />
              <Button onClick={handleGrantFreeAccount} disabled={isGranting}>
                {isGranting ? 'Granting...' : 'Grant Free Access'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Users</CardTitle>
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.email}
                        {u.is_owner && (
                          <Badge variant="secondary" className="ml-2">Owner</Badge>
                        )}
                      </TableCell>
                      <TableCell>{u.name || '-'}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(value) => handleUpdateUser(u.id, { role: value as 'admin' | 'user' })}
                          disabled={u.is_owner}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={u.subscription_status === 'active' ? 'default' : 'secondary'}
                          className={
                            u.subscription_status === 'active' ? 'bg-emerald-500' :
                            u.subscription_status === 'trial' ? 'bg-amber-500' : ''
                          }
                        >
                          {u.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!u.is_owner && u.subscription_status !== 'active' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateUser(u.id, { subscription_status: 'active', subscription_plan: 'free_granted' })}
                            >
                              <Gift className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
