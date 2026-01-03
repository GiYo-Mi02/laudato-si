/**
 * ============================================================================
 * ADMIN USERS API
 * ============================================================================
 * Provides user management capabilities for administrators.
 * Supports listing, role updates, banning, and point adjustments.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  validateAdminSession, 
  hasPermission, 
  canManageRole, 
  logAdminAction 
} from '@/lib/adminAuth';
import type { UserRole } from '@/types';

/**
 * GET /api/admin/users
 * Retrieve paginated user list with search and filters.
 * 
 * Query Parameters:
 * - search: Search by name or email
 * - role: Filter by role
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
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

    if (!hasPermission(adminCheck.user.role, 'users')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply role filter
    if (roleFilter) {
      query = query.eq('role', roleFilter);
    }

    // Execute with pagination
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Update user properties (role, ban status, points).
 * 
 * Request Body:
 * - user_id: UUID of user to update
 * - action: 'update_role' | 'toggle_ban' | 'adjust_points'
 * - value: New role / ban reason / points amount
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

    if (!hasPermission(adminCheck.user.role, 'users')) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { user_id, action, value, reason } = await request.json();

    if (!user_id || !action) {
      return NextResponse.json(
        { success: false, message: 'User ID and action are required' },
        { status: 400 }
      );
    }

    // Get target user
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify permission to manage this user
    if (!canManageRole(adminCheck.user.role, targetUser.role as UserRole)) {
      return NextResponse.json(
        { success: false, message: 'Cannot manage users with equal or higher role' },
        { status: 403 }
      );
    }

    let updateData: Record<string, any> = {};
    let auditAction = '';
    let oldValues: Record<string, any> = {};
    let newValues: Record<string, any> = {};

    switch (action) {
      case 'update_role':
        const newRole = value as UserRole;
        // Verify admin can assign this role
        if (!canManageRole(adminCheck.user.role, newRole)) {
          return NextResponse.json(
            { success: false, message: 'Cannot assign this role' },
            { status: 403 }
          );
        }
        updateData = { role: newRole };
        auditAction = 'user_role_updated';
        oldValues = { role: targetUser.role };
        newValues = { role: newRole };
        break;

      case 'toggle_ban':
        updateData = { 
          is_banned: !targetUser.is_banned,
          ban_reason: !targetUser.is_banned ? (reason || 'No reason provided') : null,
          banned_by: !targetUser.is_banned ? adminCheck.user.id : null,
          banned_at: !targetUser.is_banned ? new Date().toISOString() : null,
        };
        auditAction = targetUser.is_banned ? 'user_unbanned' : 'user_banned';
        oldValues = { is_banned: targetUser.is_banned };
        newValues = { is_banned: !targetUser.is_banned, reason };
        break;

      case 'adjust_points':
        const pointsChange = parseInt(value);
        if (isNaN(pointsChange)) {
          return NextResponse.json(
            { success: false, message: 'Invalid points value' },
            { status: 400 }
          );
        }
        const newTotal = Math.max(0, targetUser.total_points + pointsChange);
        updateData = { total_points: newTotal };
        auditAction = 'user_points_adjusted';
        oldValues = { total_points: targetUser.total_points };
        newValues = { total_points: newTotal, change: pointsChange, reason };

        // Create point transaction record
        await supabase
          .from('point_transactions')
          .insert({
            user_id: user_id,
            amount: pointsChange,
            transaction_type: 'admin_adjustment',
            description: reason || 'Admin adjustment',
            admin_id: adminCheck.user.id,
          });
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    // Apply update
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user_id);

    if (updateError) throw updateError;

    // Log audit entry
    await logAdminAction(
      adminCheck.user.id,
      auditAction,
      'users',
      user_id,
      oldValues,
      newValues
    );

    return NextResponse.json({
      success: true,
      message: `User ${action.replace('_', ' ')} successful`,
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user' },
      { status: 500 }
    );
  }
}
