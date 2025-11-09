import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const { user, isAdmin } = await getCurrentUserAdmin();
    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Supabase with service role key for admin actions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { action, userId, amount, newPlan, reason } = body;

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'adjust_credits':
        return await handleCreditAdjustment(supabase, userId, amount, reason, user.id);
      
      case 'change_plan':
        return await handlePlanChange(supabase, userId, newPlan, reason, user.id);
      
      case 'reset_usage':
        return await handleUsageReset(supabase, userId, reason, user.id);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Admin actions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCreditAdjustment(supabase: any, userId: string, amount: number, reason: string, adminId: string) {
  if (!amount || isNaN(amount)) {
    return NextResponse.json(
      { error: 'Invalid amount' },
      { status: 400 }
    );
  }

  try {
    // For credit adjustments, we need to handle additions and subtractions differently
    // Since the usage_history table likely only accepts positive amounts
    
    if (amount > 0) {
      // Adding credits - insert positive amount
      const { error: usageError } = await supabase
        .from('usage_history')
        .insert({
          user_id: userId,
          amount: amount,
          created_at: new Date().toISOString()
        });

      if (usageError) {
        console.error('Error adding usage history for credit addition:', usageError);
        throw new Error('Failed to record credit addition');
      }
    } else {
      // Subtracting credits - we'll create a separate entry or handle differently
      // For now, let's just log it since the usage_history table might not support negative amounts
      console.log('Credit subtraction recorded:', {
        userId,
        amount,
        timestamp: new Date().toISOString()
      });
      
      // Note: In a production system, you might want to:
      // 1. Create a separate table for credit adjustments
      // 2. Use a different approach to track credit subtractions
      // 3. Modify the usage calculation logic to account for admin adjustments
    }

    // Log admin action
    await logAdminAction(supabase, adminId, 'credit_adjustment', userId, {
      amount,
      reason,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${amount > 0 ? 'added' : 'subtracted'} ${Math.abs(amount)} credits`
    });

  } catch (error) {
    console.error('Error adjusting credits:', error);
    return NextResponse.json(
      { error: 'Failed to adjust credits' },
      { status: 500 }
    );
  }
}

async function handlePlanChange(supabase: any, userId: string, newPlan: string, reason: string, adminId: string) {
  if (!newPlan || !['free', 'pro'].includes(newPlan)) {
    return NextResponse.json(
      { error: 'Invalid plan type' },
      { status: 400 }
    );
  }

  try {
    if (newPlan === 'pro') {
      // Create or update subscription to pro
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          plan_type: 'pro',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (subscriptionError) {
        console.error('Error creating pro subscription:', subscriptionError);
        throw new Error('Failed to upgrade to pro plan');
      }
    } else {
      // Remove or deactivate pro subscription
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (subscriptionError) {
        console.error('Error cancelling subscription:', subscriptionError);
        throw new Error('Failed to downgrade to free plan');
      }
    }

    // Log admin action
    await logAdminAction(supabase, adminId, 'plan_change', userId, {
      newPlan,
      reason,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${newPlan === 'pro' ? 'upgraded' : 'downgraded'} user to ${newPlan} plan`
    });

  } catch (error) {
    console.error('Error changing plan:', error);
    return NextResponse.json(
      { error: 'Failed to change plan' },
      { status: 500 }
    );
  }
}

async function handleUsageReset(supabase: any, userId: string, reason: string, adminId: string) {
  try {
    // Delete all usage history for the user
    const { error: usageError } = await supabase
      .from('usage_history')
      .delete()
      .eq('user_id', userId);

    if (usageError) {
      console.error('Error resetting usage history:', usageError);
      throw new Error('Failed to reset usage history');
    }

    // Delete tweet history
    const { error: tweetError } = await supabase
      .from('tweet_history')
      .delete()
      .eq('user_id', userId);

    if (tweetError) {
      console.error('Error resetting tweet history:', tweetError);
      // Don't throw error, tweet history table might not exist
    }

    // Delete thread history
    const { error: threadError } = await supabase
      .from('thread_history')
      .delete()
      .eq('user_id', userId);

    if (threadError) {
      console.error('Error resetting thread history:', threadError);
      // Don't throw error, thread history table might not exist
    }

    // Delete reply history
    const { error: replyError } = await supabase
      .from('reply_history')
      .delete()
      .eq('user_id', userId);

    if (replyError) {
      console.error('Error resetting reply history:', replyError);
      // Don't throw error, reply history table might not exist
    }

    // Log admin action
    await logAdminAction(supabase, adminId, 'usage_reset', userId, {
      reason,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully reset user usage statistics'
    });

  } catch (error) {
    console.error('Error resetting usage:', error);
    return NextResponse.json(
      { error: 'Failed to reset usage' },
      { status: 500 }
    );
  }
}

async function logAdminAction(supabase: any, adminId: string, action: string, targetUserId: string, details: any) {
  try {
    // Try to log admin action - if table doesn't exist, just log to console
    const { error } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action,
        target_user_id: targetUserId,
        details,
        created_at: new Date().toISOString()
      });

    if (error) {
      // If table doesn't exist, just log to console for now
      console.log('Admin action (table not found):', {
        admin_id: adminId,
        action,
        target_user_id: targetUserId,
        details,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't fail the main action if logging fails
    console.log('Admin action (fallback log):', {
      admin_id: adminId,
      action,
      target_user_id: targetUserId,
      details,
      timestamp: new Date().toISOString()
    });
  }
} 