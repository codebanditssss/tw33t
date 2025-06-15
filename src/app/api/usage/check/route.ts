import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserUsageStatus } from '@/lib/usage';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    const token = authHeader.split(' ')[1];

    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              return cookieStore.get(name)?.value;
            } catch (error) {
              console.error('Error getting cookie:', error);
              return null;
            }
          },
          set(name: string, value: string, options: Partial<ResponseCookie>) {
            try {
              cookieStore.set({
                name,
                value,
                ...options
              });
            } catch (error) {
              console.error('Error setting cookie:', error);
            }
          },
          remove(name: string, options: Partial<ResponseCookie>) {
            try {
              cookieStore.delete(name);
            } catch (error) {
              console.error('Error removing cookie:', error);
            }
          }
        },
      }
    );
    
    // Verify the session token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check usage
    const usageStatus = await getUserUsageStatus(user.id);
    
    return NextResponse.json({
      success: true,
      canGenerate: usageStatus.canGenerate,
      currentUsage: usageStatus.currentUsage,
      limit: usageStatus.limit,
      planType: usageStatus.planType
    });
    
  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    );
  }
} 