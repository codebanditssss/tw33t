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
import LoadingScreen from '@/components/loading-screen';
import { RepliesResultsSection } from "@/components/replies-results-section";

type Mode = 'hero' | 'loading' | 'results';

export default function Home() {
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
  const { user } = useAuth();
  const { usageStatus, refreshUsage } = useUsage();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for auth callback
    const code = searchParams.get('code');
    if (code && user?.id) {
      const connectTwitter = async () => {
        try {
          const response = await fetch('/api/twitter/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          if (!response.ok) {
            throw new Error('Failed to connect Twitter');
          }

          await refreshUsage();
          toast.success('Twitter connected successfully!');
        } catch (error) {
          console.error('Twitter connection error:', error);
          toast.error('Failed to connect Twitter. Please try again.');
        }
      };

      connectTwitter();
    }
  }, [searchParams, user?.id, refreshUsage]);

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
      toast.error(`Usage limit reached. You've used ${usageStatus?.currentUsage}/${usageStatus?.limit} tweets this month. Upgrade for more!`);
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            tone,
            length: options.threadLength,
            style: options.threadStyle
          }),
        });
      } else if (options?.type === 'reply') {
        response = await fetch('/api/generate-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            tone,
            originalTweet: options.originalTweet
          }),
        });
      } else {
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, tone }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      setProgress({ percent: 60, text: 'Generating content...' });

      const data = await response.json();

      setProgress({ percent: 90, text: 'Finalizing...' });

      if (options?.type === 'thread') {
        setGeneratedThreads([data.threads]);
      } else if (options?.type === 'reply') {
        setGeneratedReplies(data.replies);
      } else {
        setGeneratedTweets(data.tweets);
        setSelectedTweet(data.tweets[0]);
      }

      setProgress({ percent: 100, text: 'Done!' });
      setMode('results');

      // Save to history
      const { error } = await supabase
        .from(options?.type === 'reply' ? 'replies' : options?.type === 'thread' ? 'threads' : 'tweets')
        .insert([
          {
            user_id: user.id,
            prompt: topic,
            tone,
            content: JSON.stringify(options?.type === 'thread' ? data.threads : options?.type === 'reply' ? data.replies : data.tweets),
            ...(options?.type === 'reply' && { original_tweet: options.originalTweet }),
            type: options?.type || 'tweet'
          }
        ]);

      if (error) {
        console.error('Error saving to history:', error);
        toast.error('Failed to save to history. Please try again.');
      }

      // Refresh usage after successful generation
      await refreshUsage();

    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate content. Please try again.');
      setMode('hero');
    }
  };

  const handleGenerateMore = async () => {
    if (!usageStatus?.canGenerate) {
      toast.error(`Usage limit reached. You've used ${usageStatus?.currentUsage}/${usageStatus?.limit} tweets this month. Upgrade for more!`);
      return;
    }

    try {
      let response;
      if (currentType === 'thread') {
        response = await fetch('/api/generate-thread', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: currentTopic,
            tone: currentTone,
            length: 8,
            style: 'story'
          }),
        });
      } else if (currentType === 'reply') {
        response = await fetch('/api/generate-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: currentTopic,
            tone: currentTone,
            originalTweet
          }),
        });
      } else {
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: currentTopic,
            tone: currentTone
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to generate more content');
      }

      const data = await response.json();

      if (currentType === 'thread') {
        setGeneratedThreads(prev => [...prev, data.threads]);
      } else if (currentType === 'reply') {
        setGeneratedReplies(prev => [...prev, ...data.replies]);
      } else {
        setGeneratedTweets(prev => [...prev, ...data.tweets]);
      }

      // Save to history
      const { error } = await supabase
        .from(currentType === 'thread' ? 'threads' : 'tweets')
        .insert([
          {
            user_id: user!.id,
            prompt: currentTopic,
            tone: currentTone,
            content: JSON.stringify(currentType === 'thread' ? data.threads : data.tweets),
            type: currentType
          }
        ]);

      if (error) {
        console.error('Error saving to history:', error);
      }

      // Refresh usage after successful generation
      await refreshUsage();

    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate more content. Please try again.');
    }
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
