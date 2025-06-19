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

    // Fetch user metrics in parallel
    const [
      totalUsersResult,
      proUsersResult,
      newSignupsTodayResult,
      newSignupsWeekResult,
      newSignupsMonthResult,
      activeUsersResult
    ] = await Promise.all([
      // Total users
      supabase
        .from('auth.users')
        .select('id', { count: 'exact', head: true }),
      
      // Pro users (active subscriptions)
      supabase
        .from('user_subscriptions')
        .select('user_id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('plan_type', 'pro'),
      
      // New signups today
      supabase
        .from('auth.users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),
      
      // New signups this week
      supabase
        .from('auth.users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
      
      // New signups this month
      supabase
        .from('auth.users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString()),
      
      // Active users (generated content in last 1 day)
      supabase
        .from('usage_history')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo.toISOString())
    ]);

    // Calculate metrics
    const totalUsers = totalUsersResult.count || 0;
    const proUsers = proUsersResult.count || 0;
    const freeUsers = totalUsers - proUsers;
    const newSignupsToday = newSignupsTodayResult.count || 0;
    const newSignupsWeek = newSignupsWeekResult.count || 0;
    const newSignupsMonth = newSignupsMonthResult.count || 0;
    const activeUsers = activeUsersResult.count || 0;

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
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
} 