import type { CSSProperties } from 'react';

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Shimmer skeleton placeholder. Use while data is loading to stabilize layout.
 * Prefer a variant matching the final content shape (card, row, avatar) over
 * a generic box — content doesn't jump when the real node swaps in.
 */
export const Skeleton = ({ width, height, radius = 6, className, style }: SkeletonProps) => {
  return (
    <span
      aria-hidden="true"
      className={`ui-skeleton${className ? ` ${className}` : ''}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
};

type SkeletonTextProps = {
  lines?: number;
  lastWidth?: string;
  gap?: number;
};

export const SkeletonText = ({ lines = 3, lastWidth = '60%', gap = 8 }: SkeletonTextProps) => {
  return (
    <div className="ui-skeleton-stack" style={{ gap }}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height={10}
          width={index === lines - 1 ? lastWidth : '100%'}
        />
      ))}
    </div>
  );
};
