import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import CustomToast, { ToastType } from './CustomToast';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let showToastCallback: ((toast: ToastData) => void) | null = null;

// Toast Manager Component
const ToastManager: React.FC = () => {
  const [currentToast, setCurrentToast] = useState<ToastData | null>(null);

  // Register the callback when component mounts
  React.useEffect(() => {
    showToastCallback = (toast: ToastData) => {
      setCurrentToast(toast);
    };

    return () => {
      showToastCallback = null;
    };
  }, []);

  const handleHideToast = useCallback(() => {
    setCurrentToast(null);
  }, []);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {currentToast && (
        <CustomToast
          key={currentToast.id}
          message={currentToast.message}
          type={currentToast.type}
          duration={currentToast.duration}
          onHide={handleHideToast}
        />
      )}
    </View>
  );
};

// Toast API
export const Toast = {
  success: (message: string, duration?: number) => {
    const toast: ToastData = {
      id: Date.now().toString(),
      message,
      type: 'success',
      duration,
    };
    showToastCallback?.(toast);
  },

  error: (message: string, duration?: number) => {
    const toast: ToastData = {
      id: Date.now().toString(),
      message,
      type: 'error',
      duration: duration || 4000, // Errors stay longer by default
    };
    showToastCallback?.(toast);
  },

  warning: (message: string, duration?: number) => {
    const toast: ToastData = {
      id: Date.now().toString(),
      message,
      type: 'warning',
      duration,
    };
    showToastCallback?.(toast);
  },

  info: (message: string, duration?: number) => {
    const toast: ToastData = {
      id: Date.now().toString(),
      message,
      type: 'info',
      duration,
    };
    showToastCallback?.(toast);
  },
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});

export default ToastManager;
