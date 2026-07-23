import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export const useAndroidNavBar = () => {
  const insets = useSafeAreaInsets();

  return {
    isVisible: Platform.OS === 'android' && insets.bottom > 0,
    height: insets.bottom,
  };
};
