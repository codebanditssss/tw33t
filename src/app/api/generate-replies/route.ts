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
        { error: `Usage limit reached. You've used ${usageStatus.currentUsage}/${usageStatus.limit} credits. Upgrade for more!` },
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
3. Follow Twitter's character limit (under 280 characters)
4. Be engaging and encourage further discussion
5. Be unique from each other
6. Use appropriate emojis where relevant
7. Be authentic and human-like
8. Add value to the conversation

Format: Return ONLY the replies, one per line. Do NOT include numbering, prefixes like "Reply 1:", or any other commentary.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert Twitter user who crafts engaging, authentic replies. You follow character limits strictly and provide only the requested content without extra text."
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
      .map(line => line.trim())
      .filter(line => line.length > 5)
      .map(reply => {
        // Remove common numbering patterns
        return reply.replace(/^(\s*Reply\s*\d+\s*:?|\s*\d+[\.)]\s*|\s*-\s*)/i, '').trim();
      })
      .filter(reply => reply.length > 5 && reply.length <= 300); // Lenient on upper limit here

    if (replies.length === 0) {
      throw new Error('Failed to generate valid replies');
    }

    return NextResponse.json({
      success: true,
      replies: replies.slice(0, 5)
    });
    
  } catch (error) {
    console.error('Reply generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate replies. Please try again.' },
      { status: 500 }
    );
  }
}
 