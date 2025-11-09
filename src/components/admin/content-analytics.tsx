'use client';

import { useEffect, useState } from 'react';
import { DashboardCard } from './dashboard-card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, MessageCircle, Hash, Zap } from 'lucide-react';

interface ContentAnalytics {
  popularTones: Array<{
    tone: string;
    count: number;
    percentage: number;
  }>;
  contentTypes: {
    tweets: number;
    replies: number;
    threads: number;
  };
  engagementPatterns: Array<{
    day: string;
    generations: number;
  }>;
  contentLengthDistribution: Array<{
    range: string;
    count: number;
  }>;
  topPerformingContent: Array<{
    type: string;
    tone: string;
    count: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function ContentAnalytics() {
  const [analytics, setAnalytics] = useState<ContentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh analytics every 60 seconds
    const interval = setInterval(fetchAnalytics, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/content-analytics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch content analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error fetching content analytics:', error);
      setError('Failed to load content analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardCard title="Content Analytics">
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
      <DashboardCard title="Content Analytics">
        <div className="text-red-400">
          {error || 'Failed to load analytics'}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Content Analytics">
      <div className="space-y-6">
        {/* Content Type Distribution */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <span className="text-gray-300">Content Type Distribution</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-3 bg-gray-700/30 rounded">
              <div className="text-lg font-semibold text-blue-400">
                {analytics.contentTypes.tweets.toLocaleString()}
              </div>
              <div className="text-gray-400">Tweets</div>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded">
              <div className="text-lg font-semibold text-green-400">
                {analytics.contentTypes.replies.toLocaleString()}
              </div>
              <div className="text-gray-400">Replies</div>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded">
              <div className="text-lg font-semibold text-yellow-400">
                {analytics.contentTypes.threads.toLocaleString()}
              </div>
              <div className="text-gray-400">Threads</div>
            </div>
          </div>
        </div>

        {/* Popular Tones */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="text-gray-300">Popular Tones</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Tone List */}
            <div className="space-y-2">
              {analytics.popularTones.slice(0, 5).map((tone, index) => (
                <div key={tone.tone} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm text-gray-300 capitalize">{tone.tone}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {tone.count} ({tone.percentage}%)
                  </div>
                </div>
              ))}
            </div>

            {/* Tone Chart */}
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.popularTones.slice(0, 5)}
                    dataKey="count"
                    nameKey="tone"
                    cx="50%"
                    cy="50%"
                    outerRadius={50}
                    fill="#8884d8"
                  >
                    {analytics.popularTones.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Engagement Patterns */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">7-Day Generation Trend</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.engagementPatterns}>
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Line 
                  type="monotone" 
                  dataKey="generations" 
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Length Distribution */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Hash className="w-5 h-5 text-orange-400" />
            <span className="text-gray-300">Content Length Distribution</span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.contentLengthDistribution}>
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Bar 
                  dataKey="count" 
                  fill="#F59E0B"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Content */}
        <div className="border-t border-gray-700 pt-4">
          <div className="text-gray-300 mb-3">Top Performing Combinations</div>
          <div className="space-y-2 text-sm">
            {analytics.topPerformingContent.slice(0, 3).map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-700/20 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-400 capitalize">{item.type}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-purple-400 capitalize">{item.tone}</span>
                </div>
                <span className="text-white font-medium">{item.count} uses</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
} 