import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { SUPPORT_MAILTO } from '../../lib/config/support';

type SupportMailLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  children?: ReactNode;
};

export const SupportMailLink = ({
  children,
  ...props
}: SupportMailLinkProps) => {
  return (
    <a href={SUPPORT_MAILTO} {...props}>
      {children ?? 'Помощь'}
    </a>
  );
};
