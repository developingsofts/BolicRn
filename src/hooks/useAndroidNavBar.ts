import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

/**
 * Hook to detect if Android three-button navigation bar is visible
 * Returns an object with:
 * - isVisible: boolean - whether the Android nav bar is visible
 * - height: number - the height of the safe area inset (nav bar height)
 */
export const useAndroidNavBar = () => {
  const insets = useSafeAreaInsets();

  return {
    isVisible: Platform.OS === 'android' && insets.bottom > 0,
    height: insets.bottom,
  };
};
