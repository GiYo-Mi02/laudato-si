import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Use admin client for all DB operations (bypasses RLS)
const supabase = supabaseAdmin;
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, question, options, correct_answer, placeholder } = body;

    const { data, error } = await supabase
      .from('questions')
      .insert({
        type,
        question,
        options: options || null,
        correct_answer: correct_answer || null,
        placeholder: placeholder || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ question: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
