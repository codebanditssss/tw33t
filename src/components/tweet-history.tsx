'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Copy, Heart, Clock, Hash, Search, Filter, ChevronLeft, ChevronRight, Star, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Generation {
  id: string;
  topic: string;
  tone: string;
  created_at: string;
  generated_tweets: {
    id: string;
    content: string;
    character_count: number;
    position: number;
    is_favorited: boolean;
    is_copied: boolean;
  }[];
}

interface TweetHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 10; // Increased since items are more compact now
const TONES = ['all', 'professional', 'casual', 'funny', 'serious', 'friendly', 'witty'];

function TweetHistory({ isOpen, onClose }: TweetHistoryProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedTweetId, setCopiedTweetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTone, setSelectedTone] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedGenerations, setExpandedGenerations] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      fetchHistory();
    }
  }, [isOpen, user]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTone, showFavoritesOnly]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tweet_generations')
        .select(`
          id,
          topic,
          tone,
          created_at,
          generated_tweets (
            id,
            content,
            character_count,
            position,
            is_favorited,
            is_copied
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
        toast.error('Failed to load history');
      } else {
        setGenerations(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  const filteredGenerations = useMemo(() => {
    return generations.filter(generation => {
      // Filter by tone
      if (selectedTone !== 'all' && generation.tone.toLowerCase() !== selectedTone) {
        return false;
      }

      // Filter by search query (topic or tweet content)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const topicMatch = generation.topic.toLowerCase().includes(query);
        const tweetMatch = generation.generated_tweets.some(tweet => 
          tweet.content.toLowerCase().includes(query)
        );
        if (!topicMatch && !tweetMatch) {
          return false;
        }
      }

      // Filter by favorites
      if (showFavoritesOnly) {
        const hasFavorites = generation.generated_tweets.some(tweet => tweet.is_favorited);
        if (!hasFavorites) {
          return false;
        }
      }

      return true;
    });
  }, [generations, searchQuery, selectedTone, showFavoritesOnly]);

  // Pagination logic
  const totalPages = Math.ceil(filteredGenerations.length / ITEMS_PER_PAGE);
  const paginatedGenerations = filteredGenerations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleExpanded = (generationId: string) => {
    setExpandedGenerations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(generationId)) {
        newSet.delete(generationId);
      } else {
        newSet.add(generationId);
      }
      return newSet;
    });
  };

  const handleCopy = async (tweet: { id: string; content: string }) => {
    try {
      await navigator.clipboard.writeText(tweet.content);
      setCopiedTweetId(tweet.id);
      toast.success('Tweet copied to clipboard!');
      
      // Update database
      await supabase
        .from('generated_tweets')
        .update({ is_copied: true })
        .eq('id', tweet.id);
      
      // Reset copy state after 2 seconds
      setTimeout(() => {
        setCopiedTweetId(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy tweet');
    }
  };

  const toggleFavorite = async (tweet: { id: string; is_favorited: boolean }) => {
    try {
      const newFavoriteState = !tweet.is_favorited;
      
      const { error } = await supabase
        .from('generated_tweets')
        .update({ is_favorited: newFavoriteState })
        .eq('id', tweet.id);

      if (error) {
        toast.error('Failed to update favorite');
      } else {
        // Update local state
        setGenerations(prev => prev.map(gen => ({
          ...gen,
          generated_tweets: gen.generated_tweets.map(t => 
            t.id === tweet.id ? { ...t, is_favorited: newFavoriteState } : t
          )
        })));
        
        toast.success(newFavoriteState ? 'Added to favorites' : 'Removed from favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorite');
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

  const getGenerationStats = (generation: Generation) => {
    const totalTweets = generation.generated_tweets.length;
    const favoritedTweets = generation.generated_tweets.filter(t => t.is_favorited).length;
    const copiedTweets = generation.generated_tweets.filter(t => t.is_copied).length;
    
    return { totalTweets, favoritedTweets, copiedTweets };
  };

  const getPreviewTweet = (generation: Generation) => {
    // Show the first favorited tweet, or the first tweet if none are favorited
    const favoritedTweet = generation.generated_tweets.find(t => t.is_favorited);
    return favoritedTweet || generation.generated_tweets[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-5xl mx-4 h-[85vh] rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#252628' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#3B3B3D' }}>
          <h2 className="text-2xl font-semibold" style={{ color: '#FFFFFF' }}>
            Tweet History
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors hover:opacity-80"
            style={{ color: '#B5B5B5' }}
          >
            ✕
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b space-y-4" style={{ borderColor: '#3B3B3D' }}>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#B5B5B5' }} />
            <input
              type="text"
              placeholder="Search topics or tweet content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: '#161618',
                borderColor: '#3B3B3D',
                color: '#FFFFFF'
              }}
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Tone Filter */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-80"
                style={{ 
                  background: 'rgba(35, 35, 37, 0.9)',
                  backdropFilter: 'blur(10px)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Filter className="h-4 w-4" style={{ color: '#B5B5B5' }} />
                <span>{selectedTone === 'all' ? 'All Tones' : capitalizeFirst(selectedTone)}</span>
                <ChevronDown 
                  className={`h-4 w-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  style={{ color: '#B5B5B5' }} 
                />
              </button>
              
              {/* Custom Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div 
                    className="absolute top-full left-0 mt-2 w-48 rounded-xl overflow-hidden z-20"
                    style={{ 
                      background: 'rgba(35, 35, 37, 0.98)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                  >
                    {TONES.map(tone => (
                      <button
                        key={tone}
                        onClick={() => {
                          setSelectedTone(tone);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                        style={{ 
                          color: selectedTone === tone ? '#FFFFFF' : '#B5B5B5'
                        }}
                      >
                        {tone === 'all' ? 'All Tones' : capitalizeFirst(tone)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Favorites Filter */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                showFavoritesOnly ? 'bg-red-500/20 text-red-400' : 'hover:opacity-80'
              }`}
              style={{ 
                backgroundColor: showFavoritesOnly ? undefined : '#3E3F41',
                color: showFavoritesOnly ? undefined : '#B5B5B5'
              }}
            >
              <Star className="h-4 w-4" fill={showFavoritesOnly ? 'currentColor' : 'none'} />
              Favorites Only
            </button>

            {/* Results Count */}
            <span className="text-sm ml-auto" style={{ color: '#B5B5B5' }}>
              {filteredGenerations.length} generation{filteredGenerations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col" style={{ height: 'calc(85vh - 200px)' }}>
          <div className="flex-1 p-6 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3B3B3D transparent' }}>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : filteredGenerations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg" style={{ color: '#B5B5B5' }}>
                  {generations.length === 0 
                    ? "No tweet history yet. Generate some tweets to see them here!"
                    : "No results found. Try adjusting your search or filters."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedGenerations.map((generation) => {
                  const isExpanded = expandedGenerations.has(generation.id);
                  const stats = getGenerationStats(generation);
                  const previewTweet = getPreviewTweet(generation);
                  
                  return (
                    <div 
                      key={generation.id}
                      className="rounded-lg border"
                      style={{ 
                        backgroundColor: '#161618',
                        borderColor: '#3B3B3D'
                      }}
                    >
                      {/* Compact Header - Always Visible */}
                      <div 
                        className="p-4 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => toggleExpanded(generation.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Topic and Tone */}
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4" style={{ color: '#B5B5B5' }} />
                              <span className="font-medium" style={{ color: '#FFFFFF' }}>
                                {generation.topic}
                              </span>
                              <span 
                                className="text-xs px-2 py-1 rounded"
                                style={{ 
                                  backgroundColor: '#3E3F41',
                                  color: '#B5B5B5'
                                }}
                              >
                                {capitalizeFirst(generation.tone)}
                              </span>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs" style={{ color: '#B5B5B5' }}>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{stats.totalTweets}</span>
                              </div>
                              {stats.favoritedTweets > 0 && (
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" style={{ color: '#ef4444' }} fill="#ef4444" />
                                  <span>{stats.favoritedTweets}</span>
                                </div>
                              )}
                              {stats.copiedTweets > 0 && (
                                <div className="flex items-center gap-1">
                                  <Copy className="h-3 w-3" />
                                  <span>{stats.copiedTweets}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Date and Expand Button */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs" style={{ color: '#B5B5B5' }}>
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(generation.created_at)}</span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" style={{ color: '#B5B5B5' }} />
                            ) : (
                              <ChevronDown className="h-4 w-4" style={{ color: '#B5B5B5' }} />
                            )}
                          </div>
                        </div>

                        {/* Preview Tweet - Only when collapsed */}
                        {!isExpanded && previewTweet && (
                          <div className="mt-3 pl-6">
                            <p className="text-sm line-clamp-2" style={{ color: '#B5B5B5' }}>
                              {previewTweet.content}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Expanded Content - All Tweets */}
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <div className="border-t pt-4 space-y-3" style={{ borderColor: '#3B3B3D' }}>
                            {generation.generated_tweets
                              .sort((a, b) => a.position - b.position)
                              .filter(tweet => !showFavoritesOnly || tweet.is_favorited)
                              .map((tweet) => (
                                <div 
                                  key={tweet.id}
                                  className="p-3 rounded border"
                                  style={{ 
                                    backgroundColor: '#252628',
                                    borderColor: '#3B3B3D'
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm flex-1" style={{ color: '#FFFFFF' }}>
                                      {tweet.content}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFavorite(tweet);
                                        }}
                                        className="p-1 rounded transition-colors hover:opacity-80"
                                      >
                                        <Heart 
                                          className="h-4 w-4" 
                                          style={{ 
                                            color: tweet.is_favorited ? '#ef4444' : '#B5B5B5'
                                          }}
                                          fill={tweet.is_favorited ? '#ef4444' : 'none'}
                                        />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopy(tweet);
                                        }}
                                        className="p-1 rounded transition-colors hover:opacity-80"
                                      >
                                        {copiedTweetId === tweet.id ? (
                                          <span className="text-xs" style={{ color: '#22c55e' }}>✓</span>
                                        ) : (
                                          <Copy className="h-4 w-4" style={{ color: '#B5B5B5' }} />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex justify-end mt-2">
                                    <span className="text-xs" style={{ color: '#B5B5B5' }}>
                                      {tweet.character_count}/280
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t" style={{ borderColor: '#3B3B3D' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#B5B5B5' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                    style={{ 
                      backgroundColor: '#3E3F41',
                      color: '#B5B5B5'
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                    style={{ 
                      backgroundColor: '#3E3F41',
                      color: '#B5B5B5'
                    }}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { TweetHistory }; 