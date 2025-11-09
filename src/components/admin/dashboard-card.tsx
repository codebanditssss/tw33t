import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function DashboardCard({ title, children, className = '', action }: DashboardCardProps) {
  return (
    <div className={`bg-gray-800/50 rounded-lg p-6 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {title}
        </h3>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
} 