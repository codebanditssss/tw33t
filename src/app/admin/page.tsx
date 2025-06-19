import { UserMetrics } from '@/components/admin/user-metrics';

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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Metrics */}
        <UserMetrics />

        {/* System Status */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            System Status
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-green-400">System Online</span>
          </div>
        </div>
      </div>
    </div>
  );
} 