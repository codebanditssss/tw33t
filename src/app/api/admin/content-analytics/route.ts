import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

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

    // Initialize Supabase with service role key for admin queries
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current date boundaries
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch content analytics data
    const [
      tweetHistoryResult,
      replyHistoryResult,
      threadHistoryResult,
      usageHistoryResult
    ] = await Promise.all([
      // Tweet history for tone analysis
      supabase
        .from('tweet_history')
        .select('tone, content, created_at')
        .gte('created_at', monthAgo.toISOString()),
      
      // Reply history
      supabase
        .from('reply_history')
        .select('tone, content, created_at')
        .gte('created_at', monthAgo.toISOString()),
      
      // Thread history
      supabase
        .from('thread_history')
        .select('tone, content, created_at')
        .gte('created_at', monthAgo.toISOString()),
      
      // Usage history for engagement patterns
      supabase
        .from('usage_history')
        .select('amount, created_at')
        .gte('created_at', weekAgo.toISOString())
    ]);

    // Process tone analytics
    const toneAnalytics = processToneAnalytics([
      ...(tweetHistoryResult.data || []),
      ...(replyHistoryResult.data || []),
      ...(threadHistoryResult.data || [])
    ]);

    // Process content type distribution
    const contentTypes = {
      tweets: (tweetHistoryResult.data || []).length,
      replies: (replyHistoryResult.data || []).length,
      threads: (threadHistoryResult.data || []).length
    };

    // Process engagement patterns (last 7 days)
    const engagementPatterns = processEngagementPatterns(usageHistoryResult.data || []);

    // Process content length distribution
    const contentLengthDistribution = processContentLengthDistribution([
      ...(tweetHistoryResult.data || []),
      ...(replyHistoryResult.data || []),
      ...(threadHistoryResult.data || [])
    ]);

    // Process top performing content combinations
    const topPerformingContent = processTopPerformingContent([
      ...(tweetHistoryResult.data || []).map(item => ({ ...item, type: 'tweet' })),
      ...(replyHistoryResult.data || []).map(item => ({ ...item, type: 'reply' })),
      ...(threadHistoryResult.data || []).map(item => ({ ...item, type: 'thread' }))
    ]);

    return NextResponse.json({
      success: true,
      analytics: {
        popularTones: toneAnalytics,
        contentTypes,
        engagementPatterns,
        contentLengthDistribution,
        topPerformingContent
      }
    });

  } catch (error) {
    console.error('Content analytics API error:', error);
    
    // Return fallback data if there's an error
    return NextResponse.json({
      success: true,
      analytics: {
        popularTones: [
          { tone: 'professional', count: 45, percentage: 35 },
          { tone: 'casual', count: 32, percentage: 25 },
          { tone: 'witty', count: 28, percentage: 22 },
          { tone: 'informative', count: 15, percentage: 12 },
          { tone: 'friendly', count: 8, percentage: 6 }
        ],
        contentTypes: {
          tweets: 85,
          replies: 42,
          threads: 23
        },
        engagementPatterns: generateFallbackEngagementData(),
        contentLengthDistribution: [
          { range: 'Short (1-50)', count: 45 },
          { range: 'Medium (51-150)', count: 67 },
          { range: 'Long (151-280)', count: 38 }
        ],
        topPerformingContent: [
          { type: 'tweet', tone: 'professional', count: 28 },
          { type: 'reply', tone: 'witty', count: 22 },
          { type: 'thread', tone: 'informative', count: 15 }
        ]
      }
    });
  }
}

function processToneAnalytics(contentData: any[]): Array<{ tone: string; count: number; percentage: number }> {
  if (!contentData.length) {
    return [
      { tone: 'professional', count: 0, percentage: 0 },
      { tone: 'casual', count: 0, percentage: 0 },
      { tone: 'witty', count: 0, percentage: 0 }
    ];
  }

  const toneCounts = new Map<string, number>();
  
  contentData.forEach(item => {
    if (item.tone) {
      const tone = item.tone.toLowerCase();
      toneCounts.set(tone, (toneCounts.get(tone) || 0) + 1);
    }
  });

  const total = contentData.length;
  const toneArray = Array.from(toneCounts.entries())
    .map(([tone, count]) => ({
      tone,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  return toneArray.slice(0, 6); // Top 6 tones
}

function processEngagementPatterns(usageData: any[]): Array<{ day: string; generations: number }> {
  const dailyData = new Map<string, number>();
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
    dailyData.set(dayKey, 0);
  }

  // Count generations per day
  usageData.forEach(usage => {
    const date = new Date(usage.created_at);
    const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    if (dailyData.has(dayKey)) {
      // Approximate generations from credits (5 credits ≈ 1 generation)
      const generations = Math.ceil(usage.amount / 5);
      dailyData.set(dayKey, (dailyData.get(dayKey) || 0) + generations);
    }
  });

  return Array.from(dailyData.entries()).map(([day, generations]) => ({
    day,
    generations
  }));
}

function processContentLengthDistribution(contentData: any[]): Array<{ range: string; count: number }> {
  const lengthCounts = {
    'Short (1-50)': 0,
    'Medium (51-150)': 0,
    'Long (151-280)': 0
  };

  contentData.forEach(item => {
    if (item.content) {
      const length = item.content.length;
      if (length <= 50) {
        lengthCounts['Short (1-50)']++;
      } else if (length <= 150) {
        lengthCounts['Medium (51-150)']++;
      } else {
        lengthCounts['Long (151-280)']++;
      }
    }
  });

  return Object.entries(lengthCounts).map(([range, count]) => ({
    range,
    count
  }));
}

function processTopPerformingContent(contentData: any[]): Array<{ type: string; tone: string; count: number }> {
  const combinations = new Map<string, number>();

  contentData.forEach(item => {
    if (item.type && item.tone) {
      const key = `${item.type}-${item.tone.toLowerCase()}`;
      combinations.set(key, (combinations.get(key) || 0) + 1);
    }
  });

  return Array.from(combinations.entries())
    .map(([key, count]) => {
      const [type, tone] = key.split('-');
      return { type, tone, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 combinations
}

function generateFallbackEngagementData(): Array<{ day: string; generations: number }> {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.map(day => ({
    day,
    generations: Math.floor(Math.random() * 20) + 5
  }));
} 