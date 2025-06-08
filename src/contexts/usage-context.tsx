'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context';
import { supabase } from '@/lib/supabase';

interface UsageStatus {
  canGenerate: boolean;
  currentUsage: number;
  limit: number;
  planType: string;
}

interface UsageContextType {
  usageStatus: UsageStatus | null;
  loading: boolean;
  refreshUsage: () => Promise<void>;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: ReactNode }) {
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const { user } = useAuth();

  const fetchUsage = async () => {
    if (!user) {
      setUsageStatus(null);
      return;
    }

    // Debounce: Don't fetch if we just fetched within the last 5 seconds
    const now = Date.now();
    if (now - lastFetchTime < 5000) {
      return;
    }
    setLastFetchTime(now);

    setLoading(true);
    try {
      const response = await fetch('/api/usage/check', {
        method: 'GET',
        credentials: 'include', // Include cookies for auth
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsageStatus({
          canGenerate: data.canGenerate,
          currentUsage: data.currentUsage,
          limit: data.limit,
          planType: data.planType
        });
      } else {
        console.error('Usage check failed:', response.status, response.statusText);
        // If unauthorized, set default free plan
        if (response.status === 401) {
          setUsageStatus({
            canGenerate: true,
            currentUsage: 0,
            limit: 50,
            planType: 'free'
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      // Set default free plan on error
      setUsageStatus({
        canGenerate: true,
        currentUsage: 0,
        limit: 50,
        planType: 'free'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshUsage = useCallback(async () => {
    await fetchUsage();
  }, []);

  useEffect(() => {
    // Only fetch when user ID changes, not the entire user object
    if (user?.id) {
      fetchUsage();
    } else {
      setUsageStatus(null);
    }
  }, [user?.id]);

  return (
    <UsageContext.Provider value={{ usageStatus, loading, refreshUsage }}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const context = useContext(UsageContext);
  if (context === undefined) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
} 