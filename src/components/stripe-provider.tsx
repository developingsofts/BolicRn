import { StripeProvider } from "@stripe/stripe-react-native";

import * as Linking from "expo-linking";

export default function BolicStripeProvider(
  props: Omit<
    React.ComponentProps<typeof StripeProvider>,
    "publishableKey" | "merchantIdentifier"
  >,
) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error(
      "Stripe publishable key is not configured. Please check your .env file.",
    );
  }

  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.bolicbuddy.app"
      urlScheme="bolic"
      {...props}
    />
  );
}
