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

    // Fetch user metrics using Supabase admin methods
    const [
      totalUsersResult,
      proUsersResult,
      activeUsersResult
    ] = await Promise.all([
      // Total users using admin API
      supabase.auth.admin.listUsers(),
      
      // Pro users (active subscriptions)
      supabase
        .from('user_subscriptions')
        .select('user_id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('plan_type', 'pro'),
      
      // Active users (generated content in last 1 day) - get unique user_ids
      supabase
        .from('usage_history')
        .select('user_id')
        .gte('created_at', oneDayAgo.toISOString())
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

    // Calculate final metrics
    const proUsers = proUsersResult.count || 0;
    const freeUsers = totalUsers - proUsers;

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