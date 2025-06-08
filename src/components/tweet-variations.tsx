'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TweetVariationsProps {
  tweets: string[];
  selectedTweet: string;
  onSelectTweet: (tweet: string) => void;
}

function TweetVariations({ tweets, selectedTweet, onSelectTweet }: TweetVariationsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (tweet: string, index: number) => {
    try {
      await navigator.clipboard.writeText(tweet);
      setCopiedIndex(index);
      toast.success('Tweet copied to clipboard!');
      
      // Reset copy state after 2 seconds
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy tweet');
    }
  };

  const getCharacterCount = (tweet: string) => {
    return tweet.length;
  };

  const isOverLimit = (tweet: string) => {
    return tweet.length > 280;
  };

  // Function to format tweet content with proper line breaks and structure
  const formatTweetContent = (tweet: string) => {
    return tweet
      .split('\n')
      .map((line, index) => {
        // Handle different types of formatting
        const trimmedLine = line.trim();
        
        if (!trimmedLine) {
          return <br key={index} />;
        }
        
        // Handle bullet points
        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('→')) {
          return (
            <div key={index} className="ml-2 mb-1">
              {trimmedLine}
            </div>
          );
        }
        
        // Handle numbered lists
        if (/^\d+[.)]\s/.test(trimmedLine)) {
          return (
            <div key={index} className="ml-2 mb-1">
              {trimmedLine}
            </div>
          );
        }
        
        // Regular line
        return (
          <div key={index} className={index > 0 ? 'mt-2' : ''}>
            {trimmedLine}
          </div>
        );
      });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>
        Generated Tweets
      </h3>
      
      {tweets.map((tweet, index) => (
        <div
          key={index}
          onClick={() => onSelectTweet(tweet)}
          className="p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:opacity-80"
          style={{
            backgroundColor: selectedTweet === tweet ? '#3E3F41' : '#252628',
            borderColor: selectedTweet === tweet ? '#5A5A5C' : '#3B3B3D',
            borderWidth: selectedTweet === tweet ? '2px' : '1px'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span 
              className="text-sm font-medium px-2 py-1 rounded"
              style={{ 
                backgroundColor: '#161618',
                color: '#B5B5B5'
              }}
            >
              Tweet {index + 1}
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(tweet, index);
              }}
              className="p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: '#161618' }}
            >
              {copiedIndex === index ? (
                <Check className="h-4 w-4" style={{ color: '#22c55e' }} />
              ) : (
                <Copy className="h-4 w-4" style={{ color: '#B5B5B5' }} />
              )}
            </button>
          </div>

          {/* Tweet Content with Proper Formatting */}
          <div className="text-sm leading-relaxed mb-3" style={{ color: '#FFFFFF' }}>
            {formatTweetContent(tweet)}
          </div>

          {/* Character Count */}
          <div className="flex justify-end">
            <span 
              className="text-xs"
              style={{ 
                color: isOverLimit(tweet) ? '#ef4444' : '#B5B5B5'
              }}
            >
              {getCharacterCount(tweet)}/280
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export { TweetVariations }; 