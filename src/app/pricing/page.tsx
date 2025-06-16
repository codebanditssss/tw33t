'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from "@/components/ui/header";
import { PricingSection } from "@/components/ui/pricing";
import { useAuth } from '@/contexts/auth-context';
import { useUsage } from '@/contexts/usage-context';

export default function PricingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { usageStatus, loading: usageLoading } = useUsage();

  // Redirect pro users to home page
  useEffect(() => {
    if (!authLoading && !usageLoading && user && usageStatus) {
      if (usageStatus.planType === 'pro') {
        router.push('/');
      }
    }
  }, [user, usageStatus, authLoading, usageLoading, router]);

  // Show loading while checking user status
  if (authLoading || usageLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1A1A1C' }}>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </main>
      </>
    );
  }

  // Don't render pricing page for pro users (they'll be redirected)
  if (user && usageStatus?.planType === 'pro') {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen" style={{ backgroundColor: '#1A1A1C' }}>
        <PricingSection />
      </main>
    </>
  );
} 