import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface CustomToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onHide: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({ 
  message, 
  type, 
  duration = 3000, 
  onHide 
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      hideToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: COLORS._3FE363,
          icon: '✓',
          iconColor: COLORS.white,
        };
      case 'error':
        return {
          backgroundColor: COLORS.error,
          icon: '✕',
          iconColor: COLORS.white,
        };
      case 'warning':
        return {
          backgroundColor: COLORS._F3A455,
          icon: '⚠',
          iconColor: COLORS.white,
        };
      case 'info':
        return {
          backgroundColor: COLORS._0B80FF,
          icon: 'ℹ',
          iconColor: COLORS.white,
        };
      default:
        return {
          backgroundColor: COLORS.primary,
          icon: 'ℹ',
          iconColor: COLORS.white,
        };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: toastStyle.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={hideToast}
        style={styles.content}
      >
        <View style={styles.iconContainer}>
          <Text style={[styles.icon, { color: toastStyle.iconColor }]}>
            {toastStyle.icon}
          </Text>
        </View>
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: DIMENSIONS.spacing.md,
    right: DIMENSIONS.spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    flex: 1,
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  closeIcon: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '300',
    opacity: 0.8,
  },
});

export default CustomToast;
