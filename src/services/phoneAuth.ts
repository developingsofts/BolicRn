import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  PhoneAuthProvider, 
  signInWithCredential,
  RecaptchaVerifier,
  ConfirmationResult 
} from 'firebase/auth';

// Firebase configuration - you'll need to replace these with your actual Firebase config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export interface PhoneVerificationResult {
  success: boolean;
  verificationId?: string;
  error?: string;
}

export interface CodeVerificationResult {
  success: boolean;
  credential?: any;
  error?: string;
}

class PhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  // Initialize reCAPTCHA verifier
  initializeRecaptcha(containerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          callback: () => {
            resolve();
          },
          'expired-callback': () => {
            reject(new Error('reCAPTCHA expired'));
          }
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Send verification code to phone number
  async sendVerificationCode(phoneNumber: string): Promise<PhoneVerificationResult> {
    try {
      if (!this.recaptchaVerifier) {
        throw new Error('reCAPTCHA verifier not initialized');
      }

      // Format phone number if needed
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Send verification code
      this.confirmationResult = await PhoneAuthProvider.verifyPhoneNumber(
        formattedPhone,
        this.recaptchaVerifier
      );

      return {
        success: true,
        verificationId: this.confirmationResult.verificationId
      };
    } catch (error) {
      console.error('Error sending verification code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification code'
      };
    }
  }

  // Verify the code entered by user
  async verifyCode(code: string): Promise<CodeVerificationResult> {
    try {
      if (!this.confirmationResult) {
        throw new Error('No confirmation result available');
      }

      // Confirm the verification code
      const credential = await this.confirmationResult.confirm(code);
      
      return {
        success: true,
        credential
      };
    } catch (error) {
      console.error('Error verifying code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid verification code'
      };
    }
  }

  // Format phone number to international format
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it doesn't start with +, assume it's a US number
    if (!phoneNumber.startsWith('+')) {
      return `+1${cleaned}`;
    }
    
    return phoneNumber;
  }

  // Clear the reCAPTCHA verifier
  clearRecaptcha(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }

  // Check if phone number is valid
  isValidPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}

export const phoneAuthService = new PhoneAuthService();

// Mock implementation for development/testing
export class MockPhoneAuthService {
  async sendVerificationCode(phoneNumber: string): Promise<PhoneVerificationResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For development, always succeed
    return {
      success: true,
      verificationId: `mock-verification-id-${Date.now()}`
    };
  }

  async verifyCode(code: string): Promise<CodeVerificationResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For development, accept any 6-digit code
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      return {
        success: true,
        credential: { mock: true }
      };
    }
    
    return {
      success: false,
      error: 'Invalid verification code'
    };
  }

  isValidPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}

export const mockPhoneAuthService = new MockPhoneAuthService();
