import type { InputHTMLAttributes } from 'react';

type TextInputProps = {
  label: string;
  error?: string;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
};

export const TextInput = ({ label, error, inputProps }: TextInputProps) => {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input className="input" {...inputProps} />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
};
