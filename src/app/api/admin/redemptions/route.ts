/**
 * ============================================================================
 * ADMIN REDEMPTIONS API
 * ============================================================================
 * Manages reward redemption verification (QR code scanning).
 * Used primarily by Canteen Admins at point of redemption.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateAdminSession, hasPermission, logAdminAction } from '@/lib/adminAuth';

/**
 * GET /api/admin/redemptions
 * List redemptions with optional filters.
 * 
 * Query Parameters:
 * - status: 'pending' | 'verified' | 'expired' | 'cancelled'
 * - user_id: Filter by specific user
 * - page: Page number
 * - limit: Items per page
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    const adminCheck = await validateAdminSession(session?.user?.email);
    
    if (!adminCheck.isValid || !adminCheck.user) {
      return NextResponse.json(
        { success: false, message: adminCheck.error },
        { status: 403 }
      );
    }

    if (!hasPermission(adminCheck.user.role, 'redemptions')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('reward_redemptions')
      .select(`
        *,
        user:users!reward_redemptions_user_id_fkey (
          id,
          name,
          email,
          avatar_url
        ),
        reward:rewards!reward_redemptions_reward_id_fkey (
          id,
          name,
          category,
          point_cost
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: redemptions, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      redemptions: redemptions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching redemptions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch redemptions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/redemptions
 * Verify a redemption by QR code or redemption ID.
 * 
 * Request Body:
 * - redemption_id: UUID of the redemption (optional if qr_code provided)
 * - qr_code: The QR code string (optional if redemption_id provided)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    const adminCheck = await validateAdminSession(session?.user?.email);
    
    if (!adminCheck.isValid || !adminCheck.user) {
      return NextResponse.json(
        { success: false, message: adminCheck.error },
        { status: 403 }
      );
    }

    if (!hasPermission(adminCheck.user.role, 'redemptions')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { redemption_id, qr_code } = await request.json();

    if (!redemption_id && !qr_code) {
      return NextResponse.json(
        { success: false, message: 'Redemption ID or QR code is required' },
        { status: 400 }
      );
    }

    // Find the redemption
    let query = supabase
      .from('reward_redemptions')
      .select(`
        *,
        users (
          id,
          name,
          email
        ),
        rewards (
          id,
          name,
          category
        )
      `);

    if (qr_code) {
      query = query.eq('qr_code', qr_code);
    } else {
      query = query.eq('id', redemption_id);
    }

    const { data: redemption, error: findError } = await query.single();

    if (findError || !redemption) {
      return NextResponse.json(
        { success: false, message: 'Redemption not found' },
        { status: 404 }
      );
    }

    // Check redemption status
    if (redemption.status === 'verified') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'This redemption has already been verified',
          redemption: {
            id: redemption.id,
            verified_at: redemption.verified_at,
            reward_name: redemption.rewards?.name,
          },
        },
        { status: 400 }
      );
    }

    if (redemption.status === 'cancelled') {
      return NextResponse.json(
        { success: false, message: 'This redemption was cancelled' },
        { status: 400 }
      );
    }

    if (redemption.status === 'expired') {
      return NextResponse.json(
        { success: false, message: 'This redemption has expired' },
        { status: 400 }
      );
    }

    // Check expiry
    if (redemption.expires_at && new Date(redemption.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('reward_redemptions')
        .update({ status: 'expired' })
        .eq('id', redemption.id);

      return NextResponse.json(
        { success: false, message: 'This redemption has expired' },
        { status: 400 }
      );
    }

    // Verify the redemption
    const { error: updateError } = await supabase
      .from('reward_redemptions')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: adminCheck.user.id,
      })
      .eq('id', redemption.id);

    if (updateError) throw updateError;

    await logAdminAction(
      adminCheck.user.id,
      'redemption_verified',
      'reward_redemptions',
      redemption.id,
      { status: 'pending' },
      { status: 'verified' }
    );

    return NextResponse.json({
      success: true,
      message: 'Redemption verified successfully!',
      redemption: {
        id: redemption.id,
        user: redemption.users?.name || redemption.users?.email,
        reward: redemption.rewards?.name,
        category: redemption.rewards?.category,
        verified_at: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error verifying redemption:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify redemption' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/redemptions
 * Cancel a pending redemption and refund points.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    const adminCheck = await validateAdminSession(session?.user?.email);
    
    if (!adminCheck.isValid || !adminCheck.user) {
      return NextResponse.json(
        { success: false, message: adminCheck.error },
        { status: 403 }
      );
    }

    if (!hasPermission(adminCheck.user.role, 'redemptions')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Redemption ID is required' },
        { status: 400 }
      );
    }

    // Get the redemption
    const { data: redemption, error: findError } = await supabase
      .from('reward_redemptions')
      .select(`
        *,
        reward:rewards!reward_redemptions_reward_id_fkey (point_cost)
      `)
      .eq('id', id)
      .single();

    if (findError || !redemption) {
      return NextResponse.json(
        { success: false, message: 'Redemption not found' },
        { status: 404 }
      );
    }

    if (redemption.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Only pending redemptions can be cancelled' },
        { status: 400 }
      );
    }

    // Refund points to user (use points_spent from redemption record)
    const pointsToRefund = redemption.points_spent || redemption.reward?.point_cost || 0;
    
    await supabase
      .from('users')
      .update({ 
        total_points: supabase.rpc('increment_points', { 
          user_id: redemption.user_id, 
          amount: pointsToRefund 
        })
      })
      .eq('id', redemption.user_id);

    // Actually, use a simpler approach - get current points then update
    const { data: userData } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', redemption.user_id)
      .single();

    if (userData) {
      await supabase
        .from('users')
        .update({ total_points: userData.total_points + pointsToRefund })
        .eq('id', redemption.user_id);
    }

    // Restore stock
    if (redemption.reward_id) {
      const { data: rewardData } = await supabase
        .from('rewards')
        .select('stock_quantity')
        .eq('id', redemption.reward_id)
        .single();

      if (rewardData && rewardData.stock_quantity !== null) {
        await supabase
          .from('rewards')
          .update({ stock_quantity: rewardData.stock_quantity + 1 })
          .eq('id', redemption.reward_id);
      }
    }

    // Record refund transaction
    await supabase
      .from('point_transactions')
      .insert({
        user_id: redemption.user_id,
        amount: pointsToRefund,
        transaction_type: 'refund',
        reference_id: redemption.id,
        description: `Refund for cancelled redemption`,
      });

    // Update redemption status
    await supabase
      .from('reward_redemptions')
      .update({ status: 'cancelled' })
      .eq('id', id);

    await logAdminAction(
      adminCheck.user.id,
      'redemption_cancelled',
      'reward_redemptions',
      id,
      { status: 'pending' },
      { status: 'cancelled', points_refunded: pointsToRefund }
    );

    return NextResponse.json({
      success: true,
      message: `Redemption cancelled. ${pointsToRefund} points refunded.`,
    });

  } catch (error) {
    console.error('Error cancelling redemption:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to cancel redemption' },
      { status: 500 }
    );
  }
}
