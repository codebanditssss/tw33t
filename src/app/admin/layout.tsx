import { redirect } from 'next/navigation';
import { getCurrentUserAdmin } from '@/lib/admin';
import { ReactNode } from 'react';

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
      {/* Simple admin header */}
      <header className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">
                TWT-LAB Admin
              </h1>
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