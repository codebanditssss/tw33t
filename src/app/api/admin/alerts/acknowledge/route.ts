import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAdmin } from '@/lib/admin';

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

    const { alertId } = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // In a production environment, you would:
    // 1. Store alert acknowledgments in database
    // 2. Log the acknowledgment with admin user info
    // 3. Send notifications if needed
    
    console.log(`Alert ${alertId} acknowledged by admin: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });

  } catch (error) {
    console.error('Alert acknowledgment API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 