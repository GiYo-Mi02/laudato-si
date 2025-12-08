import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { question_id, answer } = body;

    // Get user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id, last_contribution')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already contributed today
    const now = new Date();
    const lastContribution = userData.last_contribution
      ? new Date(userData.last_contribution)
      : null;
    
    if (lastContribution) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastContribDate = new Date(
        lastContribution.getFullYear(),
        lastContribution.getMonth(),
        lastContribution.getDate()
      );
      
      if (today.getTime() === lastContribDate.getTime()) {
        return NextResponse.json(
          { error: 'Already contributed today' },
          { status: 429 }
        );
      }
    }

    // Get question to check answer
    const { data: questionData } = await supabase
      .from('questions')
      .select('*')
      .eq('id', question_id)
      .single();

    const isCorrect =
      questionData?.type === 'quiz'
        ? answer === questionData.correct_answer
        : null;

    // Insert contribution
    const { data: contribution, error: insertError } = await supabase
      .from('contributions')
      .insert({
        user_id: userData.id,
        question_id,
        answer,
        is_correct: isCorrect,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update user's last contribution time
    await supabase
      .from('users')
      .update({ last_contribution: now.toISOString() })
      .eq('id', userData.id);

    // Get updated plant stats
    const { data: plantStats } = await supabase
      .from('plant_stats')
      .select('*')
      .single();

    return NextResponse.json(
      {
        contribution,
        plantStats,
        isCorrect,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting contribution:', error);
    return NextResponse.json(
      { error: 'Failed to submit contribution' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const { data: contributions, error } = await supabase
      .from('contributions')
      .select(`
        *,
        users (
          name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ contributions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributions' },
      { status: 500 }
    );
  }
}
