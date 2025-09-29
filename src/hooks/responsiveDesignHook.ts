import { useMemo } from 'react';
import { responsive } from '../designing/responsiveDesigns';

export const useResponsive = (styles: Record<string, any>) => {
  return useMemo(() => responsive(styles), [styles]);
};