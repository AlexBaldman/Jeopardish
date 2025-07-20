#!/bin/bash

# Enhanced development server with environment checking
# Usage: ./dev_server.sh

echo "🚀 Starting Jeopardish Development Server..."

# Check for required environment variables
check_env() {
    local missing=()
    
    if [[ ! -f ".env.local" && ! -f ".env" ]]; then
        echo "⚠️  No .env file found. Creating from template..."
        if [[ -f ".env.example" ]]; then
            cp .env.example .env.local
            echo "📝 Created .env.local from .env.example"
            echo "   Please update it with your API keys!"
        else
            echo "❌ No .env.example found. Creating basic template..."
            cat > .env.local << EOF
# Jeopardish Environment Variables
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
EOF
            echo "📝 Created .env.local template. Please update with your keys!"
        fi
    fi
    
    # Check if API keys are configured
    if [[ -f ".env.local" ]]; then
        if grep -q "your_.*_here" .env.local; then
            echo ""
            echo "⚠️  Warning: Default API keys detected in .env.local"
            echo "   Some features may not work without proper API keys."
        fi
    fi
}

# Check Node.js version
check_node() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        echo "❌ Node.js version 18+ required. Current version: $(node -v)"
        exit 1
    fi
    echo "✅ Node.js $(node -v) detected"
}

# Check and install dependencies
check_deps() {
    if [[ ! -d "node_modules" ]]; then
        echo "📦 Installing dependencies..."
        npm install
    else
        echo "✅ Dependencies already installed"
    fi
}

# Open browser after delay
open_browser() {
    sleep 2
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:3000
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:3000
    fi
}

# Main execution
check_node
check_env
check_deps

echo ""
echo "🎮 Starting Vite development server..."
echo "   Access at: http://localhost:3000"
echo "   Press Ctrl+C to stop"
echo ""

# Start browser in background
open_browser &

# Start Vite dev server
npm run dev
