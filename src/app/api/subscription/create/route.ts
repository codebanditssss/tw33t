import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Client for user authentication
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    
    // Service role client for database operations (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get current user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please log in to create a subscription' },
        { status: 401 }
      );
    }

    console.log('🚀 Creating subscription for user:', user.id, user.email);

    const { planType } = await request.json();

    // Validate plan type
    if (planType !== 'pro') {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Check if user already has a pro subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_type', 'pro')
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active Pro subscription' },
        { status: 400 }
      );
    }

    // Create Dodo Payments subscription
    const subscriptionPayload = {
      billing: {
        city: 'Default City',
        country: 'US',
        state: 'Default State', 
        street: 'Default Street',
        zipcode: '12345'
      },
      customer: {
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
      },
      product_id: process.env.DODO_PRO_PRODUCT_ID,
      quantity: 1,
      payment_link: true,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/?success=true`,
      metadata: {
        user_id: user.id,
        plan_type: 'pro'
      }
    };
    
    console.log('📦 Subscription payload:', subscriptionPayload);
    console.log('🔗 Dodo API URL:', process.env.DODO_PAYMENTS_API_URL);
    console.log('🔑 Has API key:', !!process.env.DODO_PAYMENTS_API_KEY);
    
    const dodoResponse = await fetch(`${process.env.DODO_PAYMENTS_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
      },
      body: JSON.stringify(subscriptionPayload),
    });

    if (!dodoResponse.ok) {
      const errorData = await dodoResponse.json().catch(() => null);
      console.error('Dodo Payments error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create subscription', details: errorData },
        { status: dodoResponse.status }
      );
    }

    const subscriptionData = await dodoResponse.json();
    console.log('✅ Dodo response:', subscriptionData);

    // Store subscription info in our database
    const subscriptionRecord = {
      user_id: user.id,
      plan_type: 'pro',
      dodo_subscription_id: subscriptionData.subscription_id,
      dodo_customer_id: subscriptionData.customer?.customer_id,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('💾 Storing subscription record:', subscriptionRecord);
    
    const { error: dbError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(subscriptionRecord);

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue anyway, webhook will handle the subscription
    }

    return NextResponse.json({
      success: true,
      payment_link: subscriptionData.payment_link,
      subscription_id: subscriptionData.subscription_id
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
} 