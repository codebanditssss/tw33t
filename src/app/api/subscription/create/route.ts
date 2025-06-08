import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
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
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please log in to create a subscription' },
        { status: 401 }
      );
    }

    const { planType } = await request.json();

    // Validate plan type
    if (planType !== 'pro') {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Check if user already has a pro subscription
    const { data: existingSubscription } = await supabase
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
    const dodoResponse = await fetch(`${process.env.DODO_PAYMENTS_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
      },
      body: JSON.stringify({
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
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?success=true`,
        metadata: {
          user_id: user.id,
          plan_type: 'pro'
        }
      }),
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

    // Store subscription info in our database
    const { error: dbError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        plan_type: 'pro',
        dodo_subscription_id: subscriptionData.subscription_id,
        dodo_customer_id: subscriptionData.customer.customer_id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

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