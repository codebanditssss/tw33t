import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function DashboardCard({ title, children, className = '' }: DashboardCardProps) {
  return (
    <div className={`bg-gray-800/50 rounded-lg p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
} 