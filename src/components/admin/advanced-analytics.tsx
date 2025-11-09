'use client';

import { useEffect, useState } from 'react';
import { DashboardCard } from './dashboard-card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  ComposedChart,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, Users, Activity, Calendar } from 'lucide-react';

interface AdvancedAnalytics {
  userAcquisition: Array<{
    date: string;
    newUsers: number;
    totalUsers: number;
    proSignups: number;
  }>;
  usageTrends: Array<{
    date: string;
    credits: number;
    generations: number;
    activeUsers: number;
  }>;
  revenueMetrics: Array<{
    date: string;
    revenue: number;
    subscriptions: number;
    churnRate: number;
  }>;
  platformMetrics: {
    totalGenerations: number;
    avgGenerationsPerUser: number;
    retentionRate: number;
    conversionRate: number;
  };
}

export function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh analytics every 2 minutes
    const interval = setInterval(fetchAnalytics, 120000);
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/advanced-analytics?range=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch advanced analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      setError('Failed to load advanced analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="User Acquisition">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-48 bg-gray-700 rounded"></div>
          </div>
        </DashboardCard>
        
        <DashboardCard title="Usage Trends">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-48 bg-gray-700 rounded"></div>
          </div>
        </DashboardCard>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <DashboardCard title="Advanced Analytics">
        <div className="text-red-400">
          {error || 'Failed to load analytics'}
        </div>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Advanced Analytics</h3>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-5 h-5 text-green-400" />
            <span className="text-gray-300 text-sm">Total Generations</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.platformMetrics.totalGenerations.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-gray-300 text-sm">Avg per User</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.platformMetrics.avgGenerationsPerUser.toFixed(1)}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="text-gray-300 text-sm">Retention Rate</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.platformMetrics.retentionRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-5 h-5 text-orange-400" />
            <span className="text-gray-300 text-sm">Conversion Rate</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.platformMetrics.conversionRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Acquisition Chart */}
        <DashboardCard title="User Acquisition Trends">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.userAcquisition}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalUsers"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Total Users"
                />
                <Bar
                  yAxisId="right"
                  dataKey="newUsers"
                  fill="#10B981"
                  name="New Users"
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="proSignups"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
                  name="Pro Signups"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        {/* Usage Trends Chart */}
        <DashboardCard title="Platform Usage Trends">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.usageTrends}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="credits"
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  name="Credits Used"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={{ fill: '#EC4899', strokeWidth: 2, r: 3 }}
                  name="Active Users"
                />
                <Bar
                  yAxisId="left"
                  dataKey="generations"
                  fill="#06B6D4"
                  name="Generations"
                  fillOpacity={0.7}
                  radius={[2, 2, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        {/* Revenue Metrics Chart */}
        <DashboardCard title="Revenue & Subscriptions">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.revenueMetrics}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  fill="#10B981"
                  fillOpacity={0.3}
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
                <Bar
                  yAxisId="right"
                  dataKey="subscriptions"
                  fill="#3B82F6"
                  name="New Subscriptions"
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="churnRate"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                  name="Churn Rate (%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        {/* Geographic Distribution Placeholder */}
        <DashboardCard title="User Geographic Distribution">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-lg mb-2">🌍</div>
              <p className="text-sm">Geographic data coming soon</p>
              <p className="text-xs mt-2">
                Will show user distribution by country/region
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
} 