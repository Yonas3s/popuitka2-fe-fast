import type { ReactNode } from 'react';

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
};

export const GlassPanel = ({ children, className = '' }: GlassPanelProps) => {
  return <section className={`panel ${className}`.trim()}>{children}</section>;
};
