'use client';

/**
 * ============================================================================
 * ADMIN REDEMPTIONS / QR VERIFICATION PAGE
 * ============================================================================
 * Interface for Canteen Admin to verify reward redemptions via QR code.
 * Also allows manual lookup by redemption ID.
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { QrCode, Search, CheckCircle2, XCircle, Clock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Redemption {
  id: string;
  status: 'pending' | 'verified' | 'expired' | 'cancelled';
  created_at: string;
  verified_at?: string;
  expires_at?: string;
  redemption_code?: string;
  points_spent?: number;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  reward: {
    id: string;
    name: string;
    category: string;
    point_cost: number;
  };
}

export default function AdminRedemptionsPage() {
  const { toast } = useToast();
  const [manualCode, setManualCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [lastVerified, setLastVerified] = useState<Redemption | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch redemptions list
  const fetchRedemptions = async (status: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/redemptions?status=${status}&limit=50`);
      const data = await response.json();

      if (data.success) {
        setRedemptions(data.redemptions);
      }
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedemptions(statusFilter);
  }, [statusFilter]);

  // Focus input for scanner
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Verify redemption by QR code or ID
  const handleVerify = async (codeOrId: string) => {
    if (!codeOrId.trim()) return;

    setVerifying(true);
    try {
      const response = await fetch('/api/admin/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: codeOrId.trim() }),
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: '✅ Verified!',
          description: `${data.redemption.reward} for ${data.redemption.user}`,
        });
        setLastVerified(data.redemption);
        setManualCode('');
        // Refresh list
        fetchRedemptions(statusFilter);
      } else {
        toast({
          title: 'Verification Failed',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify redemption',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
      inputRef.current?.focus();
    }
  };

  // Handle Enter key for manual input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify(manualCode);
    }
  };

  // Status badge colors
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    verified: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-4 h-4" />,
    verified: <CheckCircle2 className="w-4 h-4" />,
    expired: <XCircle className="w-4 h-4" />,
    cancelled: <XCircle className="w-4 h-4" />,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reward Verification
        </h1>
        <p className="text-gray-500">
          Scan QR codes or enter codes manually to verify reward redemptions
        </p>
      </div>

      {/* Scanner Section */}
      <Card className="border-2 border-dashed border-green-300 dark:border-green-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-green-600" />
            QR Code Scanner
          </CardTitle>
          <CardDescription>
            Scan a QR code or enter the code manually below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                ref={inputRef}
                placeholder="Scan or enter redemption code..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-12 h-14 text-lg"
                autoFocus
              />
            </div>
            <Button
              size="lg"
              className="h-14 px-8"
              onClick={() => handleVerify(manualCode)}
              disabled={verifying || !manualCode.trim()}
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </Button>
          </div>

          {/* Last Verified Display */}
          {lastVerified && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
                <div>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                    Successfully Verified!
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {lastVerified.reward?.name} claimed by {lastVerified.user?.name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redemptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Redemption History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending
              </TabsTrigger>
              <TabsTrigger value="verified">
                Verified
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expired
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled
              </TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter}>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading...
                </div>
              ) : redemptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No {statusFilter} redemptions found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.map((redemption) => (
                      <TableRow key={redemption.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={redemption.user?.avatar_url} />
                              <AvatarFallback>
                                {redemption.user?.name?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {redemption.user?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {redemption.user?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {redemption.reward?.name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {redemption.reward?.category}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {redemption.points_spent || redemption.reward?.point_cost} pts
                        </TableCell>
                        <TableCell>
                          {formatDate(redemption.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[redemption.status]} flex items-center gap-1 w-fit`}>
                            {statusIcons[redemption.status]}
                            {redemption.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {redemption.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleVerify(redemption.redemption_code || '')}
                            >
                              Verify
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
