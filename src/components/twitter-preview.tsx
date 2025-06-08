'use client';

import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface TwitterPreviewProps {
  tweet: string;
}

function TwitterPreview({ tweet }: TwitterPreviewProps) {
  const { user } = useAuth();

  const twitterUsername = user?.user_metadata?.twitter_username;
  const userName = twitterUsername || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userHandle = twitterUsername ? `@${twitterUsername}` : `@${user?.email?.split('@')[0] || 'user'}`;
  const userEmail = user?.email;

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
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
    <div className="sticky top-4">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>
        Twitter Preview
      </h3>
      
      <div 
        className="rounded-xl border overflow-hidden"
        style={{ 
          backgroundColor: '#252628',
          borderColor: '#3B3B3D'
        }}
      >
        {/* Tweet Header */}
        <div className="p-4 border-b" style={{ borderColor: '#3B3B3D' }}>
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium flex-shrink-0"
              style={{ backgroundColor: '#3E3F41', color: '#FFFFFF' }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-medium text-[15px] truncate" style={{ color: '#FFFFFF' }}>
                  {userName}
                </span>
                <span className="text-[15px] truncate" style={{ color: 'rgb(113, 118, 123)' }}>
                  {userHandle}
                </span>
                <span className="text-[15px] mx-0.5" style={{ color: 'rgb(113, 118, 123)' }}>
                  ·
                </span>
                <span className="text-[15px]" style={{ color: 'rgb(113, 118, 123)' }}>
                  {formatTime()}
                </span>
              </div>
            </div>
            
            {/* More Options */}
            <button className="p-1 rounded-full hover:opacity-80">
              <MoreHorizontal className="h-5 w-5" style={{ color: '#B5B5B5' }} />
            </button>
          </div>
        </div>

        {/* Tweet Content with Proper Formatting */}
        <div className="p-4">
          <div className="text-base leading-relaxed" style={{ color: '#FFFFFF' }}>
            {formatTweetContent(tweet)}
          </div>
        </div>

        {/* Tweet Metadata */}
        <div className="px-4 py-3 border-t border-b" style={{ borderColor: '#3B3B3D' }}>
          <div className="flex items-center gap-1 text-sm" style={{ color: '#B5B5B5' }}>
            <span>{formatTime()}</span>
            <span>·</span>
            <span>{formatDate()}</span>
            <span>·</span>
            <span className="font-medium" style={{ color: '#FFFFFF' }}>
              Twitter for Web
            </span>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="px-4 py-3 border-b" style={{ borderColor: '#3B3B3D' }}>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <span className="font-medium" style={{ color: '#FFFFFF' }}>
                12
              </span>
              <span style={{ color: '#B5B5B5' }}>
                Retweets
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium" style={{ color: '#FFFFFF' }}>
                3
              </span>
              <span style={{ color: '#B5B5B5' }}>
                Quote Tweets
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium" style={{ color: '#FFFFFF' }}>
                47
              </span>
              <span style={{ color: '#B5B5B5' }}>
                Likes
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-around">
            <button className="flex items-center gap-2 p-2 rounded-full hover:opacity-80 transition-colors">
              <MessageCircle className="h-5 w-5" style={{ color: '#B5B5B5' }} />
            </button>
            <button className="flex items-center gap-2 p-2 rounded-full hover:opacity-80 transition-colors">
              <Repeat2 className="h-5 w-5" style={{ color: '#B5B5B5' }} />
            </button>
            <button className="flex items-center gap-2 p-2 rounded-full hover:opacity-80 transition-colors">
              <Heart className="h-5 w-5" style={{ color: '#B5B5B5' }} />
            </button>
            <button className="flex items-center gap-2 p-2 rounded-full hover:opacity-80 transition-colors">
              <Share className="h-5 w-5" style={{ color: '#B5B5B5' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TwitterPreview }; 