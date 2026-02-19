type TerminalBlockProps = {
  lines: string[];
  className?: string;
};

export const TerminalBlock = ({ lines, className }: TerminalBlockProps) => {
  return (
    <div className={`terminal ${className ?? ''}`.trim()} aria-label="commands">
      {lines.map((line, index) => (
        <span key={`${line}-${index}`} className="line">
          {line.startsWith('$') ? (
            <>
              <span className="prompt">$</span>
              {line.slice(1)}
            </>
          ) : (
            line
          )}
        </span>
      ))}
    </div>
  );
};
