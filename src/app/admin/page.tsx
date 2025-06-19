import { UserMetrics } from '@/components/admin/user-metrics';
import { UsageAnalytics } from '@/components/admin/usage-analytics';
import { SystemHealth } from '@/components/admin/system-health';
import { ContentAnalytics } from '@/components/admin/content-analytics';

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Admin Dashboard
        </h2>
        <p className="text-gray-400">
          Welcome to the TWT-LAB admin panel. Monitor your platform metrics below.
        </p>
      </div>

      {/* Top Row - User Metrics and Usage Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Metrics */}
        <UserMetrics />

        {/* Usage Analytics */}
        <UsageAnalytics />
      </div>

      {/* Bottom Row - System Health and Content Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemHealth />
        <ContentAnalytics />
      </div>
    </div>
  );
} 