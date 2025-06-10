import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canUserGenerate, incrementUsage } from '@/lib/usage';

// Initialize Supabase only if keys are available
let supabase: any = null;
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const tonePrompts = {
  professional: "Create professional, business-appropriate tweets that are informative and credible. Use formal language and focus on value and insights.",
  casual: "Write casual, friendly tweets that feel conversational and relatable. Use everyday language and a relaxed tone.",
  funny: "Generate humorous, witty tweets that are entertaining and shareable. Use humor, wordplay, or funny observations.",
  serious: "Create serious, thoughtful tweets that convey importance and gravity. Use authoritative language and focus on facts.",
  friendly: "Write warm, approachable tweets that feel personal and welcoming. Use inclusive language and positive energy.",
  witty: "Generate clever, smart tweets with wordplay and intelligent humor. Use wit, puns, or clever observations."
};

const encoder = new TextEncoder();

function sendProgress(controller: ReadableStreamDefaultController, progress: number, status: string) {
  const data = encoder.encode(JSON.stringify({ progress, status }) + '\n');
  controller.enqueue(data);
}

export async function POST(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { topic, tone } = await request.json();
        
        // Initial progress
        sendProgress(controller, 0, 'Starting generation...');

        // Authentication is required
        if (!supabase) {
          const errorMessage = 'Authentication service not available';
          controller.enqueue(encoder.encode(JSON.stringify({ error: errorMessage }) + '\n'));
          controller.close();
          return;
        }

        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          const errorMessage = 'Authentication required. Please sign up or log in to generate tweets.';
          controller.enqueue(encoder.encode(JSON.stringify({ error: errorMessage }) + '\n'));
          controller.close();
          return;
        }

        let userId = null;
        try {
          const token = authHeader.substring(7);
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          
          if (authError || !user) {
            const errorMessage = 'Invalid authentication. Please sign up or log in to generate tweets.';
            controller.enqueue(encoder.encode(JSON.stringify({ error: errorMessage }) + '\n'));
            controller.close();
            return;
          }
          
          userId = user.id;
          
          // Check usage limits
          sendProgress(controller, 10, 'Checking usage limits...');
          const usageStatus = await canUserGenerate(userId);
          
          if (!usageStatus.canGenerate) {
            // Send error through stream instead of throwing
            const errorMessage = `Usage limit reached. You've used ${usageStatus.currentUsage}/${usageStatus.limit} tweets this month. Upgrade to SuperTw33t for more tweets!`;
            controller.enqueue(encoder.encode(JSON.stringify({ error: errorMessage }) + '\n'));
            controller.close();
            return;
          }
        } catch (authError) {
          const errorMessage = authError instanceof Error ? authError.message : 'Authentication failed. Please sign up or log in to generate tweets.';
          controller.enqueue(encoder.encode(JSON.stringify({ error: errorMessage }) + '\n'));
          controller.close();
          return;
        }

        if (!topic || !tone) {
          const errorMessage = 'Topic and tone are required';
          controller.enqueue(encoder.encode(JSON.stringify({ error: errorMessage }) + '\n'));
          controller.close();
          return;
        }

        if (!process.env.OPENAI_API_KEY) {
          const errorMessage = 'OpenAI API key not configured';
          controller.enqueue(encoder.encode(JSON.stringify({ error: errorMessage }) + '\n'));
          controller.close();
          return;
        }

        sendProgress(controller, 20, 'Preparing prompt...');

        const toneInstruction = tonePrompts[tone as keyof typeof tonePrompts] || tonePrompts.casual;

        const prompt = `${toneInstruction}

Topic: "${topic}"

Generate exactly 5 different tweet variations about this topic. Each tweet should:
- Be under 280 characters
- Be engaging and likely to get clicks
- Match the specified tone perfectly
- Be unique and different from the others
- Include relevant emojis where appropriate

Return only the 5 tweets, each on a new line, numbered 1-5.`;

        sendProgress(controller, 40, 'Connecting to AI...');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        if (!response.ok) {
          const errorMessage = `OpenAI API error: ${response.status}`;
          controller.enqueue(encoder.encode(JSON.stringify({ error: errorMessage }) + '\n'));
          controller.close();
          return;
        }

        sendProgress(controller, 60, 'Processing response...');

        const data = await response.json();
        const text = data.choices[0]?.message?.content || '';

        // Parse the response to extract individual tweets
        const tweets = text
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string) => line.replace(/^\d+\.?\s*/, '').trim())
          .filter((tweet: string) => tweet.length > 0)
          .slice(0, 5);

        // If we don't get exactly 5 tweets, pad with variations
        while (tweets.length < 5) {
          tweets.push(`${topic} is worth exploring! ${tone === 'funny' ? '😄' : '✨'}`);
        }

        sendProgress(controller, 80, 'Saving results...');

        // Save to database and increment usage
        try {
          // Create generation record
          const { data: generation, error: generationError } = await supabase
            .from('tweet_generations')
            .insert({
              user_id: userId,
              topic,
              tone
            })
            .select()
            .single();

          if (!generationError && generation) {
            // Save individual tweets
            const tweetsToInsert = tweets.map((tweet: string, index: number) => ({
              generation_id: generation.id,
              content: tweet,
              character_count: tweet.length,
              position: index + 1
            }));

            await supabase
              .from('generated_tweets')
              .insert(tweetsToInsert);
            
            // Increment usage count
            await incrementUsage(userId);
          }
        } catch (saveError) {
          console.error('Database save error:', saveError);
        }

        // Send final result
        sendProgress(controller, 100, JSON.stringify({ tweets }));
        
        // Close the stream
        controller.close();
      } catch (error) {
        // Send error through the stream
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(encoder.encode(JSON.stringify({ error: errorMessage }) + '\n'));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 