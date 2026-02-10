type EmptyStateProps = {
  title: string;
  description?: string;
};

export const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <div className="empty-state panel">
      <h3>{title}</h3>
      {description ? <p className="lead">{description}</p> : null}
    </div>
  );
};
