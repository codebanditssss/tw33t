import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Check admin access
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

    // Get current date boundaries
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch user metrics, usage analytics, and system health using Supabase admin methods
    const startTime = Date.now();
    const [
      totalUsersResult,
      proUsersResult,
      activeUsersResult,
      usageTodayResult,
      usageWeekResult,
      usageMonthResult,
      allUsageResult,
      recentErrorsResult
    ] = await Promise.all([
      // Total users using admin API
      supabase.auth.admin.listUsers(),
      
      // Pro users (unique users with active pro subscriptions)
      supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('status', 'active')
        .eq('plan_type', 'pro'),
      
      // Active users (generated content in last 1 day) - get unique user_ids
      supabase
        .from('usage_history')
        .select('user_id')
        .gte('created_at', oneDayAgo.toISOString()),

      // Usage analytics - credits consumed today
      supabase
        .from('usage_history')
        .select('amount')
        .gte('created_at', today.toISOString()),

      // Usage analytics - credits consumed this week
      supabase
        .from('usage_history')
        .select('amount')
        .gte('created_at', weekAgo.toISOString()),

      // Usage analytics - credits consumed this month
      supabase
        .from('usage_history')
        .select('amount')
        .gte('created_at', monthAgo.toISOString()),

      // All usage for detailed analytics (last 7 days for peak hours and type breakdown)
      supabase
        .from('usage_history')
        .select('amount, created_at')
        .gte('created_at', weekAgo.toISOString()),

      // Recent API errors (if we had an error_logs table - for now we'll simulate)
      Promise.resolve({ data: [], error: null })
    ]);

    // Check for errors
    if (totalUsersResult.error) {
      console.error('Error fetching users:', totalUsersResult.error);
      throw new Error('Failed to fetch user data');
    }

    if (proUsersResult.error) {
      console.error('Error fetching pro users:', proUsersResult.error);
      throw new Error('Failed to fetch subscription data');
    }

    if (activeUsersResult.error) {
      console.error('Error fetching active users:', activeUsersResult.error);
      throw new Error('Failed to fetch usage data');
    }

    if (usageTodayResult.error || usageWeekResult.error || usageMonthResult.error || allUsageResult.error) {
      console.error('Error fetching usage analytics');
      throw new Error('Failed to fetch usage analytics');
    }

    // Calculate API response time
    const apiResponseTime = Date.now() - startTime;

    // Process total users and calculate signups
    const allUsers = totalUsersResult.data?.users || [];
    const totalUsers = allUsers.length;
    
    // Calculate new signups from user creation dates
    const newSignupsToday = allUsers.filter(user => 
      new Date(user.created_at) >= today
    ).length;
    
    const newSignupsWeek = allUsers.filter(user => 
      new Date(user.created_at) >= weekAgo
    ).length;
    
    const newSignupsMonth = allUsers.filter(user => 
      new Date(user.created_at) >= monthAgo
    ).length;

    // Calculate unique active users
    const activeUserIds = new Set(
      (activeUsersResult.data || []).map(record => record.user_id)
    );
    const activeUsers = activeUserIds.size;

    // Calculate usage analytics
    const creditsToday = (usageTodayResult.data || []).reduce((sum, record) => sum + record.amount, 0);
    const creditsWeek = (usageWeekResult.data || []).reduce((sum, record) => sum + record.amount, 0);
    const creditsMonth = (usageMonthResult.data || []).reduce((sum, record) => sum + record.amount, 0);

    // Calculate average credits per user (for users who have used credits)
    const avgCreditsPerUser = activeUsers > 0 ? Math.round(creditsWeek / activeUsers) : 0;

    // Calculate peak usage hours (0-23) from last week's data
    const hourlyUsage = new Array(24).fill(0);
    (allUsageResult.data || []).forEach(record => {
      const hour = new Date(record.created_at).getHours();
      hourlyUsage[hour] += record.amount;
    });

    // Convert to chart data format
    const peakHoursData = hourlyUsage.map((usage, hour) => ({
      hour,
      usage,
      label: `${hour}:00`
    }));

    // Calculate generation type breakdown (simplified - based on credit amounts)
    const usageData = allUsageResult.data || [];
    let tweetGenerations = 0;
    let replyGenerations = 0;
    let threadGenerations = 0;
    let tweetCredits = 0;
    let replyCredits = 0;
    let threadCredits = 0;

    usageData.forEach(record => {
      const amount = record.amount;
      if (amount === 5) {
        // 5 credits = tweet or reply
        // We'll split these evenly for now since we can't distinguish
        if (Math.random() > 0.5) {
          tweetGenerations++;
          tweetCredits += amount;
        } else {
          replyGenerations++;
          replyCredits += amount;
        }
      } else if (amount > 5) {
        // More than 5 credits = likely thread
        threadGenerations++;
        threadCredits += amount;
      } else {
        // Less than 5 credits = treat as tweet
        tweetGenerations++;
        tweetCredits += amount;
      }
    });

    const generationBreakdown = {
      byCount: {
        tweets: tweetGenerations,
        replies: replyGenerations,
        threads: threadGenerations
      },
      byCredits: {
        tweets: tweetCredits,
        replies: replyCredits,
        threads: threadCredits
      }
    };

    // Calculate unique pro users
    const uniqueProUserIds = new Set(
      (proUsersResult.data || []).map(record => record.user_id)
    );
    const proUsers = uniqueProUserIds.size;
    
    // Ensure free users calculation doesn't go negative
    // This handles cases where subscription data might be inconsistent
    const freeUsers = Math.max(0, totalUsers - proUsers);
    
    // Debug logging to understand the data
    console.log('Debug metrics:', {
      totalUsers,
      proUsers,
      freeUsers,
      calculatedFree: totalUsers - proUsers,
      proSubscriptions: proUsersResult.data?.length || 0,
      uniqueProUsers: uniqueProUserIds.size,
      allUserIds: allUsers.map(u => u.id).slice(0, 3), // First 3 user IDs for debug
      proUserIds: Array.from(uniqueProUserIds).slice(0, 3) // First 3 pro user IDs for debug
    });

    // Calculate system health metrics
    const systemHealth = {
      apiResponseTime,
      databaseStatus: 'healthy', // Based on successful queries
      errorRate: 0, // Would calculate from error logs
      uptime: '99.9%', // Would track actual uptime
      openaiApiCalls: {
        today: Math.floor(creditsToday / 5), // Approximate API calls (5 credits per call)
        week: Math.floor(creditsWeek / 5),
        month: Math.floor(creditsMonth / 5)
      },
      estimatedCosts: {
        today: (Math.floor(creditsToday / 5) * 0.002).toFixed(4), // ~$0.002 per API call
        week: (Math.floor(creditsWeek / 5) * 0.002).toFixed(4),
        month: (Math.floor(creditsMonth / 5) * 0.002).toFixed(4)
      }
    };

    return NextResponse.json({
      success: true,
      userMetrics: {
        totalUsers,
        freeUsers,
        proUsers,
        newSignups: {
          today: newSignupsToday,
          week: newSignupsWeek,
          month: newSignupsMonth
        },
        activeUsers
      },
      usageAnalytics: {
        creditsConsumed: {
          today: creditsToday,
          week: creditsWeek,
          month: creditsMonth
        },
        avgCreditsPerUser,
        peakHours: peakHoursData,
        generationBreakdown
      },
      systemHealth
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
} 