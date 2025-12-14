# Laudato Si' - Backend Setup Guide

## Database Setup (Supabase)

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

### 2. Run Database Schema
1. In Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Execute the SQL to create tables, triggers, and RLS policies

### 3. Enable Realtime
1. Go to Database → Replication
2. Enable replication for:
   - `contributions` table
   - `plant_stats` table

## Google OAuth Setup

### 1. Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Set Application type to "Web application"
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (production)
8. Copy Client ID and Client Secret

### 2. Configure Environment Variables
1. Copy `.env.example` to `.env.local`
2. Fill in the values:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Next Auth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here
```

### 3. Generate NextAuth Secret
Run in terminal:
```bash
openssl rand -base64 32
```

## Installation & Running

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

## API Endpoints

### GET /api/questions
Fetch all active questions

### POST /api/contributions
Submit a contribution
Body: `{ question_id, answer }`

### GET /api/contributions
Get recent contributions (with user data)

### GET /api/plant-stats
Get current plant statistics

## Features Implemented

✅ **Google OAuth Authentication**
- Secure sign-in with Google
- User data stored in Supabase
- Session management with NextAuth

✅ **Real-time Database**
- Live contribution updates
- Real-time plant statistics
- Supabase Realtime subscriptions

✅ **Daily Contribution Limit**
- One contribution per user per day
- Server-side validation
- Automatic reset at midnight

✅ **Question Management**
- Dynamic questions from database
- Support for quiz and pledge types
- Easy to add new questions via SQL

✅ **Plant Growth System**
- Automatic stage progression
- Database triggers for stats updates
- Milestone celebrations

✅ **Contributor System**
- Real-time contributor feed
- User avatars and names
- Contribution history

## Database Schema

### Tables
- `users` - User profiles from Google OAuth
- `questions` - Eco questions (quiz/pledge)
- `contributions` - User submissions
- `plant_stats` - Global plant statistics

### Key Features
- Row Level Security (RLS) enabled
- Automatic contribution counting
- Realtime subscriptions
- Foreign key relationships

## Security

- All API routes protected with NextAuth
- RLS policies on Supabase tables
- Daily limit enforcement server-side
- Environment variables for secrets
- HTTPS in production (required for OAuth)

## Troubleshooting

### Google OAuth Not Working
- Check redirect URIs match exactly
- Verify environment variables are set
- Ensure NEXTAUTH_URL matches your domain

### Realtime Not Updating
- Check Supabase replication settings
- Verify tables are added to publication
- Check browser console for subscription errors

### Database Errors
- Verify schema.sql executed successfully
- Check RLS policies are enabled
- Ensure user has proper permissions
