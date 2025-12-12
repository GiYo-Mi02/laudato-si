/**
 * ============================================================================
 * ADMIN AUDIT LOGS API
 * ============================================================================
 * Provides access to system audit logs for compliance and debugging.
 * Super Admin only.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateAdminSession, hasPermission } from '@/lib/adminAuth';

/**
 * GET /api/admin/audit-logs
 * Retrieve paginated audit logs with filters.
 * 
 * Query Parameters:
 * - action: Filter by action type
 * - entity_type: Filter by entity type
 * - actor_id: Filter by admin who performed action
 * - start_date: Filter from date
 * - end_date: Filter to date
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

    // Audit logs are super admin only
    if (!hasPermission(adminCheck.user.role, 'audit_logs')) {
      return NextResponse.json(
        { success: false, message: 'Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entity_type');
    const actorId = searchParams.get('actor_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = (page - 1) * limit;

    // Build query with actor user info
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        actor:users!audit_logs_actor_id_fkey (
          id,
          name,
          email,
          role
        )
      `, { count: 'exact' });

    // Apply filters
    if (action) {
      query = query.eq('action', action);
    }
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (actorId) {
      query = query.eq('actor_id', actorId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Execute with pagination
    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get distinct action types for filter dropdown
    const { data: actionTypes } = await supabase
      .from('audit_logs')
      .select('action')
      .limit(100);

    const uniqueActions = Array.from(new Set(actionTypes?.map(a => a.action) || []));

    // Get distinct entity types for filter dropdown
    const { data: entityTypes } = await supabase
      .from('audit_logs')
      .select('entity_type')
      .limit(100);

    const uniqueEntities = Array.from(new Set(entityTypes?.map(e => e.entity_type) || []));

    return NextResponse.json({
      success: true,
      logs: logs || [],
      filters: {
        actions: uniqueActions,
        entityTypes: uniqueEntities,
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
