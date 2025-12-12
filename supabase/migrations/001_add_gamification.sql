-- ============================================================================
-- MIGRATION: Add Gamification Features
-- ============================================================================
-- This migration adds all the necessary columns and tables for the 
-- gamification system including points, streaks, and rewards.
-- ============================================================================

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Create streaks table for tracking user streaks
CREATE TABLE IF NOT EXISTS streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_pledge_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create rewards table for marketplace items
CREATE TABLE IF NOT EXISTS rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    cost INTEGER NOT NULL, -- Points required to redeem
    category TEXT NOT NULL CHECK (category IN ('food', 'merchandise', 'discount', 'other')),
    image_url TEXT,
    total_quantity INTEGER DEFAULT 0,
    remaining_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create redemptions table for tracking reward claims
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to redemptions table (if table already exists)
ALTER TABLE redemptions 
ADD COLUMN IF NOT EXISTS redemption_code TEXT UNIQUE DEFAULT substring(md5(random()::text || clock_timestamp()::text) from 1 for 8),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Drop existing check constraint if it exists and add updated one
DO $$ 
BEGIN
    ALTER TABLE redemptions DROP CONSTRAINT IF EXISTS redemptions_status_check;
    ALTER TABLE redemptions ADD CONSTRAINT redemptions_status_check 
        CHECK (status IN ('pending', 'verified', 'completed', 'cancelled', 'expired'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create pledge_messages table for user pledges
CREATE TABLE IF NOT EXISTS pledge_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    points_earned INTEGER DEFAULT 0,
    is_displayed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_reward_id ON redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON redemptions(redemption_code);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_pledge_messages_user_id ON pledge_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_pledge_messages_created_at ON pledge_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);

-- Enable Row Level Security on new tables
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledge_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for streaks (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Users can view all streaks" ON streaks;
DROP POLICY IF EXISTS "Users can insert their own streak" ON streaks;
DROP POLICY IF EXISTS "Users can update their own streak" ON streaks;

CREATE POLICY "Users can view all streaks" ON streaks FOR SELECT USING (true);
CREATE POLICY "Users can insert their own streak" ON streaks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own streak" ON streaks FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS Policies for rewards (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;
DROP POLICY IF EXISTS "Only admins can modify rewards" ON rewards;

CREATE POLICY "Anyone can view active rewards" ON rewards FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can modify rewards" ON rewards FOR ALL USING (false);

-- RLS Policies for redemptions (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Users can view their own redemptions" ON redemptions;
DROP POLICY IF EXISTS "Users can insert their own redemptions" ON redemptions;

CREATE POLICY "Users can view their own redemptions" ON redemptions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own redemptions" ON redemptions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for pledge_messages (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Anyone can view pledge messages" ON pledge_messages;
DROP POLICY IF EXISTS "Users can insert their own pledge" ON pledge_messages;

CREATE POLICY "Anyone can view pledge messages" ON pledge_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert their own pledge" ON pledge_messages FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Function to update streak on pledge
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS TABLE(current_streak INTEGER, points_awarded INTEGER) AS $$
DECLARE
    v_last_pledge_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_today DATE := CURRENT_DATE;
    v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
    v_points INTEGER;
BEGIN
    -- Get or create streak record
    SELECT last_pledge_date, streaks.current_streak, streaks.longest_streak
    INTO v_last_pledge_date, v_current_streak, v_longest_streak
    FROM streaks
    WHERE user_id = p_user_id;

    -- If no streak record exists, create one
    IF NOT FOUND THEN
        INSERT INTO streaks (user_id, current_streak, longest_streak, last_pledge_date)
        VALUES (p_user_id, 1, 1, v_today);
        
        v_current_streak := 1;
        v_points := 1;
    ELSE
        -- Calculate new streak
        IF v_last_pledge_date = v_today THEN
            -- Already pledged today, don't increment
            v_points := LEAST(v_current_streak, 5);
        ELSIF v_last_pledge_date = v_yesterday THEN
            -- Consecutive day, increment streak
            v_current_streak := v_current_streak + 1;
            v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
            v_points := LEAST(v_current_streak, 5);
            
            UPDATE streaks
            SET current_streak = v_current_streak,
                longest_streak = v_longest_streak,
                last_pledge_date = v_today,
                updated_at = NOW()
            WHERE user_id = p_user_id;
        ELSE
            -- Streak broken, reset to 1
            v_current_streak := 1;
            v_longest_streak := GREATEST(v_longest_streak, 1);
            v_points := 1;
            
            UPDATE streaks
            SET current_streak = 1,
                longest_streak = v_longest_streak,
                last_pledge_date = v_today,
                updated_at = NOW()
            WHERE user_id = p_user_id;
        END IF;
    END IF;

    -- Update user points and last contribution
    UPDATE users
    SET total_points = total_points + v_points,
        last_contribution = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT v_current_streak, v_points;
END;
$$ LANGUAGE plpgsql;

-- Add realtime publications for new tables (with safe checks)
DO $$
BEGIN
    -- Only add tables to publication if they're not already members
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'streaks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE streaks;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'pledge_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE pledge_messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'redemptions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE redemptions;
    END IF;
END $$;

-- Insert sample rewards (optional)
INSERT INTO rewards (name, description, cost, category, total_quantity, remaining_quantity, is_active) VALUES
('UMak Tumbler', 'Reusable stainless steel tumbler with UMak logo', 150, 'merchandise', 50, 50, true),
('Cafeteria 10% Discount', '10% discount on your next cafeteria purchase', 50, 'discount', 100, 100, true),
('Eco Tote Bag', 'Sustainable canvas tote bag', 100, 'merchandise', 30, 30, true),
('Free Coffee', 'One free coffee at the campus café', 75, 'food', 50, 50, true),
('Plant Kit', 'Indoor plant starter kit with seeds and pot', 200, 'other', 20, 20, true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE streaks IS 'Tracks daily pledge streaks for gamification';
COMMENT ON TABLE rewards IS 'Marketplace items users can redeem with points';
COMMENT ON TABLE redemptions IS 'History of reward redemptions by users';
COMMENT ON TABLE pledge_messages IS 'User pledge messages displayed on the main screen';
COMMENT ON COLUMN users.total_points IS 'Total points earned by user through pledges';
COMMENT ON COLUMN users.has_completed_onboarding IS 'Whether user has completed initial pledge flow';
