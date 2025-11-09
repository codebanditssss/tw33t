import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAdmin } from '@/lib/admin';

interface AlertThresholds {
  criticalErrors: number;
  lowCredits: number;
  highChurnRate: number;
  systemDowntime: number;
  unusualActivity: number;
}

// In-memory storage for demo purposes
// In production, these would be stored in database
let globalThresholds: AlertThresholds = {
  criticalErrors: 10,
  lowCredits: 100,
  highChurnRate: 15,
  systemDowntime: 5,
  unusualActivity: 50
};

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

    const { thresholds } = await request.json();
    
    if (!thresholds) {
      return NextResponse.json(
        { error: 'Thresholds data is required' },
        { status: 400 }
      );
    }

    globalThresholds = { ...globalThresholds, ...thresholds };
    console.log(`Alert thresholds updated by admin: ${user.email}`, thresholds);

    return NextResponse.json({
      success: true,
      thresholds: globalThresholds,
      message: 'Thresholds updated successfully'
    });

  } catch (error) {
    console.error('Alert thresholds API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 