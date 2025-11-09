import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAdmin } from '@/lib/admin';

interface AlertSettings {
  emailNotifications: boolean;
  slackNotifications: boolean;
  criticalOnly: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface AlertThresholds {
  criticalErrors: number;
  lowCredits: number;
  highChurnRate: number;
  systemDowntime: number;
  unusualActivity: number;
}

// In-memory storage for demo purposes
// In production, these would be stored in database
let globalSettings: AlertSettings = {
  emailNotifications: true,
  slackNotifications: false,
  criticalOnly: false,
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  }
};

let globalThresholds: AlertThresholds = {
  criticalErrors: 10,
  lowCredits: 100,
  highChurnRate: 15,
  systemDowntime: 5,
  unusualActivity: 50
};

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const { user, isAdmin } = await getCurrentUserAdmin();
    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: globalSettings,
      thresholds: globalThresholds
    });

  } catch (error) {
    console.error('Alert settings GET API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    
    if (body.settings) {
      globalSettings = { ...globalSettings, ...body.settings };
      console.log(`Alert settings updated by admin: ${user.email}`, body.settings);
    }

    if (body.thresholds) {
      globalThresholds = { ...globalThresholds, ...body.thresholds };
      console.log(`Alert thresholds updated by admin: ${user.email}`, body.thresholds);
    }

    return NextResponse.json({
      success: true,
      settings: globalSettings,
      thresholds: globalThresholds,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Alert settings POST API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 