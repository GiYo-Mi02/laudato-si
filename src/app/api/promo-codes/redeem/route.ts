/**
 * ============================================================================
 * PROMO CODE REDEMPTION API
 * ============================================================================
 * Handles promo code validation and redemption.
 * Awards bonus points or rewards based on code configuration.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/promo-codes/redeem
 * Redeem a promo code to receive bonus points or rewards.
 * 
 * Request body:
 * - code: The promo code string
 * 
 * Validates:
 * - Code exists and is active
 * - Code hasn't expired
 * - Usage limits not exceeded
 * - User hasn't already used (if single-use per user)
 * - User role is eligible
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Promo code is required' }, 
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
        { success: false, message: 'User not found' }, 
        { status: 404 }
      );
    }

    if (userData.is_banned) {
      return NextResponse.json(
        { success: false, message: 'Account is suspended' }, 
        { status: 403 }
      );
    }

    // Find the promo code (case-insensitive)
    const { data: promoCode, error: promoError } = await supabase
      .from('promo_codes')
      .select('*')
      .ilike('code', code.trim())
      .eq('is_active', true)
      .single();

    if (promoError || !promoCode) {
      return NextResponse.json(
        { success: false, message: 'Invalid promo code' }, 
        { status: 404 }
      );
    }

    // Check validity period
    const now = new Date();
    if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
      return NextResponse.json(
        { success: false, message: 'This promo code is not yet active' }, 
        { status: 400 }
      );
    }
    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      return NextResponse.json(
        { success: false, message: 'This promo code has expired' }, 
        { status: 400 }
      );
    }

    // Check max uses
    if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json(
        { success: false, message: 'This promo code has reached its usage limit' }, 
        { status: 400 }
      );
    }

    // Check if user already used (if single use per user)
    if (promoCode.is_single_use_per_user) {
      const { data: existingUse } = await supabase
        .from('promo_code_uses')
        .select('id')
        .eq('promo_code_id', promoCode.id)
        .eq('user_id', userData.id)
        .single();

      if (existingUse) {
        return NextResponse.json(
          { success: false, message: 'You have already used this promo code' }, 
          { status: 400 }
        );
      }
    }

    // Check role eligibility
    if (promoCode.eligible_roles && promoCode.eligible_roles.length > 0) {
      if (!promoCode.eligible_roles.includes(userData.role)) {
        return NextResponse.json(
          { success: false, message: 'This promo code is not available for your account type' }, 
          { status: 403 }
        );
      }
    }

    // Process the promo code based on type
    let pointsGranted = 0;

    if (promoCode.code_type === 'points') {
      pointsGranted = promoCode.value;

      // Add points to user
      await supabase
        .from('users')
        .update({ 
          total_points: userData.total_points + pointsGranted 
        })
        .eq('id', userData.id);

      // Record point transaction
      await supabase
        .from('point_transactions')
        .insert({
          user_id: userData.id,
          amount: pointsGranted,
          transaction_type: 'promo_code',
          reference_id: promoCode.id,
          description: `Promo code: ${promoCode.code} (+${pointsGranted} pts)`,
        });
    }
    // Additional code_type handling (reward, multiplier) can be added here

    // Record promo code usage
    await supabase
      .from('promo_code_uses')
      .insert({
        promo_code_id: promoCode.id,
        user_id: userData.id,
        points_granted: pointsGranted,
      });

    // Increment usage counter
    await supabase
      .from('promo_codes')
      .update({ 
        current_uses: promoCode.current_uses + 1 
      })
      .eq('id', promoCode.id);

    // Log audit entry
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: userData.id,
        action: 'promo_code_redeemed',
        entity_type: 'promo_codes',
        entity_id: promoCode.id,
        new_values: { 
          code: promoCode.code, 
          points_granted: pointsGranted 
        },
      });

    return NextResponse.json({
      success: true,
      message: `Promo code redeemed! You received ${pointsGranted} points.`,
      pointsGranted,
      newPointsBalance: userData.total_points + pointsGranted,
    });

  } catch (error) {
    console.error('Error redeeming promo code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to redeem promo code' }, 
      { status: 500 }
    );
  }
}
