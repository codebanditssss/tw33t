import { createClient } from '@supabase/supabase-js';

// Use service role key for usage operations to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Plan limits
export const PLAN_LIMITS = {
  free: 50,
  pro: 500
} as const;

// Simple in-memory cache for usage data
interface CacheEntry {
  data: {
    canGenerate: boolean;
    currentUsage: number;
    limit: number;
    planType: string;
  };
  timestamp: number;
}

const usageCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

// Get current month in YYYY-MM format
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Get user's current plan
export async function getUserPlan(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_subscriptions')
    .select('plan_type, status')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Default to free plan if no subscription record
    return { plan_type: 'free', status: 'active' };
  }

  return data;
}

// Get current month usage for user
export async function getCurrentUsage(userId: string) {
  const monthYear = getCurrentMonth();
  
  const { data, error } = await supabaseAdmin
    .from('monthly_usage')
    .select('tweets_generated')
    .eq('user_id', userId)
    .eq('month_year', monthYear)
    .single();

  if (error || !data) {
    // No usage record for this month, return 0
    return { tweets_generated: 0 };
  }

  return data;
}

// Optimized function to get both plan and usage in a single operation
export async function getUserUsageStatus(userId: string): Promise<{
  canGenerate: boolean;
  currentUsage: number;
  limit: number;
  planType: string;
}> {
  // Check cache first
  const cacheKey = `${userId}-${getCurrentMonth()}`;
  const cached = usageCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const monthYear = getCurrentMonth();
  
  // Get plan and usage data in parallel for better performance
  const [planResult, usageResult] = await Promise.all([
    supabaseAdmin
      .from('user_subscriptions')
      .select('plan_type, status')
      .eq('user_id', userId)
      .single(),
    supabaseAdmin
      .from('monthly_usage')
      .select('tweets_generated')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single()
  ]);

  // Handle plan data
  const planType = planResult.data?.plan_type || 'free';
  const limit = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS];
  
  // Handle usage data
  const currentUsage = usageResult.data?.tweets_generated || 0;
  
  const result = {
    canGenerate: currentUsage < limit,
    currentUsage,
    limit,
    planType
  };

  // Cache the result
  usageCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
}

// Check if user can generate tweets (legacy function for backward compatibility)
export async function canUserGenerate(userId: string): Promise<{
  canGenerate: boolean;
  currentUsage: number;
  limit: number;
  planType: string;
}> {
  return getUserUsageStatus(userId);
}
// Increment usage count
export async function incrementUsage(userId: string): Promise<void> {
  const monthYear = getCurrentMonth();
  
  // First, try to get existing record
  const { data: currentData } = await supabaseAdmin
    .from('monthly_usage')
    .select('tweets_generated')
    .eq('user_id', userId)
    .eq('month_year', monthYear)
    .single();

  if (currentData) {
    // Record exists, increment it
    const newCount = currentData.tweets_generated + 1;
    
    const { error: updateError } = await supabaseAdmin
      .from('monthly_usage')
      .update({
        tweets_generated: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('month_year', monthYear);

    if (updateError) {
      console.error('Failed to increment usage:', updateError);
      throw new Error('Failed to update usage count');
    }
  } else {
    // Record doesn't exist, create new one with count 1
    const { error: insertError } = await supabaseAdmin
      .from('monthly_usage')
      .insert({
        user_id: userId,
        month_year: monthYear,
        tweets_generated: 1
      });

    if (insertError) {
      console.error('Failed to create usage record:', insertError);
      throw new Error('Failed to create usage record');
    }
  }

  // Invalidate cache after incrementing usage
  const cacheKey = `${userId}-${monthYear}`;
  usageCache.delete(cacheKey);
} 

