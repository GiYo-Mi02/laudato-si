/**
 * ============================================================================
 * POINTS & STREAKS HOOK
 * ============================================================================
 * Manages user points, streak data, and point transactions.
 * Provides real-time updates via Supabase subscriptions.
 * ============================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Streak, PointTransaction, PointSummary } from '@/types';

/**
 * Hook to manage user points and streak information.
 * Automatically syncs with database and provides real-time updates.
 * 
 * @param userId - The ID of the user to fetch points for
 * @returns Points summary, streak data, transaction history, and mutation functions
 */
export function usePoints(userId: string | undefined) {
  const [pointSummary, setPointSummary] = useState<PointSummary | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchPointsData() {
      try {
        setLoading(true);
        
        // Fetch user's total points
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('total_points')
          .eq('id', userId)
          .single();

        if (userError) throw userError;

        // Fetch streak data
        const { data: streakData, error: streakError } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', userId)
          .single();

        // Streak might not exist yet, that's okay
        if (streakError && streakError.code !== 'PGRST116') {
          console.warn('Streak fetch warning:', streakError);
        }

        // Fetch recent transactions
        const { data: txData, error: txError } = await supabase
          .from('point_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (txError) throw txError;

        // Calculate today's and this week's points
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());

        const pointsToday = (txData || [])
          .filter(tx => new Date(tx.created_at) >= today && tx.amount > 0)
          .reduce((sum, tx) => sum + tx.amount, 0);

        const pointsThisWeek = (txData || [])
          .filter(tx => new Date(tx.created_at) >= weekStart && tx.amount > 0)
          .reduce((sum, tx) => sum + tx.amount, 0);

        // Check if user can pledge today (no pledge_reward transaction today)
        const hasPledgedToday = (txData || []).some(tx => 
          tx.transaction_type === 'pledge_reward' && 
          new Date(tx.created_at) >= today
        );

        setStreak(streakData || null);
        setTransactions(txData || []);
        setPointSummary({
          total_points: userData?.total_points || 0,
          current_streak: streakData?.current_streak || 0,
          longest_streak: streakData?.longest_streak || 0,
          points_earned_today: pointsToday,
          points_earned_this_week: pointsThisWeek,
          can_pledge_today: !hasPledgedToday,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching points data:', err);
        setError('Failed to load points data');
      } finally {
        setLoading(false);
      }
    }

    fetchPointsData();

    // Subscribe to real-time updates for point transactions
    const txChannel = supabase
      .channel(`points-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'point_transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newTx = payload.new as PointTransaction;
          setTransactions(prev => [newTx, ...prev.slice(0, 49)]);
          
          // Update point summary
          setPointSummary(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              total_points: prev.total_points + newTx.amount,
              points_earned_today: newTx.amount > 0 
                ? prev.points_earned_today + newTx.amount 
                : prev.points_earned_today,
              can_pledge_today: newTx.transaction_type === 'pledge_reward' 
                ? false 
                : prev.can_pledge_today,
            };
          });
        }
      )
      .subscribe();

    // Subscribe to streak updates
    const streakChannel = supabase
      .channel(`streak-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'streaks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            const newStreak = payload.new as Streak;
            setStreak(newStreak);
            setPointSummary(prev => prev ? {
              ...prev,
              current_streak: newStreak.current_streak,
              longest_streak: newStreak.longest_streak,
            } : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(txChannel);
      supabase.removeChannel(streakChannel);
    };
  }, [userId]);

  /**
   * Redeem a promo code to earn bonus points.
   * Server-side validation ensures code validity and prevents abuse.
   */
  const redeemPromoCode = useCallback(async (code: string) => {
    if (!userId) return { success: false, message: 'Not authenticated' };

    try {
      const response = await fetch('/api/promo-codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error redeeming promo code:', err);
      return { success: false, message: 'Failed to redeem code' };
    }
  }, [userId]);

  return {
    pointSummary,
    streak,
    transactions,
    loading,
    error,
    redeemPromoCode,
  };
}

/**
 * Hook to fetch global leaderboard data.
 * Returns top users by points, donations, or streaks.
 */
export function useLeaderboard(
  type: 'points' | 'donations' | 'streaks' = 'points',
  limit: number = 10
) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        // For now, fetch from users table with points
        // In production, use the materialized view for better performance
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            name,
            avatar_url,
            department,
            role,
            total_points,
            streaks (
              current_streak,
              longest_streak
            )
          `)
          .in('role', ['student', 'employee'])
          .eq('is_banned', false)
          .order('total_points', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Add rank to each entry
        const rankedData = (data || []).map((user, index) => ({
          ...user,
          rank: index + 1,
          current_streak: user.streaks?.[0]?.current_streak || 0,
          longest_streak: user.streaks?.[0]?.longest_streak || 0,
        }));

        setLeaderboard(rankedData);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();

    // Refresh leaderboard every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [type, limit]);

  return { leaderboard, loading };
}
