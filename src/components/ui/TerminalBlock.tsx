type TerminalBlockProps = {
  lines: string[];
};

export const TerminalBlock = ({ lines }: TerminalBlockProps) => {
  return (
    <div className="terminal" aria-label="commands">
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
