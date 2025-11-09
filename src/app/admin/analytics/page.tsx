import { AdvancedAnalytics } from '@/components/admin/advanced-analytics';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Advanced Analytics
        </h2>
        <p className="text-gray-400">
          Comprehensive platform analytics with time-series data and trends.
        </p>
      </div>

      <AdvancedAnalytics />
    </div>
  );
} 