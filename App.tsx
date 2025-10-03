import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider } from "./src/contexts/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { useFonts } from "@expo-google-fonts/inter";
import { useInterFonts } from "./src/hooks/useInterFonts";
import LoadingScreen from "./src/components/LoadingScreen";
import { NavigationContainer } from "@react-navigation/native";
import { Platform, StatusBar } from "react-native";

export default function App() {
  const fontsLoaded = useInterFonts();

  useEffect(() => {
    if (Platform.OS === "android") {
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle("light-content");
      StatusBar.setBackgroundColor("transparent");
      // changeNavigationBarColor("transparent", false);
    }
  }, []);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <AuthProvider>
          <AppNavigator />
          {/* <StatusBar
              translucent
              backgroundColor="transparent"
              style="light"
            /> */}
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
