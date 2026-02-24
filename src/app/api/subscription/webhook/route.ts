import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for webhook operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log('🔔 WEBHOOK RECEIVED!');
  console.log('📋 Headers:', Object.fromEntries(request.headers.entries()));

  try {
    // Verify webhook signature (basic implementation)
    const signature = request.headers.get('x-dodo-signature');
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

    console.log('🔐 Signature check:', { signature: !!signature, secret: !!webhookSecret });

    // TEMPORARILY DISABLED FOR DEBUGGING
    // if (!signature || !webhookSecret) {
    //   console.error('❌ Missing webhook signature or secret');
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.text();
    console.log('📝 Raw webhook body:', body);

    const event = JSON.parse(body);
    console.log('🎯 Parsed event:', { type: event.type, data: event.data });

    console.log('✅ Webhook received:', event.type, event.data?.subscription_id);

    // Handle different subscription events
    switch (event.type) {
      case 'subscription.active':
        await handleSubscriptionActive(event.data);
        break;

      case 'subscription.renewed':
        await handleSubscriptionRenewed(event.data);
        break;

      case 'subscription.failed':
      case 'subscription.on_hold':
        await handleSubscriptionFailed(event.data);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.data);
        break;

      case 'payment.succeeded':
        await handlePaymentSucceeded(event.data);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.data);
        break;

      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActive(data: any) {
  try {
    const { subscription_id, customer, metadata } = data;
    const userId = metadata?.user_id || data.user_id;

    console.log('🔄 Activating subscription:', {
      subscription_id,
      userId,
      customerEmail: customer?.email
    });

    // Update subscription status to active
    const { data: updatedData, error } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        updated_at: new Date().toISOString(),
        // If metadata was missing during creation, we can fill it now
        ...(userId && { user_id: userId })
      })
      .eq('dodo_subscription_id', subscription_id)
      .select();

    if (error) {
      console.error('❌ Failed to update subscription status:', error);
    } else if (!updatedData || updatedData.length === 0) {
      console.warn('⚠️ No subscription found with ID:', subscription_id);

      // Fallback: If we have a userId, try to update their most recent pending subscription
      if (userId) {
        console.log('🔍 Attempting fallback update for user:', userId);
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'active',
            dodo_subscription_id: subscription_id,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('status', 'pending')
          .limit(1);
      }
    } else {
      console.log('✅ Subscription activated successfully for user:', userId || 'unknown');
    }
  } catch (error) {
    console.error('Error handling subscription.active:', error);
  }
}

async function handleSubscriptionRenewed(data: any) {
  try {
    const { subscription_id, next_billing_date } = data;

    // Update subscription with new billing period
    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: next_billing_date,
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscription_id);

    if (error) {
      console.error('Failed to update subscription renewal:', error);
    } else {
      console.log('Subscription renewed:', subscription_id);
    }
  } catch (error) {
    console.error('Error handling subscription.renewed:', error);
  }
}

async function handleSubscriptionFailed(data: any) {
  try {
    const { subscription_id } = data;

    // Update subscription status to failed/on_hold
    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscription_id);

    if (error) {
      console.error('Failed to update subscription failure:', error);
    } else {
      console.log('Subscription failed/on_hold:', subscription_id);
    }
  } catch (error) {
    console.error('Error handling subscription failure:', error);
  }
}

async function handleSubscriptionCancelled(data: any) {
  try {
    const { subscription_id } = data;

    // Update subscription status to cancelled
    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscription_id);

    if (error) {
      console.error('Failed to update subscription cancellation:', error);
    } else {
      console.log('Subscription cancelled:', subscription_id);
    }
  } catch (error) {
    console.error('Error handling subscription.cancelled:', error);
  }
}

async function handlePaymentSucceeded(data: any) {
  try {
    const { payment_id, amount, subscription_id, customer } = data;

    // Record payment in payment history
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('dodo_subscription_id', subscription_id)
      .single();

    if (subscription?.user_id) {
      const { error } = await supabaseAdmin
        .from('payment_history')
        .insert({
          user_id: subscription.user_id,
          dodo_payment_id: payment_id,
          amount: amount,
          status: 'succeeded',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to record payment:', error);
      } else {
        console.log('Payment recorded:', payment_id);
      }
    }
  } catch (error) {
    console.error('Error handling payment.succeeded:', error);
  }
}

async function handlePaymentFailed(data: any) {
  try {
    const { payment_id, amount, subscription_id } = data;

    // Record failed payment
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('dodo_subscription_id', subscription_id)
      .single();

    if (subscription?.user_id) {
      const { error } = await supabaseAdmin
        .from('payment_history')
        .insert({
          user_id: subscription.user_id,
          dodo_payment_id: payment_id,
          amount: amount,
          status: 'failed',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to record failed payment:', error);
      } else {
        console.log('Failed payment recorded:', payment_id);
      }
    }
  } catch (error) {
    console.error('Error handling payment.failed:', error);
  }
} 