/**
 * ============================================================================
 * ADMIN IMAGE UPLOAD API
 * ============================================================================
 * Handles image uploads for admin functionality.
 * Stores images in Supabase Storage and returns public URLs.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateAdminSession } from '@/lib/adminAuth';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * POST /api/admin/upload
 * Upload an image file to Supabase Storage.
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `rewards/${filename}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // If storage doesn't exist, return base64 as fallback
      if (error.message.includes('Bucket not found') || 
          error.message.includes('not found') ||
          error.message.includes('bucket')) {
        console.warn('⚠️ Storage bucket "images" not found. Using base64 fallback.');
        console.warn('📖 See document/STORAGE_SETUP_GUIDE.md to set up Supabase Storage');
        
        // Return data URL as fallback
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;
        
        return NextResponse.json({
          success: true,
          url: dataUrl,
          warning: 'Storage not configured - using base64 (not recommended for production)',
          setupGuide: 'See document/STORAGE_SETUP_GUIDE.md',
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to upload image',
          error: error.message,
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
