import { useMemo, useRef } from 'react';

type OtpCodeInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  length?: number;
  disabled?: boolean;
};

const toCells = (value: string, length: number): string[] => {
  const digits = value.replace(/\D/g, '').slice(0, length);
  return Array.from({ length }, (_, index) => digits[index] ?? '');
};

export const OtpCodeInput = ({
  label,
  value,
  onChange,
  error,
  length = 6,
  disabled = false,
}: OtpCodeInputProps) => {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const cells = useMemo(() => toCells(value, length), [length, value]);

  const updateAt = (index: number, nextChar: string) => {
    const nextCells = [...cells];
    nextCells[index] = nextChar;
    onChange(nextCells.join(''));
  };

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <div className="otp-grid">
        {cells.map((char, index) => (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            className="otp-cell"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            value={char}
            disabled={disabled}
            onChange={(event) => {
              const nextChar = event.target.value.replace(/\D/g, '').slice(-1);
              updateAt(index, nextChar);
              if (nextChar && index < length - 1) {
                refs.current[index + 1]?.focus();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !cells[index] && index > 0) {
                refs.current[index - 1]?.focus();
                updateAt(index - 1, '');
              }

              if (event.key === 'ArrowLeft' && index > 0) {
                refs.current[index - 1]?.focus();
              }

              if (event.key === 'ArrowRight' && index < length - 1) {
                refs.current[index + 1]?.focus();
              }
            }}
            onPaste={(event) => {
              const pastedDigits = event.clipboardData
                .getData('text')
                .replace(/\D/g, '')
                .slice(0, length);

              if (!pastedDigits) {
                return;
              }

              event.preventDefault();
              onChange(pastedDigits);
              refs.current[Math.min(pastedDigits.length, length) - 1]?.focus();
            }}
          />
        ))}
      </div>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
};
