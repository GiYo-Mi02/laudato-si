import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateSecureQR } from '@/lib/qrSecurity';
import { getServerSession } from 'next-auth';

/**
 * POST /api/rewards/verify
 * Verify and process a scanned QR code for reward redemption
 */
export async function POST(request: Request) {
  try {
    // Get admin session
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin authentication required' },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Verify admin role
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (adminUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get QR data from request
    const { qrData } = await request.json();

    if (!qrData) {
      return NextResponse.json(
        { error: 'QR data is required' },
        { status: 400 }
      );
    }

    // Verify QR code signature and expiration
    const verification = validateSecureQR(qrData);

    if (!verification.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error,
          expired: verification.error?.includes('expired'),
          tampered: verification.error?.includes('Invalid signature'),
        },
        { status: 400 }
      );
    }

    // Get redemption details
    const redemptionId = verification.data?.redemptionId;

    if (!redemptionId) {
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400 }
      );
    }

    // Fetch redemption from database
    const { data: redemption, error: fetchError } = await supabase
      .from('redemptions')
      .select(`
        *,
        reward:rewards(*),
        user:users(*)
      `)
      .eq('id', redemptionId)
      .single();

    if (fetchError || !redemption) {
      return NextResponse.json(
        { error: 'Redemption not found' },
        { status: 404 }
      );
    }

    // Check if already redeemed
    if (redemption.status === 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: 'This reward has already been claimed',
          redemption: {
            id: redemption.id,
            rewardName: redemption.reward.name,
            userName: redemption.user.display_name || redemption.user.email,
            status: redemption.status,
            claimedAt: redemption.claimed_at,
          },
        },
        { status: 400 }
      );
    }

    // Check if cancelled
    if (redemption.status === 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          error: 'This redemption has been cancelled',
        },
        { status: 400 }
      );
    }

    // Mark as completed
    const { data: updatedRedemption, error: updateError } = await supabase
      .from('redemptions')
      .update({
        status: 'completed',
        claimed_at: new Date().toISOString(),
      })
      .eq('id', redemptionId)
      .select(`
        *,
        reward:rewards(*),
        user:users(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating redemption:', updateError);
      return NextResponse.json(
        { error: 'Failed to process redemption' },
        { status: 500 }
      );
    }

    // Return success with redemption details
    return NextResponse.json({
      success: true,
      message: 'Reward claimed successfully!',
      redemption: {
        id: updatedRedemption.id,
        rewardName: updatedRedemption.reward.name,
        userName: updatedRedemption.user.display_name || updatedRedemption.user.email,
        userEmail: updatedRedemption.user.email,
        pointsCost: updatedRedemption.reward.cost,
        claimedAt: updatedRedemption.claimed_at,
        status: updatedRedemption.status,
      },
    });

  } catch (error) {
    console.error('Error verifying QR code:', error);
    return NextResponse.json(
      { error: 'Failed to verify QR code' },
      { status: 500 }
    );
  }
}
