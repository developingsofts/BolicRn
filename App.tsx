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
import useDeviceLocation from "./src/hooks/useDeviceLocation";

const STRIPE_PUBLISHABLE_KEY = "pk_test_XXXXXX";

/**
 * Renders nothing. Exists so the device-location sync runs inside AuthProvider,
 * where it can see whether anyone is signed in.
 */
const DeviceLocationSync = () => {
  useDeviceLocation();
  return null;
};

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
              <DeviceLocationSync />
              <AppNavigator />
              <ToastWrapper />
            </AuthProvider>
          </PaperProvider>
        </ReduxProvider>
      </GestureHandlerRootView>
    </BolicStripeProvider>
  );
}
