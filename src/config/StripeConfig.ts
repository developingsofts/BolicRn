import { initStripe, initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { Platform } from 'react-native';

// Interface for payment sheet initialization params
interface InitPaymentSheetParams {
  paymentIntentClientSecret: string;
  customer?: string;
  customerEphemeralKeySecret?: string;
  merchantDisplayName: string;
  defaultBillingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  returnURL?: string;
  allowsDelayedPaymentMethods?: boolean;
}

// Interface for payment sheet params
interface PaymentSheetParams {
  amount: number; // in cents
  currency: string;
  email?: string;
  clientSecret: string;
}

// Interface for card details
interface CardDetails {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvc: string;
  cardholderName?: string;
}

// Interface for payment result
interface PaymentResult {
  success: boolean;
  error?: string;
  paymentMethodId?: string;
  transactionId?: string;
}

/**
 * Initialize Stripe SDK with publishable key
 * Call this in your App.tsx useEffect
 */
export const initializeStripe = async (publishableKey: string): Promise<PaymentResult> => {
  try {
    await initStripe({
      publishableKey,
      merchantIdentifier: 'merchant.com.yourapp',
      urlScheme: 'yourapp',
    });
    console.log('Stripe initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize Stripe',
    };
  }
};

/**
 * Initialize Payment Sheet
 * Call this after fetching PaymentIntent from backend
 * Backend should return: clientSecret, customer, customerEphemeralKeySecret
 */
export const initializePaymentSheet = async (
  params: InitPaymentSheetParams
): Promise<PaymentResult> => {
  try {
    const { error } = await initPaymentSheet({
      merchantDisplayName: params.merchantDisplayName,
      customerId: params.customer,
      customerEphemeralKeySecret: params.customerEphemeralKeySecret,
      paymentIntentClientSecret: params.paymentIntentClientSecret,
      allowsDelayedPaymentMethods: params.allowsDelayedPaymentMethods ?? true,
      defaultBillingDetails: params.defaultBillingDetails,
      returnURL: params.returnURL || 'bolic://stripe-redirect',
    });

    if (error) {
      console.error('Error initializing payment sheet:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to initialize payment sheet',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error initializing payment sheet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Present Payment Sheet for All Payment Methods
 * Call this when user taps the "Pay" button
 * Handles: Card, Apple Pay, Google Pay, Bank transfers, etc.
 */
export const presentPaymentSheetInPhone = async (): Promise<PaymentResult> => {
  try {
    const { error } = await presentPaymentSheet();

    if (error) {
      console.error(`Payment error code: ${error.code}`, error.message);
      return {
        success: false,
        error: error.message || 'Payment failed',
      };
    }

    console.log('Payment successful!');
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error presenting payment sheet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Process Credit/Debit Card Payment via PaymentSheet
 * This is the modern approach - CardField is handled by PaymentSheet
 */
export const processCardPayment = async (
  cardDetails: CardDetails,
  paymentIntentSecret: string
): Promise<PaymentResult> => {
  return presentPaymentSheetInPhone();
};

/**
 * Validate Card Details
 * Basic validation for card number, expiry, and CVC
 */
export const validateCardDetails = (cardDetails: CardDetails): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate card number (basic Luhn algorithm check)
  if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 13) {
    errors.push('Invalid card number');
  }

  // Validate expiry
  if (!cardDetails.expiryMonth || cardDetails.expiryMonth < 1 || cardDetails.expiryMonth > 12) {
    errors.push('Invalid expiry month');
  }

  if (!cardDetails.expiryYear || cardDetails.expiryYear < new Date().getFullYear()) {
    errors.push('Card has expired');
  }

  // Validate CVC
  if (!cardDetails.cvc || cardDetails.cvc.length < 3 || cardDetails.cvc.length > 4) {
    errors.push('Invalid CVC');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Format card number with spaces (e.g., 1234 5678 9012 3456)
 */
export const formatCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const matches = cleaned.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(' ');
  } else {
    return cardNumber;
  }
};

/**
 * Get card type from card number
 */
export const getCardType = (cardNumber: string): string => {
  const number = cardNumber.replace(/\D/g, '');

  const patterns = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(number)) {
      return type;
    }
  }

  return 'unknown';
};

/**
 * Convert amount to cents for Stripe
 */
export const convertToCents = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Convert cents to dollars
 */
export const convertFromCents = (cents: number): number => {
  return cents / 100;
};

/**
 * Check if platform supports wallet payments
 */
export const supportsWalletPayments = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Get available payment methods for current platform
 */
export const getAvailablePaymentMethods = (): string[] => {
  const methods = ['card'];

  if (Platform.OS === 'ios') {
    methods.push('applePay');
  }

  if (Platform.OS === 'android') {
    methods.push('googlePay');
  }

  return methods;
};
