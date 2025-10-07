import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// User slice selectors
export const useUser = () => useAppSelector((state) => state.user.user);
export const useToken = () => useAppSelector((state) => state.user.token);
export const useIsAuthenticated = () => useAppSelector((state) => state.user.isAuthenticated);
export const useAuthLoading = () => useAppSelector((state) => state.user.isLoading);
export const useAuthBootstrapping = () => useAppSelector((state) => state.user.isBootstrapping);
export const useAuthError = () => useAppSelector((state) => state.user.error);
