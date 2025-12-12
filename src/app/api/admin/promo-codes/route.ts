/**
 * ============================================================================
 * ADMIN PROMO CODES API
 * ============================================================================
 * Full CRUD operations for managing promo codes.
 * Supports single-use and multi-use codes with various restrictions.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateAdminSession, hasPermission, logAdminAction } from '@/lib/adminAuth';

/**
 * GET /api/admin/promo-codes
 * List all promo codes with usage statistics.
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

    if (!hasPermission(adminCheck.user.role, 'promo_codes')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let query = supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: codes, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      promo_codes: codes || [],
    });

  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch promo codes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/promo-codes
 * Create a new promo code.
 * 
 * Request Body:
 * - code: Unique code string (auto-generated if not provided)
 * - code_type: 'points' | 'reward' | 'multiplier'
 * - value: Points amount, reward_id, or multiplier value
 * - max_uses: Max total uses (null for unlimited)
 * - is_single_use_per_user: If true, each user can only use once
 * - valid_from: Start date (optional)
 * - valid_until: End date (optional)
 * - eligible_roles: Array of roles that can use this code
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

    if (!hasPermission(adminCheck.user.role, 'promo_codes')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    let { 
      code, 
      code_type = 'points',
      value,
      max_uses,
      is_single_use_per_user = true,
      valid_from,
      valid_until,
      eligible_roles,
      description,
    } = body;

    // Auto-generate code if not provided
    if (!code) {
      code = generatePromoCode();
    }

    // Validate code uniqueness
    const { data: existingCode } = await supabase
      .from('promo_codes')
      .select('id')
      .ilike('code', code)
      .single();

    if (existingCode) {
      return NextResponse.json(
        { success: false, message: 'A promo code with this name already exists' },
        { status: 400 }
      );
    }

    // Validate value based on code_type
    if (!value) {
      return NextResponse.json(
        { success: false, message: 'Value is required' },
        { status: 400 }
      );
    }

    if (code_type === 'points' && (value <= 0 || !Number.isInteger(value))) {
      return NextResponse.json(
        { success: false, message: 'Points value must be a positive integer' },
        { status: 400 }
      );
    }

    const { data: promoCode, error } = await supabase
      .from('promo_codes')
      .insert({
        code: code.toUpperCase(),
        code_type,
        value,
        max_uses: max_uses || null,
        is_single_use_per_user,
        valid_from: valid_from || null,
        valid_until: valid_until || null,
        eligible_roles: eligible_roles || null,
        description: description || null,
        is_active: true,
        current_uses: 0,
        created_by: adminCheck.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(
      adminCheck.user.id,
      'promo_code_created',
      'promo_codes',
      promoCode.id,
      undefined,
      { code: promoCode.code, code_type, value }
    );

    return NextResponse.json({
      success: true,
      message: 'Promo code created successfully',
      promo_code: promoCode,
    });

  } catch (error) {
    console.error('Error creating promo code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create promo code' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/promo-codes
 * Update an existing promo code.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    const adminCheck = await validateAdminSession(session?.user?.email);
    
    if (!adminCheck.isValid || !adminCheck.user) {
      return NextResponse.json(
        { success: false, message: adminCheck.error },
        { status: 403 }
      );
    }

    if (!hasPermission(adminCheck.user.role, 'promo_codes')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Promo code ID is required' },
        { status: 400 }
      );
    }

    // Get current code for audit log
    const { data: currentCode } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentCode) {
      return NextResponse.json(
        { success: false, message: 'Promo code not found' },
        { status: 404 }
      );
    }

    // Uppercase the code if being changed
    if (updateFields.code) {
      updateFields.code = updateFields.code.toUpperCase();
    }

    const { data: promoCode, error } = await supabase
      .from('promo_codes')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(
      adminCheck.user.id,
      'promo_code_updated',
      'promo_codes',
      id,
      currentCode,
      updateFields
    );

    return NextResponse.json({
      success: true,
      message: 'Promo code updated successfully',
      promo_code: promoCode,
    });

  } catch (error) {
    console.error('Error updating promo code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update promo code' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/promo-codes
 * Deactivate a promo code.
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

    if (!hasPermission(adminCheck.user.role, 'promo_codes')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Promo code ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    await logAdminAction(
      adminCheck.user.id,
      'promo_code_deleted',
      'promo_codes',
      id,
      { is_active: true },
      { is_active: false }
    );

    return NextResponse.json({
      success: true,
      message: 'Promo code deactivated successfully',
    });

  } catch (error) {
    console.error('Error deleting promo code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete promo code' },
      { status: 500 }
    );
  }
}

/**
 * Generate a random promo code (8 characters, alphanumeric)
 */
function generatePromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
