import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

const serialise = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('[storage] Failed to serialise value:', error);
    throw error;
  }
};

const parse = <T>(rawValue: string | null): T | null => {
  if (rawValue == null) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch (error) {
    console.warn('[storage] Removing corrupted entry after JSON parse failure');
    return null;
  }
};

const setItem = async (key: string, value: unknown) => {
  if (value === undefined) {
    await AsyncStorage.removeItem(key);
    return;
  }

  const serialised = serialise(value);
  await AsyncStorage.setItem(key, serialised);
};

const getItem = async <T>(key: string): Promise<T | null> => {
  const rawValue = await AsyncStorage.getItem(key);
  const parsed = parse<T>(rawValue);

  if (rawValue && parsed == null) {
    await AsyncStorage.removeItem(key);
  }

  return parsed;
};

const removeItem = async (key: string) => {
  await AsyncStorage.removeItem(key);
};

const multiRemove = async (keys: string[]) => {
  if (!keys.length) {
    return;
  }

  await AsyncStorage.multiRemove(keys);
};

export const clearCorruptedData = async () => {
  await AsyncStorage.clear();
};

export const validateStorageData = async () => {
  const keys = await AsyncStorage.getAllKeys();

  await Promise.all(
    keys.map(async (key) => {
      const rawValue = await AsyncStorage.getItem(key);
      if (!rawValue) {
        return;
      }

      const parsed = parse(rawValue);
      if (parsed == null) {
        console.warn(`[storage] Removing corrupted data for key ${key}`);
        await AsyncStorage.removeItem(key);
      }
    }),
  );
};

export const clearUserData = async () => {
  await multiRemove([
    STORAGE_KEYS.authToken,
    STORAGE_KEYS.userProfile,
  ]);
};

export const setAuthToken = async (token: string) => {
  await setItem(STORAGE_KEYS.authToken, token);
};

export const getAuthToken = () => getItem<string>(STORAGE_KEYS.authToken);

export const removeAuthToken = async () => {
  await removeItem(STORAGE_KEYS.authToken);
};

export const setUserProfile = async (profile: unknown) => {
  await setItem(STORAGE_KEYS.userProfile, profile);
};

export const getUserProfile = <T = unknown>() => getItem<T>(STORAGE_KEYS.userProfile);

export const storageService = {
  clearCorruptedData,
  validateStorageData,
  clearUserData,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  setUserProfile,
  getUserProfile,
};

export default storageService;

