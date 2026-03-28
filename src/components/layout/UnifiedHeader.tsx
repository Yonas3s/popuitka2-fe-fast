import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type UnifiedHeaderProps = {
  as?: 'header' | 'nav';
  className?: string;
  containerClassName?: string;
  leftClassName?: string;
  centerClassName?: string;
  rightClassName?: string;
  brandTo?: string;
  brandClassName?: string;
  brandContent?: ReactNode;
  leftContent?: ReactNode;
  centerContent?: ReactNode;
  rightContent?: ReactNode;
  envLabel?: string;
  envClassName?: string;
};

const joinClassNames = (...values: Array<string | undefined>): string => {
  return values.filter(Boolean).join(' ');
};

export const UnifiedHeader = ({
  as = 'header',
  className,
  containerClassName,
  leftClassName,
  centerClassName,
  rightClassName,
  brandTo = '/',
  brandClassName,
  brandContent,
  leftContent,
  centerContent,
  rightContent,
  envLabel,
  envClassName,
}: UnifiedHeaderProps) => {
  const Root = as;
  const hasRight = Boolean(envLabel || rightContent);
  const content = (
    <>
      <div className={joinClassNames('header-left', leftClassName)}>
        {brandContent ? (
          <Link className={brandClassName} to={brandTo}>
            {brandContent}
          </Link>
        ) : null}
        {leftContent}
      </div>

      {centerContent ? <div className={joinClassNames('header-center', centerClassName)}>{centerContent}</div> : null}

      {hasRight ? (
        <div className={joinClassNames('header-right', rightClassName)}>
          {envLabel ? <span className={envClassName}>{envLabel}</span> : null}
          {rightContent}
        </div>
      ) : null}
    </>
  );

  if (!containerClassName) {
    return <Root className={className}>{content}</Root>;
  }

  return (
    <Root className={className}>
      <div className={containerClassName}>{content}</div>
    </Root>
  );
};
