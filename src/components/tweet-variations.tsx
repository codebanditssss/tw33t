'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface TweetVariationsProps {
  tweets: string[];
  selectedTweet: string;
  onSelectTweet: (tweet: string) => void;
  onGenerateMore: () => void;
}

function TweetVariations({ tweets, selectedTweet, onSelectTweet, onGenerateMore }: TweetVariationsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Synchronize selected tweet with current index
  useEffect(() => {
    const tweet = tweets[currentIndex];
    if (tweet && tweet !== selectedTweet) {
      onSelectTweet(tweet);
    }
  }, [currentIndex, tweets, selectedTweet, onSelectTweet]);

  const handleCopy = async (tweet: string, index: number) => {
    try {
      await navigator.clipboard.writeText(tweet);
      setCopiedIndex(index);
      toast.success('Tweet copied to clipboard!');
      
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

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : tweets.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1 < tweets.length ? prev + 1 : 0));
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
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

  const currentTweet = tweets[currentIndex];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>
          Generated Tweets
        </h3>
      </div>
      
      <div className="space-y-4">
        {/* Tweet Card */}
        <div
          className="rounded-xl border overflow-hidden shadow-lg transition-all duration-300 hover:translate-y-[-2px] hover:shadow-2xl"
          style={{
            backgroundColor: '#252628',
            borderColor: '#3B3B3D',
            transform: 'translateZ(0)', // Force GPU acceleration
          }}
        >
          {/* Tweet Header */}
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#3B3B3D' }}>
            <div className="flex items-center gap-3">
              <span 
                className="text-sm"
                style={{ color: '#B5B5B5' }}
              >
                Tweet {currentIndex + 1} of {tweets.length}
              </span>
            </div>

            <button
              onClick={(e) => handleCopy(currentTweet, currentIndex)}
              className="p-2 rounded-lg transition-all duration-300 hover:opacity-80 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] cursor-pointer"
              style={{ backgroundColor: '#161618' }}
            >
              {copiedIndex === currentIndex ? (
                <Check className="h-4 w-4" style={{ color: '#22c55e' }} />
              ) : (
                <Copy className="h-4 w-4" style={{ color: '#B5B5B5' }} />
              )}
            </button>
          </div>

          {/* Tweet Content */}
          <div 
            className="p-4 text-[15px] leading-normal" 
            style={{ color: '#FFFFFF', minHeight: '144px' }}
          >
            {formatTweetContent(currentTweet)}
          </div>

          {/* Tweet Footer */}
          <div className="px-4 py-3 border-t" style={{ borderColor: '#3B3B3D' }}>
            <div className="flex justify-between items-center">
              <span 
                className="text-sm"
                style={{ color: '#B5B5B5' }}
              >
                {getCharacterCount(currentTweet)}/280
              </span>

              <button
                onClick={onGenerateMore}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 hover:opacity-90 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:translate-y-[-1px] cursor-pointer"
                style={{
                  background: 'linear-gradient(45deg, #3E3F41, #252628)',
                  color: '#FFFFFF',
                  border: '1px solid #3B3B3D'
                }}
              >
                Generate More
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between gap-4 px-4">
          <button
            onClick={handlePrevious}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:opacity-90 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:translate-y-[-1px] cursor-pointer"
            style={{ 
              backgroundColor: 'rgba(39, 40, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF'
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Previous</span>
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {tweets.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className="w-2 h-2 rounded-full transition-all duration-500 cursor-pointer"
                style={{
                  backgroundColor: currentIndex === index ? '#FFFFFF' : '#3B3B3D',
                  transform: currentIndex === index ? 'scale(1.3)' : 'scale(1)',
                  opacity: currentIndex === index ? '1' : '0.7',
                  boxShadow: currentIndex === index ? '0 0 10px rgba(255,255,255,0.3)' : 'none',
                }}
                aria-label={`Go to tweet ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:opacity-90 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:translate-y-[-1px] cursor-pointer"
            style={{ 
              backgroundColor: 'rgba(39, 40, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF'
            }}
          >
            <span className="text-sm">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { TweetVariations }; 