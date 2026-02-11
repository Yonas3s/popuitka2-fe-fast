import { useState, type InputHTMLAttributes } from 'react';

type TextInputProps = {
  label: string;
  error?: string;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
  withPasswordToggle?: boolean;
};

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg className="password-eye-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {open ? (
      <path
        d="M12 5c-6.9 0-10.2 6.3-10.2 7s3.3 7 10.2 7 10.2-6.3 10.2-7S18.9 5 12 5Zm0 11.3A4.3 4.3 0 1 1 12 7.7a4.3 4.3 0 0 1 0 8.6Zm0-6.9a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Z"
        fill="currentColor"
      />
    ) : (
      <path
        d="m3.3 2.3 18.4 18.4-1 1-3.1-3.1a12.7 12.7 0 0 1-5.6 1.4C5 20 1.8 13.7 1.8 13s1-2.6 2.7-4.3L2.3 6.5l1-1Zm2.2 7.4A8.9 8.9 0 0 0 3.6 13c.6 1 3.2 5.3 8.4 5.3 1.5 0 2.8-.3 4-.9l-2-2a4.3 4.3 0 0 1-5.6-5.6l-2.9-.1Zm6.1-.3 3 3a2.6 2.6 0 0 0-3-3Zm.4-4.4c7 0 10.2 6.3 10.2 7a9.9 9.9 0 0 1-3.2 4.3l-1.2-1.2a8.3 8.3 0 0 0 2.6-3.1c-.6-1-3.2-5.3-8.4-5.3-.8 0-1.5.1-2.2.3l-1.4-1.3A11.2 11.2 0 0 1 12 5Z"
        fill="currentColor"
      />
    )}
  </svg>
);

export const TextInput = ({ label, error, inputProps, withPasswordToggle = false }: TextInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const shouldTogglePassword = withPasswordToggle && inputProps.type === 'password';

  const resolvedType = shouldTogglePassword ? (showPassword ? 'text' : 'password') : inputProps.type;

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <div className="input-wrap">
        <input className={`input ${shouldTogglePassword ? 'input-with-toggle' : ''}`} {...inputProps} type={resolvedType} />
        {shouldTogglePassword ? (
          <button
            type="button"
            className="password-toggle"
            onClick={() => {
              setShowPassword((prev) => !prev);
            }}
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            <EyeIcon open={showPassword} />
          </button>
        ) : null}
      </div>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
};
