import type { ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { ToastViewport } from '../components/feedback/ToastViewport';
import { ConfirmModal } from '../components/feedback/ConfirmModal';

type ProvidersProps = {
  children: ReactNode;
};

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <HelmetProvider>
      {children}
      <ToastViewport />
      <ConfirmModal />
    </HelmetProvider>
  );
};
