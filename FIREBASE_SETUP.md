# Firebase Phone Authentication Setup

This guide explains how to set up Firebase Phone Authentication for the BolicBuddy mobile app.

## Prerequisites

1. A Firebase project
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. Expo CLI installed (`npm install -g @expo/cli`)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Phone Authentication

1. In your Firebase project console, go to **Authentication**
2. Click on the **Sign-in method** tab
3. Click on **Phone** in the list of providers
4. Enable Phone Authentication
5. Add your test phone numbers (for development)
6. Save the changes

## Step 3: Get Firebase Configuration

1. In your Firebase project console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click on the web app icon (</>) to add a web app if you haven't already
4. Register your app with a nickname
5. Copy the Firebase configuration object

## Step 4: Update Firebase Configuration

1. Open `src/services/phoneAuth.ts`
2. Replace the `firebaseConfig` object with your actual Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## Step 5: Install Firebase Dependencies

The Firebase dependencies are already included in the project, but make sure you have:

```bash
npm install firebase
```

## Step 6: Configure reCAPTCHA (for Web)

For web builds, you'll need to configure reCAPTCHA:

1. In your Firebase project console, go to **Authentication** > **Settings**
2. Scroll down to **Authorized domains**
3. Add your domain (for development, add `localhost`)

## Step 7: Test Phone Authentication

1. Run your app: `npx expo start`
2. Go through the sign-up process
3. Enter a phone number
4. You should receive a verification code (check your test phone numbers in Firebase console)

## Development vs Production

### Development Mode
- Uses `MockPhoneAuthService` for testing
- Accepts any 6-digit code
- No actual SMS sent

### Production Mode
- Uses `PhoneAuthService` with real Firebase
- Requires actual phone verification
- Sends real SMS codes

To switch to production mode, update the import in `AuthScreen.tsx`:

```typescript
// Change from:
import { mockPhoneAuthService } from '../services/phoneAuth';

// To:
import { phoneAuthService } from '../services/phoneAuth';
```

## Troubleshooting

### Common Issues

1. **"reCAPTCHA not initialized"**
   - Make sure you've added your domain to authorized domains in Firebase
   - Check that the Firebase config is correct

2. **"Invalid phone number"**
   - Ensure the phone number is in international format (+1234567890)
   - Check that the number is added to test phone numbers in Firebase console

3. **"Verification code not received"**
   - Check your test phone numbers in Firebase console
   - Ensure the phone number format is correct

### Firebase Console Settings

Make sure these settings are configured in your Firebase project:

1. **Authentication** > **Sign-in method** > **Phone** is enabled
2. **Authentication** > **Settings** > **Authorized domains** includes your domain
3. **Project Settings** > **General** has the correct app configuration

## Security Considerations

1. **Rate Limiting**: Firebase automatically implements rate limiting for phone verification
2. **Test Numbers**: Only use test phone numbers during development
3. **Production**: Ensure proper security rules are set up before going to production

## Additional Resources

- [Firebase Phone Auth Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- [Expo Firebase Integration](https://docs.expo.dev/guides/using-firebase/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
