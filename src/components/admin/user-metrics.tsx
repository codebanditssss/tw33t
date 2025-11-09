'use client';

import { useEffect, useState } from 'react';
import { DashboardCard } from './dashboard-card';
import { Users, UserPlus, Activity } from 'lucide-react';

interface UserMetrics {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  newSignups: {
    today: number;
    week: number;
    month: number;
  };
  activeUsers: number;
}

export function UserMetrics() {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    
    // Refresh metrics every 30 seconds for real-time data
    const interval = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data.userMetrics);
    } catch (error) {
      console.error('Error fetching user metrics:', error);
      setError('Failed to load user metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardCard title="User Metrics">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </DashboardCard>
    );
  }

  if (error || !metrics) {
    return (
      <DashboardCard title="User Metrics">
        <div className="text-red-400">
          {error || 'Failed to load metrics'}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="User Metrics">
      <div className="space-y-4">
        {/* Total Users */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-gray-300">Total Users</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {metrics.totalUsers.toLocaleString()}
          </span>
        </div>

        {/* Free vs Pro breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-700/30 rounded">
            <div className="text-lg font-semibold text-green-400">
              {metrics.freeUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Free Users</div>
          </div>
          <div className="text-center p-3 bg-gray-700/30 rounded">
            <div className="text-lg font-semibold text-yellow-400">
              {metrics.proUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Pro Users</div>
          </div>
        </div>

        {/* New Signups */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <UserPlus className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">New Signups</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <div className="text-white font-semibold">{metrics.newSignups.today}</div>
              <div className="text-gray-400">Today</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold">{metrics.newSignups.week}</div>
              <div className="text-gray-400">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold">{metrics.newSignups.month}</div>
              <div className="text-gray-400">This Month</div>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300">Active Users</span>
              <span className="text-xs text-gray-500">(last 24h)</span>
            </div>
            <span className="text-xl font-bold text-purple-400">
              {metrics.activeUsers.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
} 