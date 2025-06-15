'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, ChevronLeft, ChevronRight, MessageCircle, Repeat2, Heart, Share } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { motion, AnimatePresence } from 'framer-motion';

interface RepliesResultsSectionProps {
  originalTweet: string;
  replies: string[];
  onGenerateMore: () => void;
}

interface TweetCardProps {
  content: string;
  isOriginalTweet?: boolean;
}

function RepliesResultsSection({ originalTweet, replies, onGenerateMore }: RepliesResultsSectionProps) {
  const [selectedReplyIndex, setSelectedReplyIndex] = useState(0);
  const [copiedReplyIndex, setCopiedReplyIndex] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [likeCount, setLikeCount] = useState(47);
  const [retweetCount, setRetweetCount] = useState(12);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const selectedReply = replies[selectedReplyIndex] || '';

  const handleCopyReply = async (reply: string, index: number) => {
    try {
      await navigator.clipboard.writeText(reply);
      setCopiedReplyIndex(index);
      toast.success('Reply copied to clipboard!');
      
      setTimeout(() => {
        setCopiedReplyIndex(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy reply');
    }
  };

  const formatTweetContent = (content: string) => {
    return content.split(' ').map((word, index) => {
      if (word.startsWith('#')) {
        return (
          <span
            key={index}
            className="text-[#1d9bf0] hover:underline cursor-pointer transition-colors duration-200"
          >
            {word}{' '}
          </span>
        );
      }
      if (word.includes('📸') || word.includes('💡')) {
        return <span key={index} className="inline-block transform hover:scale-110 transition-transform duration-200">{word} </span>;
      }
      return word + ' ';
    });
  };

  const getUserInfo = () => {
    const twitterUsername = user?.user_metadata?.twitter_username;
    const userName = twitterUsername || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const userHandle = twitterUsername ? `@${twitterUsername}` : `@${user?.email?.split('@')[0] || 'user'}`;
    return { userName, userHandle };
  };

  const { userName, userHandle } = getUserInfo();

  const handlePreviousReply = () => {
    setSelectedReplyIndex((prev) => (prev - 1 >= 0 ? prev - 1 : replies.length - 1));
  };

  const handleNextReply = () => {
    setSelectedReplyIndex((prev) => (prev + 1 < replies.length ? prev + 1 : 0));
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

  const TweetCard = ({ content, isOriginalTweet = false }: TweetCardProps) => (
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
            {isOriginalTweet ? (
              <span className="text-[#71767B] group-hover:text-[#1d9bf0] transition-colors duration-200">@user</span>
            ) : (
              <>
                <span className="font-bold text-white hover:underline cursor-pointer group-hover:text-[#1d9bf0] transition-colors duration-200">
                  {userName}
                </span>
                <span className="text-[#71767B] group-hover:text-[#1d9bf0] transition-colors duration-200">{userHandle}</span>
              </>
            )}
            <span className="text-[#71767B]">·</span>
            <span className="text-[#71767B] hover:underline cursor-pointer">
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Tweet Content */}
          <div className="mt-1 mb-4 text-white text-[15px] leading-normal">
            {formatTweetContent(content)}
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

      {/* Hover Overlay */}
      <div 
        className="absolute inset-0 bg-white/[0.02] opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ 
          backdropFilter: 'blur(1px)',
        }}
      />
    </motion.div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#FFFFFF' }}>
            Generated Replies
          </h2>
          <p className="text-sm mt-1" style={{ color: '#B5B5B5' }}>
            {replies.length} variations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopyReply(selectedReply, selectedReplyIndex)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 hover:opacity-90 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:translate-y-[-1px]"
            style={{
              background: 'rgba(39, 40, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              fontSize: '14px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {copiedReplyIndex === selectedReplyIndex ? (
              <Check className="h-4 w-4" style={{ color: '#22c55e' }} />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy Reply
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
        {/* Original Tweet - Left Side */}
        <div className="min-w-[550px]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>
              Original Tweet
            </h3>
          </div>
          <TweetCard content={originalTweet} isOriginalTweet={true} />
        </div>

        {/* Reply Preview - Right Side */}
        <div className="min-w-[550px]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>
              Reply Preview
            </h3>
          </div>

          <div className="space-y-4">
            <TweetCard content={selectedReply} isOriginalTweet={false} />

            {/* Reply Navigation */}
            <div className="px-3 py-2 rounded-xl border" style={{ borderColor: '#2F3336', backgroundColor: '#16181C' }}>
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePreviousReply}
                  className="p-1.5 rounded-lg transition-all duration-300 hover:text-white group"
                  style={{ color: '#71767B' }}
                >
                  <ChevronLeft 
                    className="w-4 h-4 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group-hover:scale-125 group-hover:brightness-125" 
                  />
                </button>

                <span className="text-xs" style={{ color: '#71767B' }}>
                  Reply {selectedReplyIndex + 1} of {replies.length}
                </span>

                <button
                  onClick={handleNextReply}
                  className="p-1.5 rounded-lg transition-all duration-300 hover:text-white group"
                  style={{ color: '#71767B' }}
                >
                  <ChevronRight 
                    className="w-4 h-4 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group-hover:scale-125 group-hover:brightness-125" 
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { RepliesResultsSection }; 