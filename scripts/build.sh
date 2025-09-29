#!/bin/bash

# BolicBuddy Build Script
# This script helps build the app for different platforms

echo "🏗️  BolicBuddy Build Script"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for environment variables
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Creating template..."
    cat > .env << EOF
# BolicBuddy Environment Variables
API_BASE_URL=your_api_endpoint_here
FIREBASE_CONFIG=your_firebase_config_here
EOF
    echo "📝 Please update the .env file with your actual configuration."
fi

# Function to build for iOS
build_ios() {
    echo "🍎 Building for iOS..."
    expo build:ios
}

# Function to build for Android
build_android() {
    echo "🤖 Building for Android..."
    expo build:android
}

# Function to build for both platforms
build_all() {
    echo "📱 Building for all platforms..."
    build_ios
    build_android
}

# Function to start development server
start_dev() {
    echo "🚀 Starting development server..."
    expo start
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    npm test
}

# Function to lint code
lint_code() {
    echo "🔍 Linting code..."
    npm run lint
}

# Main script logic
case "$1" in
    "ios")
        build_ios
        ;;
    "android")
        build_android
        ;;
    "all")
        build_all
        ;;
    "dev")
        start_dev
        ;;
    "test")
        run_tests
        ;;
    "lint")
        lint_code
        ;;
    "clean")
        echo "🧹 Cleaning build artifacts..."
        rm -rf node_modules
        rm -rf .expo
        rm -rf dist
        rm -rf web-build
        npm install
        ;;
    *)
        echo "Usage: $0 {ios|android|all|dev|test|lint|clean}"
        echo ""
        echo "Commands:"
        echo "  ios     - Build for iOS"
        echo "  android - Build for Android"
        echo "  all     - Build for all platforms"
        echo "  dev     - Start development server"
        echo "  test    - Run tests"
        echo "  lint    - Lint code"
        echo "  clean   - Clean build artifacts"
        exit 1
        ;;
esac

echo "✅ Build script completed!"
