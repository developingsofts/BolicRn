# BolicBuddy Mobile App

A comprehensive fitness social networking app built with React Native and Expo, designed to help users find training partners, track workouts, and build a fitness community.

## 🏋️‍♂️ Features

### Core Functionality
- **User Authentication** - Secure login and registration system
- **Training Partner Discovery** - Swipe-based matching system for finding workout buddies
- **Trainer Directory** - Browse and connect with certified fitness trainers
- **Workout Tracking** - Log and monitor your fitness progress
- **Social Features** - Share achievements, connect with the community
- **Rating System** - 5-star rating system for partners and trainers

### Key Screens
- **Home Dashboard** - Weekly goals, workout of the day, social feed
- **Find Partners & Trainers** - Swipeable cards with rating display
- **Groups** - Join training communities and fitness groups
- **Messages** - Chat with training partners and trainers
- **Profile** - Personal stats, achievements, and rating display
- **Settings** - App preferences and account management

## 🛠 Tech Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build tools
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Screen navigation and routing
- **React Native Paper** - Material Design components
- **AsyncStorage** - Local data persistence
- **Expo Location** - Location services
- **Expo Notifications** - Push notifications

## 📱 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BolicBuddyMobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your device

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── LoadingScreen.tsx
│   ├── NotificationManager.tsx
│   ├── ProgressTracker.tsx
│   ├── RatingModal.tsx
│   ├── RatingStars.tsx
│   ├── StorageDebugger.tsx
│   └── SwipeableCard.tsx
├── config/             # App configuration
│   └── constants.ts    # Colors, dimensions, and constants
├── contexts/           # React Context providers
│   └── AuthContext.tsx # Authentication state management
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── screens/           # App screens
│   ├── AuthScreen.tsx
│   ├── ChatScreen.tsx
│   ├── CreatePostScreen.tsx
│   ├── FindScreen.tsx
│   ├── GroupsScreen.tsx
│   ├── HomeScreen.tsx
│   ├── MessagesScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── SettingsScreen.tsx
│   └── WorkoutSessionScreen.tsx
├── services/          # API and storage services
│   ├── api.ts         # Backend API integration
│   └── storage.ts     # Local storage management
└── types/             # TypeScript type definitions
    └── index.ts       # App-wide type definitions
```

## 🎯 Key Components

### Rating System
- **RatingStars** - Interactive 5-star rating component
- **RatingModal** - Rating submission interface
- Integrated throughout the app for partner/trainer ratings

### Navigation
- **Tab Navigation** - Main app sections (Home, Find, Groups, Messages, Profile)
- **Stack Navigation** - Screen transitions and modal presentations

### State Management
- **AuthContext** - User authentication and profile management
- **Local Storage** - Persistent data for user preferences and notes

## 📊 Data Models

### User Types
- `User` - Basic user information
- `UserProfile` - Extended profile data
- `UserStats` - Fitness statistics and progress

### Social Features
- `TrainingPartner` - Partner discovery data
- `Trainer` - Trainer directory information
- `Rating` - User rating and review system

### Fitness Tracking
- `WorkoutSession` - Individual workout data
- `ProgressGoal` - Goal setting and tracking
- `Achievement` - Gamification system

## 🚀 Building for Production

### Expo Build
```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
```

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for platforms
eas build --platform ios
eas build --platform android
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```
API_BASE_URL=your_api_endpoint
FIREBASE_CONFIG=your_firebase_config
```

### App Configuration
- **app.json** - Expo app configuration
- **package.json** - Dependencies and scripts
- **tsconfig.json** - TypeScript configuration

## 📱 Platform Support

- **iOS** - iOS 12.0 and later
- **Android** - Android 5.0 (API level 21) and later
- **Web** - React Native Web support (experimental)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

- [ ] Video sharing functionality
- [ ] Advanced workout planning
- [ ] Nutrition tracking
- [ ] Group challenges
- [ ] Live workout sessions
- [ ] Integration with fitness wearables

---

**BolicBuddy** - Building stronger communities through fitness! 💪
