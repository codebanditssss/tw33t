'use client';

import { useEffect, useState } from 'react';
import { DashboardCard } from './dashboard-card';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Bell, 
  Settings, 
  Mail,
  Clock,
  TrendingDown,
  Server,
  Users
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  category: 'system' | 'usage' | 'revenue' | 'security';
}

interface AlertThresholds {
  criticalErrors: number;
  lowCredits: number;
  highChurnRate: number;
  systemDowntime: number;
  unusualActivity: number;
}

interface AlertSettings {
  emailNotifications: boolean;
  slackNotifications: boolean;
  criticalOnly: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export function AlertSystem() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    criticalErrors: 10,
    lowCredits: 100,
    highChurnRate: 15,
    systemDowntime: 5,
    unusualActivity: 50
  });
  const [settings, setSettings] = useState<AlertSettings>({
    emailNotifications: true,
    slackNotifications: false,
    criticalOnly: false,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    }
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchAlerts();
    fetchSettings();
    
    // Check for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/admin/alerts');
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/alert-settings');
      
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.thresholds) {
          setThresholds(data.thresholds);
        }
      }
    } catch (error) {
      console.error('Error fetching alert settings:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/alerts/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });

      if (response.ok) {
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId 
              ? { ...alert, acknowledged: true }
              : alert
          )
        );
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<AlertSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/admin/alert-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings })
      });

      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const updateThresholds = async (newThresholds: Partial<AlertThresholds>) => {
    try {
      const updatedThresholds = { ...thresholds, ...newThresholds };
      
      const response = await fetch('/api/admin/alert-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholds: updatedThresholds })
      });

      if (response.ok) {
        setThresholds(updatedThresholds);
      }
    } catch (error) {
      console.error('Error updating thresholds:', error);
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: Alert['category']) => {
    switch (category) {
      case 'system':
        return <Server className="w-4 h-4" />;
      case 'usage':
        return <TrendingDown className="w-4 h-4" />;
      case 'revenue':
        return <Users className="w-4 h-4" />;
      case 'security':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.acknowledged);
  const warningAlerts = alerts.filter(a => a.type === 'warning' && !a.acknowledged);
  const totalUnacknowledged = alerts.filter(a => !a.acknowledged).length;

  if (loading) {
    return (
      <DashboardCard title="Alert System">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm">Critical Alerts</p>
              <p className="text-2xl font-bold text-white">{criticalAlerts.length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm">Warning Alerts</p>
              <p className="text-2xl font-bold text-white">{warningAlerts.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm">Total Unacknowledged</p>
              <p className="text-2xl font-bold text-white">{totalUnacknowledged}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">System Status</p>
              <p className="text-lg font-semibold text-green-400">Operational</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Alert List and Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <div className="lg:col-span-2">
          <DashboardCard 
            title="Recent Alerts" 
            action={
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>
            }
          >
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p>No alerts at this time</p>
                  <p className="text-sm">System is running smoothly</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.acknowledged 
                        ? 'bg-gray-800/30 border-gray-700' 
                        : alert.type === 'critical'
                        ? 'bg-red-900/20 border-red-800'
                        : alert.type === 'warning'
                        ? 'bg-yellow-900/20 border-yellow-800'
                        : 'bg-blue-900/20 border-blue-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getCategoryIcon(alert.category)}
                            <h4 className="text-white font-medium">{alert.title}</h4>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{alert.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(alert.timestamp).toLocaleString()}</span>
                            </span>
                            <span className="capitalize">{alert.category}</span>
                          </div>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Alert Settings */}
        <div>
          <DashboardCard title="Alert Configuration">
            <div className="space-y-4">
              {/* Notification Settings */}
              <div>
                <h4 className="text-white font-medium mb-3">Notifications</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => updateSettings({ emailNotifications: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300 text-sm">Email notifications</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.criticalOnly}
                      onChange={(e) => updateSettings({ criticalOnly: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <AlertTriangle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300 text-sm">Critical alerts only</span>
                  </label>
                </div>
              </div>

              {/* Thresholds */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-white font-medium mb-3">Alert Thresholds</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">
                      Critical Errors (per hour)
                    </label>
                    <input
                      type="number"
                      value={thresholds.criticalErrors}
                      onChange={(e) => updateThresholds({ criticalErrors: parseInt(e.target.value) })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">
                      Low Credits Warning
                    </label>
                    <input
                      type="number"
                      value={thresholds.lowCredits}
                      onChange={(e) => updateThresholds({ lowCredits: parseInt(e.target.value) })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">
                      High Churn Rate (%)
                    </label>
                    <input
                      type="number"
                      value={thresholds.highChurnRate}
                      onChange={(e) => updateThresholds({ highChurnRate: parseInt(e.target.value) })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-white font-medium mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setAlerts(prev => prev.map(alert => ({ ...alert, acknowledged: true })));
                    }}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Acknowledge All Alerts
                  </button>
                  
                  <button
                    onClick={fetchAlerts}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Refresh Alerts
                  </button>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
} 