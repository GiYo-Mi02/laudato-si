'use client';

/**
 * ============================================================================
 * LEADERBOARD PAGE
 * ============================================================================
 * Public leaderboard showing top contributors by points, pledges, or streaks.
 * Updates in real-time and allows filtering by time period.
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { Trophy, Flame, Medal, TrendingUp, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/common/Header';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar_url?: string;
  role: string;
  total: number;
  longest?: number; // For streak leaderboard
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'points' | 'contributions' | 'streak'>('points');
  const [period, setPeriod] = useState<'all' | 'monthly' | 'weekly'>('all');

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        period,
        limit: '50',
      });
      const response = await fetch(`/api/leaderboard?${params}`);
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [type, period]);

  // Get medal icon for top 3
  const getMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  // Get row background for top 3
  const getRowStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/20';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20';
      default:
        return '';
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || '??';
  };

  // Type-specific value label
  const getValueLabel = () => {
    switch (type) {
      case 'points':
        return 'Points';
      case 'contributions':
        return 'Pledges';
      case 'streak':
        return 'Days';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-gray-500 mt-2">
            Top eco-warriors of the Laudato Si&apos; community
          </p>
        </div>

        {/* Leaderboard Type Tabs */}
        <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="points" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Points
              </TabsTrigger>
              <TabsTrigger value="contributions" className="flex items-center gap-2">
                <Medal className="w-4 h-4" />
                Pledges
              </TabsTrigger>
              <TabsTrigger value="streak" className="flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Streaks
              </TabsTrigger>
            </TabsList>

            {/* Time Period Filter */}
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger className="w-40">
                <Clock className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="weekly">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leaderboard Content */}
          <Card>
            <CardHeader>
              <CardTitle>
                {type === 'points' && 'Top Point Earners'}
                {type === 'contributions' && 'Most Active Contributors'}
                {type === 'streak' && 'Longest Streaks'}
              </CardTitle>
              <CardDescription>
                {period === 'all' && 'All time rankings'}
                {period === 'monthly' && 'Rankings for this month'}
                {period === 'weekly' && 'Rankings for this week'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LeaderboardSkeleton />
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No data available for this period
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${getRowStyle(entry.rank)}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="w-10 text-center">
                          {getMedal(entry.rank) || (
                            <span className="text-lg font-semibold text-gray-400">
                              {entry.rank}
                            </span>
                          )}
                        </div>

                        {/* Avatar & Name */}
                        <Avatar className={entry.rank <= 3 ? 'w-12 h-12 ring-2 ring-green-500' : ''}>
                          <AvatarImage src={entry.avatar_url} alt={entry.name} />
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {getInitials(entry.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className={`font-medium ${entry.rank <= 3 ? 'text-lg' : ''}`}>
                            {entry.name}
                          </p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {entry.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className={`font-bold ${entry.rank <= 3 ? 'text-xl text-green-600' : 'text-lg'}`}>
                          {entry.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">{getValueLabel()}</p>
                        {type === 'streak' && entry.longest && (
                          <p className="text-xs text-gray-400">
                            Best: {entry.longest} days
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>

        {/* Motivational Footer */}
        <div className="text-center mt-8 p-6 bg-green-100 dark:bg-green-900/30 rounded-xl">
          <p className="text-green-800 dark:text-green-200 font-medium">
            🌱 Every pledge counts! Keep contributing to climb the leaderboard.
          </p>
        </div>
      </main>
    </div>
  );
}

/**
 * Loading skeleton for leaderboard
 */
function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20 mt-1" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
