'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, ChevronLeft, ChevronRight, MessageCircle, Repeat2, Heart, Share } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { motion, AnimatePresence } from 'framer-motion';

interface ThreadResultsSectionProps {
  threads: string[][];
  onGenerateMore: () => void;
}

function ThreadResultsSection({ threads, onGenerateMore }: ThreadResultsSectionProps) {
  const [selectedThreadIndex, setSelectedThreadIndex] = useState(0);
  const [selectedTweetIndex, setSelectedTweetIndex] = useState(0);
  const [copiedTweetIndex, setCopiedTweetIndex] = useState<number | null>(null);
  const [copiedEntireThread, setCopiedEntireThread] = useState(false);
  const { user } = useAuth();
  const [currentTime] = useState(new Date());
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [retweetCount, setRetweetCount] = useState(0);

  const selectedThread = threads[selectedThreadIndex] || [];
  const selectedTweet = selectedThread[selectedTweetIndex] || '';

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

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleRetweet = () => {
    setIsRetweeted(!isRetweeted);
    setRetweetCount(prev => isRetweeted ? prev - 1 : prev + 1);
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const getUserInfo = () => {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const userHandle = `@${userName.toLowerCase().replace(/\s+/g, '')}`;
    return { userName, userHandle };
  };

  const handlePreviousThread = () => {
    setSelectedThreadIndex((prev) => (prev - 1 >= 0 ? prev - 1 : threads.length - 1));
    setSelectedTweetIndex(0);
  };

  const handleNextThread = () => {
    setSelectedThreadIndex((prev) => (prev + 1 < threads.length ? prev + 1 : 0));
    setSelectedTweetIndex(0);
  };

  const handlePreviousTweet = () => {
    setSelectedTweetIndex((prev) => (prev - 1 >= 0 ? prev - 1 : selectedThread.length - 1));
  };

  const handleNextTweet = () => {
    setSelectedTweetIndex((prev) => (prev + 1 < selectedThread.length ? prev + 1 : 0));
  };

  const { userName, userHandle } = getUserInfo();

  const formatTweetContent = (content: string, index: number, total: number) => {
    // Remove any existing "Tweet X:" prefix if present
    const cleanContent = content.replace(/^Tweet \d+:\s*/, '');
    
    // Just return the clean content without any prefix
    return cleanContent.split(' ').map((word, i) => {
      if (word.startsWith('#')) {
        return (
          <span
            key={i}
            className="text-[#1d9bf0] hover:underline cursor-pointer transition-colors duration-200"
          >
            {word}{' '}
          </span>
        );
      }
      if (word.includes('📸') || word.includes('💡')) {
        return <span key={i} className="inline-block transform hover:scale-110 transition-transform duration-200">{word} </span>;
      }
      return word + ' ';
    });
  };

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
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyEntireThread}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 hover:opacity-90 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:translate-y-[-1px]"
            style={{
              background: 'rgba(39, 40, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              fontSize: '14px',
              border: '1px solid rgba(255,255,255,0.1)'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 hover:opacity-90 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:translate-y-[-1px]"
            style={{
              background: 'rgba(39, 40, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              fontSize: '14px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            Generate More
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Thread Variations - Left Side */}
        <div className="min-w-[550px]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>
              Thread Variations
            </h3>
          </div>

          {/* Thread Navigation */}
          <motion.div
            className="rounded-xl border overflow-hidden shadow-lg transition-all duration-300 hover:translate-y-[-2px] hover:shadow-2xl"
            style={{
              backgroundColor: '#252628',
              borderColor: '#3B3B3D',
              transform: 'translateZ(0)',
            }}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Thread Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#3B3B3D' }}>
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: '#B5B5B5' }}>
                  🧵 Thread {selectedThreadIndex + 1} of {threads.length}
                </span>
              </div>
            </div>

            {/* Thread Content */}
            <div className="p-4 text-[15px] leading-normal" style={{ color: '#FFFFFF', minHeight: '144px' }}>
              {/* First Tweet Preview */}
              <div className="line-clamp-2 mb-2">
                {selectedThread[0] || ''}
              </div>
              
              {/* Tweet Count */}
              <div className="text-sm text-center py-2" style={{ color: '#B5B5B5' }}>
                {selectedThread.length} tweets in this thread
              </div>
              
              {/* Last Tweet Preview */}
              <div className="line-clamp-2">
                {selectedThread[selectedThread.length - 1] || ''}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="px-4 py-3 border-t" style={{ borderColor: '#3B3B3D' }}>
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePreviousThread}
                  className="p-1.5 rounded-lg transition-all duration-300 hover:text-white group"
                  style={{ color: '#71767B' }}
                >
                  <ChevronLeft 
                    className="w-4 h-4 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group-hover:scale-125 group-hover:brightness-125" 
                  />
                </button>

                {/* Thread Dots */}
                <div className="flex items-center gap-1.5">
                  {threads.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedThreadIndex(index)}
                      className="w-2 h-2 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: selectedThreadIndex === index ? '#FFFFFF' : '#3B3B3D',
                        transform: selectedThreadIndex === index ? 'scale(1.3)' : 'scale(1)',
                        opacity: selectedThreadIndex === index ? '1' : '0.7',
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNextThread}
                  className="p-1.5 rounded-lg transition-all duration-300 hover:text-white group"
                  style={{ color: '#71767B' }}
                >
                  <ChevronRight 
                    className="w-4 h-4 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group-hover:scale-125 group-hover:brightness-125" 
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tweet Preview - Right Side */}
        <div className="min-w-[550px]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>
              Tweet Preview
            </h3>
          </div>
                
          {/* Tweet Card */}
          <motion.div 
            className="rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(29,155,240,0.1)] relative"
            style={{ 
              backgroundColor: '#16181C',
              border: '1px solid #2F3336',
            }}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Tweet Header */}
            <div className="p-4 flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold cursor-pointer transition-transform duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: '#2F3336',
                  boxShadow: '0 0 10px rgba(255,255,255,0.1)'
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 group">
                  <span className="font-bold text-white hover:underline cursor-pointer group-hover:text-[#1d9bf0] transition-colors duration-200">
                    {userName}
                  </span>
                  <span className="text-[#71767B] group-hover:text-[#1d9bf0] transition-colors duration-200">{userHandle}</span>
                  <span className="text-[#71767B]">·</span>
                  <span className="text-[#71767B] hover:underline cursor-pointer">
                    {formatTime(currentTime)}
                  </span>
                </div>

                {/* Tweet Content */}
                <div className="mt-1 mb-4 text-white text-[15px] leading-normal">
                  {formatTweetContent(selectedTweet, selectedTweetIndex, selectedThread.length)}
                </div>

                {/* Tweet Details */}
                <div className="mt-4 text-[#71767B] text-sm flex items-center">
                  <span>{formatTime(currentTime)} · {formatDate(currentTime)}</span>
                  <span className="mx-1">·</span>
                  <span className="hover:underline cursor-pointer hover:text-[#1d9bf0] transition-colors duration-200">
                    Twitter for Web
                  </span>
                </div>

                {/* Tweet Stats */}
                <div 
                  className="flex gap-5 py-3 mt-3 border-y"
                  style={{ borderColor: '#2F3336' }}
                >
                  <span className="text-[#71767B] hover:underline cursor-pointer group transition-colors duration-200">
                    <strong className="text-white group-hover:text-[#00BA7C]">{retweetCount}</strong> Retweets
                  </span>
                  <span className="text-[#71767B] hover:underline cursor-pointer group transition-colors duration-200">
                    <strong className="text-white group-hover:text-[#1d9bf0]">3</strong> Quote Tweets
                  </span>
                  <span className="text-[#71767B] hover:underline cursor-pointer group transition-colors duration-200">
                    <strong className="text-white group-hover:text-[#F91880]">{likeCount}</strong> Likes
                  </span>
                </div>
                
                {/* Tweet Actions */}
                <div className="flex justify-between mt-2">
                  <button className="group flex items-center gap-1 text-[#71767B] transition-colors duration-200 hover:text-[#1d9bf0]">
                    <div className="p-2 rounded-full transition-all duration-200 group-hover:bg-[#1d9bf0]/10 transform group-hover:scale-110">
                      <MessageCircle size={18} className="transition-all duration-200" />
                    </div>
                  </button>
                  
                  <button
                    onClick={handleRetweet}
                    className={`group flex items-center gap-1 transition-colors duration-200 ${isRetweeted ? 'text-[#00BA7C]' : 'text-[#71767B] hover:text-[#00BA7C]'}`}
                  >
                    <div className={`p-2 rounded-full transition-all duration-200 transform group-hover:scale-110 ${isRetweeted ? 'bg-[#00BA7C]/10' : 'group-hover:bg-[#00BA7C]/10'}`}>
                      <Repeat2 size={18} className="transition-all duration-200" />
                    </div>
                  </button>
                  
                  <button 
                    onClick={handleLike}
                    className={`group flex items-center gap-1 transition-colors duration-200 ${isLiked ? 'text-[#F91880]' : 'text-[#71767B] hover:text-[#F91880]'}`}
                  >
                    <div className={`p-2 rounded-full transition-all duration-200 transform group-hover:scale-110 ${isLiked ? 'bg-[#F91880]/10' : 'group-hover:bg-[#F91880]/10'}`}>
                      <Heart 
                        size={18} 
                        className={`transition-all duration-200 ${isLiked ? 'fill-current' : ''}`}
                      />
                    </div>
                  </button>

                  <button className="group flex items-center gap-1 text-[#71767B] transition-colors duration-200 hover:text-[#1d9bf0]">
                    <div className="p-2 rounded-full transition-all duration-200 group-hover:bg-[#1d9bf0]/10 transform group-hover:scale-110">
                      <Share size={18} className="transition-all duration-200" />
                    </div>
                  </button>
                </div>
              </div>

              {/* More Options */}
              <button 
                className="p-2 rounded-full text-[#71767B] hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] transition-all duration-200 transform hover:scale-105"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
                </svg>
              </button>
            </div>

            {/* Tweet Navigation */}
            <div className="px-4 py-3 border-t" style={{ borderColor: '#2F3336' }}>
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePreviousTweet}
                  className="p-1.5 rounded-lg transition-all duration-300 hover:text-white group"
                  style={{ color: '#71767B' }}
                >
                  <ChevronLeft 
                    className="w-4 h-4 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group-hover:scale-125 group-hover:brightness-125" 
                  />
                </button>

                <span className="text-sm" style={{ color: '#71767B' }}>
                  Tweet {selectedTweetIndex + 1} of {selectedThread.length}
                </span>

                <button
                  onClick={handleNextTweet}
                  className="p-1.5 rounded-lg transition-all duration-300 hover:text-white group"
                  style={{ color: '#71767B' }}
                >
                  <ChevronRight 
                    className="w-4 h-4 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group-hover:scale-125 group-hover:brightness-125" 
                  />
                </button>
              </div>
            </div>

            {/* Hover Overlay */}
            <div 
              className="absolute inset-0 bg-white/[0.02] opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{ 
                backdropFilter: 'blur(1px)',
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { ThreadResultsSection }; 