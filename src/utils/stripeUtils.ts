import { useStripe } from "@stripe/stripe-react-native";
import { API_CONFIG } from "../config/constants";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { storageService } from "../services/storage";
import { API_END_POINTS } from "../services/endPoints";

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

export interface PaymentRequest {
  amount: number;
  priceId: string;
  currency?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

const getAppUrlScheme = (): string => {
  const scheme = Constants.expoConfig?.scheme;

  if (Array.isArray(scheme)) {
    return scheme[0] || "bolic";
  }

  return scheme || "bolic";
};

const validatePaymentIntent = (paymentIntent: string): boolean => {
  if (!paymentIntent || typeof paymentIntent !== "string") {
    console.warn("❌ Payment intent is empty or not a string:", paymentIntent);
    return false;
  }

  if (!paymentIntent.includes("_secret_")) {
    console.warn(
      "❌ Payment intent format invalid - missing '_secret_':",
      paymentIntent
    );
    return false;
  }

  if (!paymentIntent.startsWith("pi_")) {
    console.warn(
      "❌ Payment intent format invalid - should start with 'pi_':",
      paymentIntent
    );
    return false;
  }

  console.log("✅ Payment intent format is valid");
  return true;
};

export const fetchPaymentSheetParams = async (
  paymentRequest: PaymentRequest
): Promise<PaymentSheetParamsWithoutSavingPaymentOptions> => {
  try {
    const token = await storageService.getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${API_CONFIG.baseUrl}${API_END_POINTS.payments.paymentSheet}`;
    console.log("Fetching payment sheet params from:", url);
    console.log("Initializing payment sheet with request:", paymentRequest);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        price_id: paymentRequest.priceId,
        amount: paymentRequest.amount,
        trainerId: paymentRequest.metadata?.trainerId || "",
        date: paymentRequest.metadata?.date || "",
        time: paymentRequest.metadata?.time || "",
      }),
    });

    console.log("Payment sheet params response status:", response.status);

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
    console.log(
      "Payment sheet params response data:",
      JSON.stringify(data, null, 2)
    );

    const paymentIntent = data.data?.clientSecret || data.clientSecret;
    const customer =
      data.data?.customerId ||
      data.data?.stripeCustomerId ||
      data.customerId ||
      data.stripeCustomerId;

    console.log("Extracted payment params:", { paymentIntent, customer });

    if (!validatePaymentIntent(paymentIntent)) {
      throw new Error(`Invalid payment intent format: ${paymentIntent}`);
    }

    if (!customer) {
      console.warn("⚠️  Warning: Customer ID is missing");
    }

    return { paymentIntent, customer };
  } catch (error) {
    console.error("Error fetching payment sheet params:", error);
    throw error;
  }
};

export const useStripePayment = () => {
  const { initPaymentSheet, presentPaymentSheet, isPlatformPaySupported } =
    useStripe();

  const checkPlatformPayAvailable = async (): Promise<boolean> => {
    try {
      const isSupported = await isPlatformPaySupported();
      console.log(
        "Platform Pay (Google Pay / Apple Pay) supported:",
        isSupported
      );
      return isSupported ?? false;
    } catch (error) {
      console.warn("Could not check platform pay support:", error);
      return false;
    }
  };

  const initializePaymentSheet = async (
    paymentRequest: PaymentRequest
  ): Promise<{ error?: string }> => {
    try {
      const { paymentIntent, customer } =
        await fetchPaymentSheetParams(paymentRequest);

      if (!validatePaymentIntent(paymentIntent)) {
        return { error: `Invalid payment intent received: ${paymentIntent}` };
      }

      const urlScheme = getAppUrlScheme();
      const returnURL = `${urlScheme}://payment-return`;

      const platformPayAvailable = await checkPlatformPayAvailable();
      console.log(
        "Platform pay available, adding to payment sheet:",
        platformPayAvailable
      );

      console.log("Payment sheet params received, initializing with:", {
        merchantDisplayName: "Bolic",
        customerId: customer,
        paymentIntentClientSecret: paymentIntent ? "***" : "MISSING",
        returnURL,
        platformPayAvailable,
      });

      console.log("🎉 Initializing Stripe payment sheet");
      const { error } = await initPaymentSheet({
        merchantDisplayName: "Bolic",
        customerId: customer,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: paymentRequest.metadata?.customerName,
          email: paymentRequest.metadata?.customerEmail,
        },
        returnURL,
        ...(platformPayAvailable && {
          applePay: {
            merchantCountryCode: "US",
          },
          googlePay: {
            merchantCountryCode: "US",
            currencyCode: paymentRequest.currency || "usd",
          },
        }),
      });

      if (error) {
        console.error("Stripe payment sheet initialization error:", error);
        return { error: error.message };
      }

      console.log("✅ Payment sheet initialized successfully");
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
      console.log("🔓 Opening payment sheet...");
      const { error } = await presentPaymentSheet();

      if (error) {
        console.error("❌ Payment sheet error:", {
          code: error.code,
          message: error.message,
        });
        return { error: error.message };
      }

      console.log("✅ Payment completed successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Error presenting payment sheet:", error);
      return { error: String(error) };
    }
  };

  return {
    initializePaymentSheet,
    openPaymentSheet,
    checkPlatformPayAvailable,
  };
};

export const formatAmountToCents = (amount: number): number => {
  return Math.round(amount * 100);
};

export const formatCentsToAmount = (cents: number): string => {
  return (cents / 100).toFixed(2);
};