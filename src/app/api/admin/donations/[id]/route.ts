/**
 * Admin Single Donation Campaign API Routes
 * 
 * This API handles individual campaign management.
 * 
 * Endpoints:
 * - PUT /api/admin/donations/[id] - Update campaign
 * - DELETE /api/admin/donations/[id] - Delete campaign
 * 
 * Access: Super Admin, SA Admin, Finance Admin
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from 'next-auth';
import { supabase } from "@/lib/supabase";
import { validateAdminSession, hasPermission, logAdminAction } from "@/lib/adminAuth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT - Update a donation campaign
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Get session and validate admin
    const session = await getServerSession(authOptions) as Session | null;
    const adminCheck = await validateAdminSession(session?.user?.email);
    
    if (!adminCheck.isValid || !adminCheck.user) {
      return NextResponse.json(
        { error: adminCheck.error || "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check permission
    if (!hasPermission(adminCheck.user.role, "donations")) {
      return NextResponse.json(
        { error: "You don't have permission to manage donations" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      title,
      description,
      goal_amount,
      image_url,
      end_date,
      is_active,
    } = body;
    
    // Build update object (only include provided fields)
    const updates: Record<string, any> = {};
    if (title !== undefined) {
      updates.title = title.trim();
      updates.name = title.trim();
    }
    if (description !== undefined) updates.description = description?.trim() || null;
    if (goal_amount !== undefined) {
      updates.goal_amount = goal_amount;
      updates.goal_points = goal_amount;
    }
    if (image_url !== undefined) updates.image_url = image_url?.trim() || null;
    if (end_date !== undefined) {
      updates.end_date = end_date || null;
      updates.ends_at = end_date || null;
    }
    if (is_active !== undefined) updates.is_active = is_active;
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }
    
    // Update campaign
    const { data: campaign, error } = await supabase
      .from("donation_campaigns")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating campaign:", error);
      return NextResponse.json(
        { error: "Failed to update campaign" },
        { status: 500 }
      );
    }
    
    // Log admin action
    await logAdminAction(
      adminCheck.user.id,
      "update_campaign",
      "donation_campaign",
      id,
      undefined,
      updates
    );
    
    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("Admin donations API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a donation campaign
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Get session and validate admin
    const session = await getServerSession(authOptions) as Session | null;
    const adminCheck = await validateAdminSession(session?.user?.email);
    
    if (!adminCheck.isValid || !adminCheck.user) {
      return NextResponse.json(
        { error: adminCheck.error || "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check permission
    if (!hasPermission(adminCheck.user.role, "donations")) {
      return NextResponse.json(
        { error: "You don't have permission to manage donations" },
        { status: 403 }
      );
    }
    
    // Get campaign title for logging
    const { data: existing } = await supabase
      .from("donation_campaigns")
      .select("title, name")
      .eq("id", id)
      .single();
    
    // Delete campaign (cascade will delete donations)
    const { error } = await supabase
      .from("donation_campaigns")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting campaign:", error);
      return NextResponse.json(
        { error: "Failed to delete campaign" },
        { status: 500 }
      );
    }
    
    // Log admin action
    await logAdminAction(
      adminCheck.user.id,
      "delete_campaign",
      "donation_campaign",
      id,
      { title: existing?.title || existing?.name },
      undefined
    );
    
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Admin donations API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
