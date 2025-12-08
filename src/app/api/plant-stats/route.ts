import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: plantStats, error } = await supabase
      .from('plant_stats')
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ plantStats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching plant stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plant stats' },
      { status: 500 }
    );
  }
}
