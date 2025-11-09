'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, User, Shield, Palette, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { user, signOut } = useAuth();
  const router = useRouter();
  const supabase = getBrowserClient();

  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    twitterUsername: user?.user_metadata?.twitter_username || '',
    darkMode: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // Update user metadata with Twitter username
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          twitter_username: formData.twitterUsername.replace('@', ''), // Remove @ if user included it
        }
      });

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Failed to update user data');
      }
      
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async () => {
    setIsExporting(true);
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // Get user's tweets, threads, and replies
      const [
        { data: tweetData, error: tweetError },
        { data: threadData, error: threadError },
        { data: replyData, error: replyError }
      ] = await Promise.all([
        supabase
          .from('tweet_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('thread_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('reply_history')
          .select('*')
        .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (tweetError) {
        console.error('Error fetching tweets:', tweetError);
        throw new Error('Failed to fetch tweet history');
      }
      if (threadError) {
        console.error('Error fetching threads:', threadError);
        throw new Error('Failed to fetch thread history');
      }
      if (replyError) {
        console.error('Error fetching replies:', replyError);
        throw new Error('Failed to fetch reply history');
      }

      // Process tweets
      const processedTweets = (tweetData || []).map((tweet: any) => ({
        id: tweet.id,
        type: 'tweet',
        topic: tweet.prompt,
        tone: tweet.tone,
        created_at: tweet.created_at,
        content: typeof tweet.content === 'string' ? JSON.parse(tweet.content) : tweet.content,
        is_favorite: tweet.is_favorite || false
      }));

      // Process threads
      const processedThreads = (threadData || []).map((thread: any) => ({
        id: thread.id,
        type: 'thread',
        topic: thread.prompt,
        tone: thread.tone,
        created_at: thread.created_at,
        content: typeof thread.content === 'string' ? JSON.parse(thread.content) : thread.content,
        thread_length: thread.thread_length,
        thread_style: thread.thread_style,
        is_favorite: thread.is_favorite || false
      }));

      // Process replies
      const processedReplies = (replyData || []).map((reply: any) => ({
        id: reply.id,
        type: 'reply',
        topic: reply.prompt,
        tone: reply.tone,
        created_at: reply.created_at,
        content: typeof reply.content === 'string' ? JSON.parse(reply.content) : reply.content,
        original_tweet: reply.original_tweet,
        is_favorite: reply.is_favorite || false
      }));

      // Prepare the export data
      const exportData = {
        profile: {
          email: user.email || '',
          name: user.user_metadata?.full_name || '',
          twitter: user.user_metadata?.twitter_username || '',
          joined: user.created_at
        },
        history: [
          ...processedTweets,
          ...processedThreads,
          ...processedReplies
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tw33t-export-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };



  if (!isOpen) return null;

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#252628' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#3B3B3D' }}>
          <h2 className="text-2xl font-semibold" style={{ color: '#FFFFFF' }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors hover:opacity-80 cursor-pointer"
            style={{ color: '#B5B5B5' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 p-4 border-r" style={{ borderColor: '#3B3B3D' }}>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor: activeTab === tab.id ? '#3E3F41' : 'transparent',
                      color: activeTab === tab.id ? '#FFFFFF' : '#B5B5B5'
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>
                    Account Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#B5B5B5' }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: '#161618',
                          borderColor: '#3B3B3D',
                          color: '#FFFFFF'
                        }}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#B5B5B5' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 rounded-lg border text-sm opacity-50 cursor-not-allowed"
                        style={{
                          backgroundColor: '#161618',
                          borderColor: '#3B3B3D',
                          color: '#FFFFFF'
                        }}
                      />
                      <p className="text-xs mt-1" style={{ color: '#B5B5B5' }}>
                        Email cannot be changed
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#B5B5B5' }}>
                        Twitter Username
                      </label>
                      <div className="relative">
                        <span 
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                          style={{ color: '#B5B5B5' }}
                        >
                          @
                        </span>
                        <input
                          type="text"
                          name="twitterUsername"
                          value={formData.twitterUsername}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            backgroundColor: '#161618',
                            borderColor: '#3B3B3D',
                            color: '#FFFFFF'
                          }}
                          placeholder="username"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>
                    Privacy & Security
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#161618' }}>
                      <h4 className="text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                        Data Export
                      </h4>
                      <p className="text-xs mb-3" style={{ color: '#B5B5B5' }}>
                        Download a copy of your data
                      </p>
                      <Button
                        onClick={handleDataExport}
                        disabled={isExporting}
                        size="sm"
                        className="text-xs flex items-center gap-2"
                        style={{
                          backgroundColor: '#3E3F41',
                          color: '#FFFFFF'
                        }}
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          'Request Export'
                        )}
                      </Button>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Save Changes Button - Only show for Account tab */}
            {activeTab === 'account' && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-40 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: '#3E3F41',
                    color: '#FFFFFF'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { SettingsModal }; 