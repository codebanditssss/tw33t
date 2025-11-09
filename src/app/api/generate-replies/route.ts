import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { canUserGenerate } from '@/lib/usage';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        { error: 'Unauthorized. Please sign up or log in to generate replies.' },
        { status: 401 }
      );
    }

    // Check usage limits
    const usageStatus = await canUserGenerate(user.id);
    if (!usageStatus.canGenerate) {
      return NextResponse.json(
        { error: `Usage limit reached. You've used ${usageStatus.currentUsage}/${usageStatus.limit} credits this month. Upgrade for more!` },
        { status: 402 }
      );
    }

    const { topic, tone, originalTweet } = await request.json();

    if (!topic || !tone || !originalTweet) {
      return NextResponse.json(
        { error: 'Topic, tone, and original tweet are required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `Generate 5 different engaging Twitter replies to this tweet: "${originalTweet}"

The replies should:
1. Be in a ${tone} tone
2. Focus on the topic: ${topic}
3. Follow Twitter's character limit
4. Be engaging and encourage further discussion
5. Be unique from each other
6. Use appropriate emojis where relevant
7. Be authentic and human-like
8. Add value to the conversation

Format each reply as a complete, ready-to-post tweet.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert Twitter user who crafts engaging, authentic replies that add value to conversations while maintaining the specified tone. Your replies are concise, impactful, and encourage further discussion."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content generated');
    }

    // Extract replies from the content
    const replies = content
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('Reply') && !line.startsWith('-'))
      .map(reply => {
        // Remove numbering (e.g., "1.", "2.", etc.) from the beginning of replies
        return reply.trim().replace(/^\d+\.\s*/, '');
      });

    // Return the generated replies (usage will be incremented by frontend)
    return NextResponse.json({
      success: true,
      replies
    });
    
  } catch (error) {
    console.error('Reply generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate replies. Please try again.' },
      { status: 500 }
    );
  }
} 