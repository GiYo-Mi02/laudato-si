# Admin Guide - Managing Questions

## Adding New Questions via Supabase

### Quiz Questions

1. Go to your Supabase Dashboard
2. Navigate to Table Editor → `questions`
3. Click "Insert row"
4. Fill in the fields:
   - **type**: `quiz`
   - **question**: Your question text
   - **options**: JSON array of options
     ```json
     ["Option 1", "Option 2", "Option 3", "Option 4"]
     ```
   - **correct_answer**: The exact text of the correct option
   - **is_active**: `true`

#### Example Quiz Question:
```sql
INSERT INTO questions (type, question, options, correct_answer, is_active)
VALUES (
  'quiz',
  'What percentage of oxygen is produced by the Amazon rainforest?',
  '["10%", "20%", "50%", "80%"]'::jsonb,
  '20%',
  true
);
```

### Pledge Questions

1. Go to your Supabase Dashboard
2. Navigate to Table Editor → `questions`
3. Click "Insert row"
4. Fill in the fields:
   - **type**: `pledge`
   - **question**: Your prompt text
   - **options**: `null`
   - **correct_answer**: `null`
   - **placeholder**: Optional placeholder text
   - **is_active**: `true`

#### Example Pledge Question:
```sql
INSERT INTO questions (type, question, placeholder, is_active)
VALUES (
  'pledge',
  'Make a commitment to reduce your environmental impact',
  'I pledge to...',
  true
);
```

## Sample Questions to Add

### Environmental Awareness
```sql
INSERT INTO questions (type, question, options, correct_answer, is_active)
VALUES 
('quiz', 'How long does it take for a plastic bottle to decompose?', 
 '["50 years", "100 years", "450 years", "1000 years"]'::jsonb, 
 '450 years', true),

('quiz', 'What is the most abundant greenhouse gas in Earth''s atmosphere?', 
 '["Carbon dioxide", "Methane", "Water vapor", "Nitrous oxide"]'::jsonb, 
 'Water vapor', true),

('quiz', 'Which renewable energy source has the largest global capacity?', 
 '["Solar", "Wind", "Hydroelectric", "Geothermal"]'::jsonb, 
 'Hydroelectric', true);
```

### Action-Based Questions
```sql
INSERT INTO questions (type, question, options, correct_answer, is_active)
VALUES 
('quiz', 'How much water can a low-flow showerhead save per year?', 
 '["500 liters", "2,700 liters", "7,500 liters", "15,000 liters"]'::jsonb, 
 '7,500 liters', true),

('quiz', 'Which action saves the most energy at home?', 
 '["Using LED bulbs", "Unplugging devices", "Proper insulation", "Energy-efficient appliances"]'::jsonb, 
 'Proper insulation', true);
```

### Pledge Questions
```sql
INSERT INTO questions (type, question, placeholder, is_active)
VALUES 
('pledge', 'What sustainable practice will you commit to this week?', 
 'This week, I will...', true),

('pledge', 'How will you reduce your carbon footprint today?', 
 'Today, I pledge to...', true),

('pledge', 'Share your environmental goal for this month', 
 'This month, I commit to...', true);
```

## Disabling Questions

To temporarily disable a question:
```sql
UPDATE questions 
SET is_active = false 
WHERE id = 'question-id-here';
```

To re-enable:
```sql
UPDATE questions 
SET is_active = true 
WHERE id = 'question-id-here';
```

## Viewing Question Statistics

Get questions with contribution counts:
```sql
SELECT 
  q.id,
  q.question,
  q.type,
  COUNT(c.id) as total_contributions,
  ROUND(AVG(CASE WHEN c.is_correct THEN 1 ELSE 0 END) * 100, 2) as success_rate
FROM questions q
LEFT JOIN contributions c ON q.id = c.question_id
GROUP BY q.id, q.question, q.type
ORDER BY total_contributions DESC;
```

## Best Practices

1. **Question Balance**: Mix quiz and pledge questions (60% quiz, 40% pledge)
2. **Difficulty**: Vary difficulty to keep users engaged
3. **Relevance**: Focus on Philippine/UMak context when possible
4. **Options**: Keep quiz options between 3-5 choices
5. **Clarity**: Make questions clear and unambiguous
6. **Updates**: Regularly add new questions to keep content fresh

## UMak-Specific Question Ideas

```sql
-- Campus-specific
INSERT INTO questions (type, question, options, correct_answer, is_active)
VALUES 
('quiz', 'What is UMak''s primary environmental advocacy?', 
 '["Waste reduction", "Tree planting", "Energy conservation", "Water conservation"]'::jsonb, 
 'Tree planting', true),

('pledge', 'How will you contribute to making UMak more sustainable?', 
 'As a UMak student/faculty, I will...', true);
```

## Monitoring Questions

Check active questions count:
```sql
SELECT COUNT(*) FROM questions WHERE is_active = true;
```

View most recent contributions:
```sql
SELECT 
  q.question,
  u.name,
  c.answer,
  c.is_correct,
  c.created_at
FROM contributions c
JOIN questions q ON c.question_id = q.id
JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 20;
```
