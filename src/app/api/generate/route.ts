import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserUsageStatus } from '@/lib/usage';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
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
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.delete(name);
          },
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

    // Check if user can generate
    const usageStatus = await getUserUsageStatus(user.id);
    if (!usageStatus.canGenerate) {
      return NextResponse.json(
        { error: 'Usage limit reached. You have insufficient credits.' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { prompt, type = 'tweet', tone = 'casual' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }

    // Generate content
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates engaging tweets. Generate 5 unique and engaging tweets, each within Twitter's 280 character limit. Format each tweet on a new line."
        },
        {
          role: "user",
          content: `Generate 5 ${tone} tweets about: ${prompt}`
        }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const generatedContent = completion.choices[0]?.message?.content;

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      );
    }

    // Split the content into individual tweets
    const tweets = generatedContent
      .split('\n')
      .map(tweet => tweet.trim())
      .filter(tweet => tweet && !tweet.startsWith('Tweet') && !tweet.startsWith('-'))
      .map(tweet => tweet.replace(/^\d+\.\s*/, ''));

    if (tweets.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate valid tweets' },
        { status: 500 }
      );
    }

    // Return the generated tweets without saving to history
    return NextResponse.json({
      tweets
    });

  } catch (error) {
    console.error('Error in tweet generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate tweets' },
      { status: 500 }
    );
  }
} 