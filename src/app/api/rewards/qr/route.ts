/**
 * ============================================================================
 * SECURE QR CODE GENERATION API
 * ============================================================================
 * Generates cryptographically signed QR codes for redemptions.
 * QR codes include HMAC signature and timestamp for security.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Use admin client for all DB operations (bypasses RLS)
const supabase = supabaseAdmin;
import { generateSecureQR } from '@/lib/qrSecurity';

/**
 * POST /api/rewards/qr
 * Generate a secure QR code for a redemption
 * 
 * Request body:
 * - redemptionId: UUID of the redemption
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { redemptionId } = await request.json();

    if (!redemptionId) {
      return NextResponse.json(
        { error: 'Redemption ID is required' },
        { status: 400 }
      );
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get redemption details
    const { data: redemption, error: redemptionError } = await supabase
      .from('redemptions')
      .select('id, redemption_code, user_id, reward_id, status, expires_at')
      .eq('id', redemptionId)
      .eq('user_id', userData.id)
      .single();

    if (redemptionError || !redemption) {
      return NextResponse.json(
        { error: 'Redemption not found' },
        { status: 404 }
      );
    }

    // Check if redemption is valid for QR generation
    if (redemption.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot generate QR code for ${redemption.status} redemption` },
        { status: 400 }
      );
    }

    // Check expiration
    if (redemption.expires_at && new Date(redemption.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This redemption has expired' },
        { status: 400 }
      );
    }

    // Generate secure QR code
    const qrData = generateSecureQR(
      redemption.id,
      redemption.redemption_code,
      redemption.user_id,
      redemption.reward_id
    );

    return NextResponse.json({
      success: true,
      qrData,
      redemptionCode: redemption.redemption_code,
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
