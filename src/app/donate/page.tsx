'use client';

/**
 * ============================================================================
 * DONATIONS PAGE
 * ============================================================================
 * Allows users to donate points to campaigns or make GCash donations.
 * Supports both authenticated users and guest donors.
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, Coins, CreditCard, Target, Users, Clock, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/common/Header';
import { supabase } from '@/lib/supabase';

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal_points?: number;
  current_points?: number;
  end_date?: string;
  accepts_gcash: boolean;
  gcash_number?: string;
  image_url?: string;
  stats?: {
    totalPoints: number;
    totalGcash: number;
    donorCount: number;
    progressPercent: number | null;
  };
}

export default function DonationsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);

  // Dialog states
  const [pointsDialog, setPointsDialog] = useState<{
    open: boolean;
    campaign: Campaign | null;
    amount: string;
    message: string;
    isAnonymous: boolean;
  }>({
    open: false,
    campaign: null,
    amount: '',
    message: '',
    isAnonymous: false,
  });

  const [gcashDialog, setGcashDialog] = useState<{
    open: boolean;
    campaign: Campaign | null;
    amount: string;
    reference: string;
    donorName: string;
    donorEmail: string;
    message: string;
  }>({
    open: false,
    campaign: null,
    amount: '',
    reference: '',
    donorName: '',
    donorEmail: '',
    message: '',
  });

  const [donating, setDonating] = useState(false);

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/donations?include_stats=true');
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user points
  const fetchUserPoints = async () => {
    if (!session?.user?.email) return;
    const { data } = await supabase
      .from('users')
      .select('total_points')
      .eq('email', session.user.email)
      .single();
    if (data) setUserPoints(data.total_points || 0);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (session?.user?.email) fetchUserPoints();
  }, [session]);

  // Handle points donation
  const handlePointsDonation = async () => {
    if (!pointsDialog.campaign || !pointsDialog.amount) return;

    setDonating(true);
    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: pointsDialog.campaign.id,
          points: parseInt(pointsDialog.amount),
          is_anonymous: pointsDialog.isAnonymous,
          message: pointsDialog.message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Thank you! 💚',
          description: data.message,
        });
        setPointsDialog({
          open: false,
          campaign: null,
          amount: '',
          message: '',
          isAnonymous: false,
        });
        fetchCampaigns();
        fetchUserPoints();
      } else {
        toast({
          title: 'Donation Failed',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process donation',
        variant: 'destructive',
      });
    } finally {
      setDonating(false);
    }
  };

  // Handle GCash donation
  const handleGcashDonation = async () => {
    if (!gcashDialog.campaign || !gcashDialog.amount || !gcashDialog.reference) return;

    setDonating(true);
    try {
      const response = await fetch('/api/donations/gcash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: gcashDialog.campaign.id,
          amount: parseFloat(gcashDialog.amount),
          gcash_reference: gcashDialog.reference,
          donor_name: gcashDialog.donorName || session?.user?.name,
          donor_email: gcashDialog.donorEmail || session?.user?.email,
          message: gcashDialog.message,
          receipt_url: 'pending', // Would need file upload implementation
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Donation Submitted! 💚',
          description: 'Your GCash donation is pending verification.',
        });
        setGcashDialog({
          open: false,
          campaign: null,
          amount: '',
          reference: '',
          donorName: '',
          donorEmail: '',
          message: '',
        });
      } else {
        toast({
          title: 'Submission Failed',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit donation',
        variant: 'destructive',
      });
    } finally {
      setDonating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 text-pink-500" />
            Donation Campaigns
          </h1>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            Support environmental initiatives at UMak. Donate your earned points or contribute via GCash.
          </p>
        </div>

        {/* User Points (if logged in) */}
        {session && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/40 px-6 py-3 rounded-full">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-bold text-green-700 dark:text-green-300">
                {userPoints.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">points available</span>
            </div>
          </div>
        )}

        {/* Campaigns Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 rounded-t-lg" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No active campaigns at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="overflow-hidden">
                {/* Campaign Image */}
                <div className="h-48 bg-gradient-to-br from-pink-100 to-red-100 dark:from-pink-900/30 dark:to-red-900/30 flex items-center justify-center">
                  {campaign.image_url ? (
                    <img
                      src={campaign.image_url}
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Heart className="w-20 h-20 text-pink-300" />
                  )}
                </div>

                <CardHeader>
                  <CardTitle>{campaign.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {campaign.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress (if goal exists) */}
                  {campaign.goal_points && campaign.stats && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium">
                          {campaign.stats.totalPoints.toLocaleString()} / {campaign.goal_points.toLocaleString()} pts
                        </span>
                      </div>
                      <Progress value={campaign.stats.progressPercent || 0} className="h-2" />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 text-sm text-gray-500">
                    {campaign.stats && (
                      <>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {campaign.stats.donorCount} donors
                        </span>
                        {campaign.stats.totalGcash > 0 && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4" />
                            ₱{campaign.stats.totalGcash.toLocaleString()}
                          </span>
                        )}
                      </>
                    )}
                    {campaign.end_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Until {formatDate(campaign.end_date)}
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  {/* Points Donation Button */}
                  {session && (
                    <Button
                      className="flex-1"
                      onClick={() =>
                        setPointsDialog({
                          open: true,
                          campaign,
                          amount: '',
                          message: '',
                          isAnonymous: false,
                        })
                      }
                    >
                      <Coins className="w-4 h-4 mr-2" />
                      Donate Points
                    </Button>
                  )}

                  {/* GCash Donation Button */}
                  {campaign.accepts_gcash && (
                    <Button
                      variant={session ? 'outline' : 'default'}
                      className="flex-1"
                      onClick={() =>
                        setGcashDialog({
                          open: true,
                          campaign,
                          amount: '',
                          reference: '',
                          donorName: '',
                          donorEmail: '',
                          message: '',
                        })
                      }
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      GCash
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Points Donation Dialog */}
        <Dialog
          open={pointsDialog.open}
          onOpenChange={(open) =>
            setPointsDialog((prev) => ({ ...prev, open }))
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Donate Points</DialogTitle>
              <DialogDescription>
                Donate to: {pointsDialog.campaign?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Amount (points)</Label>
                <Input
                  type="number"
                  placeholder="Enter points amount"
                  value={pointsDialog.amount}
                  onChange={(e) =>
                    setPointsDialog((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  min={1}
                  max={userPoints}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: {userPoints.toLocaleString()} points
                </p>
              </div>

              <div>
                <Label>Message (optional)</Label>
                <Textarea
                  placeholder="Leave a message of support..."
                  value={pointsDialog.message}
                  onChange={(e) =>
                    setPointsDialog((prev) => ({ ...prev, message: e.target.value }))
                  }
                  maxLength={200}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pointsDialog.isAnonymous}
                  onChange={(e) =>
                    setPointsDialog((prev) => ({
                      ...prev,
                      isAnonymous: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <span className="text-sm">Donate anonymously</span>
              </label>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setPointsDialog((prev) => ({ ...prev, open: false }))
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handlePointsDonation}
                disabled={
                  donating ||
                  !pointsDialog.amount ||
                  parseInt(pointsDialog.amount) <= 0 ||
                  parseInt(pointsDialog.amount) > userPoints
                }
              >
                {donating ? 'Processing...' : 'Donate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* GCash Donation Dialog */}
        <Dialog
          open={gcashDialog.open}
          onOpenChange={(open) =>
            setGcashDialog((prev) => ({ ...prev, open }))
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>GCash Donation</DialogTitle>
              <DialogDescription>
                Donate to: {gcashDialog.campaign?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* GCash Number Display */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">Send GCash to:</p>
                <p className="text-2xl font-bold text-blue-600">
                  {gcashDialog.campaign?.gcash_number || '0917-XXX-XXXX'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Laudato Si&apos; - UMak
                </p>
              </div>

              <div>
                <Label>Amount (PHP)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={gcashDialog.amount}
                  onChange={(e) =>
                    setGcashDialog((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  min={1}
                />
              </div>

              <div>
                <Label>GCash Reference Number</Label>
                <Input
                  placeholder="Enter reference number from receipt"
                  value={gcashDialog.reference}
                  onChange={(e) =>
                    setGcashDialog((prev) => ({ ...prev, reference: e.target.value }))
                  }
                />
              </div>

              {!session && (
                <>
                  <div>
                    <Label>Your Name</Label>
                    <Input
                      placeholder="Enter your name"
                      value={gcashDialog.donorName}
                      onChange={(e) =>
                        setGcashDialog((prev) => ({
                          ...prev,
                          donorName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Your Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={gcashDialog.donorEmail}
                      onChange={(e) =>
                        setGcashDialog((prev) => ({
                          ...prev,
                          donorEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Message (optional)</Label>
                <Textarea
                  placeholder="Leave a message..."
                  value={gcashDialog.message}
                  onChange={(e) =>
                    setGcashDialog((prev) => ({ ...prev, message: e.target.value }))
                  }
                  maxLength={200}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setGcashDialog((prev) => ({ ...prev, open: false }))
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleGcashDonation}
                disabled={
                  donating ||
                  !gcashDialog.amount ||
                  !gcashDialog.reference ||
                  (!session && (!gcashDialog.donorName || !gcashDialog.donorEmail))
                }
              >
                {donating ? 'Submitting...' : 'Submit Donation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
