import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get current user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    const token = authHeader.split(' ')[1];

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the session token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: `Authentication failed: ${authError.message}` },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('No user found for token');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Get amount from request body
    const body = await request.json().catch(error => {
      console.error('Failed to parse request body:', error);
      return {};
    });

    const amount = body.amount || 1;
    
    if (typeof amount !== 'number' || amount < 1) {
      console.error('Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Invalid amount specified' },
        { status: 400 }
      );
    }

    console.log('Incrementing usage for user:', {
      userId: user.id,
      amount,
      timestamp: new Date().toISOString()
    });

    // Insert usage record directly with service role client
    const { data: usageData, error: usageError } = await supabase
      .from('usage_history')
      .insert({
        user_id: user.id,
        amount,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (usageError) {
      console.error('Failed to insert usage record:', {
        error: usageError,
        userId: user.id,
        amount
      });
      return NextResponse.json(
        { error: `Failed to record usage: ${usageError.message}` },
        { status: 500 }
      );
    }

    console.log('Successfully recorded usage:', usageData);
    
    return NextResponse.json({
      success: true,
      message: 'Usage incremented successfully',
      data: usageData
    });
    
  } catch (error) {
    console.error('Unexpected error in usage increment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to increment usage' },
      { status: 500 }
    );
  }
} 