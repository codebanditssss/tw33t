import { supabase } from './supabase';

// Plan limits
export const PLAN_LIMITS = {
  free: 50,
  pro: 500
} as const;

// Get current month in YYYY-MM format
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Get user's current plan
export async function getUserPlan(userId: string) {
  const { data, error } = await supabase
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
  
  const { data, error } = await supabase
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

// Check if user can generate tweets
export async function canUserGenerate(userId: string): Promise<{
  canGenerate: boolean;
  currentUsage: number;
  limit: number;
  planType: string;
}> {
  const plan = await getUserPlan(userId);
  const usage = await getCurrentUsage(userId);
  const limit = PLAN_LIMITS[plan.plan_type as keyof typeof PLAN_LIMITS];
  
  return {
    canGenerate: usage.tweets_generated < limit,
    currentUsage: usage.tweets_generated,
    limit,
    planType: plan.plan_type
  };
}

// Increment usage count
export async function incrementUsage(userId: string): Promise<void> {
  const monthYear = getCurrentMonth();
  
  // Use upsert to either create new record or increment existing
  const { error } = await supabase
    .from('monthly_usage')
    .upsert({
      user_id: userId,
      month_year: monthYear,
      tweets_generated: 1
    }, {
      onConflict: 'user_id,month_year',
      ignoreDuplicates: false
    });

  if (error) {
    // If upsert failed, try to increment existing record
    const { data: currentData } = await supabase
      .from('monthly_usage')
      .select('tweets_generated')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single();

    const newCount = (currentData?.tweets_generated || 0) + 1;
    
    const { error: updateError } = await supabase
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
  }
} 