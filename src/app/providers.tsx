import type { ReactNode } from 'react';
import { ToastViewport } from '../components/feedback/ToastViewport';
import { ConfirmModal } from '../components/feedback/ConfirmModal';

type ProvidersProps = {
  children: ReactNode;
};

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <>
      {children}
      <ToastViewport />
      <ConfirmModal />
    </>
  );
};
