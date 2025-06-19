import { AlertSystem } from '@/components/admin/alert-system';

export default function AlertsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Alert Management
        </h2>
        <p className="text-gray-400">
          Monitor system alerts, configure thresholds, and manage notifications.
        </p>
      </div>

      <AlertSystem />
    </div>
  );
} 