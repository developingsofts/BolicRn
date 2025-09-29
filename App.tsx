import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider } from "./src/contexts/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { useFonts } from "@expo-google-fonts/inter";
import { useInterFonts } from "./src/hooks/useInterFonts";
import LoadingScreen from "./src/components/LoadingScreen";
import { NavigationContainer } from "@react-navigation/native";

export default function App() {
  const fontsLoaded = useInterFonts();

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
