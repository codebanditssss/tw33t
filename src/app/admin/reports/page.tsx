import { AutomatedReports } from '@/components/admin/automated-reports';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Automated Reports
        </h2>
        <p className="text-gray-400">
          Schedule, generate, and manage automated analytics reports.
        </p>
      </div>

      <AutomatedReports />
    </div>
  );
} 