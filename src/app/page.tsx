'use client';

import { useState, useEffect, Suspense } from 'react';
import { Header } from "@/components/ui/header";
import { HeroSection } from "@/components/hero-section";
import { ResultsSection } from "@/components/results-section";
import { ThreadResultsSection } from "@/components/thread-results-section";
import { AuthModal } from "@/components/ui/auth-modal";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useUsage } from '@/contexts/usage-context';
import { useSearchParams } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase';
import LoadingScreen from '@/components/loading-screen';
import { RepliesResultsSection } from "@/components/replies-results-section";
import { getUserUsageStatus, incrementUsage } from '@/lib/usage';

type Mode = 'hero' | 'loading' | 'results';

interface HistoryBaseData {
  user_id: string;
  prompt: string;
  tone: string;
  content: string;
  created_at: string;
  type: 'tweet' | 'thread' | 'reply';
}

interface ReplyHistoryData extends HistoryBaseData {
  original_tweet: string;
}

interface UsageStatus {
  canGenerate: boolean;
  currentUsage: number;
  limit: number;
}

function HomeContent() {
  const [mode, setMode] = useState<Mode>('hero');
  const [currentType, setCurrentType] = useState<'tweet' | 'thread' | 'reply'>('tweet');
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentTone, setCurrentTone] = useState('');
  const [generatedTweets, setGeneratedTweets] = useState<string[]>([]);
  const [generatedThreads, setGeneratedThreads] = useState<string[][]>([]);
  const [generatedReplies, setGeneratedReplies] = useState<string[]>([]);
  const [originalTweet, setOriginalTweet] = useState('');
  const [selectedTweet, setSelectedTweet] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, text: '' });
  const { user, session } = useAuth();
  const { usageStatus, refreshUsage } = useUsage();
  const searchParams = useSearchParams();
  const supabase = getBrowserClient();

  // Handle URL parameters (payment success, errors, etc.)
  useEffect(() => {
    const success = searchParams.get('success');
    const subscriptionId = searchParams.get('subscription_id');
    const status = searchParams.get('status');
    const error = searchParams.get('error');

    if (success === 'true' && subscriptionId && status === 'active') {
      // Show success message
      toast.success('🎉 Payment successful! Your Super plan is now active with 500 credits/month!');
      
      // Refresh usage status to reflect the new plan
      refreshUsage();
      
      // Clean up URL parameters after a short delay
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('success');
        url.searchParams.delete('subscription_id');
        url.searchParams.delete('status');
        window.history.replaceState({}, '', url.toString());
      }, 2000);
    }

    // Handle unauthorized error from admin redirect
    if (error === 'unauthorized') {
      toast.error('Access denied. Admin privileges required.');
      
      // Clean up URL parameter
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.toString());
      }, 1000);
    }
  }, [searchParams, refreshUsage]);

  const handleGenerate = async (topic: string, tone: string, options?: {
    type: 'tweet' | 'thread' | 'reply';
    threadLength?: number;
    threadStyle?: string;
    originalTweet?: string;
  }) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!usageStatus?.canGenerate) {
              toast.error(`Usage limit reached. You've used ${usageStatus?.currentUsage}/${usageStatus?.limit} credits this month. Upgrade for more!`);
      return;
    }

    setMode('loading');
    setCurrentTopic(topic);
    setCurrentTone(tone);
    setCurrentType(options?.type || 'tweet');
    
    if (options?.type === 'reply' && options.originalTweet) {
      setOriginalTweet(options.originalTweet);
    }

    try {
      setProgress({ percent: 20, text: 'Analyzing prompt...' });

      let response;
      if (options?.type === 'thread') {
        response = await fetch('/api/generate-thread', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            topic,
            threadLength: options.threadLength,
            threadStyle: options.threadStyle
          }),
        });
      } else if (options?.type === 'reply') {
        response = await fetch('/api/generate-replies', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            topic,
            tone,
            originalTweet: options.originalTweet
          }),
        });
      } else {
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ prompt: topic, tone }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate content');
      }

      setProgress({ percent: 60, text: 'Generating content...' });

      const data = await response.json();
      console.log('API Response:', data); // Debug log

      // Validate response format based on type
      if (options?.type === 'thread') {
        if (!data.threads || !Array.isArray(data.threads) || data.threads.length === 0) {
          console.error('Invalid thread response:', data);
          throw new Error('Failed to generate thread: Invalid response format');
        }
      } else if (options?.type === 'reply') {
        if (!data.replies || !Array.isArray(data.replies)) {
          console.error('Invalid reply response:', data);
          throw new Error('Failed to generate replies: Invalid response format');
        }
      } else if (!data.tweets || !Array.isArray(data.tweets)) {
        console.error('Invalid tweet response:', data);
        throw new Error('Failed to generate tweets: Invalid response format');
      }

      setProgress({ percent: 90, text: 'Finalizing...' });

      // Save to history
      const tableName = `${options?.type || 'tweet'}_history`;
      
      // Debug logs
      console.log('Table name:', tableName);
      console.log('Content type:', options?.type || 'tweet');

      let contentToSave;
      if (options?.type === 'thread') {
        // For threads, we expect an array of arrays
        contentToSave = data.threads;
        if (!Array.isArray(contentToSave[0])) {
          // If the first item is not an array, wrap everything in an array
          contentToSave = [contentToSave];
        }
      } else if (options?.type === 'reply') {
        // For replies, we expect an array of strings
        contentToSave = data.replies;
        if (!Array.isArray(contentToSave)) {
          contentToSave = [contentToSave];
        }
      } else {
        contentToSave = data.tweets;
      }

      // Debug log
      console.log('Raw content to save:', contentToSave);

      // Ensure content is properly formatted
      if (options?.type === 'thread') {
        // Thread content should be an array of arrays
        contentToSave = Array.isArray(contentToSave) && Array.isArray(contentToSave[0])
          ? contentToSave
          : [Array.isArray(contentToSave) ? contentToSave : [contentToSave]];
      } else if (options?.type === 'reply') {
        // Reply content should be an array of strings
        contentToSave = Array.isArray(contentToSave) ? contentToSave : [contentToSave];
      } else {
        // Regular tweets should be an array of strings
        contentToSave = Array.isArray(contentToSave) ? contentToSave : [contentToSave];
      }

      // Debug log
      console.log('Formatted content to save:', contentToSave);

      // Validate required fields for replies
      if (options?.type === 'reply' && !options.originalTweet) {
        throw new Error('Original tweet is required for replies');
      }

      const historyData = {
        user_id: user.id,
        prompt: topic,
        tone: options?.type === 'thread' ? options.threadStyle : tone,
        content: contentToSave,
        ...(options?.type === 'reply' && { original_tweet: options.originalTweet }),
        ...(options?.type === 'thread' && { 
          thread_length: options.threadLength,
          thread_style: options.threadStyle
        })
      };

      // Debug log
      console.log('History data:', historyData);

      try {
        const { data: savedData, error: saveError } = await supabase
          .from(tableName)
          .insert(historyData)
          .select()
          .single();

        if (saveError) {
          console.error('Error saving to history. Details:', {
            error: saveError,
            errorMessage: saveError.message,
            errorCode: saveError.code,
            details: saveError.details,
            hint: saveError.hint,
            table: tableName,
            data: JSON.stringify(historyData, null, 2)
          });
          toast.error(`Failed to save to history: ${saveError.message || 'Unknown error'}`);
        } else {
          console.log('Successfully saved to history:', savedData);
        }
      } catch (saveError) {
        console.error('Unexpected error in history save operation:', saveError);
        if (saveError instanceof Error) {
          toast.error(`Failed to save to history: ${saveError.message}`);
        } else {
          toast.error('Failed to save to history due to an unexpected error');
        }
      }

      if (options?.type === 'thread') {
        setGeneratedThreads(data.threads);
      } else if (options?.type === 'reply') {
        setGeneratedReplies(data.replies);
      } else {
        setGeneratedTweets(data.tweets);
        setSelectedTweet(data.tweets[0]);
      }

      setProgress({ percent: 100, text: 'Done!' });
      setMode('results');

      // Increment usage after successful generation
      try {
        const usageAmount = options?.type === 'thread' ? options.threadLength : 5;
        console.log('Incrementing usage:', {
          amount: usageAmount,
          type: options?.type || 'tweet',
          hasSession: !!session,
          hasAccessToken: !!session?.access_token
        });

        const response = await fetch('/api/usage/increment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ amount: usageAmount })
        });

        const data = await response.json().catch(error => {
          console.error('Failed to parse usage response:', error);
          return { error: 'Invalid response from server' };
        });

        if (!response.ok) {
          console.error('Usage increment failed:', {
            status: response.status,
            statusText: response.statusText,
            data
          });
          throw new Error(data.error || `Failed to update usage count (${response.status})`);
        }

        console.log('Usage increment successful:', data);
        
        // Add a small delay to ensure database consistency before refreshing
        await new Promise(resolve => setTimeout(resolve, 500));
        await refreshUsage();
      } catch (usageError) {
        console.error('Error incrementing usage:', {
          error: usageError,
          message: usageError instanceof Error ? usageError.message : 'Unknown error',
          hasSession: !!session,
          hasAccessToken: !!session?.access_token
        });
        toast.error(usageError instanceof Error ? usageError.message : 'Failed to update usage count');
      }

    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate content. Please try again.');
      setMode('hero');
    }
  };

  const handleGenerateMore = async () => {
    // Reset all states and return to landing page
    setMode('hero');
    setCurrentTopic('');
    setCurrentTone('');
    setCurrentType('tweet');
    setGeneratedTweets([]);
    setGeneratedThreads([]);
    setGeneratedReplies([]);
    setOriginalTweet('');
    setSelectedTweet('');
    setProgress({ percent: 0, text: '' });
  };

  const handleSelectTweet = (tweet: string) => {
    setSelectedTweet(tweet);
  };

  const getLoadingText = () => {
    switch (currentType) {
      case 'thread':
        return `Creating ${currentTone} thread about "${currentTopic}"`;
      case 'reply':
        return `Creating ${currentTone} replies to the tweet`;
      default:
        return `Creating ${currentTone} tweets about "${currentTopic}"`;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#161618' }}>
      <Header />
      
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="flex flex-col items-center w-full">
          {mode === 'hero' && (
            <div className="max-w-2xl">
              <HeroSection onGenerate={handleGenerate} />
            </div>
          )}
          
          {mode === 'loading' && (
            <LoadingScreen 
              progress={progress.percent}
              prompt={getLoadingText()}
            />
          )}
          
          {mode === 'results' && (
            <>
              {currentType === 'thread' ? (
                <ThreadResultsSection
                  threads={generatedThreads}
                  onGenerateMore={handleGenerateMore}
                />
              ) : currentType === 'reply' ? (
                <RepliesResultsSection
                  originalTweet={originalTweet}
                  replies={generatedReplies}
                  onGenerateMore={handleGenerateMore}
                />
              ) : (
                <ResultsSection
                  tweets={generatedTweets}
                  selectedTweet={selectedTweet}
                  onSelectTweet={handleSelectTweet}
                  onGenerateMore={handleGenerateMore}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab="signup"
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1A1A1C' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

