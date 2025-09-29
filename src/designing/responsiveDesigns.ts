import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (design reference)
const BASE_WIDTH = 375; // iPhone X width
const BASE_HEIGHT = 812; // iPhone X height

// Scale functions
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;
const fontScale = widthScale; // Fonts scale with width

// Smart responsive function that automatically chooses the right scaling
export const r = (value: number, type?: 'width' | 'height' | 'font' | 'spacing'): number => {
  let scaledValue: number;
  
  if (type === 'height') {
    scaledValue = value * heightScale;
  } else if (type === 'font') {
    scaledValue = value * fontScale;
  } else if (type === 'width') {
    scaledValue = value * widthScale;
  } else {
    // Default: moderate scaling for spacing/margins/padding
    const scale = widthScale + (heightScale - widthScale) * 0.5;
    scaledValue = value * scale;
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(scaledValue));
};

// Auto-detect what type of scaling based on style property names
const getScaleType = (property: string): 'width' | 'height' | 'font' | 'spacing' => {
  // Height-related properties
  if (property.includes('height') || property.includes('Height') || 
      property.includes('top') || property.includes('Top') ||
      property.includes('bottom') || property.includes('Bottom') ||
      property.includes('vertical') || property.includes('Vertical')) {
    return 'height';
  }
  
  // Width-related properties
  if (property.includes('width') || property.includes('Width') ||
      property.includes('left') || property.includes('Left') ||
      property.includes('right') || property.includes('Right') ||
      property.includes('horizontal') || property.includes('Horizontal')) {
    return 'width';
  }
  
  // Font-related properties
  if (property.includes('font') || property.includes('Font') ||
      property.includes('size') || property.includes('Size')) {
    return 'font';
  }
  
  // Default to spacing for margins, padding, etc.
  return 'spacing';
};

// Smart style object processor
export const responsive = (styles: Record<string, any>): Record<string, any> => {
  const processedStyles: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(styles)) {
    if (typeof value === 'object' && value !== null) {
      // Recursively process nested objects
      processedStyles[key] = responsive(value);
    } else if (typeof value === 'number') {
      // Auto-scale numeric values based on property name
      const scaleType = getScaleType(key);
      processedStyles[key] = r(value, scaleType);
    } else {
      // Keep non-numeric values as is
      processedStyles[key] = value;
    }
  }
  
  return processedStyles;
};

// Predefined responsive values with smart scaling
export const SCALE = {
  // Common sizes that auto-scale appropriately
  fontSize: {
    xs: r(10, 'font'),
    sm: r(12, 'font'),
    base: r(14, 'font'),
    md: r(16, 'font'),
    lg: r(18, 'font'),
    xl: r(20, 'font'),
    '2xl': r(24, 'font'),
    '3xl': r(28, 'font'),
    '4xl': r(32, 'font'),
  },
  
  spacing: {
    xs: r(4),
    sm: r(8),
    md: r(12),
    lg: r(16),
    xl: r(20),
    '2xl': r(24),
    '3xl': r(32),
    '4xl': r(40),
  },
  
  borderRadius: {
    sm: r(4),
    md: r(8),
    lg: r(12),
    xl: r(16),
    full: 9999,
  },
  
  // Component-specific scales
  button: {
    height: r(48, 'height'),
    paddingHorizontal: r(16),
    paddingVertical: r(12),
    borderRadius: r(8),
  },
  
  input: {
    height: r(48, 'height'),
    paddingHorizontal: r(16),
    paddingVertical: r(14),
    borderRadius: r(8),
  },
  
  icon: {
    sm: r(16),
    md: r(24),
    lg: r(32),
    xl: r(40),
  },

  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
 
  },
};

// Simple percentage-based helpers
export const wp = (percentage: number) => (SCREEN_WIDTH * percentage) / 100;
export const hp = (percentage: number) => (SCREEN_HEIGHT * percentage) / 100;

// Device type detection
export const isTablet = () => SCREEN_WIDTH > 768;
export const isSmallDevice = () => SCREEN_WIDTH < 375;