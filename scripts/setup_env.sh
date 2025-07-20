#!/bin/bash

# Environment setup helper for Jeopardish
# Usage: ./setup_env.sh

echo "🔧 Jeopardish Environment Setup"
echo "==============================="

# Create .env.example if it doesn't exist
if [[ ! -f ".env.example" ]]; then
    echo "📝 Creating .env.example..."
    cat > .env.example << 'EOF'
# Jeopardish Environment Variables
# Copy this file to .env.local and fill in your values

# Google AI (Gemini) Configuration
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key_here
# Get your API key from: https://makersuite.google.com/

# Firebase Configuration (Optional - for authentication and data persistence)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
# Get your Firebase config from: https://console.firebase.google.com/

# Game Configuration
VITE_QUESTIONS_API_URL=https://cluebase.lukelav.in/clues/random
VITE_QUESTIONS_CHUNK_SIZE=500

# Feature Flags
VITE_ENABLE_AI_HOST=true
VITE_ENABLE_FIREBASE=false
VITE_ENABLE_SOUND_EFFECTS=true
VITE_ENABLE_ANIMATIONS=true

# Development
VITE_DEBUG_MODE=false
EOF
    echo "✅ Created .env.example"
fi

# Interactive setup
echo ""
echo "🚀 Let's set up your environment!"
echo ""

# Check if .env.local exists
if [[ -f ".env.local" ]]; then
    echo "📋 Found existing .env.local"
    echo "Do you want to update it? (y/N)"
    read -r update_env
    if [[ "$update_env" != "y" && "$update_env" != "Y" ]]; then
        echo "✅ Keeping existing configuration"
        exit 0
    fi
else
    cp .env.example .env.local
    echo "📝 Created .env.local from template"
fi

# Google AI API Key
echo ""
echo "🤖 Google AI (Gemini) Setup"
echo "=========================="
echo "To use AI features, you need a Google AI API key."
echo "Get one free at: https://makersuite.google.com/"
echo ""
echo "Enter your Google AI API key (or press Enter to skip):"
read -r google_api_key

if [[ -n "$google_api_key" ]]; then
    sed -i.bak "s/VITE_GOOGLE_AI_API_KEY=.*/VITE_GOOGLE_AI_API_KEY=$google_api_key/" .env.local
    echo "✅ Google AI API key configured"
else
    echo "⏭️  Skipped Google AI setup"
fi

# Firebase Setup
echo ""
echo "🔥 Firebase Setup (Optional)"
echo "==========================="
echo "Firebase enables user authentication and data persistence."
echo "Do you want to configure Firebase? (y/N)"
read -r setup_firebase

if [[ "$setup_firebase" == "y" || "$setup_firebase" == "Y" ]]; then
    echo ""
    echo "Get your Firebase config from:"
    echo "https://console.firebase.google.com/ → Your Project → Project Settings"
    echo ""
    
    echo "Enter Firebase API Key:"
    read -r firebase_api_key
    
    echo "Enter Firebase Project ID:"
    read -r firebase_project_id
    
    echo "Enter Firebase App ID:"
    read -r firebase_app_id
    
    if [[ -n "$firebase_api_key" && -n "$firebase_project_id" && -n "$firebase_app_id" ]]; then
        sed -i.bak "s/VITE_FIREBASE_API_KEY=.*/VITE_FIREBASE_API_KEY=$firebase_api_key/" .env.local
        sed -i.bak "s/VITE_FIREBASE_PROJECT_ID=.*/VITE_FIREBASE_PROJECT_ID=$firebase_project_id/" .env.local
        sed -i.bak "s/VITE_FIREBASE_APP_ID=.*/VITE_FIREBASE_APP_ID=$firebase_app_id/" .env.local
        sed -i.bak "s/VITE_FIREBASE_AUTH_DOMAIN=.*/VITE_FIREBASE_AUTH_DOMAIN=${firebase_project_id}.firebaseapp.com/" .env.local
        sed -i.bak "s/VITE_FIREBASE_STORAGE_BUCKET=.*/VITE_FIREBASE_STORAGE_BUCKET=${firebase_project_id}.appspot.com/" .env.local
        sed -i.bak "s/VITE_ENABLE_FIREBASE=.*/VITE_ENABLE_FIREBASE=true/" .env.local
        echo "✅ Firebase configured"
    else
        echo "⚠️  Firebase configuration incomplete"
    fi
else
    echo "⏭️  Skipped Firebase setup"
fi

# Feature flags
echo ""
echo "⚡ Feature Configuration"
echo "======================="

echo "Enable AI host? (Y/n)"
read -r enable_ai
if [[ "$enable_ai" != "n" && "$enable_ai" != "N" ]]; then
    sed -i.bak "s/VITE_ENABLE_AI_HOST=.*/VITE_ENABLE_AI_HOST=true/" .env.local
else
    sed -i.bak "s/VITE_ENABLE_AI_HOST=.*/VITE_ENABLE_AI_HOST=false/" .env.local
fi

echo "Enable sound effects? (Y/n)"
read -r enable_sound
if [[ "$enable_sound" != "n" && "$enable_sound" != "N" ]]; then
    sed -i.bak "s/VITE_ENABLE_SOUND_EFFECTS=.*/VITE_ENABLE_SOUND_EFFECTS=true/" .env.local
else
    sed -i.bak "s/VITE_ENABLE_SOUND_EFFECTS=.*/VITE_ENABLE_SOUND_EFFECTS=false/" .env.local
fi

# Clean up backup files
rm -f .env.local.bak

# Summary
echo ""
echo "✅ Environment setup complete!"
echo ""
echo "📋 Configuration Summary:"
echo "========================"
grep -E "^VITE_" .env.local | grep -v "your_.*_here" | sed 's/=.*$/=✓/' | sort

echo ""
echo "🎮 Ready to start developing!"
echo "   Run: npm run dev"
echo ""
echo "📝 You can manually edit .env.local anytime to update settings."
