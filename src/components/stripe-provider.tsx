import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import * as Linking from "expo-linking";

export default function BolicStripeProvider(
  props: Omit<
    React.ComponentProps<typeof StripeProvider>,
    "publishableKey" | "merchantIdentifier"
  >,
) {
  const stripePlugin = Constants.expoConfig?.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "@stripe/stripe-react-native"
  ) as [string, { merchantIdentifier?: string }] | undefined;

  const merchantIdentifier = stripePlugin?.[1]?.merchantIdentifier || "";
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error("Stripe publishable key is not configured. Please check your .env file.");
  }

  return (
    <StripeProvider
      merchantIdentifier={merchantIdentifier}
      publishableKey={publishableKey}
      urlScheme={Linking.createURL("/")?.split(":")[0]} 
      {...props}
    />
  );
}
