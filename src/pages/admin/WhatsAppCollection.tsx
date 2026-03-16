import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  Filter,
  Download,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  Shield,
  Globe,
  UserCheck,
  UserX,
  Mail,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppUser {
  id: string;
  name: string;
  phone: string;
  whatsapp_number: string;
  email?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  verified: boolean;
  whatsapp_verified: boolean;
  status: 'pending' | 'verified' | 'active' | 'inactive' | 'blocked';
  join_date: string;
  last_active: string;
  source: 'app_signup' | 'profile_update' | 'manual_import' | 'api_import';
  profile_completion: number;
  interests?: string[];
  language?: string;
}

interface WhatsAppStats {
  totalUsers: number;
  verifiedNumbers: number;
  pendingVerification: number;
  todaySignups: number;
  weeklyGrowth: number;
  verificationRate: number;
  topSources: Array<{ source: string; count: number }>;
  topLocations: Array<{ location: string; count: number }>;
}

const WhatsAppCollection: React.FC = () => {
  const [users, setUsers] = useState<WhatsAppUser[]>([]);
  const [stats, setStats] = useState<WhatsAppStats>({
    totalUsers: 0,
    verifiedNumbers: 0,
    pendingVerification: 0,
    todaySignups: 0,
    weeklyGrowth: 0,
    verificationRate: 0,
    topSources: [],
    topLocations: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<WhatsAppUser | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isBulkVerifyOpen, setIsBulkVerifyOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Load WhatsApp users data
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.warn('WhatsApp data loading timeout - possible infinite loop');
      setLoading(false);
    }, 10000); // 10 second timeout

    loadWhatsAppData();

    return () => clearTimeout(timeoutId);
  }, []);

  const loadWhatsAppData = async () => {
    try {
      setLoading(true);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 8000)
      );

      // Load users with WhatsApp numbers
      const dataPromise = (supabase as any)
        .from('whatsapp_leads')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: userData, error: userError } = await Promise.race([dataPromise, timeoutPromise]) as any;

      if (userError) throw userError;

      // Transform data to match our interface
      const transformedUsers: WhatsAppUser[] = (userData || []).map(user => ({
        id: user.id,
        name: user.name || 'Anonymous',
        phone: user.phone || '',
        whatsapp_number: user.whatsapp_number || user.phone || '',
        email: user.email,
        location: user.location,
        bio: user.bio,
        avatar_url: user.avatar_url,
        verified: user.verified || false,
        whatsapp_verified: user.whatsapp_verified || false,
        status: user.status || 'pending',
        join_date: user.created_at,
        last_active: user.last_active || user.created_at,
        source: user.source || 'app_signup',
        profile_completion: user.profile_completion || 0,
        interests: user.interests || [],
        language: user.language || 'en'
      }));

      setUsers(transformedUsers);

      // Calculate stats
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const totalUsers = transformedUsers.length;
      const verifiedNumbers = transformedUsers.filter(u => u.whatsapp_verified).length;
      const pendingVerification = transformedUsers.filter(u => !u.whatsapp_verified && u.status === 'pending').length;
      const todaySignups = transformedUsers.filter(u => u.join_date.startsWith(today)).length;
      const weeklyGrowth = transformedUsers.filter(u => u.join_date >= weekAgo).length;
      const verificationRate = totalUsers > 0 ? (verifiedNumbers / totalUsers) * 100 : 0;

      // Calculate top sources
      const sourceCounts = transformedUsers.reduce((acc: any, user) => {
        acc[user.source] = (acc[user.source] || 0) + 1;
        return acc;
      }, {});

      const topSources = Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate top locations
      const locationCounts = transformedUsers
        .filter(u => u.location)
        .reduce((acc: any, user) => {
          acc[user.location!] = (acc[user.location!] || 0) + 1;
          return acc;
        }, {});

      const topLocations = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalUsers,
        verifiedNumbers,
        pendingVerification,
        todaySignups,
        weeklyGrowth,
        verificationRate,
        topSources,
        topLocations
      });

    } catch (error) {
      console.error('Error loading WhatsApp data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users with useMemo for performance
  const filteredUsers = useMemo(() => users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.whatsapp_number.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesVerification = verificationFilter === 'all' ||
      (verificationFilter === 'verified' && user.whatsapp_verified) ||
      (verificationFilter === 'unverified' && !user.whatsapp_verified);
    const matchesSource = sourceFilter === 'all' || user.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesVerification && matchesSource;
  }), [users, searchTerm, statusFilter, verificationFilter, sourceFilter]);

  // Handle user verification
  const handleVerifyUser = async (userId: string, verified: boolean) => {
    try {
      await (supabase as any)
        .from('whatsapp_leads')
        .update({
          whatsapp_verified: verified,
          verified: verified,
          status: verified ? 'verified' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      loadWhatsAppData();
    } catch (error) {
      console.error('Error updating user verification:', error);
    }
  };

  // Handle status update
  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      await (supabase as any)
        .from('whatsapp_leads')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      loadWhatsAppData();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Bulk verification
  const handleBulkVerify = async () => {
    try {
      for (const userId of selectedUsers) {
        await (supabase as any)
          .from('whatsapp_leads')
          .update({
            whatsapp_verified: true,
            verified: true,
            status: 'verified',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }

      setSelectedUsers([]);
      setIsBulkVerifyOpen(false);
      loadWhatsAppData();
    } catch (error) {
      console.error('Error bulk verifying users:', error);
    }
  };

  // Export data
  const exportData = () => {
    const csvContent = [
      ['Name', 'Phone', 'WhatsApp Number', 'Email', 'Location', 'Status', 'Verified', 'Source', 'Join Date'].join(','),
      ...filteredUsers.map(user => [
        user.name,
        user.phone,
        user.whatsapp_number,
        user.email || '',
        user.location || '',
        user.status,
        user.whatsapp_verified,
        user.source,
        user.join_date
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp_numbers_collection.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Number Collection</h1>
          <p className="text-muted-foreground">Manage WhatsApp numbers collected from app users</p>
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <Button onClick={() => setIsBulkVerifyOpen(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Selected ({selectedUsers.length})
            </Button>
          )}
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.weeklyGrowth} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Numbers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedNumbers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.verificationRate.toFixed(1)}% verification rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVerification}</div>
            <p className="text-xs text-muted-foreground">
              Need verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today Signups</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaySignups}</div>
            <p className="text-xs text-muted-foreground">
              New users today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Sources and Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Sources</CardTitle>
            <CardDescription>Where users are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topSources.map((source, index) => (
                <div key={source.source} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{source.source.replace('_', ' ')}</span>
                  <Badge variant="secondary">{source.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>User locations distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topLocations.map((location, index) => (
                <div key={location.location} className="flex items-center justify-between">
                  <span className="text-sm">{location.location}</span>
                  <Badge variant="secondary">{location.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="app_signup">App Signup</SelectItem>
                <SelectItem value="profile_update">Profile Update</SelectItem>
                <SelectItem value="manual_import">Manual Import</SelectItem>
                <SelectItem value="api_import">API Import</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Numbers ({filteredUsers.length})</CardTitle>
          <CardDescription>Users who have provided their WhatsApp numbers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="rounded"
                  />
                  <Avatar>
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      {user.whatsapp_verified && <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Verified</Badge>}
                      <Badge variant={user.status === 'verified' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {user.source.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center"><Phone className="h-3 w-3 mr-1" />{user.phone}</span>
                      <span className="flex items-center"><MessageSquare className="h-3 w-3 mr-1" />{user.whatsapp_number}</span>
                      {user.email && <span className="flex items-center"><Mail className="h-3 w-3 mr-1" />{user.email}</span>}
                      {user.location && <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" />{user.location}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerifyUser(user.id, !user.whatsapp_verified)}
                  >
                    {user.whatsapp_verified ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUser(user)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected WhatsApp user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <div className="flex items-center space-x-2">
                    {selectedUser.whatsapp_verified && <Badge variant="secondary">Verified</Badge>}
                    <Badge variant={selectedUser.status === 'verified' ? 'default' : 'secondary'}>
                      {selectedUser.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {selectedUser.source.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number</Label>
                  <p className="text-sm">{selectedUser.phone}</p>
                </div>
                <div>
                  <Label>WhatsApp Number</Label>
                  <p className="text-sm">{selectedUser.whatsapp_number}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedUser.email || 'Not provided'}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-sm">{selectedUser.location || 'Not provided'}</p>
                </div>
                <div>
                  <Label>Join Date</Label>
                  <p className="text-sm">{new Date(selectedUser.join_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Last Active</Label>
                  <p className="text-sm">{new Date(selectedUser.last_active).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Profile Completion</Label>
                  <p className="text-sm">{selectedUser.profile_completion}%</p>
                </div>
                <div>
                  <Label>Language</Label>
                  <p className="text-sm">{selectedUser.language || 'Not specified'}</p>
                </div>
              </div>

              {selectedUser.interests && selectedUser.interests.length > 0 && (
                <div>
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedUser.interests.map((interest, index) => (
                      <Badge key={index} variant="outline">{interest}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Verify Dialog */}
      <Dialog open={isBulkVerifyOpen} onOpenChange={setIsBulkVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Verify Users</DialogTitle>
            <DialogDescription>
              Are you sure you want to verify {selectedUsers.length} selected users?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsBulkVerifyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkVerify}>
              Verify {selectedUsers.length} Users
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppCollection;
