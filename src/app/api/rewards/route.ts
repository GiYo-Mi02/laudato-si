/**
 * ============================================================================
 * REWARDS LIST API
 * ============================================================================
 * Public endpoint to fetch available rewards.
 * Returns active rewards with remaining stock.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Use admin client for all DB operations (bypasses RLS)
const supabase = supabaseAdmin;

/**
 * GET /api/rewards
 * Fetch all available rewards.
 * 
 * Query params:
 * - category: Filter by reward category
 * - limit: Maximum number of results (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('cost', { ascending: true })  // Database uses 'cost' column
      .limit(limit);

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category);
    }

    const { data: rewards, error } = await query;

    if (error) throw error;

    // Filter out items with no stock and check validity dates
    const now = new Date();
    const availableRewards = (rewards || []).filter(reward => {
      // Check stock
      if (reward.remaining_quantity !== null && reward.remaining_quantity <= 0) {
        return false;
      }
      // Check validity period
      if (reward.valid_from && new Date(reward.valid_from) > now) {
        return false;
      }
      if (reward.valid_until && new Date(reward.valid_until) < now) {
        return false;
      }
      return true;
    }).map(reward => ({
      ...reward,
      point_cost: reward.cost,  // Map 'cost' to 'point_cost' for frontend
    }));

    return NextResponse.json({ 
      rewards: availableRewards,
      total: availableRewards.length 
    });

  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' }, 
      { status: 500 }
    );
  }
}
