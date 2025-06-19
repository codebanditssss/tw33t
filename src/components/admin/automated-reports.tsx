'use client';

import { useEffect, useState } from 'react';
import { DashboardCard } from './dashboard-card';
import { 
  FileText, 
  Calendar, 
  Mail, 
  Download, 
  Play, 
  Pause,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ReportSchedule {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly';
  frequency: string;
  recipients: string[];
  enabled: boolean;
  lastRun: string | null;
  nextRun: string;
  status: 'active' | 'paused' | 'error';
}

interface ReportHistory {
  id: string;
  reportName: string;
  generatedAt: string;
  status: 'success' | 'failed';
  downloadUrl?: string;
  size?: string;
}

export function AutomatedReports() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewReportModal, setShowNewReportModal] = useState(false);

  useEffect(() => {
    fetchReportData();
    
    // Refresh data every 60 seconds
    const interval = setInterval(fetchReportData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchReportData = async () => {
    try {
      const [schedulesResponse, historyResponse] = await Promise.all([
        fetch('/api/admin/reports/schedules'),
        fetch('/api/admin/reports/history')
      ]);

      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json();
        setSchedules(schedulesData.schedules || []);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistory(historyData.history || []);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Set sample data on error
      setSchedules(generateSampleSchedules());
      setHistory(generateSampleHistory());
    } finally {
      setLoading(false);
    }
  };

  const toggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/reports/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, enabled })
      });

      if (response.ok) {
        setSchedules(prev => 
          prev.map(schedule => 
            schedule.id === scheduleId 
              ? { ...schedule, enabled, status: enabled ? 'active' : 'paused' }
              : schedule
          )
        );
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const generateReport = async (scheduleId: string) => {
    try {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId })
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh history to show new report
        fetchReportData();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const getStatusIcon = (status: ReportSchedule['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: ReportSchedule['type']) => {
    switch (type) {
      case 'daily':
        return 'text-blue-400 bg-blue-900/20';
      case 'weekly':
        return 'text-green-400 bg-green-900/20';
      case 'monthly':
        return 'text-purple-400 bg-purple-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Report Schedules">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </DashboardCard>
        
        <DashboardCard title="Report History">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </DashboardCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm">Active Schedules</p>
              <p className="text-2xl font-bold text-white">
                {schedules.filter(s => s.enabled).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm">Reports Generated</p>
              <p className="text-2xl font-bold text-white">
                {history.filter(h => h.status === 'success').length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm">Next Report</p>
              <p className="text-lg font-semibold text-white">
                {schedules.find(s => s.enabled)?.nextRun ? 
                  new Date(schedules.find(s => s.enabled)!.nextRun).toLocaleDateString() : 
                  'None'
                }
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Email Recipients</p>
              <p className="text-2xl font-bold text-white">
                {Array.from(new Set(schedules.flatMap(s => s.recipients))).length}
              </p>
            </div>
            <Mail className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Report Schedules and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Schedules */}
        <DashboardCard 
          title="Report Schedules"
          action={
            <button
              onClick={() => setShowNewReportModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              New Report
            </button>
          }
        >
          <div className="space-y-3">
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3" />
                <p>No scheduled reports</p>
                <p className="text-sm">Create your first automated report</p>
              </div>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(schedule.status)}
                      <div>
                        <h4 className="text-white font-medium">{schedule.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${getTypeColor(schedule.type)}`}>
                            {schedule.type}
                          </span>
                          <span className="text-xs text-gray-400">{schedule.frequency}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => generateReport(schedule.id)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Generate now"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleSchedule(schedule.id, !schedule.enabled)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title={schedule.enabled ? 'Pause' : 'Resume'}
                      >
                        {schedule.enabled ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex items-center space-x-4">
                      <span>Recipients: {schedule.recipients.length}</span>
                      <span>
                        Last run: {schedule.lastRun ? 
                          new Date(schedule.lastRun).toLocaleDateString() : 
                          'Never'
                        }
                      </span>
                    </div>
                    <div>
                      Next run: {new Date(schedule.nextRun).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardCard>

        {/* Report History */}
        <DashboardCard title="Recent Reports">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3" />
                <p>No reports generated yet</p>
                <p className="text-sm">Reports will appear here once generated</p>
              </div>
            ) : (
              history.map((report) => (
                <div
                  key={report.id}
                  className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        report.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      <div>
                        <h4 className="text-white font-medium text-sm">{report.reportName}</h4>
                        <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                          <span>{new Date(report.generatedAt).toLocaleString()}</span>
                          {report.size && <span>{report.size}</span>}
                        </div>
                      </div>
                    </div>
                    
                    {report.downloadUrl && report.status === 'success' && (
                      <button
                        onClick={() => window.open(report.downloadUrl, '_blank')}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Download report"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Quick Report Templates */}
      <DashboardCard title="Quick Report Templates">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
            <h4 className="text-white font-medium mb-2">Daily Summary</h4>
            <p className="text-gray-400 text-sm mb-3">
              Daily user activity, generations, and system health
            </p>
            <button
              onClick={() => generateReport('daily-summary')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Generate Now
            </button>
          </div>

          <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
            <h4 className="text-white font-medium mb-2">Weekly Analytics</h4>
            <p className="text-gray-400 text-sm mb-3">
              Comprehensive weekly performance and usage trends
            </p>
            <button
              onClick={() => generateReport('weekly-analytics')}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Generate Now
            </button>
          </div>

          <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
            <h4 className="text-white font-medium mb-2">Revenue Report</h4>
            <p className="text-gray-400 text-sm mb-3">
              Monthly revenue, subscriptions, and financial metrics
            </p>
            <button
              onClick={() => generateReport('revenue-report')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Generate Now
            </button>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}

function generateSampleSchedules(): ReportSchedule[] {
  return [
    {
      id: 'daily-summary',
      name: 'Daily Summary Report',
      type: 'daily',
      frequency: 'Every day at 9:00 AM',
      recipients: ['admin@twtlab.com'],
      enabled: true,
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    {
      id: 'weekly-analytics',
      name: 'Weekly Analytics Report',
      type: 'weekly',
      frequency: 'Every Monday at 8:00 AM',
      recipients: ['admin@twtlab.com', 'team@twtlab.com'],
      enabled: true,
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    {
      id: 'monthly-revenue',
      name: 'Monthly Revenue Report',
      type: 'monthly',
      frequency: '1st of every month at 10:00 AM',
      recipients: ['admin@twtlab.com'],
      enabled: false,
      lastRun: null,
      nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'paused'
    }
  ];
}

function generateSampleHistory(): ReportHistory[] {
  return [
    {
      id: 'report-1',
      reportName: 'Daily Summary Report',
      generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'success',
      downloadUrl: '#',
      size: '2.3 MB'
    },
    {
      id: 'report-2',
      reportName: 'Weekly Analytics Report',
      generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'success',
      downloadUrl: '#',
      size: '5.7 MB'
    },
    {
      id: 'report-3',
      reportName: 'Daily Summary Report',
      generatedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      status: 'failed'
    }
  ];
} 