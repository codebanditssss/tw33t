'use client';

import { useState } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

interface ThreadResultsSectionProps {
  threads: string[][];
  onGenerateMore: () => void;
}

function ThreadResultsSection({ threads, onGenerateMore }: ThreadResultsSectionProps) {
  const [selectedThreadIndex, setSelectedThreadIndex] = useState(0);
  const [copiedTweetIndex, setCopiedTweetIndex] = useState<number | null>(null);
  const [copiedEntireThread, setCopiedEntireThread] = useState(false);
  const { user } = useAuth();

  const selectedThread = threads[selectedThreadIndex] || [];

  const handleCopyTweet = async (tweet: string, index: number) => {
    try {
      await navigator.clipboard.writeText(tweet);
      setCopiedTweetIndex(index);
      toast.success('Tweet copied to clipboard!');
      
      setTimeout(() => {
        setCopiedTweetIndex(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy tweet');
    }
  };

  const handleCopyEntireThread = async () => {
    try {
      const threadText = selectedThread.join('\n\n');
      await navigator.clipboard.writeText(threadText);
      setCopiedEntireThread(true);
      toast.success('Entire thread copied to clipboard!');
      
      setTimeout(() => {
        setCopiedEntireThread(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy thread');
    }
  };

  const formatTweetContent = (tweet: string) => {
    return tweet
      .split('\n')
      .map((line, index) => {
        const trimmedLine = line.trim();
        
        if (!trimmedLine) {
          return <br key={index} />;
        }
        
        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('→')) {
          return (
            <div key={index} className="ml-2 mb-1">
              {trimmedLine}
            </div>
          );
        }
        
        if (/^\d+[.)]\s/.test(trimmedLine)) {
          return (
            <div key={index} className="ml-2 mb-1">
              {trimmedLine}
            </div>
          );
        }
        
        return (
          <div key={index} className={index > 0 ? 'mt-2' : ''}>
            {trimmedLine}
          </div>
        );
      });
  };

  const getUserInfo = () => {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const userHandle = `@${user?.email?.split('@')[0] || 'user'}`;
    return { userName, userHandle };
  };

  const { userName, userHandle } = getUserInfo();

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#FFFFFF' }}>
            Generated Thread
          </h2>
          <p className="text-sm mt-1" style={{ color: '#B5B5B5' }}>
            {selectedThread.length} tweets • {threads.length} variations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyEntireThread}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:opacity-80"
            style={{
              backgroundColor: '#3E3F41',
              borderColor: '#5A5A5C',
              color: '#FFFFFF'
            }}
          >
            {copiedEntireThread ? (
              <Check className="h-4 w-4" style={{ color: '#22c55e' }} />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy Thread
          </button>
          
          <button
            onClick={onGenerateMore}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:opacity-80"
            style={{
              backgroundColor: '#3E3F41',
              color: '#FFFFFF'
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Generate More
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Thread Variations - Left Side */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>
            Thread Variations
          </h3>
          
          <div className="space-y-4">
            {threads.map((thread, index) => (
              <div
                key={index}
                onClick={() => setSelectedThreadIndex(index)}
                className="p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:opacity-80"
                style={{
                  backgroundColor: selectedThreadIndex === index ? '#3E3F41' : '#252628',
                  borderColor: selectedThreadIndex === index ? '#5A5A5C' : '#3B3B3D',
                  borderWidth: selectedThreadIndex === index ? '2px' : '1px'
                }}
              >
                {/* Variation Header */}
                <div className="flex items-center justify-between mb-3">
                  <span 
                    className="text-sm font-medium px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: '#161618',
                      color: '#B5B5B5'
                    }}
                  >
                    Thread {index + 1}
                  </span>
                  <span className="text-xs" style={{ color: '#B5B5B5' }}>
                    {thread.length} tweets
                  </span>
                </div>

                {/* Preview - First and Last Tweet */}
                <div className="space-y-2">
                  <div className="text-sm" style={{ color: '#FFFFFF' }}>
                    <div className="line-clamp-2">
                      {formatTweetContent(thread[0] || '')}
                    </div>
                  </div>
                  
                  {thread.length > 2 && (
                    <div className="text-xs text-center py-1" style={{ color: '#B5B5B5' }}>
                      ... {thread.length - 2} more tweets ...
                    </div>
                  )}
                  
                  {thread.length > 1 && (
                    <div className="text-sm" style={{ color: '#FFFFFF' }}>
                      <div className="line-clamp-2">
                        {formatTweetContent(thread[thread.length - 1])}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thread Preview - Right Side */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>
            Thread Preview
          </h3>
          
          <div className="space-y-4">
            {selectedThread.map((tweet, index) => (
              <div
                key={index}
                className="relative"
              >
                {/* Connection Line */}
                {index < selectedThread.length - 1 && (
                  <div 
                    className="absolute left-6 top-16 w-0.5 h-8"
                    style={{ backgroundColor: '#3B3B3D' }}
                  />
                )}
                
                {/* Tweet Card */}
                <div 
                  className="rounded-xl border overflow-hidden"
                  style={{ 
                    backgroundColor: '#252628',
                    borderColor: '#3B3B3D'
                  }}
                >
                  {/* Tweet Header */}
                  <div className="p-4 border-b" style={{ borderColor: '#3B3B3D' }}>
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium flex-shrink-0"
                        style={{ backgroundColor: '#3E3F41', color: '#FFFFFF' }}
                      >
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm" style={{ color: '#FFFFFF' }}>
                            {userName}
                          </span>
                          <span className="text-sm" style={{ color: '#B5B5B5' }}>
                            {userHandle}
                          </span>
                          <span className="text-sm" style={{ color: '#B5B5B5' }}>
                            ·
                          </span>
                          <span className="text-sm" style={{ color: '#B5B5B5' }}>
                            now
                          </span>
                        </div>
                      </div>
                      
                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyTweet(tweet, index)}
                        className="p-2 rounded-lg transition-colors hover:opacity-80"
                        style={{ backgroundColor: '#161618' }}
                      >
                        {copiedTweetIndex === index ? (
                          <Check className="h-4 w-4" style={{ color: '#22c55e' }} />
                        ) : (
                          <Copy className="h-4 w-4" style={{ color: '#B5B5B5' }} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tweet Content */}
                  <div className="p-4">
                    <div className="text-base leading-relaxed" style={{ color: '#FFFFFF' }}>
                      {formatTweetContent(tweet)}
                    </div>
                  </div>

                  {/* Character Count */}
                  <div className="px-4 pb-3">
                    <div className="flex justify-end">
                      <span 
                        className="text-xs"
                        style={{ 
                          color: tweet.length > 280 ? '#ef4444' : '#B5B5B5'
                        }}
                      >
                        {tweet.length}/280
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { ThreadResultsSection }; 