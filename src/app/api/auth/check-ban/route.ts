/**
 * ============================================================================
 * CHECK BAN STATUS API
 * ============================================================================
 * Checks if the current user is banned and returns ban information.
 * Used by the banned page and middleware to verify user status.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/auth/check-ban
 * Check if the current user is banned.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, is_banned, ban_reason, updated_at')
      .eq('email', session.user.email)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      banInfo: {
        is_banned: user?.is_banned || false,
        ban_reason: user?.ban_reason || null,
        banned_at: user?.is_banned ? user?.updated_at : null,
      },
    });

  } catch (error) {
    console.error('Error checking ban status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
