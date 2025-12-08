-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_contribution TIMESTAMPTZ
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('quiz', 'pledge')),
    question TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT,
    placeholder TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    is_correct BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create plant_stats table (singleton for global stats)
CREATE TABLE IF NOT EXISTS plant_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    total_contributions INTEGER DEFAULT 0,
    current_stage TEXT DEFAULT 'seed' CHECK (current_stage IN ('seed', 'sprout', 'plant', 'tree')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial plant stats
INSERT INTO plant_stats (total_contributions, current_stage)
VALUES (0, 'seed')
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON questions(is_active);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for contributions
CREATE POLICY "Anyone can view contributions" ON contributions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert contributions" ON contributions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for questions
CREATE POLICY "Anyone can view active questions" ON questions FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can modify questions" ON questions FOR ALL USING (false);

-- RLS Policies for plant_stats
CREATE POLICY "Anyone can view plant stats" ON plant_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can update plant stats" ON plant_stats FOR UPDATE USING (true);

-- Insert sample questions
INSERT INTO questions (type, question, options, correct_answer) VALUES
('quiz', 'What is the most effective way to reduce your carbon footprint?', 
 '["Using public transportation", "Eating less meat", "Reducing energy consumption at home", "All of the above"]'::jsonb, 
 'All of the above'),
('quiz', 'How much water can you save by turning off the tap while brushing teeth?', 
 '["Up to 3 liters per day", "Up to 8 liters per day", "Up to 15 liters per day", "Up to 25 liters per day"]'::jsonb, 
 'Up to 8 liters per day'),
('pledge', 'Make a pledge for the environment', NULL, NULL),
('quiz', 'What percentage of plastic waste is actually recycled globally?', 
 '["9%", "25%", "50%", "75%"]'::jsonb, 
 '9%'),
('quiz', 'Which renewable energy source is the fastest growing?', 
 '["Solar", "Wind", "Hydroelectric", "Geothermal"]'::jsonb, 
 'Solar');

-- Create a function to increment plant stats
CREATE OR REPLACE FUNCTION increment_plant_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE plant_stats
    SET total_contributions = total_contributions + 1,
        current_stage = CASE
            WHEN total_contributions + 1 < 10 THEN 'seed'
            WHEN total_contributions + 1 < 50 THEN 'sprout'
            WHEN total_contributions + 1 < 200 THEN 'plant'
            ELSE 'tree'
        END,
        updated_at = NOW()
    WHERE id = (SELECT id FROM plant_stats LIMIT 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment stats
CREATE TRIGGER on_contribution_added
AFTER INSERT ON contributions
FOR EACH ROW
EXECUTE FUNCTION increment_plant_stats();

-- Create realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE plant_stats;
