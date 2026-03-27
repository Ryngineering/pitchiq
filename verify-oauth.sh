#!/bin/bash

# OAuth Configuration Verification Script
# This script checks if your Google OAuth setup is correct

echo "🔍 Checking PitchIQ OAuth Configuration..."
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file found"
    
    # Check if VITE_GOOGLE_CLIENT_ID exists
    if grep -q "VITE_GOOGLE_CLIENT_ID" .env.local; then
        echo "✅ VITE_GOOGLE_CLIENT_ID variable found"
        
        # Extract and display the Client ID (first 20 chars)
        CLIENT_ID=$(grep "VITE_GOOGLE_CLIENT_ID" .env.local | cut -d'=' -f2)
        if [ -z "$CLIENT_ID" ]; then
            echo "❌ ERROR: VITE_GOOGLE_CLIENT_ID is empty!"
            echo "   → Update .env.local with your Google Client ID"
        else
            echo "✅ Client ID found: ${CLIENT_ID:0:20}..."
            
            # Check format
            if [[ $CLIENT_ID == *".apps.googleusercontent.com" ]]; then
                echo "✅ Client ID format looks correct"
            else
                echo "❌ Client ID format doesn't look correct"
                echo "   Expected format: xxx-yyy.apps.googleusercontent.com"
            fi
        fi
    else
        echo "❌ VITE_GOOGLE_CLIENT_ID not found in .env.local"
        echo "   → Add this line: VITE_GOOGLE_CLIENT_ID=your-client-id"
    fi
else
    echo "❌ .env.local file NOT found!"
    echo "   → Create .env.local with your Google Client ID"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Go to Google Cloud Console: https://console.cloud.google.com/"
echo "2. Select your project"
echo "3. Go to APIs & Services > Credentials"
echo "4. Click your OAuth 2.0 Client ID"
echo "5. Add http://localhost:5173 to 'Authorized JavaScript origins'"
echo "6. Click SAVE"
echo "7. Run: npm run dev"
echo ""
echo "For more help, see OAUTH_TROUBLESHOOTING.md"
