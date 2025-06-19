import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const { user, isAdmin } = await getCurrentUserAdmin();
    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Supabase with service role key for admin queries
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all users using Supabase admin API
    const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw new Error('Failed to fetch users');
    }

    // Get user subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('user_id, plan_type, status')
      .eq('status', 'active');

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      throw new Error('Failed to fetch subscriptions');
    }

    // Get usage statistics for all users
    const { data: usageStats, error: usageError } = await supabase
      .from('usage_history')
      .select('user_id, amount, created_at');

    if (usageError) {
      console.error('Error fetching usage stats:', usageError);
      throw new Error('Failed to fetch usage statistics');
    }

    // Create subscription lookup
    const subscriptionMap = new Map();
    (subscriptions || []).forEach(sub => {
      subscriptionMap.set(sub.user_id, sub.plan_type);
    });

    // Create usage statistics lookup
    const usageMap = new Map();
    const lastActiveMap = new Map();
    
    (usageStats || []).forEach(usage => {
      const userId = usage.user_id;
      const currentUsage = usageMap.get(userId) || 0;
      usageMap.set(userId, currentUsage + usage.amount);
      
      // Track last active time
      const currentLastActive = lastActiveMap.get(userId);
      const usageDate = new Date(usage.created_at);
      if (!currentLastActive || usageDate > currentLastActive) {
        lastActiveMap.set(userId, usageDate);
      }
    });

    // Calculate generation counts (approximate based on credits)
    const generationMap = new Map();
    (usageStats || []).forEach(usage => {
      const userId = usage.user_id;
      const currentGenerations = generationMap.get(userId) || 0;
      // Approximate: 5 credits = 1 generation for tweets/replies, variable for threads
      const generations = usage.amount >= 5 ? Math.ceil(usage.amount / 5) : 1;
      generationMap.set(userId, currentGenerations + generations);
    });

    // Process users data
    const processedUsers = (allUsers?.users || []).map(user => {
      const planType = subscriptionMap.get(user.id) || 'free';
      const creditsUsed = usageMap.get(user.id) || 0;
      const totalGenerations = generationMap.get(user.id) || 0;
      const lastActive = lastActiveMap.get(user.id) || new Date(user.created_at);

      return {
        id: user.id,
        email: user.email || 'No email',
        created_at: user.created_at,
        plan_type: planType,
        credits_used: creditsUsed,
        last_active: lastActive.toISOString(),
        total_generations: totalGenerations
      };
    });

    // Sort by most recent activity
    processedUsers.sort((a, b) => 
      new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
    );

    return NextResponse.json({
      success: true,
      users: processedUsers,
      total: processedUsers.length
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 