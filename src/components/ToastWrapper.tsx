import React from 'react';
import ToastManager from './ToastManager';

/**
 * Wrapper for custom ToastManager that ensures toasts don't block user interactions
 * with underlying components
 */
const ToastWrapper: React.FC = () => {
  return <ToastManager />;
};

export default ToastWrapper;
