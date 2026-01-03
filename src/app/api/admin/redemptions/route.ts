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
import { validateSecureQR } from '@/lib/qrSecurity';

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
      .from('redemptions')
      .select(`
        *,
        user:users (
          id,
          name,
          email,
          avatar_url
        ),
        reward:rewards (
          id,
          name,
          category,
          cost
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

    const { redemption_id, qr_code, redemption_code } = await request.json();

    if (!redemption_id && !qr_code && !redemption_code) {
      return NextResponse.json(
        { success: false, message: 'Redemption ID or QR code is required' },
        { status: 400 }
      );
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    let redemptionIdToVerify: string | undefined = redemption_id;
    let redemptionCodeToVerify: string | undefined = redemption_code;
    let securityValidated = false;

    // If QR code provided, validate its security.
    // If it's not a secure-QR JSON payload, fall back to treating it as a redemption ID/code.
    if (qr_code) {
      const rawInput = String(qr_code).trim();
      let qrPayload = rawInput;

      // If a QR encodes a URL (e.g. https://.../scan?qr=...), extract the actual payload.
      try {
        const url = new URL(rawInput);
        const embedded = url.searchParams.get('qr');
        if (embedded) {
          qrPayload = decodeURIComponent(embedded);
        }
      } catch {
        // Not a URL, keep as-is
      }

      const qrValidation = validateSecureQR(qrPayload);

      if (qrValidation.isValid) {
        redemptionIdToVerify = qrValidation.data!.redemptionId;
        redemptionCodeToVerify = undefined;
        securityValidated = true;
      } else {
        const errorMessage = qrValidation.error || 'Invalid QR code';
        const isExpired = /expired/i.test(errorMessage);
        const isSignatureError = /signature|tamper|fake/i.test(errorMessage);
        const isFormatError = /format|missing required data|unsupported/i.test(errorMessage);

        // If the QR looks tampered/expired, do NOT fall back.
        if (isExpired || isSignatureError) {
          return NextResponse.json(
            {
              success: false,
              message: errorMessage,
              isSecurityError: true,
            },
            { status: 400 }
          );
        }

        // Otherwise (typically manual entry), treat input as redemption ID or redemption_code.
        if (!redemptionIdToVerify && !redemptionCodeToVerify && (isFormatError || !rawInput.startsWith('{'))) {
          if (UUID_REGEX.test(rawInput)) {
            redemptionIdToVerify = rawInput;
          } else {
            redemptionCodeToVerify = rawInput;
          }
        } else if (!isFormatError) {
          // Unknown validation failure: treat as security error.
          return NextResponse.json(
            {
              success: false,
              message: errorMessage,
              isSecurityError: true,
            },
            { status: 400 }
          );
        }
      }
    }

    if (!redemptionIdToVerify && !redemptionCodeToVerify) {
      return NextResponse.json(
        { success: false, message: 'Redemption ID, redemption code, or QR code is required' },
        { status: 400 }
      );
    }

    // Find the redemption
    let findQuery = supabase
      .from('redemptions')
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

    if (redemptionIdToVerify) {
      findQuery = findQuery.eq('id', redemptionIdToVerify);
    } else if (redemptionCodeToVerify) {
      findQuery = findQuery.eq('redemption_code', redemptionCodeToVerify);
    }

    const { data: redemption, error: findError } = await findQuery.single();

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
        .from('redemptions')
        .update({ status: 'expired' })
        .eq('id', redemption.id);

      return NextResponse.json(
        { success: false, message: 'This redemption has expired' },
        { status: 400 }
      );
    }

    // Verify the redemption
    const { error: updateError } = await supabase
      .from('redemptions')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
      })
      .eq('id', redemption.id);

    if (updateError) throw updateError;

    await logAdminAction(
      adminCheck.user.id,
      'redemption_verified',
      'redemptions',
      redemption.id,
      { status: 'pending' },
      { status: 'verified' }
    );

    return NextResponse.json({
      success: true,
      message: 'Redemption verified successfully!',
      securityValidated,
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
      .from('redemptions')
      .select(`
        *,
        reward:rewards (cost)
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
    const pointsToRefund = redemption.points_spent || redemption.reward?.cost || 0;
    
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
        .select('remaining_quantity')
        .eq('id', redemption.reward_id)
        .single();

      if (rewardData && rewardData.remaining_quantity !== null) {
        await supabase
          .from('rewards')
          .update({ remaining_quantity: rewardData.remaining_quantity + 1 })
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
      .from('redemptions')
      .update({ status: 'cancelled' })
      .eq('id', id);

    await logAdminAction(
      adminCheck.user.id,
      'redemption_cancelled',
      'redemptions',
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
