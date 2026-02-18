import { useStripe } from "@stripe/stripe-react-native";
import { API_CONFIG } from "../config/constants";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { storageService } from "../services/storage";
import { API_END_POINTS } from "../services/endPoints";

// Types for the payment sheet parameters
export interface PaymentSheetParams {
  paymentIntent: string;
  ephemeralKey: string;
  customer: string;
  publishableKey?: string;
}

export interface PaymentSheetParamsWithoutSavingPaymentOptions {
  paymentIntent: string;
  customer: string;
  publishableKey?: string;
}

// Types for the payment request
export interface PaymentRequest {
  amount: number; // Amount in cents (e.g., 1000 = $10.00)
  currency?: string; // Default: 'usd'
  customerId?: string; // Optional: existing customer ID
  description?: string; // Optional: payment description
  metadata?: Record<string, string>; // Optional: additional metadata
}

/**
 * Get the app's URL scheme from expo config
 */
const getAppUrlScheme = (): string => {
  const scheme = Constants.expoConfig?.scheme;

  // Handle both string and array cases
  if (Array.isArray(scheme)) {
    return scheme[0] || "bolic";
  }

  return scheme || "bolic";
};

export const fetchPaymentSheetParams = async (
  paymentRequest: PaymentRequest,
): Promise<PaymentSheetParamsWithoutSavingPaymentOptions> => {
  try {
    const token = await storageService.getAuthToken();
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${API_CONFIG.baseUrl}${API_END_POINTS.payments.paymentSheet}`;
    console.log("Fetching payment sheet params from:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: paymentRequest.amount,
        sessionId: paymentRequest.metadata?.sessionId || "",
        trainerId:paymentRequest.metadata?.trainerId || "",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Payment sheet params error:", {
        status: response.status,
        errorText,
        url,
      });
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Payment sheet params received:", { 
      hasPaymentIntent: !!data.paymentIntent,
      hasCustomer: !!data.customer,
      hasPublishableKey: !!data.publishableKey,
    });

    return {
      paymentIntent: data.paymentIntent,
      customer: data.customer,
      publishableKey: data.publishableKey,
    };
  } catch (error) {
    console.error("Error fetching payment sheet params:", error);
    throw error;
  }
};

/**
 * Hook to handle the complete payment flow
 * Step 3: Initialize the payment sheet
 * Step 4: Present the payment sheet
 */
export const useStripePayment = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  /**
   * Initialize the payment sheet with the parameters from your backend
   */
  const initializePaymentSheet = async (
    paymentRequest: PaymentRequest,
  ): Promise<{ error?: string }> => {
    try {
      console.log("Initializing payment sheet with request:", paymentRequest);
      
      const { paymentIntent, customer } =
        await fetchPaymentSheetParams(paymentRequest);

      const urlScheme = getAppUrlScheme();
      const returnURL = `${urlScheme}://payment-return`;

      console.log("Payment sheet params received, initializing with:", {
        merchantDisplayName: "Bolic",
        customerId: customer,
        paymentIntentClientSecret: paymentIntent ? "***" : "MISSING",
        returnURL,
      });

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Bolic",
        customerId: customer,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: paymentRequest.metadata?.customerName,
          email: paymentRequest.metadata?.customerEmail,
        },
        returnURL, // Dynamic return URL: "bolic://payment-return"
        applePay: {
          merchantCountryCode: "US",
        },
        googlePay: {
          merchantCountryCode: "US",
          testEnv: __DEV__, 
          currencyCode: paymentRequest.currency || "usd",
        },
      });

      if (error) {
        console.error("Stripe payment sheet initialization error:", error);
        return { error: error.message };
      }

      console.log("Payment sheet initialized successfully");
      return {};
    } catch (error) {
      console.error("Error in initializePaymentSheet:", error);
      return { error: String(error) };
    }
  };


  const openPaymentSheet = async (): Promise<{
    error?: string;
    success?: boolean;
  }> => {
    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        return { error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error presenting payment sheet:", error);
      return { error: String(error) };
    }
  };

  return {
    initializePaymentSheet,
    openPaymentSheet,
  };
};

export const formatAmountToCents = (amount: number): number => {
  return Math.round(amount * 100);
};

export const formatCentsToAmount = (cents: number): string => {
  return (cents / 100).toFixed(2);
};


   // setIsProcessing(true);
    // Toast.info("Initializing payment...", 1500);

    // try {
    // 	// Initialize the Stripe payment sheet
    // 	const { error: initError } = await initializePaymentSheet({
    // 		amount: formatAmountToCents(sessionData.total),
    // 		currency: "usd",
    // 		description: `${packageTitle} - ${trainerName}`,
    // 		metadata: {
    // 			trainerId: trainerId || "",
    // 			priceId: priceId || "",
    // 			sessionDate: selectedSlots[0]?.date || date,
    // 			sessionTime: selectedSlots[0]?.time || time,
    // 			trainerName,
    // 			packageTitle,
    // 		},
    // 	});

    // 	if (initError) {
    // 		Alert.alert("Error", initError);
    // 		setIsProcessing(false);
    // 		return;
    // 	}

    // 	// Present the payment sheet
    // 	const { error: paymentError, success } = await openPaymentSheet();

    // 	if (paymentError) {
    // 		Alert.alert("Payment Cancelled", paymentError);
    // 		setIsProcessing(false);
    // 		return;
    // 	}

    // 	if (success) {
    // 		// Payment successful - create the booking
    // 		await handleConfirmBooking();
    // 	}
    // } catch (error) {
    // 	console.error("[BookingConfirmation] Payment error:", error);
    // 	Alert.alert("Error", "Failed to process payment. Please try again.");
    // 	setIsProcessing(false);
    // }
    
    // dependencyArray -> // [isProcessing, sessionData.total, packageTitle, trainerName, trainerId, priceId, selectedSlots, date, time, initializePaymentSheet, openPaymentSheet]