'use client';

import { useEffect, useState } from 'react';
import { DashboardCard } from './dashboard-card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, Zap } from 'lucide-react';

interface UsageAnalytics {
  creditsConsumed: {
    today: number;
    week: number;
    month: number;
  };
  avgCreditsPerUser: number;
  peakHours: Array<{
    hour: number;
    usage: number;
    label: string;
  }>;
  generationBreakdown: {
    byCount: {
      tweets: number;
      replies: number;
      threads: number;
    };
    byCredits: {
      tweets: number;
      replies: number;
      threads: number;
    };
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

export function UsageAnalytics() {
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh analytics every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.usageAnalytics);
    } catch (error) {
      console.error('Error fetching usage analytics:', error);
      setError('Failed to load usage analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardCard title="Usage Analytics">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </DashboardCard>
    );
  }

  if (error || !analytics) {
    return (
      <DashboardCard title="Usage Analytics">
        <div className="text-red-400">
          {error || 'Failed to load analytics'}
        </div>
      </DashboardCard>
    );
  }

  // Prepare pie chart data for generation breakdown by count
  const pieData = [
    { name: 'Tweets', value: analytics.generationBreakdown.byCount.tweets, color: COLORS[0] },
    { name: 'Replies', value: analytics.generationBreakdown.byCount.replies, color: COLORS[1] },
    { name: 'Threads', value: analytics.generationBreakdown.byCount.threads, color: COLORS[2] }
  ].filter(item => item.value > 0);

  return (
    <DashboardCard title="Usage Analytics">
      <div className="space-y-6">
        {/* Credits Consumed */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-gray-300">Credits Consumed</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-3 bg-gray-700/30 rounded">
              <div className="text-lg font-semibold text-blue-400">
                {analytics.creditsConsumed.today.toLocaleString()}
              </div>
              <div className="text-gray-400">Today</div>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded">
              <div className="text-lg font-semibold text-blue-400">
                {analytics.creditsConsumed.week.toLocaleString()}
              </div>
              <div className="text-gray-400">This Week</div>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded">
              <div className="text-lg font-semibold text-blue-400">
                {analytics.creditsConsumed.month.toLocaleString()}
              </div>
              <div className="text-gray-400">This Month</div>
            </div>
          </div>
        </div>

        {/* Average Credits Per User */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300">Avg Credits/User</span>
              <span className="text-xs text-gray-500">(active users)</span>
            </div>
            <span className="text-xl font-bold text-yellow-400">
              {analytics.avgCreditsPerUser}
            </span>
          </div>
        </div>

        {/* Peak Usage Hours Chart */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-gray-300">Peak Usage Hours</span>
            <span className="text-xs text-gray-500">(last 7 days)</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.peakHours}>
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Bar 
                  dataKey="usage" 
                  fill="#8B5CF6"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Generation Type Breakdown */}
        <div className="border-t border-gray-700 pt-4">
          <div className="text-gray-300 mb-3">Generation Breakdown</div>
          <div className="grid grid-cols-2 gap-4">
            {/* By Count */}
            <div>
              <div className="text-sm text-gray-400 mb-2">By Count</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-400">Tweets</span>
                  <span className="text-white">{analytics.generationBreakdown.byCount.tweets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Replies</span>
                  <span className="text-white">{analytics.generationBreakdown.byCount.replies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400">Threads</span>
                  <span className="text-white">{analytics.generationBreakdown.byCount.threads}</span>
                </div>
              </div>
            </div>

            {/* By Credits */}
            <div>
              <div className="text-sm text-gray-400 mb-2">By Credits</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-400">Tweets</span>
                  <span className="text-white">{analytics.generationBreakdown.byCredits.tweets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Replies</span>
                  <span className="text-white">{analytics.generationBreakdown.byCredits.replies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400">Threads</span>
                  <span className="text-white">{analytics.generationBreakdown.byCredits.threads}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
} 