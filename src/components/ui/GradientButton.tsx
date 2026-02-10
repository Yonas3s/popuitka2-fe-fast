import type { ButtonHTMLAttributes, ReactNode } from 'react';

type GradientButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export const GradientButton = ({ children, className = '', ...props }: GradientButtonProps) => {
  return (
    <button {...props} className={`cta button-reset ${className}`.trim()}>
      {children}
    </button>
  );
};
