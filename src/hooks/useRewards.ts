/**
 * ============================================================================
 * REWARDS HOOK
 * ============================================================================
 * Manages rewards marketplace data and redemption operations.
 * Provides real-time inventory updates and redemption status tracking.
 * ============================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Reward, RewardRedemption } from '@/types';

/**
 * Hook to fetch available rewards from the marketplace.
 * Automatically filters to show only active rewards with available stock.
 */
export function useRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRewards() {
      try {
        const { data, error: fetchError } = await supabase
          .from('rewards')
          .select('*')
          .eq('is_active', true)
          .order('point_cost', { ascending: true });

        if (fetchError) throw fetchError;

        // Filter out rewards with no remaining quantity
        const availableRewards = (data || []).filter(
          reward => reward.remaining_quantity === null || reward.remaining_quantity > 0
        );

        setRewards(availableRewards);
        setError(null);
      } catch (err) {
        console.error('Error fetching rewards:', err);
        setError('Failed to load rewards');
      } finally {
        setLoading(false);
      }
    }

    fetchRewards();

    // Subscribe to reward updates (inventory changes)
    const channel = supabase
      .channel('rewards-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rewards',
        },
        () => {
          // Refetch on any change to ensure consistency
          fetchRewards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { rewards, loading, error };
}

/**
 * Hook to manage user's reward redemptions.
 * Tracks redemption history and provides redemption functionality.
 * 
 * @param userId - The ID of the user
 */
export function useRedemptions(userId: string | undefined) {
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Fetch user's redemption history
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchRedemptions() {
      try {
        const { data, error } = await supabase
          .from('reward_redemptions')
          .select(`
            *,
            reward:rewards (
              id,
              name,
              description,
              point_cost,
              category,
              image_url
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRedemptions(data || []);
      } catch (err) {
        console.error('Error fetching redemptions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRedemptions();

    // Subscribe to redemption status updates
    const channel = supabase
      .channel(`redemptions-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reward_redemptions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the full record with joined reward data
            fetchRedemptions();
          } else if (payload.eventType === 'UPDATE') {
            setRedemptions(prev => 
              prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /**
   * Redeem a reward using points.
   * Validates sufficient points and available stock server-side.
   * 
   * @param rewardId - The ID of the reward to redeem
   * @returns Result object with success status and redemption details
   */
  const redeemReward = useCallback(async (rewardId: string) => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsRedeeming(true);

    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem reward');
      }

      return { success: true, redemption: data.redemption };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to redeem reward';
      return { success: false, error: message };
    } finally {
      setIsRedeeming(false);
    }
  }, [userId]);

  return {
    redemptions,
    loading,
    isRedeeming,
    redeemReward,
  };
}

/**
 * Hook for canteen/admin staff to verify redemptions.
 * Used in the admin panel for processing reward claims.
 */
export function useRedemptionVerification() {
  const [pendingRedemptions, setPendingRedemptions] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all pending redemptions
  useEffect(() => {
    async function fetchPending() {
      try {
        const { data, error } = await supabase
          .from('reward_redemptions')
          .select(`
            *,
            reward:rewards (id, name, category, image_url),
            user:users (id, name, email, avatar_url)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setPendingRedemptions(data || []);
      } catch (err) {
        console.error('Error fetching pending redemptions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPending();

    // Real-time updates for pending redemptions
    const channel = supabase
      .channel('pending-redemptions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reward_redemptions',
        },
        () => fetchPending()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * Verify a redemption (mark as completed).
   * Called by canteen staff when user claims their reward.
   */
  const verifyRedemption = useCallback(async (
    redemptionId: string, 
    verifierId: string
  ) => {
    try {
      const { error } = await supabase
        .from('reward_redemptions')
        .update({
          status: 'verified',
          verified_by: verifierId,
          verified_at: new Date().toISOString(),
        })
        .eq('id', redemptionId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error verifying redemption:', err);
      return { success: false, error: 'Failed to verify redemption' };
    }
  }, []);

  return {
    pendingRedemptions,
    loading,
    verifyRedemption,
  };
}
