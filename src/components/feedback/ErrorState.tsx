type ErrorStateProps = {
  title?: string;
  message: string;
};

export const ErrorState = ({ title = 'Ошибка', message }: ErrorStateProps) => {
  return (
    <div className="error-state panel">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
};
