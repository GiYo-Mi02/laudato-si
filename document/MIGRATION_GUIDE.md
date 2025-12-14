# Database Migration Instructions

## Issue: Missing Database Columns

The application was querying columns that don't exist in your Supabase database:

- `users.total_points`
- `users.has_completed_onboarding`
- `rewards.cost` (was querying as `points_required`)
- `users.avatar_url` (was querying as `image`)
- Missing tables: `streaks`, `rewards`, `redemptions`, `pledge_messages`

## Solution: Apply Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file: `supabase/migrations/001_add_gamification.sql`
4. Copy the entire content
5. Paste it into the SQL Editor
6. Click **Run** to execute

### Option 2: Via Supabase CLI

If you have Supabase CLI installed:

```bash
cd c:\Users\Gio\Desktop\laudato-si-webapp
supabase db push
```

## What This Migration Adds

### New Columns in `users` table:

- `total_points` (INTEGER) - Points earned from pledges
- `has_completed_onboarding` (BOOLEAN) - Tracks if user finished welcome flow

### New Tables:

1. **streaks** - Tracks daily pledge streaks

   - `current_streak` - Current consecutive days
   - `longest_streak` - Best streak ever
   - `last_pledge_date` - Last pledge date

2. **rewards** - Marketplace items

   - `name`, `description`, `cost` (points required)
   - `category` - food, merchandise, discount, other
   - `remaining_quantity` - Stock tracking

3. **redemptions** - Reward claims history

   - Links users to redeemed rewards
   - Status tracking (pending, approved, completed)

4. **pledge_messages** - User pledges displayed on screen
   - User pledge text
   - Points earned
   - Display status

### Database Functions:

- `update_user_streak()` - Automatically calculates streaks and awards points

## After Migration

Once you run the migration:

1. **Restart your dev server** (if running)

```bash
# Press Ctrl+C to stop
npm run dev
```

2. **Clear browser cache** or hard refresh (`Ctrl+Shift+R`)

3. **Test the flows**:
   - Sign in with UMak email → Should see dashboard
   - Complete welcome flow → Answer questions → Submit pledge
   - Check points/streak on dashboard
   - Try rewards page (should show sample rewards)
   - Check ranks page (should show leaderboard)

## Verification

After migration, verify tables exist:

```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('streaks', 'rewards', 'redemptions', 'pledge_messages');
```

You should see all 4 tables listed.

## Troubleshooting

### Issue: "column does not exist" errors persist

- Make sure you ran the migration SQL
- Check Supabase dashboard → Database → Tables
- Verify new columns appear in `users` table

### Issue: "relation does not exist"

- The migration creates new tables
- If error persists, check if migration ran successfully
- Look for errors in Supabase dashboard logs

### Issue: Frontend still showing errors

1. Stop dev server (`Ctrl+C`)
2. Clear Next.js cache: `rd /s /q .next`
3. Restart: `npm run dev`
4. Hard refresh browser (`Ctrl+Shift+R`)

## Sample Data

The migration includes 5 sample rewards:

- UMak Tumbler (150 points)
- Cafeteria 10% Discount (50 points)
- Eco Tote Bag (100 points)
- Free Coffee (75 points)
- Plant Kit (200 points)

You can add more via the admin dashboard after migration.
