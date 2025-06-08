'use client';

import { useState, useEffect } from 'react';
import { Header } from "@/components/ui/header";
import { HeroSection } from "@/components/hero-section";
import { ResultsSection } from "@/components/results-section";
import { ThreadResultsSection } from "@/components/thread-results-section";
import { AuthModal } from "@/components/ui/auth-modal";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useUsage } from '@/contexts/usage-context';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Mode = 'hero' | 'loading' | 'results';

export default function Home() {
  const [mode, setMode] = useState<Mode>('hero');
  const [generatedTweets, setGeneratedTweets] = useState<string[]>([]);
  const [generatedThreads, setGeneratedThreads] = useState<string[][]>([]);
  const [selectedTweet, setSelectedTweet] = useState<string>('');
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [currentTone, setCurrentTone] = useState<string>('');
  const [currentType, setCurrentType] = useState<'tweet' | 'thread'>('tweet');
  const [progress, setProgress] = useState<{ percent: number; status: string }>({ percent: 0, status: '' });
  const [hasShownSuccessToast, setHasShownSuccessToast] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const { refreshUsage } = useUsage();
  const searchParams = useSearchParams();

  // Handle success return from payment
  useEffect(() => {
    const success = searchParams.get('success');
    const subscriptionId = searchParams.get('subscription_id');
    
    if (success === 'true' && user && !hasShownSuccessToast) {
      console.log('Payment success detected, subscription ID:', subscriptionId);
      toast.success('Payment successful! Your SuperTw33t subscription is now active.');
      setHasShownSuccessToast(true);
      
      // Refresh usage to update the UI with a slight delay to allow webhook processing
      setTimeout(() => {
        refreshUsage();
      }, 2000);
      
      // Clear the success parameter from URL to prevent re-triggering
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      url.searchParams.delete('subscription_id');
      url.searchParams.delete('status');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, user?.id, refreshUsage, hasShownSuccessToast]);

  const handleGenerate = async (
    topic: string, 
    tone: string, 
    options?: {
      type: 'tweet' | 'thread';
      threadLength?: number;
      threadStyle?: string;
    }
  ) => {
    // Check if user is authenticated
    if (!user) {
      setIsAuthModalOpen(true);
      toast.info('Please sign up or log in to generate tweets');
      return;
    }

    setCurrentTopic(topic);
    setCurrentTone(tone);
    setCurrentType(options?.type || 'tweet');
    setMode('loading');
    setProgress({ percent: 0, status: 'Starting...' });

    try {
      // Get auth token if user is logged in
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      // Choose the appropriate API endpoint
      const endpoint = options?.type === 'thread' ? '/api/generate-thread' : '/api/generate';
      
      const requestBody = options?.type === 'thread' 
        ? { 
            topic, 
            tone, 
            threadLength: options.threadLength || 8,
            threadStyle: options.threadStyle || 'story'
          }
        : { topic, tone };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `Failed to generate ${options?.type || 'tweets'}`;
        
        // If it's an authentication error, show the auth modal
        if (response.status === 401) {
          setIsAuthModalOpen(true);
          toast.error('Please sign up or log in to generate tweets');
          setMode('hero');
          return;
        }
        
        throw new Error(errorMessage);
      }

      if (options?.type === 'thread') {
        // Handle thread generation (no streaming yet)
        const data = await response.json();
        setGeneratedThreads(data.threads || []);
        setGeneratedTweets([]); // Clear tweets when showing threads
        setMode('results');
        // Refresh usage after successful generation
        if (user) {
          await refreshUsage();
        }
      } else {
        // Handle streaming response for tweets
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Convert the chunk to text
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (data.error) {
                // Handle error from stream
                toast.error(data.error);
                setMode('hero');
                return; // Exit the function completely
              }
              
              if (data.progress !== undefined) {
                setProgress({ 
                  percent: data.progress,
                  status: data.status
                });
                
                // If we got the final tweets
                if (data.status.startsWith('{')) {
                  const finalData = JSON.parse(data.status);
                  if (finalData.tweets) {
                    setGeneratedTweets(finalData.tweets);
                    setSelectedTweet(finalData.tweets[0] || '');
                    setGeneratedThreads([]);
                    setMode('results');
                    // Refresh usage after successful generation
                    if (user) {
                      await refreshUsage();
                    }
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
              // If it's a JSON parse error, it might be an incomplete chunk, continue
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error(`Error generating ${options?.type || 'tweets'}`);
      setMode('hero');
    }
  };

  const handleSelectTweet = (tweet: string) => {
    setSelectedTweet(tweet);
  };

  const handleGenerateMore = () => {
    setMode('hero');
    setGeneratedTweets([]);
    setGeneratedThreads([]);
    setSelectedTweet('');
    setProgress({ percent: 0, status: '' });
  };

  const getLoadingText = () => {
    if (currentType === 'thread') {
      return `Creating ${currentTone} thread about "${currentTopic}"`;
    }
    return `Creating ${currentTone} tweets about "${currentTopic}"`;
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
            <div className="text-center max-w-md w-full px-4">
              {/* Progress Container */}
              <div className="relative mb-8">
                {/* Background Bar */}
                <div className="h-1.5 bg-[#2a2a2d] rounded-full overflow-hidden">
                  {/* Progress Bar */}
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                
                {/* Percentage Text */}
                <div className="absolute -top-6 transform -translate-x-1/2 text-sm font-medium text-blue-400"
                     style={{ left: `${progress.percent}%`, minWidth: '40px' }}>
                  {progress.percent}%
                </div>
              </div>

              {/* Status Text */}
              <h3 className="text-2xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>
                {progress.status}
              </h3>
              
              {/* Context Text */}
              <p className="text-base" style={{ color: '#B5B5B5' }}>
                {getLoadingText()}
              </p>

              {/* Animated Dots */}
              <div className="flex items-center justify-center gap-1 mt-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"
                    style={{
                      animationDelay: `${i * 200}ms`,
                      opacity: 0.6
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          
          {mode === 'results' && (
            <>
              {currentType === 'thread' ? (
                <ThreadResultsSection
                  threads={generatedThreads}
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
