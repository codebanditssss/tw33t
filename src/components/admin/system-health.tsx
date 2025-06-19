'use client';

import { useEffect, useState } from 'react';
import { DashboardCard } from './dashboard-card';
import { Activity, Database, Zap, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface SystemHealth {
  apiResponseTime: number;
  databaseStatus: string;
  errorRate: number;
  uptime: string;
  openaiApiCalls: {
    today: number;
    week: number;
    month: number;
  };
  estimatedCosts: {
    today: string;
    week: string;
    month: string;
  };
}

export function SystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth();
    
    // Refresh health every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch system health');
      }

      const data = await response.json();
      setHealth(data.systemHealth);
    } catch (error) {
      console.error('Error fetching system health:', error);
      setError('Failed to load system health');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardCard title="System Health">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </DashboardCard>
    );
  }

  if (error || !health) {
    return (
      <DashboardCard title="System Health">
        <div className="text-red-400">
          {error || 'Failed to load system health'}
        </div>
      </DashboardCard>
    );
  }

  // Determine response time status
  const getResponseTimeStatus = (time: number) => {
    if (time < 200) return { color: 'text-green-400', status: 'Excellent' };
    if (time < 500) return { color: 'text-yellow-400', status: 'Good' };
    if (time < 1000) return { color: 'text-orange-400', status: 'Fair' };
    return { color: 'text-red-400', status: 'Slow' };
  };

  const responseTimeStatus = getResponseTimeStatus(health.apiResponseTime);

  return (
    <DashboardCard title="System Health">
      <div className="space-y-6">
        {/* API Response Time */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300">API Response Time</span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-semibold ${responseTimeStatus.color}`}>
                {health.apiResponseTime}ms
              </div>
              <div className={`text-xs ${responseTimeStatus.color}`}>
                {responseTimeStatus.status}
              </div>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300">Database</span>
            </div>
            <div className="flex items-center space-x-2">
              {health.databaseStatus === 'healthy' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span className={health.databaseStatus === 'healthy' ? 'text-green-400' : 'text-red-400'}>
                {health.databaseStatus.charAt(0).toUpperCase() + health.databaseStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* System Uptime */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-gray-300">Uptime</span>
            </div>
            <span className="text-lg font-semibold text-green-400">
              {health.uptime}
            </span>
          </div>
        </div>

        {/* OpenAI API Usage */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-300">OpenAI API Calls</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-3 bg-gray-700/30 rounded">
              <div className="text-lg font-semibold text-yellow-400">
                {health.openaiApiCalls.today.toLocaleString()}
              </div>
              <div className="text-gray-400">Today</div>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded">
              <div className="text-lg font-semibold text-yellow-400">
                {health.openaiApiCalls.week.toLocaleString()}
              </div>
              <div className="text-gray-400">This Week</div>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded">
              <div className="text-lg font-semibold text-yellow-400">
                {health.openaiApiCalls.month.toLocaleString()}
              </div>
              <div className="text-gray-400">This Month</div>
            </div>
          </div>
        </div>

        {/* Estimated Costs */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">Estimated OpenAI Costs</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-3 bg-gray-700/30 rounded">
              <div className="text-lg font-semibold text-green-400">
                ${health.estimatedCosts.today}
              </div>
              <div className="text-gray-400">Today</div>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded">
              <div className="text-lg font-semibold text-green-400">
                ${health.estimatedCosts.week}
              </div>
              <div className="text-gray-400">This Week</div>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded">
              <div className="text-lg font-semibold text-green-400">
                ${health.estimatedCosts.month}
              </div>
              <div className="text-gray-400">This Month</div>
            </div>
          </div>
        </div>

        {/* Error Rate */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">Error Rate</span>
              <span className="text-xs text-gray-500">(24h)</span>
            </div>
            <span className="text-lg font-semibold text-green-400">
              {health.errorRate}%
            </span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
} 