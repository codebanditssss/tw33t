import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canUserGenerate } from '@/lib/usage';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. Thread generation will not work.');
}

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
  const baseInstructions = `Create a Twitter thread about "${topic}" with exactly ${threadLength} tweets. Each tweet should be a standalone message without any numbering or prefixes. Separate each tweet with "---" and ensure each tweet is under 280 characters.`;
  
  const styleInstructions = {
    story: `Create a compelling narrative thread that tells a complete story. Start with a hook, build tension or interest through the middle tweets, and end with a satisfying conclusion or insight. Use storytelling techniques like setting, conflict, and resolution.`,
    
    educational: `Create an educational thread that teaches something step by step. Break down complex concepts into digestible, easy-to-understand tweets. Each tweet should build upon the previous one, creating a clear learning progression. Use examples and analogies where helpful.`,
    
    tips: `Create a practical tips thread with actionable advice. Each tweet should contain a specific, implementable tip or piece of advice. Use clear formatting. Focus on practical value the reader can immediately apply.`,
    
    personal: `Create a personal experience thread told in first-person. Share insights, lessons learned, or experiences in an authentic, relatable way. Use personal anecdotes and be vulnerable where appropriate. Make it feel like a genuine personal story.`,
    
    analysis: `Create an analytical thread that provides a deep dive into the topic. Break down different aspects, provide insights, examine causes and effects, and offer thoughtful analysis. Use data, examples, and logical reasoning to support your points.`
  };

  return `${baseInstructions}\n\n${styleInstructions[threadStyle as keyof typeof styleInstructions]}\n\nFormat each tweet as a complete, ready-to-post tweet WITHOUT any numbering, prefixes, or labels. Just the pure content. Separate tweets with "---".`;
};

// Simple function to split and clean thread content
const parseThreadContent = (content: string, expectedLength: number): string[] => {
  // First try splitting by "---"
  let tweets = content
    .split('---')
    .map((tweet: string) => tweet.trim())
    .filter((tweet: string) => tweet.length > 0);
  
  // If that didn't work, try splitting by newlines and filtering
  if (tweets.length < expectedLength) {
    tweets = content
      .split('\n')
      .map((tweet: string) => tweet.trim())
      .filter((tweet: string) => 
        tweet.length > 0 && 
        !tweet.startsWith('Tweet') && 
        !tweet.startsWith('-') &&
        !tweet.match(/^\d+[\.)]/));
  }
  
  // Ensure we have the right number of tweets and they're within length limits
  return tweets
    .filter((tweet: string) => tweet.length <= 280)
    .slice(0, expectedLength);
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

    // Validate thread style
    const validStyles = ['story', 'educational', 'tips', 'personal', 'analysis'];
    if (!validStyles.includes(threadStyle)) {
      return NextResponse.json(
        { error: 'Invalid thread style' },
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
        { error: 'Authentication required. Please sign up or log in to generate threads.' },
        { status: 401 }
      );
    }

    let userId = null;
    try {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Invalid authentication. Please sign up or log in to generate threads.' },
          { status: 401 }
        );
      }
      
      userId = user.id;
      
      // Check usage limits
      const usageStatus = await canUserGenerate(userId);
      
      if (!usageStatus.canGenerate) {
        return NextResponse.json(
          { 
            error: `Usage limit reached. You've used ${usageStatus.currentUsage}/${usageStatus.limit} credits this month. Upgrade to SuperTw33t for more credits!`,
            usageStatus 
          },
          { status: 429 }
        );
      }
    } catch (authError) {
      return NextResponse.json(
        { error: 'Authentication failed. Please sign up or log in to generate threads.' },
        { status: 401 }
      );
    }

    // Generate 3 different thread variations
    const threadPromises = Array.from({ length: 3 }, async (_, index) => {
      const prompt = getThreadPrompt(topic, threadLength, threadStyle);
      
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an expert at creating engaging Twitter threads that are properly formatted and follow Twitter\'s character limits.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7 + (index * 0.1), // Slight variation for different threads
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `OpenAI API error (${response.status}): ${
              errorData.error?.message || errorData.error || response.statusText
            }`
          );
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
          throw new Error('No content received from OpenAI API');
        }

        // Parse and validate the content
        const parsedTweets = parseThreadContent(content, threadLength);
        
        if (parsedTweets.length < threadLength) {
          throw new Error(`OpenAI returned insufficient tweets: got ${parsedTweets.length}, expected ${threadLength}`);
        }

        return parsedTweets;
      } catch (error) {
        console.error(`Error in thread variation ${index + 1}:`, error);
        return null; // Return null for failed variations
      }
    });

    const threads = (await Promise.all(threadPromises)).filter(Boolean) as string[][];

    // Validate that we have valid threads
    const validThreads = threads.filter(thread => 
      Array.isArray(thread) && 
      thread.length >= Math.min(2, threadLength) && 
      thread.every(tweet => typeof tweet === 'string' && tweet.length > 20 && tweet.length <= 280)
    );

    if (validThreads.length === 0) {
      throw new Error('Failed to generate valid threads. Please try again with different parameters.');
    }

    // Return the generated threads without saving to history or incrementing usage
    return NextResponse.json({
      threads: validThreads,
      metadata: {
        topic,
        threadLength,
        threadStyle,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Thread generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate thread' },
      { status: 500 }
    );
  }
} 