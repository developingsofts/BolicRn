import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold, Inter_100Thin, Inter_600SemiBold } from "@expo-google-fonts/inter";

export function useInterFonts() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_600SemiBold

  });

  return fontsLoaded;
}

enum FontWeight {
  Regular = 'Inter_400Regular',
  Medium = 'Inter_500Medium',
  Bold = 'Inter_700Bold',
  SemiBold = 'Inter_600SemiBold',
}

export default FontWeight;

