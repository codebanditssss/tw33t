import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canUserGenerate, incrementUsage } from '@/lib/usage';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_API_KEY) {
  console.warn('DEEPSEEK_API_KEY is not set. Thread generation will not work.');
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
const getThreadPrompt = (topic: string, tone: string, threadLength: number, threadStyle: string) => {
  const baseInstructions = `Create a Twitter thread about "${topic}" in a ${tone} tone with exactly ${threadLength} tweets.`;
  
  const styleInstructions = {
    story: `Create a compelling narrative thread that tells a complete story. Start with a hook, build tension or interest through the middle tweets, and end with a satisfying conclusion or insight. Use storytelling techniques like setting, conflict, and resolution.`,
    
    educational: `Create an educational thread that teaches something step by step. Break down complex concepts into digestible, easy-to-understand tweets. Each tweet should build upon the previous one, creating a clear learning progression. Use examples and analogies where helpful.`,
    
    tips: `Create a practical tips thread with actionable advice. Each tweet should contain a specific, implementable tip or piece of advice. Use numbered lists, bullet points, and clear formatting. Focus on practical value the reader can immediately apply.`,
    
    personal: `Create a personal experience thread told in first-person. Share insights, lessons learned, or experiences in an authentic, relatable way. Use personal anecdotes and be vulnerable where appropriate. Make it feel like a genuine personal story.`,
    
    analysis: `Create an analytical thread that provides a deep dive into the topic. Break down different aspects, provide insights, examine causes and effects, and offer thoughtful analysis. Use data, examples, and logical reasoning to support your points.`
  };

  const formatInstructions = `
FORMATTING RULES:
- Write ${threadLength} complete, well-formatted tweets
- Start the first tweet with 🧵 and include "1/${threadLength}:" 
- Number each subsequent tweet as "2/${threadLength}:", "3/${threadLength}:", etc.
- Each tweet should be under 280 characters including the numbering
- Use proper formatting with line breaks between sections
- Use bullet points (•), arrows (→), or numbered lists (1. 2. 3.) for lists
- Add blank lines between different sections within a tweet
- Make each tweet visually appealing and easy to scan
- Ensure smooth flow between tweets
- End with a strong conclusion or call-to-action
- Separate each tweet with "---" on its own line

Example format:
🧵 1/${threadLength}: Here's why [topic] matters:

Key insight that hooks the reader

Let's dive in 👇
---
2/${threadLength}: First key point with proper structure:

• Bullet point 1
• Bullet point 2  
• Bullet point 3

This creates better readability.
---
3/${threadLength}: Second important insight:

→ Arrow point 1
→ Arrow point 2
→ Arrow point 3
---
${threadLength}/${threadLength}: Final thoughts:

Strong conclusion with clear takeaway.

What's your experience with this?

Return exactly ${threadLength} tweets separated by "---"`;

  return `${baseInstructions}

${styleInstructions[threadStyle as keyof typeof styleInstructions] || styleInstructions.story}

${formatInstructions}`;
};

// Simple function to split and clean thread content
const parseThreadContent = (content: string, expectedLength: number): string[] => {
  // Split by separator and clean up
  const tweets = content
    .split('---')
    .map((tweet: string) => tweet.trim())
    .filter((tweet: string) => tweet.length > 0)
    .slice(0, expectedLength); // Ensure we don't exceed expected length

  return tweets;
};

export async function POST(request: NextRequest) {
  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json(
      { error: 'Thread generation is not configured' },
      { status: 500 }
    );
  }

  try {
    const { topic, tone, threadLength = 8, threadStyle = 'story' } = await request.json();

    if (!topic || !tone) {
      return NextResponse.json(
        { error: 'Topic and tone are required' },
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
            error: `Usage limit reached. You've used ${usageStatus.currentUsage}/${usageStatus.limit} tweets this month. Upgrade to SuperTw33t for more tweets!`,
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

    // Generate 3 different thread variations
    const threadPromises = Array.from({ length: 3 }, async (_, index) => {
      const prompt = getThreadPrompt(topic, tone, threadLength, threadStyle);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1',
          messages: [
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
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from DeepSeek API');
      }

      // Simple parsing - just split by "---"
      return parseThreadContent(content, threadLength);
    });

    const threads = await Promise.all(threadPromises);

    // Validate that we have valid threads
    const validThreads = threads.filter(thread => 
      Array.isArray(thread) && 
      thread.length >= Math.min(2, threadLength) && 
      thread.every(tweet => typeof tweet === 'string' && tweet.length > 20 && tweet.length <= 300) // Slightly more lenient
    );

    if (validThreads.length === 0) {
      throw new Error('Failed to generate valid threads');
    }

    // Increment usage
    try {
      await incrementUsage(userId);
      console.log('Thread generated and usage incremented for user:', userId);
    } catch (usageError) {
      console.warn('Usage increment failed, but continuing:', usageError);
    }

    return NextResponse.json({
      threads: validThreads,
      metadata: {
        topic,
        tone,
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