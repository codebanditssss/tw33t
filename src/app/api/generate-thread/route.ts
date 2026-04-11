import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canUserGenerate } from '@/lib/usage';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. Thread generation will not work.');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Initialize Supabase only if keys are available
let supabase: any = null;
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Thread-specific prompts for different styles
const getThreadPrompt = (topic: string, threadLength: number, threadStyle: string) => {
  const baseInstructions = `Create a high-quality Twitter thread about "${topic}" with exactly ${threadLength} tweets. Each tweet should be a standalone message. Separate each tweet with exactly "---" and ensure each tweet is STRICTLY under 280 characters.`;

  const styleInstructions = {
    story: `Create a compelling narrative thread that tells a complete story. Start with a hook, build tension or interest through the middle tweets, and end with a satisfying conclusion or insight. Use storytelling techniques like setting, conflict, and resolution.`,
    educational: `Create an educational thread that teaches something step by step. Break down complex concepts into digestible, easy-to-understand tweets. Each tweet should build upon the previous one, creating a clear learning progression. Use examples and analogies where helpful.`,
    tips: `Create a practical tips thread with actionable advice. Each tweet should contain a specific, implementable tip or piece of advice. Use clear formatting. Focus on practical value the reader can immediately apply.`,
    personal: `Create a personal experience thread told in first-person. Share insights, lessons learned, or experiences in an authentic, relatable way. Use personal anecdotes and be vulnerable where appropriate. Make it feel like a genuine personal story.`,
    analysis: `Create an analytical thread that provides a deep dive into the topic. Break down different aspects, provide insights, examine causes and effects, and offer thoughtful analysis. Use data, examples, and logical reasoning to support your points.`
  };

  return `${baseInstructions}\n\nStyle: ${styleInstructions[threadStyle as keyof typeof styleInstructions]}\n\nFormat: Return ONLY the tweets separated by "---". Do NOT include numbering, prefixes like "Tweet 1:", or any other commentary. Just the pure content of the tweets separated by "---".`;
};

// Simple function to split and clean thread content
const parseThreadContent = (content: string, expectedLength: number): string[] => {
  // First try splitting by "---"
  let tweets = content
    .split('---')
    .map((tweet: string) => tweet.trim())
    .filter((tweet: string) => tweet.length > 0);

  // If that didn't work well, try splitting by double line breaks
  if (tweets.length < expectedLength) {
    const backupTweets = content
      .split(/\n\s*\n/)
      .map((tweet: string) => tweet.trim())
      .filter((tweet: string) => tweet.length > 5);
    
    if (backupTweets.length >= expectedLength) {
      tweets = backupTweets;
    }
  }

  // Clean up tweets: remove numbering, "Tweet X:" prefixes, etc.
  tweets = tweets.map((tweet: string) => {
    return tweet
      .replace(/^(\s*Tweet\s*\d+\s*:?|\s*Thread\s*\d+\s*:?|\s*\d+[\.)]\s*|\s*-\s*)/i, '')
      .trim();
  }).filter(tweet => tweet.length > 5);

  return tweets.slice(0, expectedLength);
};

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Thread generation is not configured' },
      { status: 500 }
    );
  }

  try {
    const { topic, threadLength, threadStyle } = await request.json();

    // Validate required fields
    if (!topic || !threadLength || !threadStyle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate thread length
    if (threadLength < 2 || threadLength > 20) {
      return NextResponse.json(
        { error: 'Thread length must be between 2 and 20 tweets' },
        { status: 400 }
      );
    }

    // Authentication is required
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service not available' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    let userId = null;
    try {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
      }

      userId = user.id;

      // Check usage limits
      const usageStatus = await canUserGenerate(userId);
      if (!usageStatus.canGenerate) {
        return NextResponse.json(
          {
            error: `Usage limit reached. You've used ${usageStatus.currentUsage}/${usageStatus.limit} credits.`,
            usageStatus
          },
          { status: 429 }
        );
      }
    } catch (authError) {
      return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
    }

    // Generate threads
    const threadPromises = Array.from({ length: 2 }, async (_, index) => {
      const prompt = getThreadPrompt(topic, threadLength, threadStyle);

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Twitter ghostwriter who creates engaging, viral threads. You strictly follow character limits (280 characters per tweet) and formatting instructions.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7 + (index * 0.1),
          max_tokens: 2500,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return null;

        const parsedTweets = parseThreadContent(content, threadLength);
        
        // Basic validation for this variation
        if (parsedTweets.length < Math.min(2, Math.floor(threadLength * 0.7))) {
          return null;
        }

        return parsedTweets;
      } catch (error) {
        console.error(`Error in variation ${index}:`, error);
        return null;
      }
    });

    const results = await Promise.all(threadPromises);
    const validThreads = results.filter((t): t is string[] => 
      t !== null && 
      t.length > 0 && 
      t.every(tweet => tweet.length <= 285) // Be slightly lenient in parsing, but ideally prompt keeps it under 280
    );

    if (validThreads.length === 0) {
      throw new Error('Failed to generate valid threads. The prompt might be too complex or character limits were exceeded. Please try a simpler topic or shorter thread.');
    }

    return NextResponse.json({
      threads: validThreads,
      metadata: { topic, threadLength, threadStyle }
    });

  } catch (error) {
    console.error('Thread generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate thread' },
      { status: 500 }
    );
  }
}