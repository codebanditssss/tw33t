import { UserMetrics } from '@/components/admin/user-metrics';
import { UsageAnalytics } from '@/components/admin/usage-analytics';
import { SystemHealth } from '@/components/admin/system-health';
import { ContentAnalytics } from '@/components/admin/content-analytics';
import Link from 'next/link';
import { Bell, FileText, TrendingUp } from 'lucide-react';

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

      {/* Quick Access Panel */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/admin/analytics"
            className="flex items-center space-x-3 p-4 bg-blue-900/20 border border-blue-800 rounded-lg hover:bg-blue-900/30 transition-colors group"
          >
            <TrendingUp className="w-8 h-8 text-blue-400 group-hover:text-blue-300" />
            <div>
              <h4 className="text-white font-medium">Advanced Analytics</h4>
              <p className="text-gray-400 text-sm">Time-series charts and trends</p>
            </div>
          </Link>

          <Link 
            href="/admin/alerts"
            className="flex items-center space-x-3 p-4 bg-red-900/20 border border-red-800 rounded-lg hover:bg-red-900/30 transition-colors group"
          >
            <Bell className="w-8 h-8 text-red-400 group-hover:text-red-300" />
            <div>
              <h4 className="text-white font-medium">Alert Management</h4>
              <p className="text-gray-400 text-sm">System alerts and notifications</p>
            </div>
          </Link>

          <Link 
            href="/admin/reports"
            className="flex items-center space-x-3 p-4 bg-green-900/20 border border-green-800 rounded-lg hover:bg-green-900/30 transition-colors group"
          >
            <FileText className="w-8 h-8 text-green-400 group-hover:text-green-300" />
            <div>
              <h4 className="text-white font-medium">Automated Reports</h4>
              <p className="text-gray-400 text-sm">Scheduled analytics reports</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 