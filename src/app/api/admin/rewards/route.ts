/**
 * ============================================================================
 * ADMIN REWARDS API
 * ============================================================================
 * Full CRUD operations for managing rewards in the marketplace.
 * Includes stock management and category handling.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateAdminSession, hasPermission, logAdminAction } from '@/lib/adminAuth';

/**
 * GET /api/admin/rewards
 * List all rewards (including inactive) with full details.
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

    if (!hasPermission(adminCheck.user.role, 'rewards')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let query = supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: rewards, error } = await query;

    if (error) throw error;

    // Map database field names to frontend field names for compatibility
    // Database uses 'cost', frontend expects 'point_cost'
    const mappedRewards = (rewards || []).map(reward => ({
      ...reward,
      point_cost: reward.cost,  // Map 'cost' to 'point_cost' for frontend
    }));

    return NextResponse.json({
      success: true,
      rewards: mappedRewards,
    });

  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/rewards
 * Create a new reward.
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

    if (!hasPermission(adminCheck.user.role, 'rewards')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      points_cost,  // Accept points_cost from frontend
      point_cost,   // Or point_cost if sent directly
      category, 
      image_url,
      stock_quantity,
      total_quantity,
      valid_until,
      eligible_roles,
    } = body;

    // Use whichever cost field is provided (normalize to point_cost for DB)
    const costValue = point_cost || points_cost;

    // Validate required fields
    if (!name || !costValue || !category) {
      return NextResponse.json(
        { success: false, message: 'Name, points cost, and category are required' },
        { status: 400 }
      );
    }

    if (costValue <= 0) {
      return NextResponse.json(
        { success: false, message: 'Points cost must be positive' },
        { status: 400 }
      );
    }

    const { data: reward, error } = await supabase
      .from('rewards')
      .insert({
        name,
        description: description || null,
        cost: costValue,  // Use correct column name from actual database (001_add_gamification.sql)
        category,
        image_url: image_url || null,
        total_quantity: total_quantity || stock_quantity || null,
        remaining_quantity: total_quantity || stock_quantity || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(
      adminCheck.user.id,
      'reward_created',
      'rewards',
      reward.id,
      undefined,
      { name, cost: costValue, category }
    );

    return NextResponse.json({
      success: true,
      message: 'Reward created successfully',
      reward,
    });

  } catch (error) {
    console.error('Error creating reward:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create reward' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/rewards
 * Update an existing reward.
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

    if (!hasPermission(adminCheck.user.role, 'rewards')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Reward ID is required' },
        { status: 400 }
      );
    }

    // Get current reward for audit log
    const { data: currentReward } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentReward) {
      return NextResponse.json(
        { success: false, message: 'Reward not found' },
        { status: 404 }
      );
    }

    // Update reward
    const { data: reward, error } = await supabase
      .from('rewards')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(
      adminCheck.user.id,
      'reward_updated',
      'rewards',
      id,
      currentReward,
      updateFields
    );

    return NextResponse.json({
      success: true,
      message: 'Reward updated successfully',
      reward,
    });

  } catch (error) {
    console.error('Error updating reward:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update reward' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/rewards
 * Soft-delete a reward (set inactive).
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

    if (!hasPermission(adminCheck.user.role, 'rewards')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Reward ID is required' },
        { status: 400 }
      );
    }

    // Soft delete - just deactivate
    const { error } = await supabase
      .from('rewards')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    await logAdminAction(
      adminCheck.user.id,
      'reward_deleted',
      'rewards',
      id,
      { is_active: true },
      { is_active: false }
    );

    return NextResponse.json({
      success: true,
      message: 'Reward deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting reward:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete reward' },
      { status: 500 }
    );
  }
}
