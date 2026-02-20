import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { Provider as ReduxProvider } from "react-redux";
import { AuthProvider } from "./src/contexts/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { useInterFonts } from "./src/hooks/useInterFonts";
import LoadingScreen from "./src/components/LoadingScreen";
import { Platform, StatusBar } from "react-native";
import { store } from "./src/store/store";
import ToastWrapper from "./src/components/ToastWrapper";
import BolicStripeProvider from "./src/components/stripe-provider";

const STRIPE_PUBLISHABLE_KEY = "pk_test_XXXXXX"; // Replace with your actual key

export default function App() {
  const fontsLoaded = useInterFonts();

  useEffect(() => {
    if (Platform.OS === "android") {
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle("light-content");
      StatusBar.setBackgroundColor("transparent");
    }
  }, []);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <BolicStripeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ReduxProvider store={store}>
          <PaperProvider>
            <AuthProvider>
              <AppNavigator />
              <ToastWrapper />
            </AuthProvider>
          </PaperProvider>
        </ReduxProvider>
      </GestureHandlerRootView>
    </BolicStripeProvider>
  );
}
