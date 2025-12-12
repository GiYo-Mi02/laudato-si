/**
 * ============================================================================
 * REWARDS API
 * ============================================================================
 * Handles reward listing and redemption operations.
 * Validates user points, stock availability, and creates redemption records.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { randomUUID } from 'crypto';

/**
 * POST /api/rewards/redeem
 * Redeem a reward using points.
 * 
 * Request body:
 * - rewardId: UUID of the reward to redeem
 * 
 * Validates:
 * - User authentication
 * - Sufficient points balance
 * - Reward availability and stock
 * - User role eligibility
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const { rewardId } = await request.json();

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' }, 
        { status: 400 }
      );
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, total_points, role, is_banned')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Check if user is banned
    if (userData.is_banned) {
      return NextResponse.json(
        { error: 'Account is suspended' }, 
        { status: 403 }
      );
    }

    // Only students and employees can redeem rewards
    if (!['student', 'employee'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Only UMak students and employees can redeem rewards' }, 
        { status: 403 }
      );
    }

    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('is_active', true)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json(
        { error: 'Reward not found or unavailable' }, 
        { status: 404 }
      );
    }

    // Check validity period
    const now = new Date();
    if (reward.valid_from && new Date(reward.valid_from) > now) {
      return NextResponse.json(
        { error: 'Reward is not yet available' }, 
        { status: 400 }
      );
    }
    if (reward.valid_until && new Date(reward.valid_until) < now) {
      return NextResponse.json(
        { error: 'Reward has expired' }, 
        { status: 400 }
      );
    }

    // Check stock availability
    if (reward.remaining_quantity !== null && reward.remaining_quantity <= 0) {
      return NextResponse.json(
        { error: 'Reward is out of stock' }, 
        { status: 400 }
      );
    }

    // Check user has enough points
    if (userData.total_points < reward.point_cost) {
      return NextResponse.json(
        { 
          error: 'Insufficient points',
          required: reward.point_cost,
          available: userData.total_points 
        }, 
        { status: 400 }
      );
    }

    // Generate unique redemption code for QR verification
    const redemptionCode = `RDM-${randomUUID().slice(0, 8).toUpperCase()}`;
    
    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('reward_redemptions')
      .insert({
        user_id: userData.id,
        reward_id: rewardId,
        points_spent: reward.point_cost,
        status: 'pending',
        redemption_code: redemptionCode,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (redemptionError) {
      console.error('Redemption insert error:', redemptionError);
      throw redemptionError;
    }

    // Deduct points from user
    const { error: pointsError } = await supabase
      .from('users')
      .update({ 
        total_points: userData.total_points - reward.point_cost 
      })
      .eq('id', userData.id);

    if (pointsError) throw pointsError;

    // Record point transaction for audit trail
    await supabase
      .from('point_transactions')
      .insert({
        user_id: userData.id,
        amount: -reward.point_cost, // Negative = spending
        transaction_type: 'reward_redemption',
        reference_id: redemption.id,
        description: `Redeemed: ${reward.name}`,
      });

    // Update reward stock if limited
    if (reward.remaining_quantity !== null) {
      await supabase
        .from('rewards')
        .update({ 
          remaining_quantity: reward.remaining_quantity - 1 
        })
        .eq('id', rewardId);
    }

    // Log audit entry
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: userData.id,
        action: 'reward_redeemed',
        entity_type: 'reward_redemptions',
        entity_id: redemption.id,
        new_values: { 
          reward_name: reward.name, 
          points_spent: reward.point_cost,
          redemption_code: redemptionCode 
        },
      });

    return NextResponse.json({
      success: true,
      redemption: {
        ...redemption,
        reward,
      },
      newPointsBalance: userData.total_points - reward.point_cost,
    });

  } catch (error) {
    console.error('Error processing reward redemption:', error);
    return NextResponse.json(
      { error: 'Failed to process redemption' }, 
      { status: 500 }
    );
  }
}
