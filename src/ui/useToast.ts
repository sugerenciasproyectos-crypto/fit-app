import { createContext, useContext } from 'react';

export interface ToastInput {
  message: string;
  error?: boolean;
  action?: { label: string; run: () => void };
}

export const ToastContext = createContext<(t: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}
