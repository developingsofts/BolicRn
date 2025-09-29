@echo off
REM BolicBuddy Build Script for Windows
REM This script helps build the app for different platforms

echo 🏗️  BolicBuddy Build Script
echo ==========================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

REM Check if Expo CLI is installed
expo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing Expo CLI...
    npm install -g @expo/cli
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Check for environment variables
if not exist .env (
    echo ⚠️  Warning: .env file not found. Creating template...
    (
        echo # BolicBuddy Environment Variables
        echo API_BASE_URL=your_api_endpoint_here
        echo FIREBASE_CONFIG=your_firebase_config_here
    ) > .env
    echo 📝 Please update the .env file with your actual configuration.
)

REM Main script logic
if "%1"=="ios" (
    echo 🍎 Building for iOS...
    expo build:ios
) else if "%1"=="android" (
    echo 🤖 Building for Android...
    expo build:android
) else if "%1"=="all" (
    echo 📱 Building for all platforms...
    expo build:ios
    expo build:android
) else if "%1"=="dev" (
    echo 🚀 Starting development server...
    expo start
) else if "%1"=="test" (
    echo 🧪 Running tests...
    npm test
) else if "%1"=="lint" (
    echo 🔍 Linting code...
    npm run lint
) else if "%1"=="clean" (
    echo 🧹 Cleaning build artifacts...
    if exist node_modules rmdir /s /q node_modules
    if exist .expo rmdir /s /q .expo
    if exist dist rmdir /s /q dist
    if exist web-build rmdir /s /q web-build
    npm install
) else (
    echo Usage: %0 {ios^|android^|all^|dev^|test^|lint^|clean}
    echo.
    echo Commands:
    echo   ios     - Build for iOS
    echo   android - Build for Android
    echo   all     - Build for all platforms
    echo   dev     - Start development server
    echo   test    - Run tests
    echo   lint    - Lint code
    echo   clean   - Clean build artifacts
    exit /b 1
)

echo ✅ Build script completed!
