import { getServerClient } from './supabase';

// Plan limits (in credits)
// Free: 10 tweets/replies (50 credits) or threads up to 50 tweets total
// Pro: 100 tweets/replies (500 credits) or threads up to 500 tweets total
export const PLAN_LIMITS = {
  free: 50,
  pro: 500
} as const;

// Note: No caching to ensure real-time usage updates

// Get current month in YYYY-MM format
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Get user's current plan
export async function getUserPlan(userId: string) {
  const { data, error } = await getServerClient()
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

interface UsageRecord {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

// Get current month usage for user
export async function getCurrentUsage(userId: string) {
  try {
    const supabase = getServerClient();
  
    const { data, error } = await supabase
      .from('usage_history')
      .select()
    .eq('user_id', userId)
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .returns<UsageRecord[]>();

    if (error) {
      console.error('Error fetching usage:', error);
      return { tweets_generated: 0 };
    }

    const totalUsage = (data || []).reduce((sum, record) => sum + record.amount, 0);
    return { tweets_generated: totalUsage };
  } catch (error) {
    console.error('Error in getCurrentUsage:', error);
    return { tweets_generated: 0 };
  }
}

interface UsageStatus {
  canGenerate: boolean;
  currentUsage: number;
  limit: number;
  planType: string;
}

// Optimized function to get both plan and usage in a single operation
export async function getUserUsageStatus(userId: string): Promise<UsageStatus> {
  try {
    const supabase = getServerClient();

    // Get plan and usage data in parallel for better performance
    const [planResult, usageResult] = await Promise.all([
      supabase
        .from('user_subscriptions')
        .select('plan_type, status')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('usage_history')
        .select()
        .eq('user_id', userId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .returns<UsageRecord[]>()
    ]);

    // Handle any errors
    if (planResult.error && planResult.error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', planResult.error);
      throw planResult.error;
    }

    if (usageResult.error) {
      console.error('Error fetching usage:', usageResult.error);
      throw usageResult.error;
    }

    // Determine plan type and limit
    const planType = planResult.data?.plan_type || 'free';
    const isSubscriptionActive = planResult.data?.status === 'active';
    const effectivePlanType = isSubscriptionActive && planType ? planType : 'free';
    const limit = PLAN_LIMITS[effectivePlanType as keyof typeof PLAN_LIMITS];
    
    // Calculate total usage from all records
    const currentUsage = (usageResult.data || []).reduce((sum, record) => sum + record.amount, 0);

    return {
      canGenerate: currentUsage < limit,
      currentUsage,
      limit,
      planType: effectivePlanType as string
    };

  } catch (error) {
    console.error('Error in getUserUsageStatus:', error);
    // Return free plan limits on error
    return {
      canGenerate: true,
      currentUsage: 0,
      limit: PLAN_LIMITS.free,
      planType: 'free'
    };
  }
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

// No need for incrementUserUsage since we're tracking usage through tweet_history table directly 

// Increment usage for user
export async function incrementUsage(userId: string, amount: number = 1) {
  try {
    const supabase = getServerClient();
    
    // Insert a new usage record with required fields
    const { error } = await supabase
      .from('usage_history')
      .insert({
        user_id: userId,
        amount,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }

    // Usage incremented successfully
    
    return true;
  } catch (error) {
    console.error('Error in incrementUsage:', error);
    throw error;
  }
}

