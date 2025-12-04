import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold, Inter_100Thin, Inter_600SemiBold, Inter_800ExtraBold } from "@expo-google-fonts/inter";

export function useInterFonts() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_600SemiBold,
    Inter_800ExtraBold,

  });

  return fontsLoaded;
}

enum FontWeight {
  Regular = 'Inter_400Regular',
  Medium = 'Inter_500Medium',
  Bold = 'Inter_700Bold',
  SemiBold = 'Inter_600SemiBold',
  ExtraBold = 'Inter_800ExtraBold',
}

export default FontWeight;

