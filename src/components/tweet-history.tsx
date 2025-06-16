'use client';

import { useState, useEffect, useMemo } from 'react';
import { getBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Copy, Heart, Clock, Hash, Search, Filter, ChevronLeft, ChevronRight, Star, ChevronDown, ChevronUp, MessageSquare, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TweetContent {
  content: string;
}

type TweetContentType = string | TweetContent;

interface Generation {
  id: string;
  topic: string;
  tone: string;
  created_at: string;
  type: 'tweet' | 'thread' | 'reply';
  content: TweetContentType | TweetContentType[] | string[][];
  original_tweet?: string;
  thread_length?: number;
  thread_style?: string;
  is_favorite: boolean;
}

interface TweetHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TweetRecord {
  id: string;
  user_id: string;
  prompt: string;
  tone: string;
  content: string;
  created_at: string;
  is_favorite?: boolean;
}

interface ThreadRecord extends TweetRecord {
  thread_length: number;
  thread_style: string;
}

interface ReplyRecord extends TweetRecord {
  original_tweet: string;
}

const ITEMS_PER_PAGE = 10; // Increased since items are more compact now

// Define all possible tones and thread styles
const TONES = [
  { value: 'all', label: 'All' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'funny', label: 'Funny' },
  { value: 'serious', label: 'Serious' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'witty', label: 'Witty' }
];

const THREAD_STYLES = [
  { value: 'story', label: 'Narrative' },
  { value: 'educational', label: 'Educational' },
  { value: 'tips', label: 'Tips & Lists' },
  { value: 'personal', label: 'Personal' },
  { value: 'analysis', label: 'Breakdown' }
];

const CATEGORIES = ['all', 'tweet', 'thread', 'reply'] as const;

function TweetHistory({ isOpen, onClose }: TweetHistoryProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedTweetId, setCopiedTweetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTone, setSelectedTone] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedGenerations, setExpandedGenerations] = useState<Set<string>>(new Set());
  const [expandedLoadingStates, setExpandedLoadingStates] = useState<Set<string>>(new Set());
  const [parsedContentCache, setParsedContentCache] = useState<Record<string, any>>({});
  const { user } = useAuth();
  const supabase = getBrowserClient();

  useEffect(() => {
    if (isOpen && user) {
      fetchHistory();
    }
  }, [isOpen, user]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTone, selectedCategory, showFavoritesOnly]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        { data: tweetData, error: tweetError },
        { data: threadData, error: threadError },
        { data: replyData, error: replyError }
      ] = await Promise.all([
        supabase
        .from('tweet_history')
        .select('*')
        .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
        .from('thread_history')
        .select('*')
        .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
        .from('reply_history')
        .select('*')
        .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
      ]);

      if (tweetError) {
        console.error('Error fetching tweets:', tweetError);
      }
      if (threadError) {
        console.error('Error fetching threads:', threadError);
      }
      if (replyError) {
        console.error('Error fetching replies:', replyError);
      }

      // Pre-parse all content
      const parsedTweets = (tweetData || []).map((tweet: TweetRecord) => {
        let parsedContent;
        try {
          parsedContent = typeof tweet.content === 'string' ? JSON.parse(tweet.content) : tweet.content;
        } catch (error) {
          console.error('Error parsing tweet content:', error);
          parsedContent = tweet.content;
        }
        return {
          id: tweet.id,
          topic: tweet.prompt,
          tone: tweet.tone,
          created_at: tweet.created_at,
          type: 'tweet' as const,
          content: parsedContent,
          is_favorite: tweet.is_favorite || false,
        };
      });

      const parsedThreads = (threadData || []).map((thread: ThreadRecord) => {
        let parsedContent;
        try {
          parsedContent = typeof thread.content === 'string' ? JSON.parse(thread.content) : thread.content;
        } catch (error) {
          console.error('Error parsing thread content:', error);
          parsedContent = thread.content;
        }
        return {
          id: thread.id,
          topic: thread.prompt,
          tone: thread.tone,
          created_at: thread.created_at,
          type: 'thread' as const,
          content: parsedContent,
          thread_length: thread.thread_length,
          thread_style: thread.thread_style,
          is_favorite: thread.is_favorite || false,
        };
      });

      const parsedReplies = (replyData || []).map((reply: ReplyRecord) => {
        let parsedContent;
        try {
          parsedContent = Array.isArray(reply.content) 
            ? reply.content 
            : typeof reply.content === 'string' 
              ? JSON.parse(reply.content) 
              : [reply.content];
        } catch (error) {
          console.error('Error parsing reply content:', error);
          parsedContent = Array.isArray(reply.content) ? reply.content : [reply.content];
        }
        return {
          id: reply.id,
          topic: reply.prompt,
          tone: reply.tone,
          created_at: reply.created_at,
          type: 'reply' as const,
          content: parsedContent,
          original_tweet: reply.original_tweet,
          is_favorite: reply.is_favorite || false,
        };
      });

      // Cache all parsed content
      const newCache: Record<string, any> = {};
      [...parsedTweets, ...parsedThreads, ...parsedReplies].forEach(item => {
        newCache[item.id] = item.content;
      });
      setParsedContentCache(newCache);

      // Combine and sort all data
      const allGenerations = [...parsedTweets, ...parsedThreads, ...parsedReplies]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setGenerations(allGenerations);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (generation: Generation, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let contentToCopy: string;
      const content = generation.content;
      
      if (Array.isArray(content)) {
        if (Array.isArray(content[0])) {
          // Thread
          contentToCopy = content[0][0];
        } else {
          // Tweet array
          const firstTweet = content[0] as TweetContentType;
          if (typeof firstTweet === 'string') {
            contentToCopy = firstTweet;
          } else {
            contentToCopy = firstTweet.content;
          }
        }
      } else {
        // Single tweet/reply
        if (typeof content === 'string') {
          contentToCopy = content;
        } else {
          contentToCopy = content.content;
        }
      }
      
      await navigator.clipboard.writeText(contentToCopy);
      setCopiedTweetId(generation.id);
      toast.success('Content copied to clipboard!');
      
      setTimeout(() => {
        setCopiedTweetId(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  const handleDelete = async (generation: Generation, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const tableName = `${generation.type}_history`;
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', generation.id);

      if (error) {
        throw error;
      }

      setGenerations(prev => prev.filter(g => g.id !== generation.id));
      toast.success('Successfully deleted');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  const handleToggleFavorite = async (generation: Generation, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const tableName = `${generation.type}_history`;
      const newFavoriteState = !generation.is_favorite;

      // First update the UI optimistically
      setGenerations(prev =>
        prev.map(g =>
          g.id === generation.id
            ? { ...g, is_favorite: newFavoriteState }
            : g
        )
      );

      // Then update the database
      const { error } = await supabase
        .from(tableName)
        .update({ is_favorite: newFavoriteState })
        .eq('id', generation.id)
        .eq('user_id', user?.id); // Add user_id check for extra security

      if (error) {
        // If there's an error, revert the UI change
        setGenerations(prev =>
          prev.map(g =>
            g.id === generation.id
              ? { ...g, is_favorite: !newFavoriteState }
              : g
          )
        );
        throw error;
      }

      toast.success(newFavoriteState ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  // Filter and search logic
  const filteredGenerations = useMemo(() => {
    return generations.filter(generation => {
      // Filter by favorites
      if (showFavoritesOnly && !generation.is_favorite) {
        return false;
      }

      // Filter by category
      if (selectedCategory !== 'all' && generation.type !== selectedCategory) {
        return false;
      }

      // Filter by tone/style
      if (selectedTone !== 'all') {
        if (generation.type === 'thread') {
          if (generation.thread_style !== selectedTone) {
            return false;
          }
        } else {
          const toneToCheck = typeof generation.tone === 'string' 
            ? generation.tone 
            : '';
          if (toneToCheck.toLowerCase() !== selectedTone.toLowerCase()) {
            return false;
          }
        }
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const topicMatch = generation.topic.toLowerCase().includes(query);
        let contentMatch = false;

        if (Array.isArray(generation.content)) {
          if (Array.isArray(generation.content[0])) {
            // Thread content
            contentMatch = (generation.content as string[][]).some(thread =>
              thread.some(tweet => tweet.toLowerCase().includes(query))
            );
          } else {
            // Array of tweets
            contentMatch = (generation.content as TweetContentType[]).some(tweet => {
              if (typeof tweet === 'string') {
                return tweet.toLowerCase().includes(query);
              } else if (typeof tweet === 'object' && tweet !== null && 'content' in tweet) {
                return tweet.content.toLowerCase().includes(query);
              }
              return false;
            });
          }
        } else if (typeof generation.content === 'string') {
          contentMatch = generation.content.toLowerCase().includes(query);
        } else if (typeof generation.content === 'object' && generation.content !== null && 'content' in generation.content) {
          contentMatch = (generation.content as TweetContent).content.toLowerCase().includes(query);
        }

        return topicMatch || contentMatch;
      }

      return true;
    });
  }, [generations, showFavoritesOnly, selectedCategory, selectedTone, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredGenerations.length / ITEMS_PER_PAGE);
  const paginatedGenerations = filteredGenerations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleExpanded = async (generationId: string) => {
    const generation = generations.find(g => g.id === generationId);
    if (!generation) return;
    
    // First toggle the expanded state
    setExpandedGenerations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(generationId)) {
        newSet.delete(generationId);
      } else {
        newSet.add(generationId);
      }
      return newSet;
    });

    // If we're expanding and don't have cached content, fetch it
    const isExpanding = !expandedGenerations.has(generationId);
    if (isExpanding && !parsedContentCache[generationId]) {
      // Set loading state
      setExpandedLoadingStates(prev => {
        const newSet = new Set(prev);
        newSet.add(generationId);
        return newSet;
      });

      try {
        // Parse content only if needed
        let parsedContent;
        if (typeof generation.content === 'string') {
          parsedContent = JSON.parse(generation.content);
        } else if (Array.isArray(generation.content)) {
          parsedContent = generation.content;
        } else {
          parsedContent = [generation.content];
        }

        // Cache the parsed content
        setParsedContentCache(prev => ({
          ...prev,
          [generationId]: parsedContent
        }));
      } catch (error) {
        console.error('Error parsing content:', error);
        toast.error('Failed to load content');
        
        // If there's an error, revert the expanded state
        setExpandedGenerations(prev => {
          const newSet = new Set(prev);
          newSet.delete(generationId);
          return newSet;
        });
      } finally {
        // Clear loading state
        setExpandedLoadingStates(prev => {
          const newSet = new Set(prev);
          newSet.delete(generationId);
          return newSet;
        });
      }
    }
  };

  const renderContent = (generation: Generation) => {
    const isLoading = expandedLoadingStates.has(generation.id);
    const cachedContent = parsedContentCache[generation.id];
    const isExpanded = expandedGenerations.has(generation.id);
    
    if (!isExpanded) {
      return null;
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#1d9bf0]" />
        </div>
      );
    }

    const content = cachedContent || generation.content;
    
    if (generation.type === 'thread') {
      const threadContent = Array.isArray(content) && Array.isArray(content[0]) 
        ? content 
        : [Array.isArray(content) ? content : [content]];
      return (
        <div className="space-y-4">
          {threadContent.map((thread, threadIndex) => (
            <div key={threadIndex} className="space-y-2">
              <div className="text-[#71767B] text-sm">Thread {threadIndex + 1}</div>
              {thread.map((tweet: string, tweetIndex: number) => (
                <div key={tweetIndex} className="bg-[#161618] p-3 rounded">
                  <p className="text-white text-sm">{tweet}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    } else if (generation.type === 'reply') {
      const replyContent = Array.isArray(content) ? content : [content];
      return (
        <div className="space-y-4">
          <div className="bg-[#161618] p-3 rounded">
            <p className="text-[#71767B] text-sm mb-2">Original Tweet:</p>
            <p className="text-white text-sm">{generation.original_tweet}</p>
          </div>
          {replyContent.map((reply, index) => (
            <div key={index} className="bg-[#161618] p-3 rounded">
              <p className="text-[#71767B] text-sm mb-2">Reply {index + 1}:</p>
              <p className="text-white text-sm">{typeof reply === 'string' ? reply : reply.content}</p>
          </div>
          ))}
        </div>
      );
    } else {
      // Regular tweets
      const tweetContent = Array.isArray(content) ? content : [content];
      const processedContent = tweetContent.map(tweet => 
        typeof tweet === 'string' ? tweet : tweet.content
      );
      
      return (
        <div className="space-y-2">
          {processedContent.map((tweetText, index) => (
            <div key={index} className="bg-[#161618] p-3 rounded">
              <p className="text-[#71767B] text-sm mb-2">Tweet {index + 1}:</p>
              <p className="text-white text-sm">{tweetText}</p>
            </div>
          ))}
        </div>
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2">
      <div className="bg-[#161618] rounded-xl w-full max-w-6xl max-h-[98vh] flex flex-col">
        <div className="p-8 flex-shrink-0">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-semibold text-white">History</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showFavoritesOnly
                    ? 'bg-[#1d9bf0] text-white'
                    : 'bg-[#2F3336] text-[#71767B] hover:text-white'
                }`}
              >
                <Star className="h-5 w-5" />
                <span>Favorites</span>
              </button>
              <button onClick={onClose} className="text-[#71767B] hover:text-white transition-colors">
                <X className="h-7 w-7" />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 mb-8 bg-[#202124] p-1.5 rounded-lg">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setSelectedTone('all'); // Reset tone when changing category
                }}
                className={`
                  flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${selectedCategory === category 
                    ? 'bg-[#2F3336] text-white shadow-lg' 
                    : 'text-[#71767B] hover:text-white hover:bg-[#2F3336]/50'}
                `}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
                <span className="ml-2 text-xs bg-[#2F3336] px-2 py-0.5 rounded-full">
                  {generations.filter(g => category === 'all' ? true : g.type === category).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-6 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#71767B]" />
              <input
                type="text"
                placeholder="Search by topic or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#202124] border border-[#2F3336] rounded-lg text-white placeholder-[#71767B] focus:outline-none focus:border-[#1d9bf0] text-base"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-5 py-3 bg-[#202124] border border-[#2F3336] rounded-lg text-white hover:bg-[#2F3336] transition-colors min-w-[180px] justify-between"
              >
                <Filter className="h-5 w-5" />
                <span className="mx-2">
                  {selectedCategory === 'thread' 
                    ? THREAD_STYLES.find(s => s.value === selectedTone)?.label || 'All Styles'
                    : selectedCategory === 'all'
                      ? 'All Filters'
                      : TONES.find(t => t.value === selectedTone)?.label || 'All Tones'}
                </span>
                <ChevronDown className="h-5 w-5" />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-[180px] bg-[#202124] border border-[#2F3336] rounded-lg shadow-lg overflow-hidden z-10">
                  {selectedCategory === 'thread' ? (
                    <>
                      <button
                        key="all"
                        onClick={() => {
                          setSelectedTone('all');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-5 py-3 text-left hover:bg-[#2F3336] transition-colors ${
                          selectedTone === 'all' ? 'text-[#1d9bf0]' : 'text-white'
                        }`}
                      >
                        All Styles
                      </button>
                      {THREAD_STYLES.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => {
                            setSelectedTone(style.value);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-5 py-3 text-left hover:bg-[#2F3336] transition-colors ${
                            selectedTone === style.value ? 'text-[#1d9bf0]' : 'text-white'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </>
                  ) : selectedCategory === 'all' ? (
                    <>
                      <button
                        key="all"
                        onClick={() => {
                          setSelectedTone('all');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-5 py-3 text-left hover:bg-[#2F3336] transition-colors ${
                          selectedTone === 'all' ? 'text-[#1d9bf0]' : 'text-white'
                        }`}
                      >
                        All Filters
                      </button>
                    </>
                  ) : (
                    TONES.map((tone) => (
                      <button
                        key={tone.value}
                        onClick={() => {
                          setSelectedTone(tone.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-5 py-3 text-left hover:bg-[#2F3336] transition-colors ${
                          selectedTone === tone.value ? 'text-[#1d9bf0]' : 'text-white'
                        }`}
                      >
                        {tone.label}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area with Scrolling */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#1d9bf0]" />
            </div>
          ) : paginatedGenerations.length === 0 ? (
            <div className="text-center py-16 text-[#71767B]">
              <MessageSquare className="h-16 w-16 mx-auto mb-6 opacity-50" />
              <p className="text-xl">No generations found</p>
              <p className="text-base mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-5">
              {paginatedGenerations.map((generation) => {
                const isExpanded = expandedGenerations.has(generation.id);
                const contentPreview = Array.isArray(generation.content)
                  ? Array.isArray(generation.content[0])
                    ? (generation.content as string[][])[0][0]
                    : (generation.content as string[])[0]
                  : generation.content;

                return (
                  <div
                    key={generation.id}
                    className="bg-[#202124] rounded-lg border border-[#2F3336] overflow-hidden"
                  >
                    <div className="p-4 hover:bg-[#2F3336]/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[#1d9bf0] text-sm">
                            {capitalizeFirst(generation.type)}
                          </span>
                          <span className="text-[#71767B] text-sm">•</span>
                          <span className="text-[#71767B] text-sm">
                            {formatDate(generation.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleToggleFavorite(generation, e)}
                            className={`p-1 rounded transition-colors hover:opacity-80 ${
                              generation.is_favorite ? 'text-[#1d9bf0]' : 'text-[#71767B]'
                            }`}
                          >
                            <Star className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleCopy(generation, e)}
                            className="p-1 rounded transition-colors hover:opacity-80"
                          >
                            {copiedTweetId === generation.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-[#71767B]" />
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDelete(generation, e)}
                            className="p-1 rounded transition-colors hover:opacity-80 text-[#71767B] hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-white text-sm mb-2">{generation.topic}</p>
                      <p className="text-[#71767B] text-sm line-clamp-2">
                        {generation.type === 'reply' 
                          ? `Reply to: ${generation.original_tweet}`
                          : Array.isArray(generation.content) 
                          ? (Array.isArray(generation.content[0]) 
                              ? generation.content[0][0] 
                              : typeof generation.content[0] === 'string'
                                ? generation.content[0]
                                : generation.content[0]?.content)
                          : typeof generation.content === 'string'
                            ? generation.content
                            : generation.content?.content}
                      </p>

                      {isExpanded && (
                        <div className="mt-4 space-y-4 border-t border-[#2F3336] pt-4">
                          {renderContent(generation)}
                        </div>
                      )}

                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={() => toggleExpanded(generation.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2F3336] transition-colors text-[#71767B] hover:text-white"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination - Fixed at Bottom */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 p-6 border-t border-[#2F3336] bg-[#161618]">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded transition-colors disabled:opacity-50 text-[#71767B] hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-[#71767B] text-base">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded transition-colors disabled:opacity-50 text-[#71767B] hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { TweetHistory }; 