import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
          last_contribution: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          created_at?: string;
          last_contribution?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          created_at?: string;
          last_contribution?: string | null;
        };
      };
      contributions: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          answer: string;
          is_correct: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          answer: string;
          is_correct?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          answer?: string;
          is_correct?: boolean | null;
          created_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          type: 'quiz' | 'pledge';
          question: string;
          options: string[] | null;
          correct_answer: string | null;
          placeholder: string | null;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          type: 'quiz' | 'pledge';
          question: string;
          options?: string[] | null;
          correct_answer?: string | null;
          placeholder?: string | null;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          type?: 'quiz' | 'pledge';
          question?: string;
          options?: string[] | null;
          correct_answer?: string | null;
          placeholder?: string | null;
          created_at?: string;
          is_active?: boolean;
        };
      };
      plant_stats: {
        Row: {
          id: string;
          total_contributions: number;
          current_stage: 'seed' | 'sprout' | 'plant' | 'tree';
          updated_at: string;
        };
        Insert: {
          id?: string;
          total_contributions?: number;
          current_stage?: 'seed' | 'sprout' | 'plant' | 'tree';
          updated_at?: string;
        };
        Update: {
          id?: string;
          total_contributions?: number;
          current_stage?: 'seed' | 'sprout' | 'plant' | 'tree';
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
