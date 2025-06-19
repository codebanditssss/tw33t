'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context';
import { toast } from 'sonner';

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

const DEFAULT_FREE_PLAN = {
  canGenerate: true,
  currentUsage: 0,
  limit: 50,
  planType: 'free'
};

export function UsageProvider({ children }: { children: ReactNode }) {
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, session } = useAuth();

  const fetchUsage = async () => {
    // If no user or session, set to default free plan
    if (!user || !session?.access_token) {
      setUsageStatus(DEFAULT_FREE_PLAN);
      return;
    }

    // Only show loading if we don't have any data yet
    if (!usageStatus) {
      setLoading(true);
    }

    try {
      // Get the current session token
      const token = session.access_token;
      
      if (!token) {
        console.error('No access token available');
        setUsageStatus(DEFAULT_FREE_PLAN);
        return;
      }

      const response = await fetch('/api/usage/check', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // If unauthorized, silently fall back to free plan
        if (response.status === 401) {
          console.log('Session expired or invalid, falling back to free plan');
          setUsageStatus(DEFAULT_FREE_PLAN);
          return;
        }
        
        // For other errors, show error message
        const errorText = await response.text();
        throw new Error(`Usage check failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setUsageStatus({
          canGenerate: data.canGenerate,
          currentUsage: data.currentUsage,
          limit: data.limit,
          planType: data.planType
        });
      } else {
        console.warn('Usage check returned unsuccessful response:', data);
        setUsageStatus(DEFAULT_FREE_PLAN);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      toast.error('Failed to check usage status');
      setUsageStatus(DEFAULT_FREE_PLAN);
    } finally {
      setLoading(false);
    }
  };

  const refreshUsage = useCallback(async () => {
    await fetchUsage();
  }, [user?.id, session?.access_token]);

  // Fetch usage when user or session changes
  useEffect(() => {
    fetchUsage();
  }, [user?.id, session?.access_token]);

  // Refresh usage every minute if user is logged in
  useEffect(() => {
    if (user?.id && session?.access_token) {
      const interval = setInterval(fetchUsage, 60000);
      return () => clearInterval(interval);
    }
  }, [user?.id, session?.access_token]);

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