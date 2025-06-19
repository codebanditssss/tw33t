import { redirect } from 'next/navigation';
import { getCurrentUserAdmin } from '@/lib/admin';
import { ReactNode } from 'react';
import Link from 'next/link';
import { BarChart3, Users, TrendingUp, Bell, FileText } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isAdmin } = await getCurrentUserAdmin();

  // Redirect if not logged in
  if (!user) {
    redirect('/');
  }

  // Redirect if not admin
  if (!isAdmin) {
    redirect('/?error=unauthorized');
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#161618' }}>
      {/* Admin header with navigation */}
      <header className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-white">
                TWT-LAB Admin
              </h1>
              
              {/* Navigation */}
              <nav className="flex space-x-6">
                <Link 
                  href="/admin" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  href="/admin/analytics" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Analytics</span>
                </Link>
                <Link 
                  href="/admin/alerts" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span>Alerts</span>
                </Link>
                <Link 
                  href="/admin/reports" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Reports</span>
                </Link>
                <Link 
                  href="/admin/users" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </Link>
              </nav>
            </div>
            <div className="text-sm text-gray-400">
              {user.email}
            </div>
          </div>
        </div>
      </header>

      {/* Admin content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 