/**
 * ============================================================================
 * GCASH DONATIONS API
 * ============================================================================
 * Handles GCash donation submissions from both guests and authenticated users.
 * Includes receipt upload and verification workflow.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/donations/gcash
 * Submit a GCash donation with receipt.
 * Can be used by both authenticated users and guests.
 * 
 * Request Body:
 * - campaign_id: UUID of the campaign
 * - amount: Donation amount in PHP
 * - receipt_url: URL of uploaded receipt image
 * - gcash_reference: GCash transaction reference number
 * - donor_name: Name for guest donations (optional if authenticated)
 * - donor_email: Email for guest donations (optional if authenticated)
 * - message: Optional message with donation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    const body = await request.json();
    
    const { 
      campaign_id, 
      amount, 
      receipt_url, 
      gcash_reference,
      donor_name,
      donor_email,
      message = null 
    } = body;

    // Validate required fields
    if (!campaign_id) {
      return NextResponse.json(
        { success: false, message: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid donation amount is required' },
        { status: 400 }
      );
    }

    if (!receipt_url) {
      return NextResponse.json(
        { success: false, message: 'Receipt image is required' },
        { status: 400 }
      );
    }

    if (!gcash_reference) {
      return NextResponse.json(
        { success: false, message: 'GCash reference number is required' },
        { status: 400 }
      );
    }

    // For guest donations, name and email are required
    if (!session?.user?.email && (!donor_name || !donor_email)) {
      return NextResponse.json(
        { success: false, message: 'Name and email are required for guest donations' },
        { status: 400 }
      );
    }

    // Verify campaign exists and accepts GCash
    const { data: campaign, error: campaignError } = await supabase
      .from('donation_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('is_active', true)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found or inactive' },
        { status: 404 }
      );
    }

    if (!campaign.accepts_gcash) {
      return NextResponse.json(
        { success: false, message: 'This campaign does not accept GCash donations' },
        { status: 400 }
      );
    }

    // Check for duplicate reference number (prevent double submission)
    const { data: existingDonation } = await supabase
      .from('gcash_donations')
      .select('id')
      .eq('gcash_reference', gcash_reference)
      .single();

    if (existingDonation) {
      return NextResponse.json(
        { success: false, message: 'This GCash reference has already been submitted' },
        { status: 400 }
      );
    }

    // Get user ID if authenticated
    let userId = null;
    if (session?.user?.email) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, is_banned')
        .eq('email', session.user.email)
        .single();

      if (userData?.is_banned) {
        return NextResponse.json(
          { success: false, message: 'Account is suspended' },
          { status: 403 }
        );
      }
      userId = userData?.id;
    }

    // Create the donation record (pending verification)
    const { data: donation, error: donationError } = await supabase
      .from('gcash_donations')
      .insert({
        user_id: userId,
        campaign_id: campaign_id,
        amount: amount,
        receipt_url: receipt_url,
        gcash_reference: gcash_reference,
        donor_name: donor_name || session?.user?.name,
        donor_email: donor_email || session?.user?.email,
        message: message?.substring(0, 500),
        verification_status: 'pending',
      })
      .select()
      .single();

    if (donationError) throw donationError;

    // Log audit entry if user is authenticated
    if (userId) {
      await supabase
        .from('audit_logs')
        .insert({
          actor_id: userId,
          action: 'gcash_donation_submitted',
          entity_type: 'donation_campaigns',
          entity_id: campaign_id,
          new_values: { amount, gcash_reference },
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Donation submitted! It will be verified by our team.',
      donation: {
        id: donation.id,
        amount: amount,
        status: 'pending',
        campaign: campaign.title,
      },
    });

  } catch (error) {
    console.error('Error processing GCash donation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit donation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/donations/gcash
 * Get user's GCash donation history (authenticated only).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get donations with campaign info
    const { data: donations, error: donationsError } = await supabase
      .from('gcash_donations')
      .select(`
        *,
        donation_campaigns (
          id,
          title
        )
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });

    if (donationsError) throw donationsError;

    return NextResponse.json({
      success: true,
      donations: donations || [],
    });

  } catch (error) {
    console.error('Error fetching GCash donations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}
