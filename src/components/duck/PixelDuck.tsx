export type DuckMood = 'idle' | 'thinking' | 'success' | 'error';

type PixelDuckProps = {
  mood?: DuckMood;
  className?: string;
};

// 0=empty 1=body 2=eye 3=beak 4=wing 5=feet
const GRID: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,1,1,1,3,3,0,0],
  [0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,1,1,1,4,4,1,1,1,1,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,5,5,0,5,5,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const CELL_CLASS: Record<number, string> = {
  1: 'duck-px-body',
  2: 'duck-px-eye',
  3: 'duck-px-beak',
  4: 'duck-px-wing',
  5: 'duck-px-feet',
};

export const PixelDuck = ({ mood = 'idle', className }: PixelDuckProps) => (
  <svg
    className={`duck-pixel duck-pixel--${mood}${className ? ` ${className}` : ''}`}
    viewBox="0 0 16 16"
    aria-hidden
  >
    {GRID.flatMap((row, y) =>
      row.map((cell, x) =>
        cell ? (
          <rect
            key={`${x}-${y}`}
            className={CELL_CLASS[cell]}
            x={x}
            y={y}
            width={1}
            height={1}
          />
        ) : null,
      ),
    )}
  </svg>
);
