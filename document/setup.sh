#!/bin/bash

echo "🌱 Laudato Si' - Setup Script"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created"
    echo ""
    echo "⚠️  Please update .env.local with your actual credentials:"
    echo "   - Supabase URL and Anon Key"
    echo "   - Google OAuth Client ID and Secret"
    echo "   - Generate NEXTAUTH_SECRET with: openssl rand -base64 32"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

# Install dependencies
echo "Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up your Supabase project at https://supabase.com"
echo "2. Run the SQL in supabase/schema.sql in your Supabase SQL Editor"
echo "3. Enable Realtime for 'contributions' and 'plant_stats' tables"
echo "4. Set up Google OAuth at https://console.cloud.google.com"
echo "5. Update .env.local with your credentials"
echo "6. Run 'npm run dev' to start the development server"
echo ""
