import { ReactNode } from 'react';

interface PageTitleProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function PageTitle({ title, description, icon, action }: PageTitleProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-3">
        {icon && <div className="hidden md:flex">{icon}</div>}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}